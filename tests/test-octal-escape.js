const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Simple tokenizer that extracts tokens from JS code
function tokenize(code) {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    // Skip single-line comments
    if (code.slice(i, i + 2) === '//') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    // Skip multi-line comments
    if (code.slice(i, i + 2) === '/*') {
      i += 2;
      while (i < code.length && code.slice(i, i + 2) !== '*/') i++;
      i += 2;
      continue;
    }
    // Match strings (single or double quotes)
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i];
      let str = quote;
      let start = i;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') {
          str += code[i] + (code[i + 1] || '');
          i += 2;
        } else {
          str += code[i];
          i++;
        }
      }
      if (i < code.length) {
        str += code[i];
        i++;
      }
      tokens.push({ type: 'string', value: code.slice(start, i), index: start });
      continue;
    }
    // Skip regular expressions since they can contain things like `\1` which is a backreference, not an octal escape.
    // A very simple heuristic: if we see a slash and it's not a comment, skip to the next slash.
    // This is imperfect but usually avoids matching regex literals as division.
    // Actually, in `scripts/check-meta-duplicates.js`, it is matching `\1` inside a string token?
    // Wait, let's look at check-meta-duplicates.js:41
    // `const nameMatch = attrsStr.match(/name=(["'])(.*?)\1/i) || attrsStr.match(/name=([^\s>]+)/i);`
    // Wait! `/name=(["'])(.*?)\1/i` is a RegExp literal, but our tokenizer might be parsing it incorrectly!
    // Since our tokenizer just skips other chars, when it hits `"`, it starts a string token!
    // Oh, it parses `"])(.*?)\1/i) || attrsStr.match(/name=([^` and then `\s>]+)/i);` as a string!
    // So we MUST handle regex literals, or skip slashes.
    if (code[i] === '/') {
      // Very naive regex literal handling
      // Let's just skip to the next slash if it looks like a regex literal, or just skip it.
      // A better way is just checking if we hit a slash, check if the previous non-whitespace character
      // was a punctuator that can precede a regex (like `=, (, [, :, ,, etc.)

      // But let's just use a more robust regex skip:
      let isRegex = false;
      let j = i - 1;
      while (j >= 0 && /\s/.test(code[j])) j--;
      if (j < 0 || /[\(\)\=\:\,\;\?\{\}\[\]\|&!*+\-<>]/.test(code[j])) {
        isRegex = true;
      }
      if (isRegex) {
        let start = i;
        i++; // skip initial /
        while (i < code.length && code[i] !== '/') {
          if (code[i] === '\\') {
            i += 2;
          } else {
            i++;
          }
        }
        if (i < code.length) {
          i++; // skip closing /
          // skip flags
          while (i < code.length && /[a-z]/i.test(code[i])) i++;
        }
        continue;
      }
    }

    // Match template literals
    if (code[i] === '`') {
      let start = i;
      i++;
      while (i < code.length && code[i] !== '`') {
        if (code[i] === '\\') {
          i += 2;
        } else {
          i++;
        }
      }
      if (i < code.length) {
        i++;
      }
      tokens.push({ type: 'string', value: code.slice(start, i), index: start });
      continue;
    }
    // Match identifiers and keywords
    if (/[a-zA-Z_$]/.test(code[i])) {
      let start = i;
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
      tokens.push({ type: 'identifier', value: code.slice(start, i), index: start });
      continue;
    }
    // Skip everything else
    i++;
  }
  return tokens;
}

function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== '.git') {
        findJSFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('no legacy octal escape sequences in strings', () => {
  const allowlist = [];

  const jsFiles = findJSFiles(path.resolve(__dirname, '..'));
  const errors = [];

  // A legacy octal escape is \ followed by:
  // - 1 to 3 numbers between 0 and 7, but NOT if it is just a single 0 (null character \0)
  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const tokens = tokenize(code);

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'string') {
        // Matches unescaped \ followed by octal sequence.
        // It uses negative lookbehind for \ to ensure the \ is not itself escaped.
        // But since we want to check for literal backslash characters inside the string,
        // we can just check if an odd number of backslashes precedes the octal digits.
        // Wait, the regex `/(?<!\\)(?:\\\\)*\\(?:[1-7][0-7]{0,2}|0[0-7]+)/` does exactly that.
        // E.g. `\1` -> `(?<!\\)` matches, `(?:\\\\)*` matches empty, `\` matches, `1` matches.
        // E.g. `\\1` -> `(?<!\\)` matches, `(?:\\\\)*` matches `\\`, `\` fails.
        // E.g. `\\\1` -> `(?<!\\)` matches, `(?:\\\\)*` matches `\\`, `\` matches, `1` matches.
        const octalMatch = /(?<!\\)(?:\\\\)*\\(?:[1-7][0-7]{0,2}|0[0-7]+)/.test(tokens[i].value);

        if (octalMatch) {
          const matchValue = tokens[i].value;
          const relativeFile = path.relative(path.resolve(__dirname, '..'), file).replace(/\\/g, '/');

          const isAllowed = allowlist.some(allowed => allowed.file === relativeFile && allowed.value === matchValue);
          if (!isAllowed) {
            const upToToken = code.slice(0, tokens[i].index);
            const line = (upToToken.match(/\n/g) || []).length + 1;
            errors.push(`File ${relativeFile} at line ${line} has octal escape: ${matchValue}`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    assert.fail(`Found legacy octal escapes:\n${errors.join('\n')}`);
  }
});

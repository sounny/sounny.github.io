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
      tokens.push({ type: 'string', value: str, index: start });
      continue;
    }
    // Match template literals (rough approximation)
    if (code[i] === '`') {
      let str = '`';
      let start = i;
      i++;
      while (i < code.length && code[i] !== '`') {
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
      tokens.push({ type: 'template', value: str, index: start });
      continue;
    }
    // Skip whitespace
    if (/\s/.test(code[i])) {
      i++;
      continue;
    }
    // Match identifiers and keywords
    if (/[a-zA-Z_$]/.test(code[i])) {
      let start = i;
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) i++;
      tokens.push({ type: 'identifier', value: code.slice(start, i), index: start });
      continue;
    }
    // Match numbers
    if (/[0-9]/.test(code[i])) {
      let start = i;
      while (i < code.length && /[0-9a-zA-Z.]/.test(code[i])) i++;
      tokens.push({ type: 'number', value: code.slice(start, i), index: start });
      continue;
    }
    // Match punctuators
    tokens.push({ type: 'punctuator', value: code[i], index: i });
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

test('no throw with string, number, or template literal', () => {
  const allowlist = []; // Add specific cases here if needed

  const jsFiles = findJSFiles(path.resolve(__dirname, '..'));
  const errors = [];

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const tokens = tokenize(code);

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'identifier' && tokens[i].value === 'throw') {
        let nextIdx = i + 1;

        // Skip opening parenthesis if it exists (e.g. `throw("error")`)
        if (nextIdx < tokens.length && tokens[nextIdx].value === '(') {
          nextIdx++;
        }

        if (nextIdx < tokens.length) {
          const nextToken = tokens[nextIdx];
          if (['string', 'number', 'template'].includes(nextToken.type)) {

            // Check if this occurrence is in the allowlist
            const match = { file: path.relative(path.resolve(__dirname, '..'), file), value: nextToken.value };
            const isAllowed = allowlist.some(allowed => allowed.file === match.file && allowed.value === match.value);

            if (!isAllowed) {
              // Calculate line number for better error reporting
              const upToToken = code.slice(0, nextToken.index);
              const line = (upToToken.match(/\n/g) || []).length + 1;
              errors.push(`File ${match.file} at line ${line} has throw with literal: ${nextToken.value}`);
            }
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    assert.fail(`Found invalid throw statements:\n${errors.join('\n')}`);
  }
});

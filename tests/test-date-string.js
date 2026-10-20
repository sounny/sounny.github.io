const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Allowlist of files where new Date("...") is currently permitted to exist.
// This matches the prompt's request for an allowlist for current occurrences.
// Add relative paths to the allowlist.
const ALLOWLIST = [
];

function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file === 'node_modules' || file === 'tests') continue;
    if (file.startsWith('.')) continue;

    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

function tokenize(code) {
  const tokens = [];
  let i = 0;

  while (i < code.length) {
    const char = code[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Line comments
    if (char === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Block comments
    if (char === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    // Strings (single, double, backtick)
    if (char === '"' || char === '\'' || char === '`') {
      const quote = char;
      i++;
      let strVal = '';
      while (i < code.length) {
        if (code[i] === '\\') {
          strVal += code[i] + (code[i + 1] || '');
          i += 2;
        } else if (code[i] === quote) {
          i++;
          break;
        } else {
          strVal += code[i];
          i++;
        }
      }
      tokens.push({ type: 'STRING', value: strVal, raw: quote + strVal + quote });
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let value = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        value += code[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value });
      continue;
    }

    // Numbers (simplified)
    if (/[0-9]/.test(char)) {
       let value = '';
       while(i < code.length && /[0-9.]/.test(code[i])) {
           value += code[i];
           i++;
       }
       tokens.push({ type: 'NUMBER', value });
       continue;
    }

    // Punctuators
    tokens.push({ type: 'PUNCTUATOR', value: char });
    i++;
  }

  return tokens;
}

test('no new Date("...") with string literal', () => {
  const rootDir = path.resolve(__dirname, '..');
  const jsFiles = findJsFiles(rootDir);

  for (const file of jsFiles) {
    const relativePath = path.relative(rootDir, file);
    if (ALLOWLIST.includes(relativePath)) {
      continue;
    }

    const code = fs.readFileSync(file, 'utf8');
    const tokens = tokenize(code);

    for (let i = 0; i < tokens.length - 3; i++) {
      if (
        tokens[i].type === 'IDENTIFIER' && tokens[i].value === 'new' &&
        tokens[i + 1].type === 'IDENTIFIER' && tokens[i + 1].value === 'Date' &&
        tokens[i + 2].type === 'PUNCTUATOR' && tokens[i + 2].value === '(' &&
        tokens[i + 3].type === 'STRING'
      ) {
          assert.fail(`Found new Date("...") at ${relativePath}`);
      }
    }
  }
});

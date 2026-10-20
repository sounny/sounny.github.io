const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {}; // e.g. { 'js/main.js': 2 } for 2 allowed occurrences

function tokenize(code) {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    if (code.startsWith('//', i)) {
      let end = code.indexOf('\n', i);
      if (end === -1) end = code.length;
      i = end;
      continue;
    }
    if (code.startsWith('/*', i)) {
      let end = code.indexOf('*/', i + 2);
      if (end === -1) end = code.length;
      else end += 2;
      i = end;
      continue;
    }
    const char = code[i];
    if (char === '"' || char === "'" || char === '`') {
      let end = i + 1;
      while (end < code.length) {
        if (code[end] === '\\') {
          end += 2;
        } else if (code[end] === char) {
          end++;
          break;
        } else {
          end++;
        }
      }
      i = end;
      continue;
    }

    // Check for word characters
    if (/[a-zA-Z_$]/.test(char)) {
      let end = i + 1;
      while (end < code.length && /[a-zA-Z0-9_$]/.test(code[end])) {
        end++;
      }
      const word = code.substring(i, end);
      tokens.push({ type: 'word', value: word, index: i });
      i = end;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'lparen', value: '(', index: i });
      i++;
      continue;
    }

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    tokens.push({ type: 'other', value: char, index: i });
    i++;
  }
  return tokens;
}

function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Check for escape( and unescape( in .js files', (t) => {
  const jsFiles = findJsFiles('.');

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const tokens = tokenize(code);

    let occurrences = 0;
    for (let i = 0; i < tokens.length - 1; i++) {
      const token = tokens[i];
      if (token.type === 'word' && (token.value === 'escape' || token.value === 'unescape')) {
        const nextToken = tokens[i + 1];
        if (nextToken.type === 'lparen') {
          occurrences++;
        }
      }
    }

    const relativePath = file.startsWith('./') ? file.slice(2) : file;
    const allowed = ALLOWLIST[relativePath] || 0;

    assert.ok(
      occurrences <= allowed,
      `File ${file} contains ${occurrences} unallowed 'escape(' or 'unescape(' calls (allowed: ${allowed})`
    );
  }
});

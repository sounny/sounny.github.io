const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {};

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === 'scripts' || file === '.git' || file.startsWith('.')) {
      continue;
    }
    const filePath = path.join(dir, file);
    if (filePath.includes('vendored') || filePath.includes('minified')) {
      continue;
    }
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.js') && !file.endsWith('.min.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function countDisallowedHttpStrings(code) {
  let count = 0;
  let i = 0;

  while (i < code.length) {
    const char = code[i];

    // Handle single-line comments
    if (char === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Handle multi-line comments
    if (char === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    // Handle strings
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let start = i + 1;
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2; // Skip escaped character
        } else if (code[i] === quote) {
          const strVal = code.substring(start, i);
          if (strVal.startsWith('http://') && !strVal.startsWith('http://localhost') && !strVal.startsWith('http://127.0.0.1')) {
            count++;
          }
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }

    i++;
  }

  return count;
}

test('no http:// string literals other than localhost', () => {
  const rootDir = path.resolve(__dirname, '..');
  const files = walkDir(rootDir);

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const count = countDisallowedHttpStrings(code);

    const allowed = ALLOWLIST[relPath] || 0;

    assert.ok(
      count <= allowed,
      `File ${relPath} contains ${count} disallowed http:// string literal(s), exceeding allowlist of ${allowed}.`
    );
  }
});

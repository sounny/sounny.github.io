const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === '.git') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function removeStringsAndComments(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }
    if (code[i] === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      continue;
    }
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2;
        } else if (code[i] === quote) {
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }
    result += code[i];
    i++;
  }
  return result;
}

test('no void operator', () => {
  const rootDir = path.resolve(__dirname, '..');
  const jsFiles = findJsFiles(rootDir);
  const allowlist = [];

  const violations = [];

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const stripped = removeStringsAndComments(code);
    if (/\bvoid\b/.test(stripped)) {
      const relativePath = path.relative(rootDir, file);
      if (!allowlist.includes(relativePath)) {
        violations.push(relativePath);
      }
    }
  }

  assert.deepStrictEqual(violations, [], 'Found void operator in these files');
});

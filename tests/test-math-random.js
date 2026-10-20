const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {};

function countCalls(code) {
  let count = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < code.length; i++) {
    if (inLineComment) {
      if (code[i] === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (code[i] === '*' && code[i + 1] === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (code[i] === '\\') {
        i++;
      } else if (code[i] === stringChar) {
        inString = false;
      }
      continue;
    }

    if (code[i] === '/' && code[i + 1] === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (code[i] === '/' && code[i + 1] === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      inString = true;
      stringChar = code[i];
      continue;
    }

    if (code.startsWith('Math.random', i)) {
      let afterIdx = i + 'Math.random'.length;
      let nextIdx = afterIdx;
      while (nextIdx < code.length && /\s/.test(code[nextIdx])) {
        nextIdx++;
      }
      if (code[nextIdx] === '(') {
        count++;
      }
    }
  }
  return count;
}

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== '.git') {
        walk(fullPath, fileList);
      }
    } else if (fullPath.endsWith('.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

test('limit Math.random() calls', () => {
  const jsFiles = walk(path.join(__dirname, '..'));

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    const count = countCalls(code);

    const allowedCount = ALLOWLIST[relativePath] || 0;

    assert.ok(
      count <= allowedCount,
      `File ${relativePath} has ${count} calls to Math.random(), but only ${allowedCount} are allowed.`
    );
  }
});

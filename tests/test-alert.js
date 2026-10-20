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

    let wordMatch = null;
    if (code.startsWith('alert', i)) wordMatch = 'alert';
    else if (code.startsWith('confirm', i)) wordMatch = 'confirm';
    else if (code.startsWith('prompt', i)) wordMatch = 'prompt';

    if (wordMatch) {
      let before = i === 0 ? ' ' : code[i - 1];
      let afterIdx = i + wordMatch.length;
      if (!/[a-zA-Z0-9_$]/.test(before) && !/[a-zA-Z0-9_$]/.test(code[afterIdx])) {
         let nextIdx = afterIdx;
         while (nextIdx < code.length && /\s/.test(code[nextIdx])) nextIdx++;
         if (code[nextIdx] === '(') {
            if (before !== '.') {
              count++;
            }
         }
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

test('no bare alert(), confirm(), or prompt() calls', () => {
  const jsFiles = walk(path.join(__dirname, '..'));

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    const count = countCalls(code);

    const allowedCount = ALLOWLIST[relativePath] || 0;

    assert.ok(
      count <= allowedCount,
      `File ${relativePath} has ${count} calls to alert(), confirm(), or prompt(), but only ${allowedCount} are allowed.`
    );
  }
});

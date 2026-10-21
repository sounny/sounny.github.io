const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {};

function countTodoFixme(code) {
  let count = 0;
  let i = 0;
  let inString = false;
  let stringChar = null;
  let escapeNext = false;
  let inLineComment = false;
  let inBlockComment = false;

  while (i < code.length) {
    const char = code[i];
    const nextChar = code[i + 1];

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
      } else {
        if (code.startsWith('TODO', i)) {
          count++;
          i += 4;
          continue;
        }
        if (code.startsWith('FIXME', i)) {
          count++;
          i += 5;
          continue;
        }
      }
      i++;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i += 2;
      } else {
        if (code.startsWith('TODO', i)) {
          count++;
          i += 4;
          continue;
        }
        if (code.startsWith('FIXME', i)) {
          count++;
          i += 5;
          continue;
        }
        i++;
      }
      continue;
    }

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
        i++;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        i++;
        continue;
      }
      if (char === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }

    // Check for comments start
    if (char === '/' && nextChar === '/') {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (char === '/' && nextChar === '*') {
      inBlockComment = true;
      i += 2;
      continue;
    }

    // Check for strings start
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      i++;
      continue;
    }

    i++;
  }

  return count;
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === '.git') {
      continue;
    }
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Check for TODO and FIXME occurrences in site .js files', () => {
  const rootDir = path.resolve(__dirname, '..');
  const files = walkDir(rootDir);

  for (const file of files) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');

    const code = fs.readFileSync(file, 'utf8');
    const count = countTodoFixme(code);

    const allowed = ALLOWLIST[relPath] || 0;

    assert.ok(
      count <= allowed,
      `File ${relPath} has ${count} TODO/FIXME occurrences in comments, which exceeds the allowed ${allowed}.`
    );
  }
});

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {};

function tokenize(code) {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    if (code.startsWith('//', i)) {
      let next = code.indexOf('\n', i);
      if (next === -1) break;
      i = next + 1;
    } else if (code.startsWith('/*', i)) {
      let next = code.indexOf('*/', i + 2);
      if (next === -1) break;
      i = next + 2;
    } else if (code[i] === "'" || code[i] === '"' || code[i] === '`') {
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
    } else if (/\s/.test(code[i])) {
      i++;
    } else if (/[a-zA-Z_$]/.test(code[i])) {
      let start = i;
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        i++;
      }
      tokens.push(code.substring(start, i));
    } else {
      tokens.push(code[i]);
      i++;
    }
  }
  return tokens;
}

function countKeyCodeWhich(code) {
  const tokens = tokenize(code);
  let count = 0;
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i] === '.' && (tokens[i+1] === 'keyCode' || tokens[i+1] === 'which')) {
      count++;
    }
  }
  return count;
}

function scanFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== '.git') {
        scanFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('no .keyCode or .which property accesses in .js files', (t) => {
  const rootDir = path.join(__dirname, '..');
  const jsFiles = scanFiles(rootDir);
  const errors = [];

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(rootDir, file);
    const count = countKeyCodeWhich(code);

    const allowedCount = ALLOWLIST[relativePath] || 0;

    if (count > allowedCount) {
      errors.push(`File ${relativePath} has ${count} accesses to .keyCode or .which, but only ${allowedCount} are allowed.`);
    }
  }

  if (errors.length > 0) {
    assert.fail(`Found .keyCode or .which usage exceeding allowlist:\n${errors.join('\n')}`);
  }
});

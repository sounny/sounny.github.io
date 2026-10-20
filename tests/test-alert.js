const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// A simple tokenizer to skip strings and comments
function countAlerts(code) {
  let count = 0;
  let i = 0;
  while (i < code.length) {
    // skip single line comments
    if (code[i] === '/' && code[i+1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    // skip multi line comments
    if (code[i] === '/' && code[i+1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i+1] === '/')) i++;
      i += 2;
      continue;
    }
    // skip single quotes strings
    if (code[i] === "'") {
      i++;
      while (i < code.length && code[i] !== "'") {
        if (code[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    // skip double quotes strings
    if (code[i] === '"') {
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    // skip template literals
    if (code[i] === '`') {
      i++;
      while (i < code.length && code[i] !== '`') {
        if (code[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }

    // Check for alert(, confirm(, prompt(
    if (code.slice(i, i + 6) === 'alert(') {
      count++;
      i += 6;
      continue;
    }
    if (code.slice(i, i + 8) === 'confirm(') {
      count++;
      i += 8;
      continue;
    }
    if (code.slice(i, i + 7) === 'prompt(') {
      count++;
      i += 7;
      continue;
    }
    i++;
  }
  return count;
}

function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && !file.startsWith('.')) {
        findJsFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Check for alert/confirm/prompt calls', () => {
  const rootDir = path.resolve(__dirname, '..');
  const jsFiles = findJsFiles(rootDir);

  // Allowlist logic mapping relative file paths to allowed counts
  // e.g. { 'js/main.js': 1 }
  const allowlist = {};

  let totalExceeded = 0;

  for (const file of jsFiles) {
    if (file === __filename) continue; // Skip this test file itself
    const code = fs.readFileSync(file, 'utf8');
    const count = countAlerts(code);

    if (count > 0) {
      const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
      const allowedCount = allowlist[relPath] || 0;
      if (count > allowedCount) {
        totalExceeded += (count - allowedCount);
        console.error(`Found ${count} alert/confirm/prompt calls in ${relPath}, allowed: ${allowedCount}`);
      }
    }
  }

  assert.strictEqual(totalExceeded, 0, `Found unallowed alert/confirm/prompt calls.`);
});

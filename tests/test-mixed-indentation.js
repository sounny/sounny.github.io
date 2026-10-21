const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function checkMixedIndentation(code) {
  let occurrences = 0;
  let i = 0;
  let len = code.length;
  let isStartOfLine = true;

  while (i < len) {
    if (isStartOfLine) {
      let lineHasTab = false;
      let lineHasSpace = false;

      while (i < len && (code[i] === ' ' || code[i] === '\t')) {
        if (code[i] === ' ') lineHasSpace = true;
        if (code[i] === '\t') lineHasTab = true;
        i++;
      }

      if (lineHasTab && lineHasSpace) {
        occurrences++;
      }

      isStartOfLine = false;
    }

    if (i >= len) break;

    let char = code[i];

    if (char === '\n') {
      isStartOfLine = true;
      i++;
      continue;
    }

    if (char === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < len && code[i] !== '\n') {
        i++;
      }
      continue;
    }

    if (char === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < len && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      let quote = char;
      i++;
      while (i < len) {
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

    i++;
  }
  return occurrences;
}

const ALLOWLIST = {
};

function getAllFiles(dir, extList, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== 'scripts' && file !== '.git') {
        getAllFiles(filepath, extList, fileList);
      }
    } else {
      if (extList.includes(path.extname(filepath))) {
        fileList.push(filepath);
      }
    }
  }
  return fileList;
}

test('no mixed indentation (tabs and spaces) on the same line', () => {
  const root = path.resolve(__dirname, '..');
  const files = getAllFiles(root, ['.js', '.html', '.css']); // "scans site .js files (and .html or .css where relevant..."

  let hasErrors = false;
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const occ = checkMixedIndentation(code);
    const relPath = path.relative(root, file).replace(/\\/g, '/');

    const allowed = ALLOWLIST[relPath] || 0;

    // We scan .js, .html, .css. We only strictly fail on .js based on prompt: "fails on .js files whose leading indentation mixes tabs and spaces".
    // I will log errors for all, but only set hasErrors=true for .js files.
    if (occ > allowed) {
      console.error(`File ${relPath} has mixed indentation (tabs and spaces) on ${occ} line(s) (allowed: ${allowed}).`);
      if (file.endsWith('.js')) {
        hasErrors = true;
      }
    }
  }

  assert.strictEqual(hasErrors, false, 'Found unallowed mixed indentation in .js files.');
});

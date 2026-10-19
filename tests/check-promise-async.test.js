const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Allowlist for any existing occurrences (none currently found)
const allowlist = [];

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    // Exclude node_modules and tests
    if (fullPath.includes('node_modules') || fullPath.includes('tests')) {
      continue;
    }
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getFiles(fullPath, files);
    } else {
      if (fullPath.endsWith('.js') || fullPath.endsWith('.html') || fullPath.endsWith('.css')) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function stripStringsAndComments(code) {
  let result = '';
  let i = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inTemplateLiteral = false;
  let inLineComment = false;
  let inBlockComment = false;

  while (i < code.length) {
    const char = code[i];
    const nextChar = code[i + 1] || '';

    // Handle escape characters in strings
    if ((inSingleQuote || inDoubleQuote || inTemplateLiteral) && char === '\\') {
      i += 2;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral && !inLineComment && !inBlockComment) {
      if (char === '/' && nextChar === '/') {
        inLineComment = true;
        i += 2;
        continue;
      } else if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        i += 2;
        continue;
      } else if (char === "'") {
        inSingleQuote = true;
        i++;
        continue;
      } else if (char === '"') {
        inDoubleQuote = true;
        i++;
        continue;
      } else if (char === '`') {
        inTemplateLiteral = true;
        i++;
        continue;
      } else {
        result += char;
        i++;
      }
    } else if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        result += char;
      }
      i++;
    } else if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i += 2;
      } else {
        i++;
      }
    } else if (inSingleQuote) {
      if (char === "'") {
        inSingleQuote = false;
      }
      i++;
    } else if (inDoubleQuote) {
      if (char === '"') {
        inDoubleQuote = false;
      }
      i++;
    } else if (inTemplateLiteral) {
      if (char === '`') {
        inTemplateLiteral = false;
      }
      i++;
    } else {
      i++;
    }
  }
  return result;
}

test('no new Promise(async ...) patterns', () => {
  const rootDir = path.resolve(__dirname, '..');
  const files = getFiles(rootDir);

  for (const file of files) {
    if (allowlist.includes(file)) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const cleanContent = stripStringsAndComments(content);

    // Regex to detect "new Promise(async" with possible whitespaces
    const regex = /new\s+Promise\s*\(\s*async/g;

    let match;
    while ((match = regex.exec(cleanContent)) !== null) {
      assert.fail(`Found new Promise(async ...) executor in file: ${file}`);
    }
  }
});

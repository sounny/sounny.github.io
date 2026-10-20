const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [
];

function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file.startsWith('.')) continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllJsFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function stripStringsAndComments(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    if (code.startsWith('//', i)) {
      let nextLine = code.indexOf('\n', i);
      if (nextLine === -1) nextLine = code.length;
      result += ' '.repeat(nextLine - i);
      i = nextLine;
    } else if (code.startsWith('/*', i)) {
      let end = code.indexOf('*/', i);
      if (end === -1) end = code.length;
      else end += 2;
      result += ' '.repeat(end - i);
      i = end;
    } else if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      let quote = code[i];
      let start = i;
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
      result += ' '.repeat(i - start);
    } else {
      result += code[i];
      i++;
    }
  }
  return result;
}

test('No new Function( calls in JS files', (t) => {
  const files = getAllJsFiles('.');

  for (const file of files) {
    if (ALLOWLIST.includes(file)) continue;

    const code = fs.readFileSync(file, 'utf8');
    const stripped = stripStringsAndComments(code);

    if (/\bnew\s+Function\s*\(/.test(stripped)) {
      assert.fail(`Found new Function( in ${file}`);
    }
  }
});

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [];

function checkFile(file) {
  const source = fs.readFileSync(file, 'utf8');
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;
  let inHtmlComment = false;
  let escapeNext = false;
  let errors = [];

  for (let i = 0; i < source.length; i++) {
    const c = source[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick && !inLineComment && !inBlockComment && !inHtmlComment) {
      if (c === '/' && source[i+1] === '/') {
        inLineComment = true;
        i++;
      } else if (c === '/' && source[i+1] === '*') {
        inBlockComment = true;
        i++;
      } else if (c === '<' && source.substring(i, i+4) === '<!--') {
        inHtmlComment = true;
        i += 3;
      } else if (c === "'") {
        inSingle = true;
      } else if (c === '"') {
        inDouble = true;
      } else if (c === '`') {
        inBacktick = true;
      } else {
        if (source.startsWith('isNaN', i) || source.startsWith('isFinite', i)) {
          const word = source.startsWith('isNaN', i) ? 'isNaN' : 'isFinite';
          const leftChar = i > 0 ? source[i - 1] : '';
          const rightChar = i + word.length < source.length ? source[i + word.length] : '';

          if (!/[a-zA-Z0-9_$.]/.test(leftChar) && !/[a-zA-Z0-9_$]/.test(rightChar)) {
            let j = i + word.length;
            while (j < source.length && /\s/.test(source[j])) j++;
            if (j < source.length && source[j] === '(') {
              const line = source.substring(0, i).split('\n').length;
              errors.push(`${file}:${line} ${word}`);
            }
          }
        }
      }
    } else {
      if (inLineComment && (c === '\n' || c === '\r')) {
        inLineComment = false;
      } else if (inBlockComment && c === '*' && source[i+1] === '/') {
        inBlockComment = false;
        i++;
      } else if (inHtmlComment && source.substring(i, i+3) === '-->') {
        inHtmlComment = false;
        i += 2;
      } else if (inSingle && c === '\\') {
        escapeNext = true;
      } else if (inDouble && c === '\\') {
        escapeNext = true;
      } else if (inBacktick && c === '\\') {
        escapeNext = true;
      } else if (inSingle && c === "'") {
        inSingle = false;
      } else if (inDouble && c === '"') {
        inDouble = false;
      } else if (inBacktick && c === '`') {
        inBacktick = false;
      }
    }
  }
  return errors;
}

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file === '.git') continue;
      getFiles(filePath, fileList);
    } else {
      if (file.endsWith('.js') || file.endsWith('.html')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

test('No bare isNaN or isFinite calls in .js and .html files', () => {
  const files = getFiles('.');
  let allErrors = [];

  for (const file of files) {
    const errors = checkFile(file);
    for (const err of errors) {
      if (!ALLOWLIST.includes(err)) {
        allErrors.push(err);
      }
    }
  }

  assert.deepStrictEqual(allErrors, [], `Found bare isNaN or isFinite calls:\n${allErrors.join('\n')}`);
});

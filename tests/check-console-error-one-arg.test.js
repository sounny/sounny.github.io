const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const allowlist = {
  "scripts/check-http-resources.test.js": 2,
  "scripts/check-meta-duplicates.js": 1
};

const ALLOWED_COUNT = Object.values(allowlist).reduce((sum, count) => sum + count, 0);

function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === '.git') {
      continue;
    }
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function countConsoleErrorOneArg(code) {
  let count = 0;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  let inRegex = false;

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
    if (inRegex) {
      if (code[i] === '\\') {
        i++;
      } else if (code[i] === '/') {
        inRegex = false;
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

    // Primitive Regex support (checking if '/' follows something that is not alphanumeric, a closing parenthesis or bracket)
    if (code[i] === '/') {
      let j = i - 1;
      while (j >= 0 && /\s/.test(code[j])) j--;
      let prevChar = j >= 0 ? code[j] : '';
      if (!/[a-zA-Z0-9_$)\]}]/.test(prevChar)) {
        inRegex = true;
        continue;
      }
    }

    if (code.startsWith('console.error', i)) {
      let before = i === 0 ? ' ' : code[i - 1];
      let afterIdx = i + 13;
      if (!/[a-zA-Z0-9_$]/.test(before) && !/[a-zA-Z0-9_$]/.test(code[afterIdx])) {
         let nextIdx = afterIdx;
         while (nextIdx < code.length && /\s/.test(code[nextIdx])) nextIdx++;
         if (code[nextIdx] === '(') {
            let k = nextIdx + 1;
            let parenCount = 1;
            let argCount = 1;
            let hasContent = false;
            let localInString = false;
            let localStringChar = '';
            let stack = [];

            while (k < code.length && parenCount > 0) {
              if (localInString) {
                if (code[k] === '\\') {
                  k++;
                } else if (localStringChar === '`' && code[k] === '$' && code[k+1] === '{') {
                  stack.push('`');
                  localInString = false;
                  k++;
                } else if (code[k] === localStringChar) {
                  localInString = false;
                }
                k++;
                continue;
              }

              if (code[k] === '"' || code[k] === "'" || code[k] === '`') {
                localInString = true;
                localStringChar = code[k];
                hasContent = true;
                k++;
                continue;
              }

              if (code[k] === '(') {
                stack.push('(');
                hasContent = true;
              } else if (code[k] === ')') {
                if (stack.length > 0 && stack[stack.length - 1] === '(') {
                  stack.pop();
                } else if (stack.length === 0) {
                   parenCount--;
                   if (parenCount === 0) {
                     if (!hasContent && argCount === 1) argCount = 0;
                     break;
                   }
                }
                hasContent = true;
              } else if (code[k] === '[') {
                stack.push('[');
                hasContent = true;
              } else if (code[k] === ']') {
                if (stack.length > 0 && stack[stack.length - 1] === '[') {
                  stack.pop();
                }
                hasContent = true;
              } else if (code[k] === '{') {
                stack.push('{');
                hasContent = true;
              } else if (code[k] === '}') {
                if (stack.length > 0 && stack[stack.length - 1] === '{') {
                  stack.pop();
                } else if (stack.length > 0 && stack[stack.length - 1] === '`') {
                  stack.pop();
                  localInString = true;
                  localStringChar = '`';
                }
                hasContent = true;
              } else if (code[k] === ',' && parenCount === 1 && stack.length === 0) {
                argCount++;
              } else if (!/\s/.test(code[k])) {
                hasContent = true;
              }
              k++;
            }
            if (argCount === 1) {
              count++;
            }
         }
      }
    }
  }
  return count;
}

test('no new console.error calls with exactly one argument', () => {
  const jsFiles = getJsFiles(path.join(__dirname, '..'));
  let totalCount = 0;

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf-8');
    const count = countConsoleErrorOneArg(code);
    const relPath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');

    if (count > 0) {
      const allowedCount = allowlist[relPath] || 0;
      assert.ok(
        count <= allowedCount,
        `File ${relPath} has ${count} console.error calls with one argument, but only ${allowedCount} are allowed.`
      );
    }
    totalCount += count;
  }

  assert.ok(
    totalCount <= ALLOWED_COUNT,
    `Total one-argument console.error calls (${totalCount}) exceeds allowlist (${ALLOWED_COUNT}).`
  );
});

const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

// The allowlist (initially 0)
const ALLOWLIST_COUNT = 0;

function tokenize(code) {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    const c = code[i];
    if (c === '/' && code[i+1] === '/') {
      let end = code.indexOf('\n', i);
      if (end === -1) end = code.length;
      tokens.push({ type: 'Comment', value: code.slice(i, end) });
      i = end;
    } else if (c === '/' && code[i+1] === '*') {
      let end = code.indexOf('*/', i + 2);
      if (end === -1) end = code.length;
      else end += 2;
      tokens.push({ type: 'Comment', value: code.slice(i, end) });
      i = end;
    } else if (c === "'" || c === '"' || c === '`') {
      let quote = c;
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') {
          j += 2;
        } else if (code[j] === quote) {
          j++;
          break;
        } else {
          j++;
        }
      }
      tokens.push({ type: 'String', value: code.slice(i, j) });
      i = j;
    } else if (/\s/.test(c)) {
      let j = i + 1;
      while (j < code.length && /\s/.test(code[j])) j++;
      tokens.push({ type: 'Whitespace', value: code.slice(i, j) });
      i = j;
    } else if (/[a-zA-Z0-9_$]/.test(c)) {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      tokens.push({ type: 'Identifier', value: code.slice(i, j) });
      i = j;
    } else if (code.slice(i, i+2) === '=>') {
      tokens.push({ type: 'Punctuator', value: '=>' });
      i += 2;
    } else {
      tokens.push({ type: 'Punctuator', value: c });
      i++;
    }
  }
  return tokens;
}

function countEmptyFunctions(code) {
  const tokens = tokenize(code);
  const sigTokens = tokens.filter(t => t.type !== 'Comment' && t.type !== 'Whitespace' && t.type !== 'String');
  let count = 0;
  for (let i = 0; i < sigTokens.length - 1; i++) {
    if (sigTokens[i].value === '{' && sigTokens[i+1].value === '}') {
      let isFunc = false;
      let prevToken = sigTokens[i-1];
      if (!prevToken) continue;

      if (prevToken.value === '=>') {
        isFunc = true;
      } else if (prevToken.value === ')') {
        let openParenIdx = -1;
        let parenCount = 1;
        for (let j = i - 2; j >= 0; j--) {
          if (sigTokens[j].value === ')') parenCount++;
          else if (sigTokens[j].value === '(') parenCount--;
          if (parenCount === 0) {
            openParenIdx = j;
            break;
          }
        }
        if (openParenIdx > 0) {
          let tokenBeforeParen = sigTokens[openParenIdx - 1];
          if (tokenBeforeParen.value === 'function') {
            isFunc = true;
          } else if (tokenBeforeParen.value === '*') {
            let beforeStar = sigTokens[openParenIdx - 2];
            if (beforeStar && beforeStar.value === 'function') {
              isFunc = true;
            }
          } else if (tokenBeforeParen.type === 'Identifier') {
            const keywords = ['if', 'while', 'for', 'catch', 'switch', 'with'];
            if (!keywords.includes(tokenBeforeParen.value)) {
              isFunc = true;
            }
          } else if (tokenBeforeParen.value === ']') {
            isFunc = true;
          }
        } else if (openParenIdx === 0) {
           // Starts with ( ... ) { } - highly unlikely but could be IIFE missing wrapping parens
        }
      }
      if (isFunc) {
        count++;
      }
    }
  }
  return count;
}

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === '.git' || file === 'scripts') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Check for empty function bodies in .js files', () => {
  const jsFiles = walk(process.cwd());
  let totalEmptyFunctions = 0;

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const emptyCount = countEmptyFunctions(code);
    totalEmptyFunctions += emptyCount;
  }

  assert.ok(
    totalEmptyFunctions <= ALLOWLIST_COUNT,
    `Found ${totalEmptyFunctions} empty function bodies, which exceeds the allowlist of ${ALLOWLIST_COUNT}.`
  );
});

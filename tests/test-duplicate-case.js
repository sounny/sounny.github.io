const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

function* tokenize(code) {
  let i = 0;
  while (i < code.length) {
    let char = code[i];

    if (char === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < code.length && code[i] !== '\n' && code[i] !== '\r') {
        i++;
      }
      continue;
    }

    if (char === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      let quote = char;
      let start = i;
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2;
          continue;
        }
        if (code[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      yield { type: 'string', value: code.substring(start, i), start };
      continue;
    }

    if (/[a-zA-Z0-9_$]/.test(char)) {
      let start = i;
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        i++;
      }
      yield { type: 'word', value: code.substring(start, i), start };
      continue;
    }

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    yield { type: 'punct', value: char, start: i };
    i++;
  }
}

function checkDuplicateCases(code) {
  let tokens = Array.from(tokenize(code));
  let state = 'normal';
  let switchStack = [];
  let braceDepth = 0;
  let parensDepth = 0;
  let ternaryDepth = 0;
  let currentCaseTokens = [];
  let duplicates = [];

  for (let token of tokens) {
    if (token.type === 'punct' && token.value === '{') {
      braceDepth++;
      if (state === 'wait_switch_body') {
        switchStack.push({ depth: braceDepth - 1, cases: new Set() });
        state = 'normal';
      }
    } else if (token.type === 'punct' && token.value === '}') {
      braceDepth--;
      if (switchStack.length > 0 && braceDepth === switchStack[switchStack.length - 1].depth) {
        switchStack.pop();
      }
    } else if (token.type === 'word' && token.value === 'switch') {
      state = 'wait_switch_parens';
    } else if (token.type === 'punct' && token.value === '(' && state === 'wait_switch_parens') {
      parensDepth = 1;
      state = 'in_switch_parens';
    } else if (state === 'in_switch_parens') {
      if (token.type === 'punct' && token.value === '(') parensDepth++;
      else if (token.type === 'punct' && token.value === ')') {
        parensDepth--;
        if (parensDepth === 0) {
          state = 'wait_switch_body';
        }
      }
    } else if (token.type === 'word' && token.value === 'case' && state === 'normal') {
      if (switchStack.length > 0) {
        state = 'in_case';
        currentCaseTokens = [];
        ternaryDepth = 0;
      }
    } else if (state === 'in_case') {
      if (token.type === 'punct' && token.value === '?') {
        ternaryDepth++;
        currentCaseTokens.push(token);
      } else if (token.type === 'punct' && token.value === ':') {
        if (ternaryDepth > 0) {
          ternaryDepth--;
          currentCaseTokens.push(token);
        } else {
          let exprStr = currentCaseTokens.map(t => t.value).join('');
          let currentSwitch = switchStack[switchStack.length - 1];
          if (currentSwitch.cases.has(exprStr)) {
            duplicates.push(exprStr);
          }
          currentSwitch.cases.add(exprStr);
          state = 'normal';
        }
      } else {
        currentCaseTokens.push(token);
      }
    }
  }
  return duplicates;
}

const ALLOWLIST = {};

function getAllFiles(dir, extList, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== '.git') {
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

test('no duplicate switch cases', () => {
  const root = path.resolve(__dirname, '..');
  const files = getAllFiles(root, ['.js', '.html', '.css']);

  let hasErrors = false;
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const duplicates = checkDuplicateCases(code);
    const relPath = path.relative(root, file).replace(/\\/g, '/');

    const allowed = ALLOWLIST[relPath] || [];
    const unexpected = duplicates.filter(d => !allowed.includes(d));

    if (unexpected.length > 0) {
      console.error(`File ${relPath} has unallowed duplicate switch cases: ${unexpected.join(', ')}`);
      hasErrors = true;
    }
  }

  assert.strictEqual(hasErrors, false, 'Found unallowed duplicate switch cases.');
});

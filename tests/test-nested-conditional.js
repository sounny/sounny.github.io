const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {
  'tests/check-form-labels.test.js': 1
};

function tokenize(code) {
  let tokens = [];
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < code.length; i++) {
    let char = code[i];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && code[i + 1] === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (char === '\\') {
        i++;
      } else if (char === stringChar) {
        inString = false;
      }
      continue;
    }

    if (char === '/' && code[i + 1] === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (char === '/' && code[i + 1] === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    // Skip regex literals heuristically
    if (char === '/') {
      let j = i - 1;
      while (j >= 0 && /\s/.test(code[j])) j--;
      let prevChar = j >= 0 ? code[j] : '';
      if (!/[a-zA-Z0-9_$\])]/.test(prevChar)) {
        let k = i + 1;
        let inRegexClass = false;
        while (k < code.length) {
          if (code[k] === '\\') { k += 2; continue; }
          if (code[k] === '[') inRegexClass = true;
          if (code[k] === ']') inRegexClass = false;
          if (code[k] === '/' && !inRegexClass) {
            i = k;
            break;
          }
          if (code[k] === '\n') break;
          k++;
        }
        if (code[i] === '/') continue;
      }
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === '?') {
        if (code[i+1] === '.' || code[i+1] === '?') {
            i++;
            continue;
        }
        tokens.push({ type: '?' });
    } else if (char === ':') {
        tokens.push({ type: ':' });
    } else if (char === '(' || char === '{' || char === '[') {
        tokens.push({ type: 'open', char });
    } else if (char === ')' || char === '}' || char === ']') {
        tokens.push({ type: 'close', char });
    } else if (char === ';' || char === ',') {
        tokens.push({ type: 'sep', char });
    }
  }
  return tokens;
}

function countNestedTernary(code) {
    let tokens = tokenize(code);
    let activeTernaries = [];
    let scopeDepth = 0;
    let count = 0;

    for (let i = 0; i < tokens.length; i++) {
        let t = tokens[i];

        if (t.type === 'open') {
            scopeDepth++;
        } else if (t.type === 'close') {
            scopeDepth--;
            while (activeTernaries.length > 0 && activeTernaries[activeTernaries.length - 1].scopeDepth > scopeDepth) {
                activeTernaries.pop();
            }
        } else if (t.type === 'sep') {
            while (activeTernaries.length > 0 && activeTernaries[activeTernaries.length - 1].scopeDepth === scopeDepth) {
                activeTernaries.pop();
            }
        } else if (t.type === '?') {
            if (activeTernaries.some(ternary => ternary.scopeDepth <= scopeDepth)) {
                count++;
            }
            activeTernaries.push({ scopeDepth, state: '?' });
        } else if (t.type === ':') {
            let lastTernary = activeTernaries.slice().reverse().find(ternary => ternary.scopeDepth === scopeDepth && ternary.state === '?');
            if (lastTernary) {
                lastTernary.state = ':';
            }
        }
    }

    return count;
}

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', 'tests', '.git'].includes(file)) {
        walk(fullPath, fileList);
      }
    } else if (fullPath.endsWith('.js')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

test('no nested conditional expressions beyond allowlist', () => {
    const rootDir = path.join(__dirname, '..');
    const jsFiles = walk(rootDir);
    let hasError = false;

    for (const file of jsFiles) {
        const relativePath = path.relative(rootDir, file).replace(/\\/g, '/');
        const code = fs.readFileSync(file, 'utf8');
        const count = countNestedTernary(code);
        const allowedCount = ALLOWLIST[relativePath] || 0;

        if (count > allowedCount) {
            console.error(`File ${relativePath} has ${count} nested conditional expressions, but only ${allowedCount} are allowed.`);
            hasError = true;
        }
    }

    assert.strictEqual(hasError, false, 'Found files exceeding the allowed number of nested conditional expressions.');
});

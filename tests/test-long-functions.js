const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {
  'js/main.js': 1,
};

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== 'scripts' && file !== '.git') {
        walk(fullPath, fileList);
      }
    } else if (fullPath.endsWith('.js') && !fullPath.includes('.min.js') && !fullPath.includes('vendor')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function countLongFunctions(code) {
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  let currentLine = 1;

  let parenDepth = 0;
  let pendingFunctions = [];
  let activeBlocks = [];
  let expectingArrowBody = 0;

  let longFuncs = 0;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (char === '\n') currentLine++;

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
        i++; // skip next char
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
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }

    // Ignore whitespace for tokens
    if (/\s/.test(char)) continue;

    if (expectingArrowBody) {
      if (char === '{') {
        activeBlocks.push({ isFunction: true, startLine: expectingArrowBody });
        expectingArrowBody = 0;
        continue; // handled this char
      } else {
        expectingArrowBody = 0; // not a block body
      }
    }

    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === '{') {
      let foundIndex = -1;
      for (let j = pendingFunctions.length - 1; j >= 0; j--) {
        if (pendingFunctions[j].parenDepth === parenDepth) {
          foundIndex = j;
          break;
        }
      }
      if (foundIndex !== -1) {
        let func = pendingFunctions[foundIndex];
        pendingFunctions.splice(foundIndex, 1);
        activeBlocks.push({ isFunction: true, startLine: func.startLine });
      } else {
        activeBlocks.push({ isFunction: false });
      }
    } else if (char === '}') {
      if (activeBlocks.length > 0) {
        let block = activeBlocks.pop();
        if (block.isFunction) {
          if (currentLine - block.startLine > 100) {
            longFuncs++;
          }
        }
      }
    } else if (char === '=' && code[i + 1] === '>') {
      expectingArrowBody = currentLine;
      i++; // skip >
    } else if (code.startsWith('function', i)) {
      // Check boundaries
      let before = i === 0 ? ' ' : code[i - 1];
      let after = code[i + 8];
      if (!/[a-zA-Z0-9_$]/.test(before) && (!after || !/[a-zA-Z0-9_$]/.test(after))) {
        pendingFunctions.push({ startLine: currentLine, parenDepth: parenDepth });
        i += 7; // skip 'unction'
      }
    }
  }
  return longFuncs;
}

test('no new functions longer than 100 lines', () => {
  const jsFiles = walk(path.join(__dirname, '..'));

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    const count = countLongFunctions(code);

    const allowedCount = ALLOWLIST[relativePath] || 0;

    assert.ok(
      count <= allowedCount,
      `File ${relativePath} has ${count} functions longer than 100 lines, but only ${allowedCount} are allowed.`
    );
  }
});

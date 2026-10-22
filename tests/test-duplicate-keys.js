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
      yield { type: 'string', value: code.substring(start, i) };
      continue;
    }

    if (/[a-zA-Z0-9_$]/.test(char)) {
      let start = i;
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        i++;
      }
      yield { type: 'word', value: code.substring(start, i) };
      continue;
    }

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    yield { type: 'punct', value: char };
    i++;
  }
}

function checkDuplicateKeys(code) {
  let tokens = Array.from(tokenize(code));
  let blockStack = [];
  let duplicates = [];
  let i = 0;

  while (i < tokens.length) {
    let t = tokens[i];
    if (t.type === 'punct' && t.value === '{') {
      blockStack.push({ keys: new Set(), inTernary: 0 });
    } else if (t.type === 'punct' && t.value === '}') {
      blockStack.pop();
    } else if (t.type === 'punct' && t.value === '?') {
      if (blockStack.length > 0) {
        let currentBlock = blockStack[blockStack.length - 1];
        currentBlock.inTernary++;
      }
    } else if (t.type === 'punct' && t.value === ':') {
      if (blockStack.length > 0) {
        let currentBlock = blockStack[blockStack.length - 1];
        if (currentBlock.inTernary > 0) {
          currentBlock.inTernary--;
        } else {
          let prevIndex = i - 1;
          let keyToken = tokens[prevIndex];
          if (keyToken && (keyToken.type === 'word' || keyToken.type === 'string')) {
            let beforeKey = prevIndex > 0 ? tokens[prevIndex - 1] : null;
            if (keyToken.type === 'word' && (keyToken.value === 'default')) {
              // skip
            } else if (beforeKey && beforeKey.type === 'word' && beforeKey.value === 'case') {
              // skip
            } else {
              let keyVal = keyToken.value;
              if (keyToken.type === 'string') {
                keyVal = keyVal.slice(1, -1);
              }
              if (currentBlock.keys.has(keyVal)) {
                duplicates.push(keyVal);
              }
              currentBlock.keys.add(keyVal);
            }
          }
        }
      }
    }
    i++;
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

test('no duplicate keys in object literals', () => {
  const root = path.resolve(__dirname, '..');
  const files = getAllFiles(root, ['.js']);
  let hasErrors = false;

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const duplicates = checkDuplicateKeys(code);
    const relPath = path.relative(root, file).replace(/\\/g, '/');
    const allowed = ALLOWLIST[relPath] || [];
    const unexpected = duplicates.filter(d => !allowed.includes(d));

    if (unexpected.length > 0) {
      console.error(`File ${relPath} has unallowed duplicate keys: ${unexpected.join(', ')}`);
      hasErrors = true;
    }
  }
  assert.strictEqual(hasErrors, false, 'Found unallowed duplicate keys.');
});

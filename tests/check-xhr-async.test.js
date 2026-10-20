const fs = require('fs');
const test = require('node:test');
const assert = require('assert');
const path = require('path');

const allowlist = {
  // Add files to allowlist here:
  // 'js/legacy.js': 1
};

function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && !file.startsWith('.')) {
        getAllJsFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function countXhrAsyncFalse(content) {
  let i = 0;
  let tokens = [];

  while (i < content.length) {
    const c = content[i];

    // Line comment
    if (c === '/' && content[i+1] === '/') {
      while (i < content.length && content[i] !== '\n') i++;
      continue;
    }

    // Block comment
    if (c === '/' && content[i+1] === '*') {
      i += 2;
      while (i < content.length - 1 && !(content[i] === '*' && content[i+1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    // Strings
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === '\\') i++; // skip escaped
        i++;
      }
      i++;
      tokens.push({ type: 'string', value: '""' });
      continue;
    }

    // Template literals
    if (c === '`') {
      i++;
      while (i < content.length && content[i] !== '`') {
        if (content[i] === '\\') i += 2;
        else i++;
      }
      i++;
      tokens.push({ type: 'string', value: '``' });
      continue;
    }

    // Whitespace
    if (/\s/.test(c)) {
      i++;
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(c)) {
      let word = '';
      while (i < content.length && /[a-zA-Z0-9_$]/.test(content[i])) {
        word += content[i];
        i++;
      }
      tokens.push({ type: 'word', value: word });
      continue;
    }

    // Punctuation
    tokens.push({ type: 'punc', value: c });
    i++;
  }

  let count = 0;
  for (let j = 0; j < tokens.length; j++) {
    if (tokens[j].value === '.') {
      if (j + 2 < tokens.length && tokens[j+1].value === 'open' && tokens[j+2].value === '(') {
        let k = j + 3;
        let parenLevel = 1;
        let args = [[]];
        while (k < tokens.length && parenLevel > 0) {
          if (tokens[k].value === '(') {
            parenLevel++;
            args[args.length - 1].push(tokens[k]);
          } else if (tokens[k].value === ')') {
            parenLevel--;
            if (parenLevel > 0) {
              args[args.length - 1].push(tokens[k]);
            }
          } else if (tokens[k].value === ',' && parenLevel === 1) {
            args.push([]);
          } else {
            args[args.length - 1].push(tokens[k]);
          }
          k++;
        }

        if (args.length >= 3) {
          const arg3 = args[2];
          if (arg3.length === 1 && arg3[0].value === 'false') {
            count++;
          }
        }
      }
    }
  }

  return count;
}

test('Check for synchronous XMLHttpRequest open calls', () => {
  const files = getAllJsFiles('.');
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const count = countXhrAsyncFalse(content);
    // Normalize path for allowlist (use forward slashes)
    const normalizedFile = file.split(path.sep).join('/');
    const allowed = allowlist[normalizedFile] || 0;

    assert.ok(
      count <= allowed,
      `File ${file} has ${count} synchronous .open( calls, but only ${allowed} are allowed.`
    );
  }
});

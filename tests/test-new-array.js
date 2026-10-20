const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert');

function stripStringsAndComments(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    if (code[i] === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') {
        result += ' ';
        i++;
      }
    } else if (code[i] === '/' && code[i + 1] === '*') {
      result += '  ';
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        result += code[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < code.length) {
        result += '  ';
        i += 2;
      }
    } else if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      result += ' ';
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') {
          result += '  ';
          i += 2;
        } else {
          result += code[i] === '\n' ? '\n' : ' ';
          i++;
        }
      }
      if (i < code.length) {
        result += ' ';
        i++;
      }
    } else {
      result += code[i];
      i++;
    }
  }
  return result;
}

function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== '.git') {
        findJsFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('no new Array() calls in site files', () => {
  const rootDir = path.resolve(__dirname, '..');
  const files = findJsFiles(rootDir);
  const allowlist = {
    // 'js/example.js': [42]
  };

  const errors = [];

  for (const file of files) {
    const relativePath = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const stripped = stripStringsAndComments(content);

    const lines = stripped.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      if (/\bnew\s+Array\s*\(/.test(lines[i])) {
        const allowedLines = allowlist[relativePath] || [];
        if (!allowedLines.includes(lineNum)) {
          errors.push(`${relativePath}:${lineNum}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    assert.fail(`Found new Array() calls (prefer array literals or Array.from):\n${errors.join('\n')}`);
  }
});

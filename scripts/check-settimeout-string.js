const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Simple tokenizer that skips strings and comments
function tokenize(code) {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    if (code.startsWith('//', i)) {
      while (i < code.length && code[i] !== '\n') i++;
    } else if (code.startsWith('/*', i)) {
      while (i < code.length && !code.startsWith('*/', i)) i++;
      i += 2;
    } else if (code[i] === '"' || code[i] === '\'' || code[i] === '`') {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') j += 2;
        else if (code[j] === quote) break;
        else j++;
      }
      tokens.push({ type: 'StringLiteral', value: code.slice(i, j + 1) });
      i = j + 1;
    } else if (/[a-zA-Z0-9_$]/.test(code[i])) {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      tokens.push({ type: 'Identifier', value: code.slice(i, j) });
      i = j;
    } else if (/\s/.test(code[i])) {
      i++;
    } else {
      tokens.push({ type: 'Punctuator', value: code[i] });
      i++;
    }
  }
  return tokens;
}

const ALLOWLIST = [
  // Example format: { file: 'js/main.js', signature: 'setTimeout("...")' }
];

function checkFile(filepath) {
  const code = fs.readFileSync(filepath, 'utf-8');
  const tokens = tokenize(code);
  const errors = [];

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'Identifier' && (tokens[i].value === 'setTimeout' || tokens[i].value === 'setInterval')) {
      let j = i + 1;
      while (j < tokens.length && tokens[j].type === 'Punctuator' && tokens[j].value === '(') {
        if (j + 1 < tokens.length && tokens[j + 1].type === 'StringLiteral') {
          const signature = `${tokens[i].value}(${tokens[j+1].value})`;
          if (!ALLOWLIST.some(allow => filepath.endsWith(allow.file) && signature === allow.signature)) {
            errors.push(`Found ${tokens[i].value} with a string literal as the first argument in ${filepath}`);
          }
        }
        break;
      }
    }
  }
  return errors;
}

function findFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === 'tests' || file === 'scripts' || file.startsWith('.')) continue;
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filepath, extensions));
    } else {
      if (extensions.some(ext => filepath.endsWith(ext))) {
        results.push(filepath);
      }
    }
  }
  return results;
}

test('check setTimeout/setInterval with string literals', () => {
  const files = findFiles('.', ['.js', '.html']);
  let allErrors = [];
  for (const file of files) {
    allErrors = allErrors.concat(checkFile(file));
  }

  if (allErrors.length > 0) {
    assert.fail(allErrors.join('\n'));
  }
});

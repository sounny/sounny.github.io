const { test } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function getFiles(dir, extensions, excludeDirs) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        results = results.concat(getFiles(filePath, extensions, excludeDirs));
      }
    } else {
      if (extensions.some(ext => filePath.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

function tokenize(code) {
  const tokens = [];
  let i = 0;
  let line = 1;
  while (i < code.length) {
    // Single line comment
    if (code.startsWith('//', i)) {
      let end = code.indexOf('\n', i);
      if (end === -1) end = code.length;
      tokens.push({ type: 'comment', value: code.slice(i, end), line });
      line += (code.slice(i, end).match(/\n/g) || []).length;
      i = end;
      continue;
    }
    // Multi line comment
    if (code.startsWith('/*', i)) {
      let end = code.indexOf('*/', i + 2);
      if (end === -1) end = code.length;
      else end += 2;
      tokens.push({ type: 'comment', value: code.slice(i, end), line });
      line += (code.slice(i, end).match(/\n/g) || []).length;
      i = end;
      continue;
    }
    // HTML comment
    if (code.startsWith('<!--', i)) {
      let end = code.indexOf('-->', i + 4);
      if (end === -1) end = code.length;
      else end += 3;
      tokens.push({ type: 'comment', value: code.slice(i, end), line });
      line += (code.slice(i, end).match(/\n/g) || []).length;
      i = end;
      continue;
    }
    // Strings and Template Literals
    if (code[i] === "'" || code[i] === '"' || code[i] === '`') {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') {
          j += 2; // skip escaped char
        } else if (code[j] === quote) {
          j++;
          break;
        } else {
          j++;
        }
      }
      tokens.push({ type: 'string', value: code.slice(i, j), line });
      line += (code.slice(i, j).match(/\n/g) || []).length;
      i = j;
      continue;
    }
    // Whitespace
    const wsMatch = code.slice(i).match(/^\s+/);
    if (wsMatch) {
      tokens.push({ type: 'whitespace', value: wsMatch[0], line });
      line += (wsMatch[0].match(/\n/g) || []).length;
      i += wsMatch[0].length;
      continue;
    }
    // Identifier / Keyword
    const idMatch = code.slice(i).match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (idMatch) {
      tokens.push({ type: 'identifier', value: idMatch[0], line });
      i += idMatch[0].length;
      continue;
    }
    // Other symbols
    tokens.push({ type: 'symbol', value: code[i], line });
    if (code[i] === '\n') line++;
    i++;
  }
  return tokens;
}

const allowlist = [];

test('No throw string or template literals', () => {
  const rootDir = path.resolve(__dirname, '..');
  const files = getFiles(rootDir, ['.js', '.html', '.css'], ['node_modules', 'tests', '.git', 'scripts']);

  const errors = [];

  for (const file of files) {
    const relativePath = path.relative(rootDir, file).replace(/\\/g, '/');
    if (allowlist.includes(relativePath)) {
      continue;
    }

    const code = fs.readFileSync(file, 'utf8');
    const tokens = tokenize(code);

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'identifier' && tokens[i].value === 'throw') {
        let j = i + 1;
        while (j < tokens.length && (tokens[j].type === 'whitespace' || tokens[j].type === 'comment')) {
          j++;
        }
        if (j < tokens.length && tokens[j].type === 'string') {
          errors.push(`${relativePath}:${tokens[i].line}: found "throw ${tokens[j].value}"`);
        }
      }
    }
  }

  assert.strictEqual(errors.length, 0, 'Found throw with string or template literal (throw an Error instead):\n' + errors.join('\n'));
});

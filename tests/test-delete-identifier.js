const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [];

function getFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'tests' || entry.name === '.git') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getFiles(fullPath, files);
    } else if (entry.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

function tokenize(code) {
  const tokens = [];
  let i = 0;
  let line = 1;

  while (i < code.length) {
    const char = code[i];

    // Single line comments
    if (char === '/' && code[i + 1] === '/') {
      let val = '';
      while (i < code.length && code[i] !== '\n') {
        val += code[i];
        i++;
      }
      tokens.push({ type: 'comment', value: val, line });
      continue;
    }

    // Multi-line comments
    if (char === '/' && code[i + 1] === '*') {
      let val = '';
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n') line++;
        val += code[i];
        i++;
      }
      if (i < code.length) {
        val += '*/';
        i += 2;
      }
      tokens.push({ type: 'comment', value: val, line });
      continue;
    }

    // Strings
    if (char === "'" || char === '"' || char === '`') {
      const quote = char;
      let val = quote;
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          val += code[i] + (code[i + 1] || '');
          i += 2;
          continue;
        }
        if (code[i] === '\n') line++;
        val += code[i];
        if (code[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: 'string', value: val, line });
      continue;
    }

    // Identifiers and Keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let val = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        val += code[i];
        i++;
      }
      tokens.push({ type: 'identifier', value: val, line });
      continue;
    }

    // Whitespace
    if (/\s/.test(char)) {
      if (char === '\n') line++;
      // We can skip whitespace tokens or push them if needed. We'll skip for simpler logic.
      i++;
      continue;
    }

    // Punctuators
    tokens.push({ type: 'punctuator', value: char, line });
    i++;
  }
  return tokens;
}

test('No delete Identifier statements', () => {
  const rootDir = process.cwd();
  const jsFiles = getFiles(rootDir);
  const errors = [];

  for (const file of jsFiles) {
    const relPath = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf8');
    const tokens = tokenize(content);

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'identifier' && tokens[i].value === 'delete') {
        // Look ahead to see what follows 'delete'
        // 'delete' followed by identifier, not followed by '.', '?', '['
        let j = i + 1;
        while (j < tokens.length && tokens[j].type === 'comment') {
          j++;
        }

        if (j < tokens.length && tokens[j].type === 'identifier') {
          // Check what comes after the identifier
          let k = j + 1;
          while (k < tokens.length && tokens[k].type === 'comment') {
            k++;
          }

          const nextToken = tokens[k];
          if (!nextToken || (nextToken.value !== '.' && nextToken.value !== '[' && nextToken.value !== '?')) {
             const occurrence = `${relPath}:${tokens[i].line}`;
             if (!ALLOWLIST.includes(occurrence)) {
               errors.push(occurrence);
             }
          }
        }
      }
    }
  }

  assert.strictEqual(errors.length, 0, `Found delete Identifier statements:\n${errors.join('\n')}`);
});

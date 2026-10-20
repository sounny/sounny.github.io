const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== '.git') {
        getJsFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function stripStringsAndComments(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    // Single-line comment
    if (code[i] === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < code.length && code[i] !== '\n' && code[i] !== '\r') {
        i++;
      }
      result += ' '; // replace comment with space
      continue;
    }
    // Multi-line comment
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        if (code[i] === '\n' || code[i] === '\r') {
          result += code[i]; // preserve newlines
        } else {
          result += ' ';
        }
        i++;
      }
      i += 2; // skip */
      result += ' ';
      continue;
    }
    // Template literal
    if (code[i] === '`') {
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2; // skip escaped char
          continue;
        }
        if (code[i] === '`') {
          i++;
          break;
        }
        if (code[i] === '\n' || code[i] === '\r') {
          result += code[i]; // preserve newlines
        } else {
          result += ' ';
        }
        i++;
      }
      result += '""'; // placeholder
      continue;
    }
    // Double quote string
    if (code[i] === '"') {
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2;
          continue;
        }
        if (code[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      result += '""';
      continue;
    }
    // Single quote string
    if (code[i] === "'") {
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2;
          continue;
        }
        if (code[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      result += "''";
      continue;
    }
    result += code[i];
    i++;
  }
  return result;
}

const allowlist = [];

test('No labeled statements (e.g. label: for ...) in .js files', (t) => {
  const rootDir = path.resolve(__dirname, '..');
  const jsFiles = getJsFiles(rootDir).filter(f => !path.relative(rootDir, f).startsWith('tests') && !path.relative(rootDir, f).startsWith('node_modules'));

  const errors = [];
  // We match: word boundaries, followed by an identifier, then a colon, then whitespace, then a block/loop keyword or {
  // We also match identifiers ending in : { like `myLabel: {`
  const labeledStatementRegex = /\b([A-Za-z0-9_]+)\s*:\s*(?:(for|while|do|switch|if)\b|\{)/g;

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const cleanCode = stripStringsAndComments(code);

    let match;
    while ((match = labeledStatementRegex.exec(cleanCode)) !== null) {
      const label = match[1];
      if (label === 'default' || label === 'case') continue;

      const occurrence = `${path.relative(rootDir, file)}:${label}`;
      if (!allowlist.includes(occurrence)) {
        errors.push(`File ${path.relative(rootDir, file)} contains a labeled statement: '${label}: ${match[2] || "{"}...'`);
      }
    }
  }

  assert.strictEqual(errors.length, 0, 'Found labeled statements without allowlist:\n' + errors.join('\n'));
});

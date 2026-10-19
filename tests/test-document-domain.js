const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Allowlist for current occurrences, if any exist.
// Expected format: { 'relative/path/to/file.js': count }
const allowlist = {};

const assignments = new Set([
  '=', '+=', '-=', '*=', '/=', '%=', '**=', '<<=', '>>=', '>>>=', '&=', '^=', '|=', '&&=', '||=', '??='
]);

function tokenize(code) {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    if (code.slice(i, i + 2) === '//') {
      let nextLine = code.indexOf('\n', i);
      if (nextLine === -1) nextLine = code.length;
      i = nextLine;
    } else if (code.slice(i, i + 2) === '/*') {
      let nextEnd = code.indexOf('*/', i + 2);
      if (nextEnd === -1) nextEnd = code.length;
      else nextEnd += 2;
      i = nextEnd;
    } else if (code[i] === '"' || code[i] === "'") {
      let quote = code[i];
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') j += 2;
        else if (code[j] === quote) { j++; break; }
        else j++;
      }
      i = j;
    } else if (code[i] === '`') {
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '\\') j += 2;
        else if (code[j] === '`') { j++; break; }
        else j++;
      }
      i = j;
    } else if (/\s/.test(code[i])) {
      i++;
    } else if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      tokens.push({ type: 'identifier', value: code.slice(i, j) });
      i = j;
    } else {
      let j = i;
      if (['>>>=', '===', '!=='].includes(code.slice(i, i+4))) {
          j += 4;
      } else if (['===', '!==', '>>>', '<<=', '>>=', '||=', '&&=', '??=', '**='].includes(code.slice(i, i+3))) {
        j += 3;
      } else if (['==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '++', '--', '<<', '>>', '&&', '||', '??', '?.', '**', '=>', '&=', '^=', '|='].includes(code.slice(i, i+2))) {
        j += 2;
      } else {
        j += 1;
      }
      tokens.push({ type: 'operator', value: code.slice(i, j) });
      i = j;
    }
  }
  return tokens;
}

function getViolations(code) {
  const tokens = tokenize(code);
  let count = 0;
  for (let i = 0; i < tokens.length - 3; i++) {
    if (
      tokens[i].type === 'identifier' && tokens[i].value === 'document' &&
      tokens[i+1].type === 'operator' && tokens[i+1].value === '.' &&
      tokens[i+2].type === 'identifier' && tokens[i+2].value === 'domain' &&
      tokens[i+3].type === 'operator' && assignments.has(tokens[i+3].value)
    ) {
      count++;
    }
  }
  return count;
}

function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === '.git') {
      continue;
    }
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getJsFiles(filePath, fileList);
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Check for document.domain assignments', () => {
  const jsFiles = getJsFiles(path.resolve('.'));
  const rootDir = path.resolve('.') + path.sep;

  for (const file of jsFiles) {
    const relativePath = file.startsWith(rootDir) ? file.slice(rootDir.length) : file;
    // Normalize path separators to POSIX for consistency in allowlist keys
    const posixPath = relativePath.split(path.sep).join(path.posix.sep);

    const code = fs.readFileSync(file, 'utf8');
    const count = getViolations(code);

    const allowedCount = allowlist[posixPath] || 0;
    assert.strictEqual(
      count,
      allowedCount,
      `File ${posixPath} has ${count} assignment(s) to document.domain, but only ${allowedCount} are allowed.`
    );
  }
});

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [
];

function tokenize(code) {
  const tokens = [];
  let i = 0;
  let line = 1;

  while (i < code.length) {
    if (code.substring(i, i + 4) === '<!--') {
      i += 4;
      while (i < code.length && code.substring(i, i + 3) !== '-->') {
        if (code[i] === '\n') line++;
        i++;
      }
      i += 3;
      continue;
    }

    if (code.substring(i, i + 2) === '//') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }

    if (code.substring(i, i + 2) === '/*') {
      i += 2;
      while (i < code.length && code.substring(i, i + 2) !== '*/') {
        if (code[i] === '\n') line++;
        i++;
      }
      i += 2;
      continue;
    }

    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') {
          if (code[i + 1] === '\n') line++;
          i += 2;
        } else {
          if (code[i] === '\n') line++;
          i++;
        }
      }
      i++;
      continue;
    }

    if (/\s/.test(code[i])) {
      if (code[i] === '\n') line++;
      i++;
      continue;
    }

    if (/[a-zA-Z0-9_$]/.test(code[i])) {
      const start = i;
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        i++;
      }
      tokens.push({ type: 'WORD', value: code.substring(start, i), line });
      continue;
    }

    let matchedPunctuation = false;
    const ops = ['===', '!==', '<<=', '>>=', '>>>=', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '=>', '&&', '||', '??', '?.', '++', '--', '<<', '>>'];
    for (const op of ops) {
      if (code.substring(i, i + op.length) === op) {
        tokens.push({ type: 'PUNCTUATION', value: op, line });
        i += op.length;
        matchedPunctuation = true;
        break;
      }
    }

    if (matchedPunctuation) continue;

    tokens.push({ type: 'PUNCTUATION', value: code[i], line });
    i++;
  }

  return tokens;
}

function checkFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const tokens = tokenize(code);
  const violations = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t.type === 'WORD' && (t.value === 'if' || t.value === 'while')) {
      if (i + 1 < tokens.length && tokens[i+1].type === 'PUNCTUATION' && tokens[i+1].value === '(') {
        let depth = 0;
        let hasTopLevelAssignment = false;
        let j = i + 2;

        while (j < tokens.length) {
          const ct = tokens[j];
          if (ct.type === 'PUNCTUATION' && ct.value === '(') {
            depth++;
          } else if (ct.type === 'PUNCTUATION' && ct.value === ')') {
            if (depth === 0) {
              break;
            }
            depth--;
          } else if (depth === 0 && ct.type === 'PUNCTUATION' && ct.value === '=') {
            hasTopLevelAssignment = true;
          }
          j++;
        }

        if (hasTopLevelAssignment) {
          const id = `${filePath}:${t.line}`;
          if (!ALLOWLIST.includes(id)) {
            violations.push(`Violation in ${id}: single '=' assignment at top-level of ${t.value} condition`);
          }
        }
      }
    }
  }

  return violations;
}

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && !file.startsWith('.')) {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      const ext = path.extname(file);
      if (ext === '.js' || ext === '.html' || ext === '.css') {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

test('no top-level single = assignments in if/while conditions', () => {
  const files = getAllFiles(process.cwd());
  const allViolations = [];

  files.forEach(file => {
      const relPath = path.relative(process.cwd(), file);
      // Skip the script itself
      if (relPath !== 'tests/test-check-if-assignment.js') {
          const violations = checkFile(relPath);
          allViolations.push(...violations);
      }
  });

  if (allViolations.length > 0) {
      assert.fail(allViolations.join('\n'));
  }
});

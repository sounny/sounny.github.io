const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const allowlist = [];

function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === 'tests' || file === '.git') {
      continue;
    }
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function findOneArgParseInt(code) {
  let i = 0;
  const issues = [];

  while (i < code.length) {
    if (code.startsWith('//', i)) {
      let next = code.indexOf('\n', i);
      i = next === -1 ? code.length : next + 1;
      continue;
    }
    if (code.startsWith('/*', i)) {
      let next = code.indexOf('*/', i + 2);
      i = next === -1 ? code.length : next + 2;
      continue;
    }
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      let quote = code[i];
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2;
        } else if (code[i] === quote) {
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }

    if (code.startsWith('parseInt', i)) {
      let prev = i > 0 ? code[i-1] : ' ';
      let next = i + 8 < code.length ? code[i+8] : ' ';
      if (!/[a-zA-Z0-9_$]/.test(prev) && !/[a-zA-Z0-9_$]/.test(next)) {
        let j = i + 8;
        while (j < code.length && /\s/.test(code[j])) j++;
        if (code[j] === '(') {
          let k = j + 1;
          let parenCount = 1;
          let argsCount = 1;
          let hasChars = false;

          while (k < code.length && parenCount > 0) {
            if (code.startsWith('//', k)) {
              let nextComment = code.indexOf('\n', k);
              k = nextComment === -1 ? code.length : nextComment + 1;
              continue;
            }
            if (code.startsWith('/*', k)) {
              let nextComment = code.indexOf('*/', k + 2);
              k = nextComment === -1 ? code.length : nextComment + 2;
              continue;
            }
            if (code[k] === '"' || code[k] === "'" || code[k] === '`') {
              hasChars = true;
              let quote = code[k];
              k++;
              while (k < code.length) {
                if (code[k] === '\\') k += 2;
                else if (code[k] === quote) { k++; break; }
                else k++;
              }
              continue;
            }

            if (code[k] === '(') {
              parenCount++;
              hasChars = true;
            } else if (code[k] === ')') {
              parenCount--;
              if (parenCount === 0) {
                if (!hasChars && argsCount === 1) argsCount = 0;
                break;
              } else {
                hasChars = true;
              }
            } else if (code[k] === ',' && parenCount === 1) {
              argsCount++;
            } else if (!/\s/.test(code[k])) {
              hasChars = true;
            }
            k++;
          }
          if (argsCount === 1) {
            let line = 1;
            for (let x = 0; x < i; x++) {
              if (code[x] === '\n') line++;
            }
            issues.push({ line, col: 0 /* not tracking col exact */, text: "parseInt(" });
          }
          i = k;
          continue;
        }
      }
    }
    i++;
  }
  return issues;
}

test('no one-argument parseInt calls', () => {
  const jsFiles = getJsFiles(path.join(__dirname, '..'));
  const allIssues = [];

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf-8');
    const issues = findOneArgParseInt(code);
    const relPath = path.relative(path.join(__dirname, '..'), file);

    for (const issue of issues) {
      const issueKey = `${relPath}:${issue.line}`;
      if (!allowlist.includes(issueKey)) {
        allIssues.push(issueKey);
      }
    }
  }

  assert.strictEqual(allIssues.length, 0, `Found one-argument parseInt calls:\n${allIssues.join('\n')}`);
});

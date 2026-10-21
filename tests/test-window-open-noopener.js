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

function checkWindowOpen(code) {
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

    if (code.startsWith('window.open', i)) {
      let prev = i > 0 ? code[i-1] : ' ';
      let next = i + 11 < code.length ? code[i+11] : ' ';
      if (!/[a-zA-Z0-9_$]/.test(prev) && !/[a-zA-Z0-9_$]/.test(next)) {
        let j = i + 11;
        while (j < code.length && /\s/.test(code[j])) j++;
        if (code[j] === '(') {
          let k = j + 1;
          let parenCount = 1;
          let args = [];
          let currentArg = "";

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
              let quote = code[k];
              currentArg += code[k];
              k++;
              while (k < code.length) {
                currentArg += code[k];
                if (code[k] === '\\') {
                  k++;
                  if (k < code.length) {
                    currentArg += code[k];
                  }
                  k++;
                } else if (code[k] === quote) {
                  k++;
                  break;
                } else {
                  k++;
                }
              }
              continue;
            }

            if (code[k] === '(') {
              parenCount++;
              currentArg += code[k];
            } else if (code[k] === ')') {
              parenCount--;
              if (parenCount === 0) {
                if (currentArg.trim() !== "") {
                  args.push(currentArg);
                }
                break;
              } else {
                currentArg += code[k];
              }
            } else if (code[k] === ',' && parenCount === 1) {
              args.push(currentArg);
              currentArg = "";
            } else {
              currentArg += code[k];
            }
            k++;
          }

          let featuresArg = args.length > 2 ? args[2] : "";
          if (!featuresArg.includes('noopener')) {
            let line = 1;
            for (let x = 0; x < i; x++) {
              if (code[x] === '\n') line++;
            }
            issues.push({ line, col: 0, text: "window.open without noopener" });
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

test('no window.open calls without noopener', () => {
  const jsFiles = getJsFiles(path.join(__dirname, '..'));
  const allIssues = [];

  for (const file of jsFiles) {
    const code = fs.readFileSync(file, 'utf-8');
    const issues = checkWindowOpen(code);
    const relPath = path.relative(path.join(__dirname, '..'), file);

    for (const issue of issues) {
      const issueKey = `${relPath}:${issue.line}`;
      if (!allowlist.includes(issueKey)) {
        allIssues.push(issueKey);
      }
    }
  }

  assert.strictEqual(allIssues.length, 0, `Found window.open calls without noopener:\n${allIssues.join('\n')}`);
});

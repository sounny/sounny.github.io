const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [
  // Add occurrences here if necessary
];

function isWordCharacter(char) {
  return /^[a-zA-Z0-9_$]$/.test(char || '');
}

function findProtoAssignments(content) {
  let state = 'NORMAL';
  let i = 0;
  const occurrences = [];

  while (i < content.length) {
    if (state === 'NORMAL') {
      if (content.startsWith('/*', i)) {
        state = 'BLOCK_COMMENT';
        i += 2;
        continue;
      }
      if (content.startsWith('//', i)) {
        state = 'LINE_COMMENT';
        i += 2;
        continue;
      }
      if (content[i] === "'") {
        state = 'SINGLE_QUOTE';
        i++;
        continue;
      }
      if (content[i] === '"') {
        state = 'DOUBLE_QUOTE';
        i++;
        continue;
      }
      if (content[i] === '`') {
        state = 'BACKTICK';
        i++;
        continue;
      }

      if (content.startsWith('__proto__', i)) {
        const before = i === 0 ? true : !isWordCharacter(content[i - 1]);
        const after = i + 9 >= content.length ? true : !isWordCharacter(content[i + 9]);

        if (before && after) {
          let j = i + 9;
          // Look ahead for assignment operator
          while (j < content.length && /\s/.test(content[j])) {
            j++;
          }

          let opStart = j;
          let opLen = 0;
          if (content.startsWith('>>>=', opStart)) opLen = 4;
          else if (['<<=', '>>=', '**=', '&&=', '||=', '??='].some(op => content.startsWith(op, opStart))) opLen = 3;
          else if (['+=', '-=', '*=', '/=', '%=', '&=', '^=', '|='].some(op => content.startsWith(op, opStart))) opLen = 2;
          else if (content[opStart] === '=' && content[opStart + 1] !== '=' && content[opStart + 1] !== '>') opLen = 1;

          if (opLen > 0) {
            occurrences.push(i);
          }
        }
        i += 9;
        continue;
      }

      i++;
    } else if (state === 'BLOCK_COMMENT') {
      if (content.startsWith('*/', i)) {
        state = 'NORMAL';
        i += 2;
      } else {
        i++;
      }
    } else if (state === 'LINE_COMMENT') {
      if (content[i] === '\n') {
        state = 'NORMAL';
      }
      i++;
    } else if (state === 'SINGLE_QUOTE') {
      if (content[i] === '\\') i += 2;
      else if (content[i] === "'") {
        state = 'NORMAL';
        i++;
      } else {
        i++;
      }
    } else if (state === 'DOUBLE_QUOTE') {
      if (content[i] === '\\') i += 2;
      else if (content[i] === '"') {
        state = 'NORMAL';
        i++;
      } else {
        i++;
      }
    } else if (state === 'BACKTICK') {
      if (content[i] === '\\') i += 2;
      else if (content[i] === '`') {
        state = 'NORMAL';
        i++;
      } else {
        i++;
      }
    }
  }
  return occurrences;
}

function getFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === 'tests' || file === '.git') {
      continue;
    }
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(filePath, files);
    } else if (file.endsWith('.js')) {
      files.push(filePath);
    }
  }
  return files;
}

test('Check for __proto__ assignments in .js files', (t) => {
  const repoRoot = path.resolve(__dirname, '..');
  const files = getFiles(repoRoot);

  for (const file of files) {
    const relativePath = path.relative(repoRoot, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const occurrences = findProtoAssignments(content);

    for (const index of occurrences) {
      const isAllowed = ALLOWLIST.some(item => item.file === relativePath && item.index === index);
      if (!isAllowed) {
        assert.fail(`Unexpected assignment to __proto__ found in ${relativePath} at index ${index}. This property assignment is unsafe. Disable property access or add to ALLOWLIST if false positive.`);
      }
    }
  }
});

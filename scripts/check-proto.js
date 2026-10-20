const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Allowlist for known __proto__ occurrences
const ALLOWLIST = [
  // { file: 'js/main.js', index: 123 }
];

function isWordCharacter(char) {
  return /^[a-zA-Z0-9_$]$/.test(char || '');
}

function findProto(content) {
  let state = 'NORMAL';
  let i = 0;
  const occurrences = [];

  while (i < content.length) {
    if (state === 'NORMAL') {
      if (content.startsWith('<!--', i)) {
        state = 'HTML_COMMENT';
        i += 4;
        continue;
      }
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
        if (!isWordCharacter(content[i - 1]) && !isWordCharacter(content[i + 9])) {
          occurrences.push(i);
        }
        i += 9;
        continue;
      }

      i++;
    } else if (state === 'HTML_COMMENT') {
      if (content.startsWith('-->', i)) {
        state = 'NORMAL';
        i += 3;
      } else {
        i++;
      }
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
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      files.push(filePath);
    }
  }
  return files;
}

test('Check for __proto__ usage in site files', (t) => {
  const repoRoot = path.resolve(__dirname, '..');
  const files = getFiles(repoRoot);

  for (const file of files) {
    const relativePath = path.relative(repoRoot, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const occurrences = findProto(content);

    for (const index of occurrences) {
      const isAllowed = ALLOWLIST.some(item => item.file === relativePath && item.index === index);
      if (!isAllowed) {
        assert.fail(`Unexpected __proto__ found in ${relativePath} at index ${index}. This property access is unsafe. Disable property access or add to ALLOWLIST if false positive.`);
      }
    }
  }
});

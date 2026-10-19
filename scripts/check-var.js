const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {
  // Add allowlist items here if needed in the format:
  // 'js/main.js': 0
};

// Calculate total allowed vars based on allowlist (sum of values)
const ALLOWED_TOTAL = Object.values(ALLOWLIST).reduce((a, b) => a + b, 0);

function getFiles(dir, extArray, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests') {
        getFiles(filePath, extArray, fileList);
      }
    } else {
      if (extArray.includes(path.extname(file))) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function countVars(content) {
  let count = 0;
  let i = 0;
  while (i < content.length) {
    // skip HTML comments
    if (content.startsWith('<!--', i)) {
      i += 4;
      while (i < content.length && !content.startsWith('-->', i)) i++;
      i += 3;
      continue;
    }
    // skip multi-line comments
    if (content.startsWith('/*', i)) {
      i += 2;
      while (i < content.length && !content.startsWith('*/', i)) i++;
      i += 2;
      continue;
    }
    // skip single-line comments
    if (content.startsWith('//', i)) {
      i += 2;
      while (i < content.length && content[i] !== '\n') i++;
      i++;
      continue;
    }
    // skip strings
    if (content[i] === "'" || content[i] === '"' || content[i] === '`') {
      const quote = content[i];
      i++;
      while (i < content.length) {
        if (content[i] === '\\') {
          i += 2;
        } else if (content[i] === quote) {
          i++;
          break;
        } else {
          i++;
        }
      }
      continue;
    }

    // check for var keyword
    // ensure word boundary before and after
    if (content.startsWith('var', i)) {
      const before = i > 0 ? content[i - 1] : ' ';
      const after = i + 3 < content.length ? content[i + 3] : ' ';
      if (!/[a-zA-Z0-9_$]/.test(before) && !/[a-zA-Z0-9_$]/.test(after)) {
        count++;
        i += 3;
        continue;
      }
    }

    i++;
  }
  return count;
}

test('Check var usage in .js and .html files', () => {
  const rootDir = process.cwd();
  const files = getFiles(rootDir, ['.js', '.html'])
    .filter(f => {
      const relative = path.relative(rootDir, f);
      return !relative.startsWith('node_modules') && !relative.startsWith('tests');
    });

  let totalVarCount = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const count = countVars(content);
    totalVarCount += count;
  }

  assert.ok(
    totalVarCount <= ALLOWED_TOTAL,
    `Total 'var' declarations (${totalVarCount}) exceeds allowed count (${ALLOWED_TOTAL}). Please use 'let' or 'const'.`
  );
});

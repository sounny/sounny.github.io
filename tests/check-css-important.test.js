const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Allowlist for current offenders
const allowlist = {
  'css/main.css': 2
};

function checkFileForImportant(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match !important declarations (case-insensitive usually, but regex match !important)
  const matches = content.match(/!important/gi);
  return matches ? matches.length : 0;
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'tests' && file !== 'scripts') {
        findFiles(path.join(dir, file), fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      // Look for html, css files
      if (['.html', '.css'].includes(ext)) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

test('No new !important declarations in CSS/HTML', () => {
  const filesToCheck = findFiles(path.join(__dirname, '..'));
  let hasViolations = false;

  for (const file of filesToCheck) {
    const relativePath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
    const count = checkFileForImportant(file);
    const allowed = allowlist[relativePath] || 0;

    if (count > allowed) {
      console.error(`File ${relativePath} has ${count} !important declarations, but only ${allowed} are allowed.`);
      hasViolations = true;
    }
  }

  assert.strictEqual(hasViolations, false, 'Found new !important declarations beyond the allowlist');
});

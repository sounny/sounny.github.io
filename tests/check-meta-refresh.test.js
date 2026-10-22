const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Regex to find <meta http-equiv="refresh"> tags
// This matches <meta ... http-equiv="refresh" ... > or <meta ... http-equiv='refresh' ... > or <meta ... http-equiv=refresh ... >
const refreshRegex = /<meta\s+[^>]*http-equiv\s*=\s*['"]?refresh['"]?[^>]*>/gi;

// Allowlist for known offenders
const allowlist = [
];

function checkFileForMetaRefresh(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  const violations = [];
  while ((match = refreshRegex.exec(content)) !== null) {
    const metaTag = match[0];
    if (!allowlist.includes(filePath)) {
      violations.push(metaTag);
    }
  }
  return violations;
}

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findHtmlFiles(path.join(dir, file), fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === '.html') {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

test('No <meta http-equiv="refresh"> elements allowed', () => {
  const filesToCheck = findHtmlFiles('.');
  let hasViolations = false;

  for (const file of filesToCheck) {
    const violations = checkFileForMetaRefresh(file);
    if (violations.length > 0) {
      console.error(`File ${file} contains disallowed meta refresh tags:`);
      violations.forEach(v => console.error(`  - ${v}`));
      hasViolations = true;
    }
  }

  assert.strictEqual(hasViolations, false, 'Found <meta http-equiv="refresh"> elements in HTML files');
});

const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// Regex to find http:// in src and href attributes of specific tags
// Handles src="..." and href="..." or src='...' and href='...'
const httpRegex = /<(?:script|link|img|iframe|source)\b[^>]*?\b(?:src|href)\s*=\s*['"](http:\/\/[^'"]*)['"]/gi;

// Allowlist for known http:// resources (if any currently exist)
// We already verified via grep that there are no current offenders in html files
// But we still maintain the allowlist as requested.
const allowlist = [
];

function checkFileForHttpResources(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  const violations = [];
  while ((match = httpRegex.exec(content)) !== null) {
    const url = match[1];
    if (!allowlist.includes(url) && !url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
      violations.push(url);
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
      // Look for html, css, js files
      if (['.html', '.css', '.js'].includes(ext)) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

test('No non-localhost http:// resources in src/href attributes', () => {
  const filesToCheck = findHtmlFiles('.');
  let hasViolations = false;

  for (const file of filesToCheck) {
    const violations = checkFileForHttpResources(file);
    if (violations.length > 0) {
      console.error(`File ${file} contains non-localhost http:// resources:`);
      violations.forEach(v => console.error(`  - ${v}`));
      hasViolations = true;
    }
  }

  assert.strictEqual(hasViolations, false, 'Found non-localhost http:// resources in src/href attributes');
});

const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// We use a regex to match src or href attributes that contain "http://"
const httpRegex = /\b(?:src|href)\s*=\s*(?:['"]?)http:\/\//gi;

const currentCount = 0;

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findHtmlFiles(path.join(dir, file), fileList);
      }
    } else {
      if (file.endsWith('.html')) {
        fileList.push(path.join(dir, file));
      }
    }
  }
  return fileList;
}

test('Count of plain http:// in src and href attributes does not grow', () => {
  const filesToCheck = findHtmlFiles('.');
  let totalViolations = 0;

  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = httpRegex.exec(content)) !== null) {
      totalViolations++;
    }
  }

  assert.ok(
    totalViolations <= currentCount,
    `Total plain http:// links in src/href attributes (${totalViolations}) exceeds the current count (${currentCount}). Please use https:// instead.`
  );
});

const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('assert');

// We use a regex to match href attributes that contain "javascript:"
const javascriptHrefRegex = /\bhref\s*=\s*(?:['"]?)\s*javascript:/gi;

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

test('Count of href attributes starting with javascript: does not grow', () => {
  const filesToCheck = findHtmlFiles('.');
  let totalViolations = 0;

  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = javascriptHrefRegex.exec(content)) !== null) {
      totalViolations++;
    }
  }

  assert.ok(
    totalViolations <= currentCount,
    `Total javascript: href attributes (${totalViolations}) exceeds the current count (${currentCount}).`
  );
});

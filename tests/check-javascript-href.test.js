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
  const warnings = [];

  for (const file of filesToCheck) {
    const content = fs.readFileSync(file, 'utf8');

    // Check specifically for <a> tags with javascript:
    const aTagRegex = /<a\s([^>]*)>/gi;
    let aMatch;
    while ((aMatch = aTagRegex.exec(content)) !== null) {
      const attributes = aMatch[1];
      if (/\bhref\s*=\s*(?:['"]?)\s*javascript:/i.test(attributes)) {
        warnings.push(`File: ${file} | Tag: ${aMatch[0]}`);
      }
    }

    let match;
    while ((match = javascriptHrefRegex.exec(content)) !== null) {
      totalViolations++;
    }
  }

  if (warnings.length > 0) {
    console.warn('--- WARNING: <a> tags with javascript: href found ---');
    warnings.forEach(w => console.warn(w));
    console.warn('-----------------------------------------------------');
  }

  assert.ok(
    totalViolations <= currentCount,
    `Total javascript: href attributes (${totalViolations}) exceeds the current count (${currentCount}).`
  );
});

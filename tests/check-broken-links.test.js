const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allowlist = []; // Populate if any are found

test('Relative href and src attributes must resolve to existing files', () => {
  const rootDir = path.resolve(__dirname, '..');
  const htmlFiles = findHtmlFiles(rootDir);
  const violations = [];

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(rootDir, file).replace(/\\/g, '/');

    // Match a href="..."
    const hrefRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      checkUrl(file, relFile, match[1], 'href', violations);
    }

    // Match any src="..."
    const srcRegex = /<[^>]+\s+src=["']([^"']+)["']/gi;
    while ((match = srcRegex.exec(content)) !== null) {
      checkUrl(file, relFile, match[1], 'src', violations);
    }
  }

  function checkUrl(absoluteFile, relFile, url, type, violations) {
    if (url.startsWith('http://') || url.startsWith('https://') ||
        url.startsWith('mailto:') || url.startsWith('tel:') ||
        url.startsWith('#') || url.startsWith('data:')) {
      return;
    }

    let cleanUrl = url.split('#')[0].split('?')[0];
    if (!cleanUrl) return; // e.g. url was just "?" or "#"

    const rootDir = path.resolve(__dirname, '..');
    let targetPath;
    if (cleanUrl.startsWith('/')) {
      targetPath = path.join(rootDir, cleanUrl);
    } else {
      const dir = path.dirname(absoluteFile);
      targetPath = path.resolve(dir, cleanUrl);
    }

    if (!fs.existsSync(targetPath)) {
      const violationKey = `${relFile}:${url}`;
      if (!allowlist.includes(violationKey)) {
        violations.push(violationKey);
      }
    }
  }

  if (violations.length > 0) {
    console.error('Found broken links not in the allowlist:');
    violations.forEach(v => console.error(`  - ${v}`));
  }

  assert.strictEqual(violations.length, 0, 'There are broken relative links.');
});

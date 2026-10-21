const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Allowlist for current offenders
// Format: "filepath:url"
const allowlist = new Set([
]);

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findHtmlFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Check relative href and src links', () => {
  const htmlFiles = findHtmlFiles('.');
  let count = 0;
  const offenders = [];

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const regex = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;

    let match;
    while ((match = regex.exec(content)) !== null) {
      const val = match[1];

      // Ignore absolute URLs, data URIs, mailto:, tel:, #, javascript:
      if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(val)) {
        continue;
      }

      let targetPath;
      if (val.startsWith('/')) {
          targetPath = path.join('.', val);
      } else {
          targetPath = path.resolve(path.dirname(file), val);
          targetPath = path.relative('.', targetPath);
      }

      // Remove query strings and hashes
      targetPath = targetPath.split('?')[0].split('#')[0];

      if (targetPath === '') {
          continue; // points to the file itself
      }

      if (!fs.existsSync(targetPath)) {
          const allowedKey = `${file}:${val}`;
          if (!allowlist.has(allowedKey)) {
              offenders.push(allowedKey);
              count++;
          }
      }
    }
  }

  assert.strictEqual(count, 0, `Found broken relative links:\n${offenders.join('\n')}`);
});

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = {
  'css/main.css': 6
};

function countVendorPrefixes(code) {
  const matches = code.match(/-webkit-|-moz-|-ms-/g);
  return matches ? matches.length : 0;
}

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== 'tests' && file !== '.git') {
        walk(fullPath, fileList);
      }
    } else {
      // Look at html, css, js, etc. Actually we can just look at all text-like files or all files.
      // Usually CSS and HTML are where these are, but looking at everything except some binaries is fine.
      // Let's just read it as utf8.
      if (
        fullPath.endsWith('.css') ||
        fullPath.endsWith('.html') ||
        fullPath.endsWith('.js') ||
        fullPath.endsWith('.svg') ||
        fullPath.endsWith('.json') ||
        fullPath.endsWith('.md')
      ) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

test('limit -webkit-, -moz-, and -ms- vendor prefixes', () => {
  const rootDir = path.join(__dirname, '..');
  const files = walk(rootDir);

  let totalAllowed = 0;
  for (const count of Object.values(ALLOWLIST)) {
    totalAllowed += count;
  }

  let totalUsages = 0;

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(rootDir, file).replace(/\\/g, '/'); // Normalize path for Windows
    const count = countVendorPrefixes(code);
    totalUsages += count;
  }

  if (totalUsages > totalAllowed) {
    assert.fail(`Found ${totalUsages} vendor prefixes (-webkit-, -moz-, -ms-), but only ${totalAllowed} are allowed by the allowlist.`);
  } else {
    assert.ok(true, `Found ${totalUsages} vendor prefixes, within the allowed limit of ${totalAllowed}.`);
  }
});

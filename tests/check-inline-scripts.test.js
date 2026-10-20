const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

// Allowlist of current inline script offenders
const ALLOWLIST = [
  'privacy.html: <script>',
  'index.html: <script>',
  'index.html: <script type="application/ld+json">'
];

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'tests' || file === 'scripts') {
      continue;
    }
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.svg')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Do not add new <script> elements with inline code (no src)', () => {
  const rootDir = path.resolve(__dirname, '..');
  const files = walkDir(rootDir);

  const offenders = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');

    // Parse <script> tags
    let i = 0;
    while (i < content.length) {
      let start = content.indexOf('<script', i);
      if (start === -1) break;

      // Handle comments - don't search inside comments (simple heuristic)
      let commentStart = content.lastIndexOf('<!--', start);
      let commentEnd = content.lastIndexOf('-->', start);
      if (commentStart !== -1 && commentStart > commentEnd) {
          // We are inside a comment
          i = start + 7;
          continue;
      }

      let end = content.indexOf('>', start);
      if (end === -1) break;

      const tagContent = content.substring(start, end + 1);

      // Check if it has a src attribute
      const hasSrc = /(?:^|\s)src\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|([^>\s]+))/i.test(tagContent);

      if (!hasSrc) {
        const offenderStr = `${relPath}: ${tagContent}`;
        if (!ALLOWLIST.includes(offenderStr)) {
          offenders.push(offenderStr);
        }
      }

      i = end + 1;
    }
  }

  assert.strictEqual(
    offenders.length,
    0,
    `Found new inline <script> elements (without 'src' attribute).\nOffenders:\n${offenders.join('\n')}`
  );
});

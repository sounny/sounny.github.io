const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [
  // Example: 'index.html'
];

function getFiles(dir, extFilter, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'tests' || file === 'scripts') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, extFilter, fileList);
    } else if (extFilter.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('no link rel=preload without as attribute', () => {
  const files = getFiles('.', ['.html', '.css', '.js', '.svg']);
  let errors = [];

  for (const file of files) {
    const relativePath = path.relative('.', file).replace(/\\/g, '/');
    if (ALLOWLIST.includes(relativePath)) continue;

    const content = fs.readFileSync(file, 'utf8');

    // Naive HTML parsing via Regex
    const linkRegex = /<link\s+([^>]+)>/gi;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const attributesString = match[1];

      // Parse attributes
      const attrRegex = /([a-zA-Z0-9_-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/gi;
      let attrMatch;
      let isPreload = false;
      let hasAs = false;

      while ((attrMatch = attrRegex.exec(attributesString)) !== null) {
        const name = attrMatch[1].toLowerCase();
        const value = attrMatch[2] || attrMatch[3] || attrMatch[4];

        if (name === 'rel') {
            // rel could be a space-separated list
            if (value && value.toLowerCase().split(/\s+/).includes('preload')) {
                isPreload = true;
            }
        }

        if (name === 'as') {
            hasAs = true;
        }
      }

      if (isPreload && !hasAs) {
        errors.push(`File ${relativePath} contains link rel=preload without an "as" attribute: ${match[0]}`);
      }
    }
  }

  assert.strictEqual(errors.length, 0, 'Found link rel=preload without "as" attribute:\n' + errors.join('\n'));
});

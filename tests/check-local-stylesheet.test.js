const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [
  // Add offenders here
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

test('local link rel="stylesheet" files must exist', () => {
  const files = getFiles('.', ['.html']);
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
      let isStylesheet = false;
      let hrefValue = null;

      while ((attrMatch = attrRegex.exec(attributesString)) !== null) {
        const name = attrMatch[1].toLowerCase();
        const value = attrMatch[2] || attrMatch[3] || attrMatch[4];

        if (name === 'rel') {
            if (value && value.toLowerCase().split(/\s+/).includes('stylesheet')) {
                isStylesheet = true;
            }
        }

        if (name === 'href') {
            hrefValue = value;
        }
      }

      if (isStylesheet && hrefValue) {
        // Check if local link
        if (!hrefValue.startsWith('http://') && !hrefValue.startsWith('https://') && !hrefValue.startsWith('//') && !hrefValue.startsWith('data:')) {
           // It's a local link, check if file exists

           // Remove query params or hash if any
           const cleanHref = hrefValue.split('?')[0].split('#')[0];

           // Resolve path relative to the file's directory
           let targetPath;
           if (cleanHref.startsWith('/')) {
              // Absolute path from repo root
              targetPath = path.join('.', cleanHref);
           } else {
              // Relative path
              targetPath = path.join(path.dirname(file), cleanHref);
           }

           if (!fs.existsSync(targetPath)) {
               errors.push(`File ${relativePath} has a local stylesheet link to ${hrefValue} which does not exist at ${targetPath}.`);
           }
        }
      }
    }
  }

  assert.strictEqual(errors.length, 0, 'Found local link rel="stylesheet" pointing to non-existent files:\n' + errors.join('\n'));
});

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [];

function getFiles(dir, extFilter, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, extFilter, fileList);
    } else if (extFilter.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Check <a> tags for target="_blank" or "_new" without rel="noopener"', () => {
  const files = getFiles('.', ['.html', '.css', '.js', '.svg']);
  const errors = [];

  for (const file of files) {
    const relativePath = path.relative('.', file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');

    // Regex to match <a> tags
    const aRegex = /<a\b([^>]+)>/gi;
    let match;

    while ((match = aRegex.exec(content)) !== null) {
      const attributesString = match[1];

      // Parse attributes
      const attrRegex = /([a-zA-Z0-9_-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/gi;
      let attrMatch;
      let targetValue = '';
      let relValue = '';

      while ((attrMatch = attrRegex.exec(attributesString)) !== null) {
        const name = attrMatch[1].toLowerCase();
        const value = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';

        if (name === 'target') {
          targetValue = value.toLowerCase();
        }
        if (name === 'rel') {
          relValue = value.toLowerCase();
        }
      }

      if (targetValue === '_blank' || targetValue === '_new') {
        if (!relValue.split(/\s+/).includes('noopener')) {
          const offenderStr = `${relativePath}: ${match[0]}`;
          if (!ALLOWLIST.includes(offenderStr)) {
            errors.push(offenderStr);
          }
        }
      }
    }
  }

  assert.strictEqual(errors.length, 0, 'Found <a target="_blank|_new"> without rel="noopener":\n' + errors.join('\n'));
});

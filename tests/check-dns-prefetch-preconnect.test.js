const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

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

test('Informational list of dns-prefetch and preconnect per page', () => {
  const files = getFiles('.', ['.html']);
  let report = [];

  for (const file of files) {
    const relativePath = path.relative('.', file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');

    let dnsPrefetchCount = 0;
    let preconnectCount = 0;

    const linkRegex = /<link\s+([^>]+)>/gi;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const attributesString = match[1];

      // Parse attributes
      const attrRegex = /([a-zA-Z0-9_-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/gi;
      let attrMatch;

      while ((attrMatch = attrRegex.exec(attributesString)) !== null) {
        const name = attrMatch[1].toLowerCase();
        const value = attrMatch[2] || attrMatch[3] || attrMatch[4];

        if (name === 'rel' && value) {
          const rels = value.toLowerCase().split(/\s+/);
          if (rels.includes('dns-prefetch')) dnsPrefetchCount++;
          if (rels.includes('preconnect')) preconnectCount++;
        }
      }
    }

    if (dnsPrefetchCount > 0 || preconnectCount > 0) {
      report.push(`- ${relativePath}: dns-prefetch: ${dnsPrefetchCount}, preconnect: ${preconnectCount}`);
    } else {
      report.push(`- ${relativePath}: none`);
    }
  }

  console.log('\n--- Link Rel dns-prefetch & preconnect Report ---');
  console.log(report.join('\n'));
  console.log('-------------------------------------------------\n');

  // Never fail the test
  assert.ok(true);
});

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = new Set([1000]); // Currently we have one distinct value > 10

function scanFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'tests') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      scanFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('Check for distinct z-index values > 10', () => {
  const allFiles = scanFiles('.');
  const distinctZIndices = new Set();

  // A regex to match z-index properties and attributes
  const zindexRegex = /z-index\s*[:=]\s*["']?(-?\d+)["']?/gi;

  for (const file of allFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = zindexRegex.exec(content)) !== null) {
        const value = parseInt(match[1], 10);
        if (value > 10) {
          distinctZIndices.add(value);
        }
      }
    } catch (e) {
      // Ignore files that cannot be read as utf8 (e.g., binary files)
    }
  }

  const unallowed = Array.from(distinctZIndices).filter(val => !ALLOWLIST.has(val));

  assert.ok(
    unallowed.length === 0,
    `Found distinct z-index values > 10 not in allowlist. Unallowed values found: ${unallowed.join(', ')}`
  );
});

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const allowlist = {
    // Current offenders that have duplicate meta tags
};

function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.git' || file === 'scripts') continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getHtmlFiles(filePath));
    } else if (filePath.endsWith('.html')) {
      results.push(filePath);
    }
  }
  return results;
}

test('HTML files should not repeat meta tags with the same name or property', () => {
  const files = getHtmlFiles('.');
  let allFilesValid = true;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const metaTagRegex = /<meta\s+([^>]+)>/ig;
    let match;
    const seenNames = new Set();
    const seenProperties = new Set();
    const duplicates = [];

    while ((match = metaTagRegex.exec(content)) !== null) {
      const attrsStr = match[1];

      const nameMatch = attrsStr.match(/name=(["'])(.*?)\1/i) || attrsStr.match(/name=([^\s>]+)/i);
      const propertyMatch = attrsStr.match(/property=(["'])(.*?)\1/i) || attrsStr.match(/property=([^\s>]+)/i);

      if (nameMatch) {
        const name = (nameMatch[2] !== undefined) ? nameMatch[2] : nameMatch[1];
        const lowerName = name.toLowerCase();
        if (seenNames.has(lowerName)) {
            duplicates.push({ type: 'name', val: lowerName });
        }
        seenNames.add(lowerName);
      }

      if (propertyMatch) {
        const prop = (propertyMatch[2] !== undefined) ? propertyMatch[2] : propertyMatch[1];
        const lowerProp = prop.toLowerCase();
        if (seenProperties.has(lowerProp)) {
            duplicates.push({ type: 'property', val: lowerProp });
        }
        seenProperties.add(lowerProp);
      }
    }

    if (duplicates.length > 0) {
      // Normalize path for consistent allowlist checking across OSes
      const normalizedPath = file.split(path.sep).join('/');
      const allowedForFile = allowlist[normalizedPath] || [];
      for (const dup of duplicates) {
        const key = `${dup.type}:${dup.val}`;
        if (!allowedForFile.includes(key)) {
          console.error(`File ${normalizedPath} has unallowed duplicate meta ${dup.type}: ${dup.val}`);
          allFilesValid = false;
        }
      }
    }
  }

  assert.ok(allFilesValid, 'Found unallowed duplicate meta tags in HTML files');
});

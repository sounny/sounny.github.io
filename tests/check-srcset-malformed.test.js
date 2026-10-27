const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function getHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function isMalformed(srcset) {
  if (!srcset || typeof srcset !== 'string' || srcset.trim() === '') return true;

  const descRegex = /^(?:\d+w|\d+(?:\.\d+)?x|\.\d+x)$/;

  const rawParts = srcset.split(',');
  const parts = [];

  for (let i = 0; i < rawParts.length; i++) {
    let part = rawParts[i];

    // Check if the current part starts a data URI.
    // Data URIs typically contain a single comma separating the scheme/metadata from the data.
    if (/^\s*data:/i.test(part) && i + 1 < rawParts.length) {
      // Re-join the split data URI
      part = part + ',' + rawParts[i+1];
      i++;
    }

    parts.push(part);
  }

  let validCandidateCount = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part === '') continue; // Skip empty candidates (HTML spec allows them, e.g. trailing commas)

    const tokens = part.split(/\s+/);

    // A candidate must have a URL. If the first token looks exactly like a descriptor,
    // it's highly likely a missing URL (e.g., `srcset="100w"` or `srcset="100w 2x"`).
    if (tokens.length === 1) {
      if (descRegex.test(tokens[0])) return true;
    } else if (tokens.length === 2) {
      if (descRegex.test(tokens[0])) return true;
      if (!descRegex.test(tokens[1])) return true;
    } else {
      return true; // Multiple descriptors or extra junk
    }

    validCandidateCount++;
  }

  return validCandidateCount === 0;
}

test('img and source srcset attributes must not have malformed candidates', () => {
  const rootDir = process.cwd();
  const htmlFiles = getHtmlFiles(rootDir);
  const errors = [];

  for (const file of htmlFiles) {
    const relativeFilePath = path.relative(rootDir, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');

    const regex = /<(?:img|source)\b[^>]*?\bsrcset\s*=\s*(['"])([\s\S]*?)\1/ig;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const srcsetStr = match[2];
      if (isMalformed(srcsetStr)) {
        errors.push(`Malformed srcset in ${relativeFilePath}: "${srcsetStr}"`);
      }
    }
  }

  assert.strictEqual(
    errors.length,
    0,
    'Found malformed srcset attributes:\n' + errors.join('\n')
  );
});

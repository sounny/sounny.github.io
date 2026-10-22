const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [
  // Add files with known offenders here to prevent failure if necessary.
];

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

function extractUrls(srcset) {
  const urls = [];
  let i = 0;
  while (i < srcset.length) {
    // Skip whitespace and commas
    while (i < srcset.length && (/\s/.test(srcset[i]) || srcset[i] === ',')) {
      i++;
    }
    if (i >= srcset.length) break;

    // Read URL
    let url = '';
    while (i < srcset.length && !/\s/.test(srcset[i]) && srcset[i] !== ',') {
      url += srcset[i];
      i++;
    }

    // Ignore data URIs entirely (they may contain commas inside them, which breaks simple splitting)
    if (url.startsWith('data:')) {
      // Fast forward to next space
      while (i < srcset.length && !/\s/.test(srcset[i])) {
        i++;
      }
    } else {
      if (url) {
        urls.push(url);
      }
    }

    // Skip descriptor until comma
    while (i < srcset.length && srcset[i] !== ',') {
      i++;
    }
  }
  return urls;
}

test('local files in img srcset must exist', () => {
  const rootDir = process.cwd();
  const htmlFiles = getHtmlFiles(rootDir);
  const errors = [];

  for (const file of htmlFiles) {
    const relativeFilePath = path.relative(rootDir, file).replace(/\\/g, '/');
    if (ALLOWLIST.includes(relativeFilePath)) continue;

    const content = fs.readFileSync(file, 'utf8');
    const srcsetRegex = /<img\b[^>]*?\bsrcset\s*=\s*(['"])(.*?)\1/ig;
    let match;

    while ((match = srcsetRegex.exec(content)) !== null) {
      const srcsetString = match[2];
      const urls = extractUrls(srcsetString);

      for (const rawUrl of urls) {
        if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('//')) {
          continue;
        }

        let url = rawUrl.split('?')[0].split('#')[0];
        url = decodeURIComponent(url);

        // Resolve the local path
        let resolvedPath;
        if (url.startsWith('/')) {
          resolvedPath = path.join(rootDir, url.slice(1));
        } else {
          resolvedPath = path.resolve(path.dirname(file), url);
        }

        if (!fs.existsSync(resolvedPath)) {
          errors.push(`File not found: ${url} (referenced in srcset in ${relativeFilePath})`);
        }
      }
    }
  }

  assert.strictEqual(
    errors.length,
    0,
    'Found broken local file links in img srcset:\n' + errors.join('\n')
  );
});

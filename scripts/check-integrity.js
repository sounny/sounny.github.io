const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];

function checkFile(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File not found: ${filename}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  const tagRegex = /<(script|link)\s+([^>]+)>/gi;

  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tagName = match[1].toLowerCase();
    const attrsStr = match[2];

    const attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^ >]+)))?/gi;
    const attrs = {};
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
      const name = attrMatch[1].toLowerCase();
      const value = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : attrMatch[4]);
      attrs[name] = value || true;
    }

    if (tagName === 'script' && typeof attrs.src === 'string') {
      if (attrs.src.startsWith('http://') || attrs.src.startsWith('https://') || attrs.src.startsWith('//')) {
        if (!attrs.integrity) {
          console.warn(`Warning: External script in ${filename} lacks integrity attribute: ${attrs.src}`);
        }
      }
    } else if (tagName === 'link' && attrs.rel === 'stylesheet' && typeof attrs.href === 'string') {
      if (attrs.href.startsWith('http://') || attrs.href.startsWith('https://') || attrs.href.startsWith('//')) {
        if (!attrs.integrity) {
          console.warn(`Warning: External stylesheet in ${filename} lacks integrity attribute: ${attrs.href}`);
        }
      }
    }
  }
}

filesToCheck.forEach(checkFile);

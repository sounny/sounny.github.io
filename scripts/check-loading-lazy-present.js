const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const regex = /<(img|iframe)\b[^>]*\bloading\s*=\s*["']lazy["'][^>]*>/i;

if (!regex.test(html)) {
  console.error('Error: index.html must contain at least one loading="lazy" attribute on an img or iframe.');
  process.exit(1);
}

console.log('Success: loading="lazy" is present on an img or iframe in index.html.');

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const id = 'G-8JGCM2H8Y4';
const hasId = html.includes(id);
const hasGtag = html.includes('gtag/js?id=') || html.includes('gtag config');

if (!hasId || !hasGtag) {
  console.error(`index.html is missing gtag measurement id ${id} or gtag/js?id=/gtag config`);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(indexPath, 'utf-8');

// Looking for a <link> tag with a rel attribute containing 'icon'
// We can use a regex to match: <link ... rel="...icon..." ...>
// It could be 'icon', 'shortcut icon', 'apple-touch-icon', etc.
const hasFavicon = /<link[^>]*\brel=["'][^"']*icon[^"']*["'][^>]*>/i.test(content);

if (!hasFavicon) {
  console.error('FAIL: index.html is missing a favicon link (rel containing icon).');
  process.exit(1);
}

console.log('PASS: index.html has a favicon link.');
process.exit(0);

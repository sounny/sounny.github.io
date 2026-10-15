const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

const regex = /<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']\s*\/?>/i;
const match = indexHtml.match(regex);

if (!match || match[1].trim() === '') {
  console.error('Error: index.html must contain a <meta name="theme-color"> tag with a non-empty content attribute.');
  process.exit(1);
}

console.log('Success: index.html contains a valid <meta name="theme-color"> tag.');

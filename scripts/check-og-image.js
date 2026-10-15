const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

const parserRegex = /<meta\s+([^>]+)>/ig;
let found = false;

let match;
while ((match = parserRegex.exec(html)) !== null) {
  const attrs = match[1];
  if (/property=["']og:image["']/i.test(attrs) || /name=["']og:image["']/i.test(attrs)) {
    const contentMatch = attrs.match(/content=["']([^"']+)["']/i);
    if (contentMatch && contentMatch[1].trim() !== '') {
      found = true;
      break;
    }
  }
}

if (!found) {
  console.error('Error: index.html lacks a non-empty og:image meta property.');
  process.exit(1);
}

console.log('OK: index.html has a non-empty og:image meta property.');

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(filePath, 'utf8');

const metaTags = html.match(/<meta[^>]+>/gi) || [];
let found = false;

for (const tag of metaTags) {
  if (/name\s*=\s*["']twitter:url["']/i.test(tag)) {
    const contentMatch = tag.match(/content\s*=\s*["']([^"']*)["']/i);
    if (contentMatch && contentMatch[1].trim() !== '') {
      found = true;
      break;
    }
  }
}

if (!found) {
  console.error('Error: index.html lacks a non-empty <meta name="twitter:url" content="...">');
  process.exit(1);
}

console.log('check-twitter-url.js passed: index.html contains a valid twitter:url meta tag.');

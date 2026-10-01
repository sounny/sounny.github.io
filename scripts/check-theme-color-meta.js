const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexHtmlPath, 'utf8');

const metaTags = html.match(/<meta[^>]+>/gi) || [];
let found = false;

for (const tag of metaTags) {
  if (/name=["']theme-color["']/i.test(tag)) {
    const contentMatch = tag.match(/content=["']([^"']+)["']/i);
    if (contentMatch) {
      const content = contentMatch[1].trim();
      if (content) {
        console.log(`Success: Found theme-color meta tag with content "${content}"`);
        found = true;
        break;
      }
    }
  }
}

if (!found) {
  console.error('Error: index.html must have a <meta name="theme-color" content="..."> tag with a non-empty content.');
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Regex to match a meta tag that has name="viewport" and a content attribute containing width=device-width
const viewportRegex = /<meta(?=[^>]*name=["']viewport["'])(?=[^>]*content=["'][^"']*width=device-width[^"']*["'])[^>]*>/i;

if (viewportRegex.test(indexHtml)) {
  console.log('✅ Passed: Viewport meta tag with width=device-width found in index.html.');
  process.exit(0);
} else {
  console.error('❌ Error: index.html is missing a meta viewport tag with width=device-width.');
  process.exit(1);
}

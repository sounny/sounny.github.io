const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../index.html');
let html;
try {
  html = fs.readFileSync(htmlPath, 'utf8');
} catch (err) {
  console.error("Error reading index.html:", err);
  process.exit(1);
}

const linkRegex = /<link\s+([^>]+)>/ig;
let found = false;

let match;
while ((match = linkRegex.exec(html)) !== null) {
  const attrs = match[1];

  const isStylesheet = /rel\s*=\s*['"]?stylesheet['"]?/i.test(attrs);
  const isFontAwesome = /href\s*=\s*['"]?[^'"\s]*(?:font-awesome|fontawesome)[^'"\s]*['"]?/i.test(attrs);

  if (isStylesheet && isFontAwesome) {
    found = true;
    break;
  }
}

if (!found) {
  console.error("Error: index.html does not link a font-awesome stylesheet.");
  process.exit(1);
}

console.log("Success: index.html links a font-awesome stylesheet.");

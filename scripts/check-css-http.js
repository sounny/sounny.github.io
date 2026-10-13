const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'main.css');

if (!fs.existsSync(cssPath)) {
  console.error(`Error: ${cssPath} does not exist`);
  process.exit(1);
}

const content = fs.readFileSync(cssPath, 'utf8');

if (content.trim().length === 0) {
  console.error(`Error: ${cssPath} is empty`);
  process.exit(1);
}

const httpUrlRegex = /url\(['"]?http:\/\/[^'"]+['"]?\)/i;
const httpImportRegex = /@import\s+['"]http:\/\/[^'"]+['"]/i;

if (httpUrlRegex.test(content) || httpImportRegex.test(content)) {
  console.error(`Error: ${cssPath} contains insecure http:// links in url() or @import`);
  process.exit(1);
}

console.log('check-css-http: pass');

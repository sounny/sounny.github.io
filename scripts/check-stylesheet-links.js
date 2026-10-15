const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

const regex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g;
let match;
let hasError = false;

while ((match = regex.exec(indexContent)) !== null) {
  const href = match[1];
  if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
    const filePath = path.join(__dirname, '..', href);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: Stylesheet link ${href} points to a missing file.`);
      hasError = true;
    }
  }
}

// Check link rel="stylesheet" but different order
const regex2 = /<link[^>]*href="([^"]+)"[^>]*rel="stylesheet"/g;
while ((match = regex2.exec(indexContent)) !== null) {
  const href = match[1];
  if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
    const filePath = path.join(__dirname, '..', href);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: Stylesheet link ${href} points to a missing file.`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('All stylesheet links point to existing files.');
}

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(indexPath, 'utf8');

const viewportRegex = /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const viewportRegexReverse = /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']viewport["'][^>]*>/i;

const match = content.match(viewportRegex) || content.match(viewportRegexReverse);

if (!match || !match[1].trim()) {
  console.error('Error: index.html must contain a <meta name="viewport"> with a non-empty content attribute.');
  process.exit(1);
}

console.log('Check passed: viewport meta tag found in index.html.');

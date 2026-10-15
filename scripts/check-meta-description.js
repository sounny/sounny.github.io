const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

try {
  const content = fs.readFileSync(indexPath, 'utf8');

  // This regex matches a meta tag with name="description" and ensures the content attribute is not empty.
  // It matches <meta name="description" content="non-empty-value">
  const metaRegex = /<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']+)["'][^>]*?>/i;
  // It also matches <meta content="non-empty-value" name="description">
  const metaRegex2 = /<meta[^>]*?content=["']([^"']+)["'][^>]*?name=["']description["'][^>]*?>/i;

  const match = content.match(metaRegex) || content.match(metaRegex2);

  if (!match || !match[1] || match[1].trim() === '') {
    console.error('Error: index.html lacks a non-empty <meta name="description"> tag.');
    process.exit(1);
  }

  console.log('Success: index.html contains a non-empty <meta name="description"> tag.');
} catch (err) {
  console.error('Error reading index.html:', err.message);
  process.exit(1);
}

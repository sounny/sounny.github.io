const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: index.html not found');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');

// Regex to check for <link rel="canonical" href="https://...">
// Allows attribute order independence and handles quotes
const canonicalRegex = /<link(?=\s)(?=(?:[^>]*?\s+)?rel=["']canonical["'])(?=(?:[^>]*?\s+)?href=["']https:\/\/[^"']+["'])[^>]*>/i;

if (!canonicalRegex.test(html)) {
  console.error('Error: index.html must contain a <link rel="canonical" href="https://..."> with a non-empty https URL.');
  process.exit(1);
}

console.log('Success: index.html contains valid https canonical link.');
process.exit(0);

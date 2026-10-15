const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

// Match <link rel="canonical" href="...">
const canonicalRegex = /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']\s*\/?>/i;
const match = indexHtml.match(canonicalRegex);

if (!match) {
  console.error('Error: index.html is missing a <link rel="canonical"> tag.');
  process.exit(1);
}

const href = match[1].trim();

if (!href) {
  console.error('Error: <link rel="canonical"> in index.html has an empty href attribute.');
  process.exit(1);
}

console.log('Success: index.html has a valid <link rel="canonical"> tag.');
process.exit(0);

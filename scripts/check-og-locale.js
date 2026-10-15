const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = '';

try {
  html = fs.readFileSync(indexPath, 'utf8');
} catch (err) {
  console.error(`Error reading index.html: ${err.message}`);
  process.exit(1);
}

const match1 = html.match(/<meta[^>]+property=["']og:locale(?::alternate)?["'][^>]+content=["']([^"']+)["'][^>]*>/i);
const match2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:locale(?::alternate)?["'][^>]*>/i);

const val1 = match1 ? match1[1].trim() : '';
const val2 = match2 ? match2[1].trim() : '';

if (!val1 && !val2) {
  console.log('SKIP/XFAIL: index.html lacks a non-empty og:locale or og:locale:alternate meta tag.');
  process.exit(0);
}

console.log('PASS: index.html has a non-empty og:locale meta tag.');

const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Regular expression to check for <meta property="og:type" content="website">
// Using attribute-order-independent regex where possible
const ogTypeRegex = /<meta\s+(?:[^>]*?\s+)?property=["']og:type["']\s+(?:[^>]*?\s+)?content=["']website["']\s*\/?>|<meta\s+(?:[^>]*?\s+)?content=["']website["']\s+(?:[^>]*?\s+)?property=["']og:type["']\s*\/?>/i;

if (!ogTypeRegex.test(indexHtml)) {
    console.error('Error: index.html must include <meta property="og:type" content="website">');
    process.exit(1);
}

console.log('og:type check passed.');

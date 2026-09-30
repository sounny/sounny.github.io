const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// The regex looks for an og:description meta tag with a non-empty content attribute
// It is order-independent for attributes, but content must not be empty.
const ogDescriptionRegex = /<meta\s+(?:[^>]*\s+)?property="og:description"\s+(?:[^>]*\s+)?content="([^"]+)"\s*\/?>|<meta\s+(?:[^>]*\s+)?content="([^"]+)"\s+(?:[^>]*\s+)?property="og:description"\s*\/?>/i;

const match = indexHtmlContent.match(ogDescriptionRegex);

if (!match) {
    console.error('Error: index.html must have an og:description meta tag with a non-empty content attribute.');
    process.exit(1);
}

// Extract content. match[1] corresponds to the first part of the alternation, match[2] to the second.
const content = match[1] || match[2];

if (!content || content.trim() === '') {
     console.error('Error: index.html og:description meta tag content attribute must not be empty.');
     process.exit(1);
}

console.log('Success: index.html contains a non-empty og:description meta tag.');
process.exit(0);

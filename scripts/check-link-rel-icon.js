const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

// Find all <link ...> tags
const linkRegex = /<link\s+[^>]+>/gi;
let hasIcon = false;

let match;
while ((match = linkRegex.exec(indexHtmlContent)) !== null) {
  const linkTag = match[0];
  // Extract rel attribute value
  const relMatch = linkTag.match(/rel\s*=\s*["']([^"']+)["']/i);
  if (relMatch) {
    const relValue = relMatch[1];
    // Split by whitespace and check if 'icon' is exactly one of the tokens
    const tokens = relValue.trim().split(/\s+/);
    if (tokens.includes('icon')) {
      hasIcon = true;
      break;
    }
  }
}

if (!hasIcon) {
  console.error('Error: index.html must contain a <link rel="icon"> or <link rel="shortcut icon"> tag.');
  process.exit(1);
}

console.log('check-link-rel-icon: Success');
process.exit(0);

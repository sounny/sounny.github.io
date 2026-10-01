const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

const linkRegex = /<link\s+[^>]+>/gi;
const links = html.match(linkRegex) || [];

let found = false;
for (const tag of links) {
  const isPreconnect = /rel=["']preconnect["']/i.test(tag);
  // Matches href with non-empty string
  const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
  const hasValidHref = hrefMatch && hrefMatch[1].trim() !== '';

  if (isPreconnect && hasValidHref) {
    found = true;
    break;
  }
}

if (!found) {
  console.error('Error: index.html must have at least one <link rel="preconnect" href="..."> with a non-empty href.');
  process.exit(1);
}

console.log('Success: index.html contains a preconnect link tag with a non-empty href.');
process.exit(0);

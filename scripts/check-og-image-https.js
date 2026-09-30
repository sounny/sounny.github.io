const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

const metaOgImageRegex = /<meta\s+(?:[^>]*?\s+)?property=["']og:image["'](?:\s+[^>]*?)?>/i;
const match = html.match(metaOgImageRegex);

if (!match) {
  console.error('Error: index.html is missing a <meta property="og:image"> tag.');
  process.exit(1);
}

const tag = match[0];
const contentMatch = tag.match(/content=["']([^"']+)["']/i);

if (!contentMatch) {
  console.error('Error: <meta property="og:image"> tag in index.html is missing a content attribute.');
  process.exit(1);
}

const content = contentMatch[1].trim();

if (!content) {
  console.error('Error: <meta property="og:image"> tag in index.html has an empty content attribute.');
  process.exit(1);
}

if (!content.startsWith('https://')) {
  console.error(`Error: og:image content must start with "https://". Found: "${content}"`);
  process.exit(1);
}

console.log('Success: index.html has a valid og:image URL starting with https://');

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

try {
  const html = fs.readFileSync(indexPath, 'utf8');

  // Use lookaheads to find the meta tag with property="og:title" and capture the content attribute
  // This allows the attributes to be in any order and ensures the content is not empty
  const ogTitleRegex = /<meta\s+(?=[^>]*property=["']og:title["'])(?=[^>]*content=["']([^"']+)["'])[^>]*>/i;

  const match = html.match(ogTitleRegex);

  if (!match) {
    console.error('Error: index.html must include a <meta property="og:title"> tag with a non-empty content attribute.');
    process.exit(1);
  }

  console.log('Success: og:title tag found with non-empty content.');
  process.exit(0);
} catch (error) {
  console.error('Error reading index.html:', error);
  process.exit(1);
}

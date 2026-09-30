const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

fs.readFile(indexPath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading ${indexPath}:`, err);
    process.exit(1);
  }

  // Regex to find twitter:title meta tag
  // Matches <meta ... name="twitter:title" ... content="..." ...> or <meta ... content="..." ... name="twitter:title" ...>
  // and ensures content is not empty
  const metaRegex = /<meta\s+(?:[^>]*?\s+)?name=["']twitter:title["']\s+(?:[^>]*?\s+)?content=["']([^"']+)["'][^>]*>/i;
  const metaRegexReverse = /<meta\s+(?:[^>]*?\s+)?content=["']([^"']+)["']\s+(?:[^>]*?\s+)?name=["']twitter:title["'][^>]*>/i;

  let match = data.match(metaRegex);
  if (!match) {
    match = data.match(metaRegexReverse);
  }

  if (!match) {
    console.error('Error: <meta name="twitter:title"> tag with a non-empty content attribute not found in index.html');
    process.exit(1);
  }

  const content = match[1].trim();
  if (content === '') {
    console.error('Error: <meta name="twitter:title"> tag has an empty content attribute in index.html');
    process.exit(1);
  }

  console.log('Success: index.html contains a valid twitter:title meta tag.');
  process.exit(0);
});

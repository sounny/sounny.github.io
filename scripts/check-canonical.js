const fs = require('fs');
const path = require('path');

function checkCanonical(filePath, expectedUrl) {
  const fullPath = path.join(__dirname, '..', filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');

  // Find <link ...> tags
  const linkRegex = /<link\b[^>]*>/gi;
  let match;
  let foundCanonical = false;
  let actualUrl = null;

  while ((match = linkRegex.exec(content)) !== null) {
    const tag = match[0];
    if (/\brel=["']canonical["']/i.test(tag)) {
      foundCanonical = true;
      const hrefMatch = tag.match(/\bhref=["']([^"']+)["']/i);
      if (hrefMatch) {
        actualUrl = hrefMatch[1];
      }
      break;
    }
  }

  if (!foundCanonical) {
    console.error(`Error: Could not find <link rel="canonical"> in ${filePath}`);
    process.exit(1);
  }

  if (actualUrl !== expectedUrl) {
    console.error(`Error: Expected canonical URL in ${filePath} to be ${expectedUrl}, but got ${actualUrl}`);
    process.exit(1);
  }

  console.log(`Success: ${filePath} has correct canonical URL: ${actualUrl}`);
}

try {
  checkCanonical('index.html', 'https://sounny.github.io/');
  checkCanonical('privacy.html', 'https://sounny.github.io/privacy.html');
  console.log('All canonical URLs are correct.');
} catch (error) {
  console.error('An error occurred:', error.message);
  process.exit(1);
}

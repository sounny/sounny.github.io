const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

try {
  const content = fs.readFileSync(indexPath, 'utf-8');

  const metaTags = content.match(/<meta[^>]+>/ig);
  let found = false;
  let valid = false;

  if (metaTags) {
    for (const tag of metaTags) {
      if (/name=["']keywords["']/i.test(tag)) {
        found = true;
        const contentMatch = tag.match(/content=["']([^"']*)["']/i);
        if (contentMatch && contentMatch[1].trim().length > 0) {
          valid = true;
          break;
        }
      }
    }
  }

  if (!found) {
    console.error('Error: <meta name="keywords"> not found in index.html');
    process.exit(1);
  }

  if (!valid) {
    console.error('Error: <meta name="keywords"> content is empty in index.html');
    process.exit(1);
  }

  console.log('Success: <meta name="keywords"> is present and non-empty in index.html');
} catch (error) {
  console.error(`Error reading index.html: ${error.message}`);
  process.exit(1);
}

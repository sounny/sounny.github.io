const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

try {
  const htmlContent = fs.readFileSync(indexPath, 'utf8');

  // Use a regex to match <meta property="og:title" content="something">
  // Allows single or double quotes for attributes, and some spacing flexibility.
  const regex = /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']\s*\/?>/i;

  const match = htmlContent.match(regex);

  if (match && match[1].trim() !== '') {
    console.log('✅ og:title meta property is present and non-empty.');
    process.exit(0);
  } else {
    console.error('❌ Error: index.html is missing a non-empty og:title meta property.');
    process.exit(1);
  }
} catch (error) {
  console.error(`❌ Error reading index.html: ${error.message}`);
  process.exit(1);
}

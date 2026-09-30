const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

let indexContent;
try {
  indexContent = fs.readFileSync(indexPath, 'utf8');
} catch (err) {
  console.error(`Error reading index.html: ${err.message}`);
  process.exit(1);
}

// Regex to capture the content attribute of the twitter:card meta tag, regardless of attribute order
// Uses [\s\S]*? to handle cases where attributes span multiple lines
const regexNameFirst = /<meta\s+[^>]*?name=["']twitter:card["']\s+[^>]*?content=["']([^"']+)["'][^>]*>/i;
const regexContentFirst = /<meta\s+[^>]*?content=["']([^"']+)["']\s+[^>]*?name=["']twitter:card["'][^>]*>/i;

const match = indexContent.match(regexNameFirst) || indexContent.match(regexContentFirst);

if (!match) {
  console.error('Error: index.html must include a <meta name="twitter:card"> tag with non-empty content.');
  process.exit(1);
}

const contentValue = match[1].trim();

if (contentValue === '') {
  console.error('Error: index.html <meta name="twitter:card"> tag has an empty content attribute.');
  process.exit(1);
}

console.log('✓ index.html has valid twitter:card meta tag.');

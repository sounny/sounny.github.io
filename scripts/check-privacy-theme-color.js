const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'privacy.html');

try {
  const content = fs.readFileSync(filePath, 'utf8');

  // Regex that matches both orderings
  const regex1 = /<meta\s+(?:[^>]*?\s+)?name=["']theme-color["']\s+(?:[^>]*?\s+)?content=["'](#[a-zA-Z0-9]+)["'][^>]*>/i;
  const regex2 = /<meta\s+(?:[^>]*?\s+)?content=["'](#[a-zA-Z0-9]+)["']\s+(?:[^>]*?\s+)?name=["']theme-color["'][^>]*>/i;

  const match = content.match(regex1) || content.match(regex2);

  if (!match) {
    console.error('Error: privacy.html does not contain a valid <meta name="theme-color" content="#..."> tag.');
    process.exit(1);
  }

  const hexColor = match[1];
  if (hexColor.length < 2) {
    console.error('Error: privacy.html theme-color content is empty or invalid.');
    process.exit(1);
  }

  console.log('Success: privacy.html contains valid theme-color meta tag.');
  process.exit(0);

} catch (error) {
  console.error(`Error reading privacy.html: ${error.message}`);
  process.exit(1);
}

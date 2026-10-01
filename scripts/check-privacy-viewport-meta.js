const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'privacy.html');

try {
  const html = fs.readFileSync(filePath, 'utf8');

  // Regex to match <meta ... name="viewport" ...> or <meta ... content="..." ...>
  const metaViewportRegex1 = /<meta\s+(?:[^>]*?\s+)?name=["']viewport["']\s+(?:[^>]*?\s+)?content=["']([^"']*)["'][^>]*>/i;
  const metaViewportRegex2 = /<meta\s+(?:[^>]*?\s+)?content=["']([^"']*)["']\s+(?:[^>]*?\s+)?name=["']viewport["'][^>]*>/i;

  const match = html.match(metaViewportRegex1) || html.match(metaViewportRegex2);

  if (!match) {
    console.error('Error: privacy.html does not contain a <meta name="viewport"> tag with a content attribute.');
    process.exit(1);
  }

  const content = match[1];

  if (!content || content.trim() === '') {
    console.error('Error: privacy.html has an empty content attribute in <meta name="viewport">.');
    process.exit(1);
  }

  if (!content.includes('width=')) {
    console.error('Error: privacy.html <meta name="viewport"> content attribute does not include "width=".');
    process.exit(1);
  }

  console.log('Pass: privacy.html contains <meta name="viewport"> with non-empty content including width=.');
} catch (error) {
  console.error(`Error reading privacy.html: ${error.message}`);
  process.exit(1);
}

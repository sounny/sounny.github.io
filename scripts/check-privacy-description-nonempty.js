const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'privacy.html');

try {
  const html = fs.readFileSync(filePath, 'utf8');
  const metaRegex = /<meta\s+([^>]+)>/gi;
  let match;
  let foundValid = false;

  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = match[1];

    const nameMatch = attrs.match(/name\s*=\s*(["'])description\1/i);
    if (nameMatch) {
      const contentMatch = attrs.match(/content\s*=\s*(["'])(.*?)\1/i);
      if (contentMatch && contentMatch[2].trim().length > 0) {
        foundValid = true;
        break;
      }
    }
  }

  if (!foundValid) {
    console.error('Error: privacy.html must contain a <meta name="description" content="..."> tag with non-empty trimmed content.');
    process.exit(1);
  }

  process.exit(0);
} catch (err) {
  console.error('Error reading privacy.html:', err.message);
  process.exit(1);
}

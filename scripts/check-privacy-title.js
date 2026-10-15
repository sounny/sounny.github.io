const fs = require('fs');
const path = require('path');

const privacyHtmlPath = path.join(__dirname, '..', 'privacy.html');

try {
  const content = fs.readFileSync(privacyHtmlPath, 'utf8');

  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);

  if (!titleMatch) {
    console.error('Error: privacy.html lacks a <title> tag.');
    process.exit(1);
  }

  const titleText = titleMatch[1].trim();

  if (titleText === '') {
    console.error('Error: privacy.html <title> tag is empty.');
    process.exit(1);
  }

  console.log('Success: privacy.html contains a non-empty <title> tag.');
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('Error: privacy.html not found.');
    process.exit(1);
  }
  console.error('Unexpected error reading privacy.html:', err);
  process.exit(1);
}

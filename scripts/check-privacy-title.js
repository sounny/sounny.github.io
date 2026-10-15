const fs = require('fs');
const path = require('path');

const privacyFilePath = path.join(__dirname, '..', 'privacy.html');

try {
  const content = fs.readFileSync(privacyFilePath, 'utf8');

  const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
  const match = content.match(titleRegex);

  if (!match) {
    console.error('Error: privacy.html is missing a <title> tag.');
    process.exit(1);
  }

  const titleContent = match[1].trim();

  if (!titleContent) {
    console.error('Error: privacy.html has an empty <title> tag.');
    process.exit(1);
  }

  console.log('Success: privacy.html contains a non-empty <title> tag.');
  process.exit(0);
} catch (err) {
  console.error('Error reading privacy.html:', err.message);
  process.exit(1);
}

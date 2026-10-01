const fs = require('fs');
const path = require('path');

const privacyPath = path.join(__dirname, '..', 'privacy.html');

if (!fs.existsSync(privacyPath)) {
  console.error('Error: privacy.html does not exist.');
  process.exit(1);
}

const html = fs.readFileSync(privacyPath, 'utf8');

const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/i;
const match = html.match(titleRegex);

if (!match) {
  console.error('Error: No <title> tag found in privacy.html.');
  process.exit(1);
}

const titleText = match[1].trim();

if (titleText.length === 0) {
  console.error('Error: <title> tag in privacy.html is empty.');
  process.exit(1);
}

console.log('Success: privacy.html has a non-empty <title>.');
process.exit(0);

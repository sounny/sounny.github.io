const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'privacy.html');

try {
  const content = fs.readFileSync(filePath, 'utf8');

  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;

  let match;
  let found = false;

  while ((match = h1Regex.exec(content)) !== null) {
    const h1Text = match[1];
    if (/privacy/i.test(h1Text)) {
      found = true;
      break;
    }
  }

  if (!found) {
    console.error('Error: privacy.html does not contain an <h1> element with text including "Privacy" (case-insensitive).');
    process.exit(1);
  }

  console.log('Success: privacy.html contains an <h1> element with "Privacy".');
  process.exit(0);
} catch (err) {
  console.error('Error reading privacy.html:', err.message);
  process.exit(1);
}

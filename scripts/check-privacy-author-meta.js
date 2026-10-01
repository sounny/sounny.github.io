const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'privacy.html');
if (!fs.existsSync(filePath)) {
  console.error('Error: privacy.html not found.');
  process.exit(1);
}

const html = fs.readFileSync(filePath, 'utf8');
const metaTags = html.match(/<meta[^>]+>/ig) || [];

let isValid = false;

for (const tag of metaTags) {
  if (/name=["']author["']/i.test(tag)) {
    // A slightly more robust regex to extract the content attribute
    const contentMatch = tag.match(/content=(["'])(.*?)\1/i);
    if (contentMatch) {
      const content = contentMatch[2].trim();
      if (content.length > 0) {
        isValid = true;
        break;
      }
    }
  }
}

if (!isValid) {
  console.error('Error: privacy.html is missing a <meta name="author"> tag with non-empty trimmed content.');
  process.exit(1);
}

console.log('Success: privacy.html has a valid <meta name="author"> tag.');

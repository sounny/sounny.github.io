const fs = require('fs');
const path = require('path');

function checkOgUrl(filename) {
  const filePath = path.join(__dirname, '..', filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filename}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // Look for og:url with content starting with https://
  // Try matching <meta property="og:url" content="https://..." />
  const regex1 = /<meta\s+property=["']og:url["']\s+content=["'](https:\/\/[^"']+)["']/i;
  // Try matching <meta content="https://..." property="og:url" />
  const regex2 = /<meta\s+content=["'](https:\/\/[^"']+)["']\s+property=["']og:url["']/i;

  const match = content.match(regex1) || content.match(regex2);

  if (!match) {
    console.error(`ERROR: ${filename} is missing a valid <meta property="og:url" content="https://..."> tag.`);
    process.exit(1);
  }
  console.log(`SUCCESS: ${filename} has a valid og:url (${match[1]}).`);
}

checkOgUrl('index.html');
checkOgUrl('privacy.html');

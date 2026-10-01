const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'privacy.html');

try {
  const content = fs.readFileSync(filePath, 'utf8');

  // Regex to find <link rel="canonical" href="https://..."> in privacy.html
  // Note that attributes could be in any order
  const regex = /<link\s+(?:[^>]*?\s+)?rel=["']canonical["']\s+(?:[^>]*?\s+)?href=["'](https:\/\/[^"']*privacy\.html[^"']*)["'][^>]*>/i;
  const regex2 = /<link\s+(?:[^>]*?\s+)?href=["'](https:\/\/[^"']*privacy\.html[^"']*)["']\s+(?:[^>]*?\s+)?rel=["']canonical["'][^>]*>/i;

  if (regex.test(content) || regex2.test(content)) {
    console.log('✅ privacy.html contains <link rel="canonical"> with HTTPS href ending in/containing privacy.html');
    process.exit(0);
  } else {
    console.error('❌ privacy.html is missing a valid <link rel="canonical"> tag with an HTTPS href ending in/containing privacy.html');
    process.exit(1);
  }
} catch (err) {
  console.error(`❌ Error reading privacy.html: ${err.message}`);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html') && fs.statSync(path.join(rootDir, f)).isFile());

let failed = false;

for (const file of files) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
  // Regex to match <img> tags
  const imgRegex = /<img\s([^>]*?)>/gi;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const imgTag = match[0];
    const attrs = match[1];

    // Replace content inside quotes to prevent matching "alt" inside another attribute's value
    const strippedAttrs = attrs.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");

    // Check if 'alt' is present as an attribute
    const hasAlt = /(?:^|\s)alt(?:\s*=\s*|\s|$|\/)/i.test(strippedAttrs);

    if (!hasAlt) {
      console.error(`Error in ${file}: <img> tag missing alt attribute: ${imgTag}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('All <img> tags have an alt attribute.');
}

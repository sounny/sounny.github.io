const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const files = fs.readdirSync(rootDir).filter(file => file.endsWith('.html'));

let hasError = false;

for (const file of files) {
  const content = fs.readFileSync(path.join(rootDir, file), 'utf8');

  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const fullTag = match[0];
    const attrs = match[1];
    const innerHTML = match[2];

    // Check if it has an href attribute
    if (!/\bhref\s*=/i.test(attrs)) {
      continue;
    }

    // Check if it has aria-label
    const hasAriaLabel = /\baria-label\s*=/i.test(attrs);

    // Check if it has text content (excluding HTML tags and comments)
    const textContent = innerHTML.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, '').trim();
    const hasText = textContent.length > 0;

    // Check if it contains an img with alt
    let hasImgAlt = false;
    const imgRegex = /<img\b([^>]*)>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(innerHTML)) !== null) {
      if (/\balt\s*=/i.test(imgMatch[1])) {
        hasImgAlt = true;
        break;
      }
    }

    if (!hasText && !hasAriaLabel && !hasImgAlt) {
      console.error(`Error in ${file}: <a> tag is missing text, aria-label, or img with alt.`);
      console.error(`Tag: ${fullTag}\n`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log("Check passed: All <a> tags have text, aria-label, or img with alt.");
}

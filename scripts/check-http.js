const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && fs.statSync(f).isFile());

let hasError = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  // Check for http:// in src="..." or href="..."
  const tagRegex = /<([a-zA-Z0-9\-]+)(?:[^>]*?\s)?(?:src|href)\s*=\s*['"]http:\/\//gi;
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    if (tag !== 'a') {
      console.error(`Error in ${file}: insecure http:// link found in <${tag}> tag.`);
      hasError = true;
    }
  }

  // Check for url(...)
  const urlRegex = /\burl\(\s*['"]?http:\/\//gi;
  let urlMatch;
  while ((urlMatch = urlRegex.exec(content)) !== null) {
    console.error(`Error in ${file}: insecure http:// link found in url().`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('check-http.js passed.');
}

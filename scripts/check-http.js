const fs = require('fs');
const path = require('path');

const files = ['index.html', 'privacy.html'];
let hasError = false;

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${file}`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Check src="http://"
  const srcRegex = /\bsrc\s*=\s*["']http:\/\//gi;
  let match;
  while ((match = srcRegex.exec(content)) !== null) {
    console.error(`Error in ${file}: http:// resource found in src`);
    hasError = true;
  }

  // Check url("http://")
  const urlRegex = /\burl\(\s*['"]?http:\/\//gi;
  while ((match = urlRegex.exec(content)) !== null) {
    console.error(`Error in ${file}: http:// resource found in url()`);
    hasError = true;
  }

  // Check href="http://" for non-<a> tags (like <link>)
  // Match any tag that is not "a" which has an href attribute with http://
  const hrefRegex = /<\s*([a-z0-9\-]+)(?:\s+[^>]*?)?\bhref\s*=\s*["']http:\/\//gi;
  while ((match = hrefRegex.exec(content)) !== null) {
    if (match[1].toLowerCase() !== 'a') {
      console.error(`Error in ${file}: http:// resource found in href inside <${match[1]}> tag`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error("Non-secure http:// resources are not allowed. Please use https:// or allow it explicitly for <a> tags.");
  process.exit(1);
} else {
  console.log("No non-secure http:// resources found.");
}

const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
let hasError = false;

filesToCheck.forEach(file => {
  if (!fs.existsSync(file)) {
    return;
  }
  const content = fs.readFileSync(file, 'utf8');

  // Find all <link ...> tags
  const linkRegex = /<link[^>]*>/gi;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkTag = match[0];

    // Check if it has rel="stylesheet" or rel=stylesheet
    if (/rel\s*=\s*(["']?)stylesheet\1/i.test(linkTag)) {
      // Extract href
      const hrefMatch = linkTag.match(/href\s*=\s*(["'])(.*?)\1/i);
      if (hrefMatch && hrefMatch[2]) {
        let href = hrefMatch[2];

        // Ignore external stylesheets (http/https/data:)
        if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('data:')) {
          continue;
        }

        // Strip query params or hash if any
        href = href.split('?')[0].split('#')[0];

        const filePath = path.join(process.cwd(), href);
        if (!fs.existsSync(filePath)) {
          console.error(`Error: Stylesheet link ${href} in ${file} does not resolve to a file on disk.`);
          hasError = true;
        }
      }
    }
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log('check-stylesheet-links.js passed: All local stylesheet links resolve successfully.');
}

const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];

// Allowlist for images that are currently missing alt attributes
// format: { filename: [src1, src2] }
const allowlist = {
  'index.html': [],
  'privacy.html': []
};

let hasError = false;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    hasError = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Basic regex to find <img ... > tags
  const imgRegex = /<img\s+[^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const imgTag = match[0];

    // Check if alt attribute exists
    const hasAlt = /alt\s*=\s*(["'])(.*?)\1/i.test(imgTag);

    if (!hasAlt) {
      // Try to extract src to see if it's in allowlist
      const srcMatch = /src\s*=\s*(["'])(.*?)\1/i.exec(imgTag);
      const src = srcMatch ? srcMatch[2] : 'unknown';

      const fileAllowlist = allowlist[file] || [];
      if (!fileAllowlist.includes(src)) {
        console.error(`Missing alt attribute in ${file} for image: ${imgTag}`);
        hasError = true;
      }
    }
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log('check-img-alt: All images have alt attributes or are allowlisted.');
}

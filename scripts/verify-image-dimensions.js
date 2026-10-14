const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
const imgRegex = /<img\s+[^>]*>/ig;
const widthRegex = /\bwidth\s*=\s*['"]?[^'"\s>]+['"]?/i;
const heightRegex = /\bheight\s*=\s*['"]?[^'"\s>]+['"]?/i;

let hasWarnings = false;

filesToCheck.forEach(filename => {
  const filepath = path.join(__dirname, '..', filename);

  if (!fs.existsSync(filepath)) {
    console.warn(`Warning: File not found - ${filename}`);
    return;
  }

  const content = fs.readFileSync(filepath, 'utf8');
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    const imgTag = match[0];
    const hasWidth = widthRegex.test(imgTag);
    const hasHeight = heightRegex.test(imgTag);

    if (!hasWidth || !hasHeight) {
      console.warn(`Warning: Missing width or height in ${filename}`);
      console.warn(`  Tag: ${imgTag}`);
      hasWarnings = true;
    }
  }
});

if (!hasWarnings) {
  console.log('All <img> tags have width and height attributes.');
}

// Exit with 0 to warn without failing the test suite
process.exit(0);

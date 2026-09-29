const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
let hasError = false;

const imgRegex = /<img[^>]+src\s*=\s*(["'])(.*?)\1/gi;

filesToCheck.forEach(file => {
  const filePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${file}`);
    hasError = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const src = match[2];

    // Ignore absolute URLs and data URIs
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//') || src.startsWith('data:')) {
      continue;
    }

    // Remove query parameters or hash if present (e.g. img.png?v=1)
    const cleanSrc = src.split('?')[0].split('#')[0];

    const imagePath = path.resolve(__dirname, '..', cleanSrc);

    if (!fs.existsSync(imagePath)) {
      console.error(`Missing image in ${file}: ${src}`);
      hasError = true;
    }
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log('All local images resolve successfully.');
}

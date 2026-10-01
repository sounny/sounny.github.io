const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'index.html');

try {
  const html = fs.readFileSync(filePath, 'utf8');

  // Check for <link rel="preconnect" href="https://fonts.googleapis.com">
  // or something containing fonts.googleapis.com
  const regex = /<link\s+(?:[^>]*?\s+)?rel=["']?preconnect["']?\s+(?:[^>]*?\s+)?href=["']?[^"']*(?:https:\/\/)?fonts\.googleapis\.com[^"']*["']?[^>]*>/i;
  const regex2 = /<link\s+(?:[^>]*?\s+)?href=["']?[^"']*(?:https:\/\/)?fonts\.googleapis\.com[^"']*["']?\s+(?:[^>]*?\s+)?rel=["']?preconnect["']?[^>]*>/i;

  if (regex.test(html) || regex2.test(html)) {
    console.log('check-fonts-preconnect-googleapis.js: PASSED');
    process.exit(0);
  } else {
    console.error('check-fonts-preconnect-googleapis.js: FAILED - <link rel="preconnect" href="https://fonts.googleapis.com"> not found in index.html');
    process.exit(1);
  }
} catch (error) {
  console.error(`check-fonts-preconnect-googleapis.js: FAILED - Error reading index.html: ${error.message}`);
  process.exit(1);
}

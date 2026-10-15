const fs = require('fs');
const path = require('path');

const htmlFilePath = path.join(__dirname, '..', 'index.html');

try {
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

  // Regular expression to match script tags and capture the src attribute
  const scriptRegex = /<script\s+(?:[^>]*?\s+)?src=(["'])(.*?)\1/gi;

  let match;
  let hasMissingFiles = false;

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const src = match[2];

    // Check if the src is a local file path
    if (!src.startsWith('http://') &&
        !src.startsWith('https://') &&
        !src.startsWith('//') &&
        !src.startsWith('data:')) {

      const scriptFilePath = path.join(__dirname, '..', src);

      if (!fs.existsSync(scriptFilePath)) {
        console.error(`Error: Local script file missing: ${src}`);
        hasMissingFiles = true;
      }
    }
  }

  if (hasMissingFiles) {
    process.exit(1);
  } else {
    console.log('All local script files referenced in index.html exist.');
    process.exit(0);
  }

} catch (error) {
  console.error('Error reading index.html:', error);
  process.exit(1);
}

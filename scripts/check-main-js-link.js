const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const mainJsPath = path.join(__dirname, '..', 'js', 'main.js');

try {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  if (!indexHtml.includes('js/main.js')) {
    console.error('Error: index.html does not contain a script src linking to js/main.js');
    process.exit(1);
  }

  if (!fs.existsSync(mainJsPath)) {
    console.error('Error: js/main.js does not exist on disk');
    process.exit(1);
  }

  console.log('Success: js/main.js link in index.html and js/main.js exist on disk verified.');
  process.exit(0);
} catch (error) {
  console.error('An error occurred during verification:', error);
  process.exit(1);
}

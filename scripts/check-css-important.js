const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'main.css');

if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const matches = cssContent.match(/!important/gi);
  const count = matches ? matches.length : 0;

  if (count > 20) {
    console.warn(`WARNING: css/main.css uses !important ${count} times (limit is 20).`);
  }
} else {
  console.warn('WARNING: css/main.css not found.');
}

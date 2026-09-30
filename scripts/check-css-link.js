const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'main.css');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const privacyHtmlPath = path.join(__dirname, '..', 'privacy.html');

let hasError = false;

// Check if css/main.css exists
if (!fs.existsSync(cssPath)) {
  console.error('❌ Error: css/main.css does not exist on disk.');
  hasError = true;
} else {
  console.log('✅ css/main.css exists on disk.');
}

// Function to check html files
function checkHtmlFile(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: ${fileName} does not exist.`);
    hasError = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  // Regex to match a <link> tag with rel="stylesheet" (optional but good) and href containing css/main.css
  const linkRegex = /<link[^>]+href=["'][^"']*css\/main\.css[^"']*["'][^>]*>/i;

  if (!linkRegex.test(content)) {
    console.error(`❌ Error: ${fileName} does not include a stylesheet link to css/main.css`);
    hasError = true;
  } else {
    console.log(`✅ ${fileName} includes a link to css/main.css`);
  }
}

checkHtmlFile(indexHtmlPath, 'index.html');
checkHtmlFile(privacyHtmlPath, 'privacy.html');

if (hasError) {
  process.exit(1);
} else {
  console.log('🎉 All CSS link checks passed!');
  process.exit(0);
}

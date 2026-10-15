const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const privacyHtmlPath = path.join(__dirname, '..', 'privacy.html');

function getLang(htmlContent) {
  const match = htmlContent.match(/<html\s+lang=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
const privacyContent = fs.readFileSync(privacyHtmlPath, 'utf8');

const indexLang = getLang(indexContent);
const privacyLang = getLang(privacyContent);

if (!indexLang) {
  console.error('Error: index.html is missing <html lang> declaration.');
  process.exit(1);
}

if (!privacyLang) {
  console.error('Error: privacy.html is missing <html lang> declaration.');
  process.exit(1);
}

if (indexLang !== privacyLang) {
  console.error(`Error: <html lang> mismatch. index.html has "${indexLang}", privacy.html has "${privacyLang}".`);
  process.exit(1);
}

console.log('Success: index.html and privacy.html have matching <html lang> declarations.');

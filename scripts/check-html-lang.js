const fs = require('fs');
const path = require('path');

function checkLang(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const htmlTagMatch = content.match(/<html([^>]*)>/i);
  if (!htmlTagMatch) {
    console.error(`Error: No <html> tag found in ${path.basename(filePath)}.`);
    process.exit(1);
  }

  const attrs = htmlTagMatch[1];
  const langMatch = attrs.match(/\blang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);

  if (!langMatch) {
    console.error(`Error: <html> tag in ${path.basename(filePath)} lacks a lang attribute.`);
    process.exit(1);
  }

  const lang = langMatch[1] || langMatch[2] || langMatch[3];

  if (!lang || !lang.trim()) {
    console.error(`Error: <html> tag in ${path.basename(filePath)} has an empty lang attribute.`);
    process.exit(1);
  }

  return lang.trim();
}

const indexLang = checkLang(path.join(__dirname, '..', 'index.html'));

console.log('check-html-lang.js passed.');

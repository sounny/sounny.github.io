const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'privacy.html');

try {
  const html = fs.readFileSync(filePath, 'utf8');
  const htmlTagMatch = html.match(/<html[^>]*>/i);

  if (!htmlTagMatch) {
    console.error('Error: <html ...> tag not found in privacy.html.');
    process.exit(1);
  }

  const htmlTag = htmlTagMatch[0];
  const langMatch = htmlTag.match(/\blang=(["'])(.*?)\1/i);

  if (!langMatch || !langMatch[2] || langMatch[2].trim() === '') {
    console.error('Error: privacy.html <html ...> tag is missing a non-empty lang attribute.');
    process.exit(1);
  }

  console.log('Success: privacy.html contains <html ... lang="..."> with a non-empty value.');
} catch (err) {
  console.error('Error reading privacy.html:', err);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

const privacyHtmlPath = path.join(__dirname, '..', 'privacy.html');

try {
  const content = fs.readFileSync(privacyHtmlPath, 'utf8');
  const regex = /<meta\s+charset=(['"]?)utf-8\1\s*\/?>/i;

  if (regex.test(content)) {
    console.log('check-privacy-charset-utf8: Passed');
    process.exit(0);
  } else {
    console.error('check-privacy-charset-utf8: Failed - privacy.html does not contain <meta charset="utf-8">');
    process.exit(1);
  }
} catch (error) {
  console.error('check-privacy-charset-utf8: Error reading privacy.html', error.message);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');

try {
  const html = fs.readFileSync(indexPath, 'utf8');
  // Check for meta charset utf-8, case insensitive.
  // This regex matches variants like:
  // <meta charset="utf-8">
  // <meta charset="UTF-8" />
  // <meta charset=utf-8>
  const charsetRegex = /<meta\s+(?:[^>]*\s+)?charset\s*=\s*['"]?utf-8['"]?/i;

  if (!charsetRegex.test(html)) {
    console.error('Error: index.html must contain a <meta charset="utf-8"> tag.');
    process.exit(1);
  } else {
    console.log('Success: index.html contains a utf-8 meta charset tag.');
    process.exit(0);
  }
} catch (err) {
  console.error(`Error reading index.html: ${err.message}`);
  process.exit(1);
}

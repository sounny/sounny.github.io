const fs = require('fs');
const path = require('path');

function extractMetaDescription(html) {
  let match = html.match(/<meta[^>]*?name=(["'])description\1[^>]*?content=(["'])(.*?)\2[^>]*>/is);
  if (match) return match[3];

  match = html.match(/<meta[^>]*?content=(["'])(.*?)\1[^>]*?name=(["'])description\3[^>]*>/is);
  if (match) return match[2];

  return null;
}

function walkSync(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        filelist = walkSync(path.join(dir, file), filelist);
      }
    }
    else {
      if (file.endsWith('.html') && !file.startsWith('google')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
}

const htmlFiles = walkSync(__dirname);
let errorsFound = false;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const metaDesc = extractMetaDescription(content);

  const relativePath = path.relative(__dirname, file);

  if (metaDesc === null) {
    console.error(`Error: Missing <meta name="description"> in ${relativePath}`);
    errorsFound = true;
  } else if (metaDesc.trim().length === 0) {
    console.error(`Error: Empty meta description in ${relativePath}`);
    errorsFound = true;
  } else if (metaDesc.length > 160) {
    console.error(`Error: Meta description too long (${metaDesc.length} chars) in ${relativePath}`);
    errorsFound = true;
  } else {
    // Optional: console.log(`OK: ${relativePath}`);
  }
});

if (errorsFound) {
  process.exit(1);
} else {
  console.log('All HTML files have valid meta descriptions.');
  process.exit(0);
}

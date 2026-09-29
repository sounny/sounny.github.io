const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '..');

fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }
  let allGood = true;
  files.forEach(function (file) {
    if (file === 'index.html' || file === 'privacy.html') {
      const content = fs.readFileSync(path.join(directoryPath, file), 'utf8');
      if (!content.includes('<link rel="canonical"')) {
        console.error(`File ${file} is missing canonical link`);
        allGood = false;
      }
    }
  });
  if (!allGood) {
      process.exit(1);
  } else {
      console.log('All required HTML files have canonical links.');
  }
});

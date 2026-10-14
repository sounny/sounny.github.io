const fs = require('fs');
const path = require('path');

const MAX_SIZE_BYTES = 500 * 1024;
const IMG_DIR = path.join(__dirname, '../img');

function checkImageSizes(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist. Skipping image size check.`);
    return;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      checkImageSizes(fullPath);
    } else {
      if (stats.size > MAX_SIZE_BYTES) {
        const sizeInKb = (stats.size / 1024).toFixed(2);
        console.warn(`WARN: File ${path.relative(path.join(__dirname, '..'), fullPath)} is larger than 500 KB (${sizeInKb} KB).`);
      }
    }
  }
}

console.log('Checking image sizes...');
checkImageSizes(IMG_DIR);
console.log('Finished checking image sizes.');

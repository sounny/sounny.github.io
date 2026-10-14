const fs = require('fs');
const path = require('path');

const MAX_SIZE_KB = 200;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;

const filesToCheck = [
  'index.html',
  'privacy.html'
];

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  try {
    const stats = fs.statSync(filePath);
    const sizeBytes = stats.size;
    const sizeKB = (sizeBytes / 1024).toFixed(2);

    console.log(`Size of ${file}: ${sizeKB} KB`);

    if (sizeBytes > MAX_SIZE_BYTES) {
      console.warn(`WARNING: ${file} is larger than ${MAX_SIZE_KB} KB!`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`WARNING: ${file} not found.`);
    } else {
      console.error(`Error checking ${file}:`, error);
    }
  }
});

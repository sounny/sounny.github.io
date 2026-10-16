const fs = require('fs');

function checkUtf8Bom(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File ${filePath} does not exist, skipping.`);
    return;
  }

  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(3);
  const bytesRead = fs.readSync(fd, buffer, 0, 3, 0);
  fs.closeSync(fd);

  if (bytesRead >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    console.error(`Error: ${filePath} starts with a UTF-8 BOM.`);
    process.exit(1);
  }
}

const filesToCheck = ['index.html', 'privacy.html'];

for (const file of filesToCheck) {
  checkUtf8Bom(file);
}

console.log('UTF-8 BOM check passed.');

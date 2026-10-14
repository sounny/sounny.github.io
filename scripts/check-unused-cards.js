const fs = require('fs');
const path = require('path');

const cardsDir = path.join(__dirname, '..', 'img', 'cards');
const indexPath = path.join(__dirname, '..', 'index.html');

try {
  const files = fs.readdirSync(cardsDir);
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  const unusedImages = [];

  files.forEach(file => {
    // Ignore hidden files like .DS_Store
    if (file.startsWith('.')) return;

    // Check if the file is referenced in index.html
    // E.g. img/cards/dark.jpg or img/cards/simple.png
    const reference = `img/cards/${file}`;
    if (!indexContent.includes(reference)) {
      unusedImages.push(file);
    }
  });

  if (unusedImages.length > 0) {
    console.warn('\n--- WARNING-ONLY REPORT ---');
    console.warn(`Found ${unusedImages.length} unreferenced image(s) in img/cards/:`);
    unusedImages.forEach(img => {
      console.warn(`  - ${img}`);
    });
    console.warn('These images are never referenced from index.html.');
    console.warn('---------------------------\n');
  } else {
    console.log('All images in img/cards/ are referenced in index.html.');
  }

  // We are creating a warning-only report, so we don't fail the build (exit code 0).
  process.exit(0);
} catch (error) {
  console.error('Error checking for unused card images:', error);
  process.exit(1);
}

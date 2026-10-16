const fs = require('fs');
const path = require('path');

const imgCardsDir = path.join(__dirname, '..', 'img', 'cards');

if (!fs.existsSync(imgCardsDir)) {
  console.error(`Error: Directory ${imgCardsDir} does not exist.`);
  process.exit(1);
}

const files = fs.readdirSync(imgCardsDir);
const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];

const hasImage = files.some(file => {
  const ext = path.extname(file).toLowerCase();
  return imageExtensions.includes(ext);
});

if (!hasImage) {
  console.error(`Error: Directory ${imgCardsDir} does not contain any image files.`);
  process.exit(1);
}

console.log('Success: img/cards/ exists and contains at least one image file.');
process.exit(0);

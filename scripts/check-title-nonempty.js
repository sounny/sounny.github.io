const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
let allPassed = true;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${file}`);
    allPassed = false;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  const titleRegex = /<title>(.*?)<\/title>/is;
  const match = content.match(titleRegex);

  if (!match) {
    console.error(`❌ No <title> tag found in ${file}`);
    allPassed = false;
  } else {
    const titleContent = match[1].trim();
    if (titleContent.length === 0) {
      console.error(`❌ Empty <title> tag in ${file}`);
      allPassed = false;
    } else {
      console.log(`✅ Non-empty title found in ${file}: "${titleContent}"`);
    }
  }
});

if (!allPassed) {
  process.exit(1);
} else {
  console.log('✅ All checked files have non-empty titles.');
}

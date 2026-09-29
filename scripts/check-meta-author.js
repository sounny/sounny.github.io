const fs = require('fs');
const path = require('path');

const filesToCheck = ['index.html', 'privacy.html'];
let hasError = false;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // regex that checks for <meta ... name="author" ... >
    // Attribute order independent regex:
    const regex = /<meta\s+(?:[^>]*\s+)?name=["']author["'][^>]*>/i;

    if (!regex.test(content)) {
      console.error(`Error: ${file} is missing <meta name="author"> tag.`);
      hasError = true;
    } else {
      console.log(`Success: ${file} includes <meta name="author"> tag.`);
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
    hasError = true;
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log('All files passed meta author check.');
  process.exit(0);
}

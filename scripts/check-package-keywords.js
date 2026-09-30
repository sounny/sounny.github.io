const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonData);

  if (!packageJson.keywords || !Array.isArray(packageJson.keywords) || packageJson.keywords.length === 0) {
    console.error('Error: package.json must contain a "keywords" field that is a non-empty array.');
    process.exit(1);
  }

  const allStrings = packageJson.keywords.every(keyword => typeof keyword === 'string');
  if (!allStrings) {
    console.error('Error: all items in the "keywords" array must be strings.');
    process.exit(1);
  }

  console.log('Success: "keywords" in package.json is a non-empty array of strings.');
  process.exit(0);
} catch (error) {
  console.error('Error reading or parsing package.json:', error);
  process.exit(1);
}

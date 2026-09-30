const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);

  if (typeof packageJson.author !== 'string' || packageJson.author.trim() === '') {
    console.error('Error: package.json must contain a non-empty string in the "author" field.');
    process.exit(1);
  }

  console.log('check-package-author: OK');
} catch (error) {
  console.error('Error validating package.json author:', error.message);
  process.exit(1);
}

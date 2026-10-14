const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');

try {
  const packageJsonData = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonData);

  if (!packageJson.scripts || !packageJson.scripts.test || packageJson.scripts.test.trim() === '') {
    console.error('Error: "test" script is missing or empty in package.json.');
    process.exit(1);
  } else {
    console.log('Success: "test" script is defined in package.json.');
  }
} catch (error) {
  console.error('Error reading or parsing package.json:', error.message);
  process.exit(1);
}

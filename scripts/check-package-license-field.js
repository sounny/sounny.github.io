const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
let packageJson;

try {
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  packageJson = JSON.parse(content);
} catch (error) {
  console.error(`Error reading package.json: ${error.message}`);
  process.exit(1);
}

if (!packageJson.license || typeof packageJson.license !== 'string' || packageJson.license.trim() === '') {
  console.error('Error: package.json must have a non-empty "license" field.');
  process.exit(1);
}

console.log('package.json license field check passed.');
process.exit(0);

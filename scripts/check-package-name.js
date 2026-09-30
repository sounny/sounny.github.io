const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
let packageJson;

try {
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  packageJson = JSON.parse(content);
} catch (error) {
  console.error('Error reading package.json:', error.message);
  process.exit(1);
}

let hasError = false;

if (packageJson.name !== 'sounny-personal-website') {
  console.error(`Error: package.json name is '${packageJson.name}', expected 'sounny-personal-website'`);
  hasError = true;
}

if (packageJson.license !== 'MIT') {
  console.error(`Error: package.json license is '${packageJson.license}', expected 'MIT'`);
  hasError = true;
}

if (hasError) {
  process.exit(1);
} else {
  console.log('package.json check passed.');
  process.exit(0);
}

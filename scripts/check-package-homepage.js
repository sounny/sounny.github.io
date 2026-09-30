const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
let packageJson;

try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (err) {
  console.error('Error reading package.json:', err.message);
  process.exit(1);
}

const homepage = packageJson.homepage;

if (!homepage) {
  console.error('Error: package.json is missing the "homepage" field.');
  process.exit(1);
}

if (homepage !== 'https://sounny.github.io' && homepage !== 'https://sounny.github.io/') {
  console.error(`Error: package.json homepage must be "https://sounny.github.io" or "https://sounny.github.io/". Found: "${homepage}"`);
  process.exit(1);
}

console.log('check-package-homepage: homepage is correctly set.');
process.exit(0);

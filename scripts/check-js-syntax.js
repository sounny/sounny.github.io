const { execSync } = require('child_process');
const path = require('path');

try {
  const jsFilePath = path.join(__dirname, '../js/main.js');
  console.log(`Checking syntax for ${jsFilePath}...`);
  execSync(`node --check ${jsFilePath}`, { stdio: 'inherit' });
  console.log('Syntax check passed.');
} catch (error) {
  console.error('Syntax error detected in js/main.js');
  process.exit(1);
}

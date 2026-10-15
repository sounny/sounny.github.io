const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageLockJsonPath = path.resolve(__dirname, '../package-lock.json');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageLockJson = JSON.parse(fs.readFileSync(packageLockJsonPath, 'utf8'));

  let hasError = false;

  if (packageJson.name !== packageLockJson.name) {
    console.error(`Name mismatch: package.json has "${packageJson.name}", but package-lock.json has "${packageLockJson.name}"`);
    hasError = true;
  }

  if (packageJson.version !== packageLockJson.version) {
    console.error(`Version mismatch: package.json has "${packageJson.version}", but package-lock.json has "${packageLockJson.version}"`);
    hasError = true;
  }

  if (hasError) {
    process.exit(1);
  }

  console.log('package.json and package-lock.json match.');
  process.exit(0);

} catch (err) {
  console.error('Error reading package.json or package-lock.json:', err);
  process.exit(1);
}

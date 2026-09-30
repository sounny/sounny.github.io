const fs = require('fs');
const path = require('path');

try {
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  if (!version) {
    console.error('Error: "version" field is missing in package.json.');
    process.exit(1);
  }

  // Official SemVer Regex (https://semver.org/)
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-zA-Z0-9-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-zA-Z0-9-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  if (!semverRegex.test(version)) {
    console.error(`Error: The version "${version}" in package.json is not a valid semantic version.`);
    process.exit(1);
  }

  console.log(`Success: package.json version "${version}" is valid semver.`);
  process.exit(0);
} catch (error) {
  console.error('Error reading or parsing package.json:', error.message);
  process.exit(1);
}

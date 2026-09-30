const fs = require('fs');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const description = packageJson.description;

  if (typeof description !== 'string' || description.trim() === '') {
    console.error('Error: package.json must have a non-empty string "description".');
    process.exit(1);
  }

  console.log('check-package-description: OK');
} catch (err) {
  console.error('Error reading or parsing package.json:', err.message);
  process.exit(1);
}

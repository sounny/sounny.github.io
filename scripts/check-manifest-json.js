const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const manifestJsonPath = path.join(__dirname, '..', 'manifest.json');

try {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  // Check if manifest.json is linked
  const isManifestLinked = indexHtml.includes('manifest.json');

  if (isManifestLinked) {
    if (!fs.existsSync(manifestJsonPath)) {
      console.error('Error: manifest.json is linked in index.html but does not exist.');
      process.exit(1);
    }

    const manifestContent = fs.readFileSync(manifestJsonPath, 'utf8');
    try {
      JSON.parse(manifestContent);
      console.log('Success: manifest.json is valid JSON.');
    } catch (e) {
      console.error('Error: manifest.json contains invalid JSON.');
      console.error(e.message);
      process.exit(1);
    }
  } else {
    console.log('manifest.json is not linked in index.html. Skipping checks.');
  }
} catch (e) {
  console.error('Error reading files:', e.message);
  process.exit(1);
}

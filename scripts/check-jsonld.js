const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
let match;
let foundPerson = false;

while ((match = regex.exec(content)) !== null) {
  try {
    const jsonld = JSON.parse(match[1]);
    if (jsonld['@type'] === 'Person') {
      foundPerson = true;
      if (!jsonld.name) {
        console.error("Error: JSON-LD Person missing 'name'");
        process.exit(1);
      }

      if (!jsonld.url) {
        console.error("Error: JSON-LD Person missing 'url'");
        process.exit(1);
      }

      if (!jsonld.sameAs || !Array.isArray(jsonld.sameAs) || jsonld.sameAs.length === 0) {
        console.error("Error: JSON-LD Person missing 'sameAs' array or it is empty");
        process.exit(1);
      }

      console.log("JSON-LD Person validation passed.");
    }
  } catch (e) {
    console.error("Error parsing JSON-LD: " + e.message);
    process.exit(1);
  }
}

if (!foundPerson) {
  console.error("Error: Could not find application/ld+json block with @type 'Person'");
  process.exit(1);
}

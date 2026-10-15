const fs = require('fs');

try {
  const html = fs.readFileSync('index.html', 'utf8');

  // Regex to match the script tag with type="application/ld+json" and capture its content
  const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i;
  const match = html.match(regex);

  if (!match) {
    console.error('ERROR: index.html is missing a <script type="application/ld+json"> tag.');
    process.exit(1);
  }

  const jsonContent = match[1].trim();

  if (!jsonContent) {
    console.error('ERROR: <script type="application/ld+json"> tag in index.html is empty.');
    process.exit(1);
  }

  try {
    JSON.parse(jsonContent);
    console.log('SUCCESS: index.html contains a valid JSON-LD script.');
    process.exit(0);
  } catch (parseError) {
    console.error('ERROR: The content of <script type="application/ld+json"> in index.html is not valid JSON.', parseError.message);
    process.exit(1);
  }

} catch (error) {
  console.error('ERROR reading index.html:', error);
  process.exit(1);
}

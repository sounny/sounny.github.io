const fs = require('fs');
const path = require('path');

try {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let match;
  let found = false;

  while ((match = h1Regex.exec(html)) !== null) {
    const textContent = match[1];
    if (textContent.toLowerCase().includes('sounny')) {
      found = true;
      break;
    }
  }

  if (found) {
    process.exit(0);
  } else {
    console.error("Error: index.html does not contain an <h1> with 'Sounny'");
    process.exit(1);
  }
} catch (error) {
  console.error('Error checking index.html:', error.message);
  process.exit(1);
}

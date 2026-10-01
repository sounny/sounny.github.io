const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');

try {
  const content = fs.readFileSync(indexPath, 'utf8');
  const regex = /<a\s+[^>]*href\s*=\s*["']privacy\.html["'][^>]*>/i;

  if (!regex.test(content)) {
    console.error('Error: index.html does not contain an anchor href to privacy.html');
    process.exit(1);
  }

  console.log('Success: index.html contains an anchor href to privacy.html');
} catch (error) {
  console.error('Error reading index.html:', error.message);
  process.exit(1);
}

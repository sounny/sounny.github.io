const fs = require('fs');
const path = require('path');

try {
  const content = fs.readFileSync(path.join(__dirname, '../privacy.html'), 'utf8');

  const regex1 = /<link\s+[^>]*rel=["']?stylesheet["']?[^>]*href=["']?[^"'>]*css\/main\.css[^"'>]*["']?[^>]*>/i;
  const regex2 = /<link\s+[^>]*href=["']?[^"'>]*css\/main\.css[^"'>]*["']?[^>]*rel=["']?stylesheet["']?[^>]*>/i;

  if (!regex1.test(content) && !regex2.test(content)) {
    console.error('Error: privacy.html must link stylesheet css/main.css');
    process.exit(1);
  }

  console.log('check-privacy-css-link: Passed');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

function checkMetaDescription() {
  const indexPath = path.join(__dirname, '..', 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('Error: index.html not found.');
    process.exit(1);
  }

  const html = fs.readFileSync(indexPath, 'utf8');

  // Use a regex to find the meta name="description" tag and extract its content
  // Handles single and double quotes, and arbitrary ordering of attributes
  const metaRegex = /<meta\s+(?:[^>]*?\s+)?name=["']description["']\s+(?:[^>]*?\s+)?content=["']([^"']*)["'][^>]*>/i;
  // Handle the case where content is before name
  const metaRegexRev = /<meta\s+(?:[^>]*?\s+)?content=["']([^"']*)["']\s+(?:[^>]*?\s+)?name=["']description["'][^>]*>/i;

  const match = html.match(metaRegex) || html.match(metaRegexRev);

  if (!match) {
    console.error('Error: index.html lacks a meta name="description" tag with a content attribute.');
    process.exit(1);
  }

  const content = match[1].trim();

  if (content === '') {
    console.error('Error: index.html has a meta name="description" tag, but its content is empty.');
    process.exit(1);
  }

  console.log('Success: index.html has a non-empty meta description.');
  process.exit(0);
}

checkMetaDescription();

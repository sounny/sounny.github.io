const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ALLOWLIST = [];

function getHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') {
      continue;
    }
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

test('button elements must have text content, aria-label, aria-labelledby, or title', () => {
  const htmlFiles = getHtmlFiles('.');
  let errors = [];

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = [...content.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];

    for (const match of matches) {
      const attrs = match[1];
      const innerHTML = match[2];

      const text = innerHTML.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '').trim();
      const hasTextContent = text.length > 0;
      const hasAriaLabel = /\baria-label\s*=/i.test(attrs);
      const hasAriaLabelledby = /\baria-labelledby\s*=/i.test(attrs);
      const hasTitle = /\btitle\s*=/i.test(attrs);

      if (!hasTextContent && !hasAriaLabel && !hasAriaLabelledby && !hasTitle) {
        const fullMatch = match[0];
        if (!ALLOWLIST.includes(fullMatch)) {
          errors.push(`File: ${file}\nButton without required text or attributes:\n${fullMatch}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    assert.fail(`Found <button> elements lacking text content or accessibility attributes:\n${errors.join('\n\n')}`);
  }
});

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else {
        const ext = path.extname(file).toLowerCase();
        if (['.html'].includes(ext)) {
          fileList.push(filePath);
        }
    }
  }
  return fileList;
}

function extractAttributes(attrString) {
    const attrs = {};
    const regex = /([a-zA-Z0-9\-_:]+)(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^>\s]+)))?/gi;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
        const name = match[1].toLowerCase();
        const value = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : match[4]);
        attrs[name] = value === undefined ? '' : value;
    }
    return attrs;
}

test('Report a elements with no text, no aria-label, and no img with alt as a failing list', () => {
    const htmlFiles = findHtmlFiles('.');
    let emptyLinks = [];

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const regex = /<a(?:\s([^>]*))?>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
            const attrString = match[1] || '';
            const innerHTML = match[2];
            const attrs = extractAttributes(attrString);

            let hasText = false;
            let hasAlt = false;
            let hasAriaLabel = 'aria-label' in attrs && attrs['aria-label'].trim() !== '';

            const textContent = innerHTML.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').trim();
            if (textContent !== '') {
                hasText = true;
            }

            const imgRegex = /<img\s([^>]+)>/gi;
            let imgMatch;
            while ((imgMatch = imgRegex.exec(innerHTML)) !== null) {
                const imgAttrs = extractAttributes(imgMatch[1]);
                if ('alt' in imgAttrs && imgAttrs.alt.trim() !== '') {
                    hasAlt = true;
                }
            }

            if (!hasText && !hasAriaLabel && !hasAlt) {
                emptyLinks.push({ file, element: `<a ${attrString.trim()}>...</a>` });
            }
        }
    }

    assert.deepStrictEqual(emptyLinks, []);
});

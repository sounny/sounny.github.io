const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

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

test('Check for skip-to-content or skip-navigation links', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const regex = /<a\s([^>]*)>([\s\S]*?)<\/a>/gi;
        let match;
        let hasSkipLink = false;

        while ((match = regex.exec(content)) !== null) {
            const attrString = match[1];
            const innerHTML = match[2];
            const attrs = extractAttributes(attrString);

            if ('href' in attrs && attrs.href && attrs.href.startsWith('#')) {
                const text = innerHTML.replace(/<[^>]+>/g, ' ').toLowerCase();
                if (text.includes('skip')) {
                    hasSkipLink = true;
                    break;
                }
            }
        }

        if (!hasSkipLink) {
            offenders.push(file);
        }
    }

    if (offenders.length > 0) {
        console.warn(`WARNING: The following pages are missing a skip-to-content or skip-navigation link:\n${offenders.join('\n')}`);
    }
});

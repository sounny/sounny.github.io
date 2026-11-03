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

test('Report pages where heading levels skip', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = new Set();

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        const regex = /<h([1-6])\b[^>]*>/gi;
        let match;
        let lastLevel = 0;

        while ((match = regex.exec(html)) !== null) {
            const level = parseInt(match[1], 10);
            if (lastLevel !== 0) {
                if (level > lastLevel + 1) {
                    offenders.add(file);
                }
            } else if (level > 1) {
                // The first heading should ideally be h1.
                // However, skipping from 0 to something >1 could be considered skipping.
                // I will consider first heading > h1 as skipped level.
                // Actually, wait, it says "for example h1 then h3" - maybe it means consecutive headings.
                // What if we only check `lastLevel !== 0`? The instruction says "where heading levels skip (for example h1 then h3)".
                // Let's only trigger skip if lastLevel > 0 and level > lastLevel + 1, OR lastLevel === 0 and level > 1.
                // Let's do level > lastLevel + 1 with lastLevel starting at 0, so h2 as first heading will be a skip.
                if (level > lastLevel + 1) {
                     offenders.add(file);
                }
            }
            lastLevel = level;
        }
    }

    if (offenders.size > 0) {
        console.warn('Warning: The following pages have skipped heading levels:');
        for (const file of Array.from(offenders).sort()) {
            console.warn(`- ${file}`);
        }
    }

    assert.ok(true);
});

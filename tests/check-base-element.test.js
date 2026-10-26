const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');

function findHtmlFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findHtmlFiles(fullPath));
        } else if (fullPath.endsWith('.html')) {
            results.push(fullPath);
        }
    }
    return results;
}

test('Check that HTML files have at most one <base> element', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Check the number of <base> tags (case-insensitive)
        const baseTags = content.match(/<base\b[^>]*>/gi);

        if (baseTags && baseTags.length > 1) {
            // Strip the leading "./" if present
            const normalizedFile = file.startsWith('.' + path.sep) ? file.slice(2) : file;
            offenders.push(normalizedFile);
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found HTML files with more than one <base> element.');
});

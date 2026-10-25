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

const BASELINE_COUNT = 5;

test('Count empty <p> elements in HTML files', () => {
    const htmlFiles = findHtmlFiles('.');
    let emptyPCount = 0;

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        // Regex to find empty p tags: <p ... > \s* </p>
        const matches = content.match(/<p\b[^>]*>\s*<\/p>/gi);
        if (matches) {
            emptyPCount += matches.length;
        }
    }

    assert.ok(
        emptyPCount <= BASELINE_COUNT,
        `Total empty <p> elements count (${emptyPCount}) exceeds the baseline limit of ${BASELINE_COUNT}. Please remove empty <p> elements.`
    );
});

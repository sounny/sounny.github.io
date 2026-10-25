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

const MAX_NOSCRIPT_COUNT = 0;

test('Check that noscript count does not grow', () => {
    const htmlFiles = findHtmlFiles('.');
    let noscriptCount = 0;

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const matches = content.match(/<noscript\b/gi);
        if (matches) {
            noscriptCount += matches.length;
        }
    }

    assert.ok(
        noscriptCount <= MAX_NOSCRIPT_COUNT,
        `Found ${noscriptCount} noscript elements, but baseline is ${MAX_NOSCRIPT_COUNT}. Please do not add more noscript elements.`
    );
});

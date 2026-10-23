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

// The baseline count of HTML files that do not have a <link rel="canonical"> tag.
// Currently only google03d463aa06323fde.html does not have it.
const BASELINE_COUNT = 1;

test('Count of HTML files without <link rel="canonical"> should not grow beyond baseline', () => {
    const htmlFiles = findHtmlFiles('.');
    let missingCount = 0;
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        let hasCanonical = false;

        // Simple regex to find <link> tags and check if they have rel="canonical"
        const linkRegex = /<link\b[^>]*>/gi;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const tag = match[0];
            if (/\brel\s*=\s*(["']?)canonical\1/i.test(tag)) {
                hasCanonical = true;
                break;
            }
        }

        if (!hasCanonical) {
            missingCount++;
            offenders.push(file);
        }
    }

    assert.ok(
        missingCount <= BASELINE_COUNT,
        `Found ${missingCount} HTML files without <link rel="canonical">, which exceeds the baseline of ${BASELINE_COUNT}. Offenders: ${offenders.join(', ')}`
    );
});

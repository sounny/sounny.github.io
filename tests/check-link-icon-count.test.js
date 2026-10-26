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

const CURRENT_COUNT = 1;

test('Count of HTML files without rel="icon" or rel="shortcut icon" does not grow', () => {
    const htmlFiles = findHtmlFiles('.');
    let missingIconCount = 0;
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        let hasIcon = false;

        // Find all <link> tags
        const linkRegex = /<link\b[^>]*>/gi;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const tag = match[0];
            // Check if the <link> tag has rel="icon" or rel="shortcut icon" (case-insensitive)
            if (/\brel\s*=\s*(["']?)(?:shortcut\s+)?icon\1/i.test(tag)) {
                hasIcon = true;
                break;
            }
        }

        if (!hasIcon) {
            missingIconCount++;
            offenders.push(file);
        }
    }

    assert.ok(
        missingIconCount <= CURRENT_COUNT,
        `Found ${missingIconCount} HTML files without a link rel="icon" or "shortcut icon", which exceeds the baseline of ${CURRENT_COUNT}. Offenders: ${offenders.join(', ')}`
    );
});

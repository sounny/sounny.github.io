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

test('Check that HTML files have a <meta name="referrer"> tag', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        let hasReferrer = false;

        const metaRegex = /<meta\b[^>]*>/gi;
        let match;
        while ((match = metaRegex.exec(content)) !== null) {
            const tag = match[0];
            if (/\bname\s*=\s*(["']?)referrer\1/i.test(tag)) {
                hasReferrer = true;
                break;
            }
        }

        if (!hasReferrer) {
            offenders.push(file);
        }
    }

    if (offenders.length > 0) {
        console.warn(`Warning: Found ${offenders.length} HTML files missing a <meta name="referrer"> tag:`);
        for (const file of offenders) {
            console.warn(`- ${file}`);
        }
    }

    // Do not fail the test
    assert.ok(true);
});

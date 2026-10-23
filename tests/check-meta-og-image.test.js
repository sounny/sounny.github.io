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

const MAX_MISSING_OG_IMAGE = 2;

test('Check that HTML files have a <meta property="og:image"> tag', () => {
    const htmlFiles = findHtmlFiles('.');
    let missingCount = 0;
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        let hasOgImage = false;

        const metaRegex = /<meta\b[^>]*>/gi;
        let match;
        while ((match = metaRegex.exec(content)) !== null) {
            const tag = match[0];
            if (/\bproperty\s*=\s*(["']?)og:image\1/i.test(tag)) {
                hasOgImage = true;
                break;
            }
        }

        if (!hasOgImage) {
            missingCount++;
            offenders.push(file);
        }
    }

    assert.ok(
        missingCount <= MAX_MISSING_OG_IMAGE,
        `Found ${missingCount} HTML files without <meta property="og:image">, which exceeds the baseline limit of ${MAX_MISSING_OG_IMAGE}. Offenders:\n${offenders.join('\n')}`
    );
});

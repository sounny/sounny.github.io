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

const ALLOWLIST = [
    'google03d463aa06323fde.html'
];

test('Check that HTML files have a <meta name="viewport"> tag', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        let hasViewport = false;
        let hasViewportScalingDisabled = false;

        // Find all <meta> tags
        const metaRegex = /<meta\b[^>]*>/gi;
        let match;
        while ((match = metaRegex.exec(content)) !== null) {
            const tag = match[0];
            // Check if the <meta> tag has name="viewport" (case-insensitive)
            if (/\bname\s*=\s*(["']?)viewport\1/i.test(tag)) {
                hasViewport = true;
                // Check if user scaling is disabled
                if (/user-scalable\s*=\s*(no|0)(?![.\d])/i.test(tag) || /maximum-scale\s*=\s*1(\.0+)?(?![.\d])/i.test(tag)) {
                    hasViewportScalingDisabled = true;
                }
            }
        }

        if (!hasViewport || hasViewportScalingDisabled) {
            if (!ALLOWLIST.includes(file)) {
                offenders.push(file);
            }
        }
    }

    assert.deepStrictEqual(
        offenders,
        [],
        'Found HTML files without <meta name="viewport"> or with user scaling disabled. Please fix or add to ALLOWLIST in tests/check-meta-viewport.test.js'
    );
});

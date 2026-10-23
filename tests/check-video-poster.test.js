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

// Baseline count for <video> elements without a poster attribute
const BASELINE_COUNT = 0;

test('Check that the count of <video> elements without poster attributes does not increase', () => {
    const htmlFiles = findHtmlFiles('.');
    let missingPosterCount = 0;

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Find all <video> tags
        const videoRegex = /<video\b[^>]*>/gi;
        let match;
        while ((match = videoRegex.exec(content)) !== null) {
            const tag = match[0];
            // Check if the <video> tag has poster attribute (case-insensitive)
            if (!/\bposter\s*=/i.test(tag)) {
                missingPosterCount++;
            }
        }
    }

    assert.ok(
        missingPosterCount <= BASELINE_COUNT,
        `Found ${missingPosterCount} <video> elements without a poster attribute, which is higher than the baseline of ${BASELINE_COUNT}. Please add poster attributes to new <video> elements.`
    );
});

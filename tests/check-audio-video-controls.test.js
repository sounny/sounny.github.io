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

// Baseline count for <audio> and <video> elements without a controls attribute
const BASELINE_COUNT = 0;

test('Check that the count of <audio> and <video> elements without controls attributes does not increase', () => {
    const htmlFiles = findHtmlFiles('.');
    let missingControlsCount = 0;

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Find all <audio> and <video> tags
        const mediaRegex = /<(audio|video)\b[^>]*>/gi;
        let match;
        while ((match = mediaRegex.exec(content)) !== null) {
            const tag = match[0];
            // Check if the tag has the controls attribute (case-insensitive)
            if (!/\bcontrols\b/i.test(tag) && !/\bcontrols\s*=/i.test(tag)) {
                missingControlsCount++;
            }
        }
    }

    assert.ok(
        missingControlsCount <= BASELINE_COUNT,
        `Found ${missingControlsCount} <audio> or <video> elements without a controls attribute, which is higher than the baseline of ${BASELINE_COUNT}. Please add controls attributes to new <audio> and <video> elements.`
    );
});

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

test('Check that HTML files do not increase the number of <audio> or <video> tags with the autoplay attribute', () => {
    const htmlFiles = findHtmlFiles('.');
    let totalAutoplay = 0;

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const regex = /<(audio|video)\b[^>]*\bautoplay\b[^>]*>/gi;
        const matches = content.match(regex);
        if (matches) {
            totalAutoplay += matches.length;
        }
    }

    assert.ok(
        totalAutoplay <= 0,
        `Found ${totalAutoplay} <audio> or <video> elements with autoplay. The limit is 0.`
    );
});

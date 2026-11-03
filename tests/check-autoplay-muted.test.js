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

test('Check <video> and <audio> tags for autoplay without muted', () => {
    const htmlFiles = findHtmlFiles('.');
    let missingMutedCount = 0;
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const regex = /<(video|audio)\b([^>]*)>/gi;
        let match;
        while ((match = regex.exec(content)) !== null) {
            const attributes = match[2];
            const hasAutoplay = /\bautoplay\b/i.test(attributes);
            const hasMuted = /\bmuted\b/i.test(attributes);

            if (hasAutoplay && !hasMuted) {
                missingMutedCount++;
                offenders.push(`${file}: ${match[0]}`);
            }
        }
    }

    assert.ok(
        missingMutedCount === 0,
        `Found ${missingMutedCount} <video> or <audio> tags with autoplay but without muted.\nOffenders:\n${offenders.join('\n')}\nPlease add the muted attribute to autoplaying media elements.`
    );
});

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

const BASELINE_COUNT = 0;

test('Count elements with accesskey attribute in HTML files', () => {
    const htmlFiles = findHtmlFiles('.');
    let accesskeyCount = 0;
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        // Match HTML tags and their attributes
        const tagRegex = /<[a-z0-9-]+(?:\s+[^>]+)?>/gi;
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
            const tagContent = match[0];
            // Isolate attributes to avoid matching tagName or contents incorrectly
            const attrs = tagContent.replace(/^<[a-z0-9-]+/i, '');
            // Check if the tag contains an accesskey attribute
            if (/(?:\s|^)accesskey(?:\s*=|\s*\/?>|\s*$)/i.test(attrs)) {
                accesskeyCount++;
                offenders.push(`${file}: ${tagContent}`);
            }
        }
    }

    assert.ok(
        accesskeyCount <= BASELINE_COUNT,
        `Total elements with accesskey attribute (${accesskeyCount}) exceeds the baseline limit of ${BASELINE_COUNT}. Please do not add accesskey attributes.\nOffenders:\n${offenders.join('\n')}`
    );
});

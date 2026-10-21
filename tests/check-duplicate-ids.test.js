const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

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
];

test('HTML files should not contain duplicate id attributes', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const idRegex = /\bid\s*=\s*(["'])(.*?)\1/gi;
        let match;
        const seenIds = new Set();
        while ((match = idRegex.exec(content)) !== null) {
            const idValue = match[2];
            if (seenIds.has(idValue)) {
                const offenderStr = `${file}#${idValue}`;
                if (!ALLOWLIST.includes(offenderStr)) {
                    offenders.push(offenderStr);
                }
            } else {
                seenIds.add(idValue);
            }
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found duplicate id attributes in HTML files. Please remove duplicates or add to ALLOWLIST in tests/check-duplicate-ids.test.js');
});

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

const ALLOWLIST = [];

test('Check internal anchor links point to existing id or name', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const normalizedFile = file.startsWith('.' + path.sep) ? file.slice(2) : file;
        const content = fs.readFileSync(file, 'utf8');

        const idMatches = [...content.matchAll(/\s+id=(['"])(.*?)\1/gi)].map(m => m[2]);
        const nameMatches = [...content.matchAll(/\s+name=(['"])(.*?)\1/gi)].map(m => m[2]);
        const allIds = new Set([...idMatches, ...nameMatches]);

        const hrefMatches = [...content.matchAll(/\s+href=(['"])(.*?)\1/gi)];
        for (const match of hrefMatches) {
            const href = match[2];
            if (href.startsWith('#') && href.length > 1) {
                const targetId = href.slice(1);
                if (!allIds.has(targetId)) {
                    const offenderStr = normalizedFile + ': ' + href;
                    if (!ALLOWLIST.includes(offenderStr)) {
                        offenders.push(offenderStr);
                    }
                }
            }
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found HTML files with broken internal links. Please fix them or add to ALLOWLIST in tests/check-internal-links.test.js');
});

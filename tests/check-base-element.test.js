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

test('Check that HTML files do not contain a <base> element', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const baseRegex = /<base\b/i;

        if (baseRegex.test(content)) {
            if (!ALLOWLIST.includes(file)) {
                offenders.push(file);
            }
        }
    }

    assert.deepStrictEqual(
        offenders,
        [],
        'Found HTML files containing a <base> element. Please remove them or add to ALLOWLIST in tests/check-base-element.test.js'
    );
});

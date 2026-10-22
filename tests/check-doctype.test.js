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

test('Check that HTML files start with <!DOCTYPE html>', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8').trim();

        if (!/^<!DOCTYPE html>/i.test(content)) {
            if (!ALLOWLIST.includes(file)) {
                offenders.push(file);
            }
        }
    }

    assert.deepStrictEqual(
        offenders,
        [],
        'Found HTML files that do not start with <!DOCTYPE html>. Please add it or add to ALLOWLIST in tests/check-doctype.test.js'
    );
});

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

test('Check that HTML files have exactly one <meta charset="..."> declaration', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        // Strip the leading "./" if present to match the allowlist correctly
        const normalizedFile = file.startsWith('.' + path.sep) ? file.slice(2) : file;

        if (ALLOWLIST.includes(normalizedFile)) {
            continue;
        }

        const content = fs.readFileSync(file, 'utf8');

        const charsetMatches = content.match(/<meta[^>]*\bcharset\b[^>]*>/gi) || [];

        if (charsetMatches.length !== 1) {
            offenders.push(normalizedFile);
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found HTML files missing a single <meta charset="..."> declaration. Please ensure exactly one is present or add to ALLOWLIST in tests/check-meta-charset.test.js');
});

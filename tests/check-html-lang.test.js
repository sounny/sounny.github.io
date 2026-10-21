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
    'google03d463aa06323fde.html'
];

test('<html> element must have a non-empty lang attribute', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const htmlTagMatch = content.match(/<html\b([^>]*)>/i);

        if (htmlTagMatch) {
            const attributes = htmlTagMatch[1];
            const langMatch = attributes.match(/lang\s*=\s*(["'])(.*?)\1/i);

            if (!langMatch || !langMatch[2].trim()) {
                if (!ALLOWLIST.includes(file)) {
                    offenders.push(file);
                }
            }
        } else {
             // also flag if no html tag is found unless allowlisted
             if (!ALLOWLIST.includes(file)) {
                 offenders.push(file);
             }
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found HTML files missing a non-empty lang attribute on the <html> element');
});

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

test('Check for empty or malformed mailto: and tel: links in HTML files', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const normalizedFile = file.startsWith('.' + path.sep) ? file.slice(2) : file;
        const content = fs.readFileSync(file, 'utf8');

        const matches = content.matchAll(/href=(["'])(mailto:|tel:)(.*?)\1/ig);
        for (const match of matches) {
            const protocol = match[2].toLowerCase();
            const value = match[3];

            let isBad = false;
            if (!value || value.trim() === '') {
                isBad = true;
            } else if (protocol === 'mailto:' && !value.includes('@')) {
                isBad = true;
            }

            if (isBad) {
                const offenderStr = `${normalizedFile}: ${match[0]}`;
                if (!ALLOWLIST.includes(offenderStr)) {
                    offenders.push(offenderStr);
                }
            }
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found empty or malformed mailto: or tel: links. Please fix them or add to ALLOWLIST in tests/check-mailto-tel-links.test.js');
});

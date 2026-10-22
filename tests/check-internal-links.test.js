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
    // Format: "file.html: #id"
];

test('Check that local #name links point to existing IDs', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Find all IDs
        const ids = new Set();
        const idRegex = /\bid\s*=\s*(["'])(.*?)\1/gi;
        let match;
        while ((match = idRegex.exec(content)) !== null) {
            ids.add(match[2]);
        }

        // Find all names (acting as anchors)
        const nameRegex = /\bname\s*=\s*(["'])(.*?)\1/gi;
        while ((match = nameRegex.exec(content)) !== null) {
            ids.add(match[2]);
        }

        // Find all local hrefs
        // We only care about href="#something", excluding href="#"
        const hrefRegex = /\bhref\s*=\s*(["'])#([^"'\s]+)\1/gi;
        while ((match = hrefRegex.exec(content)) !== null) {
            const hash = match[2];
            if (!ids.has(hash)) {
                const offender = `${file}: #${hash}`;
                if (!ALLOWLIST.includes(offender)) {
                    offenders.push(offender);
                }
            }
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found href="#name" links that point to an id that does not exist on the same page.');
});

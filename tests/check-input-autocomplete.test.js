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
    // format: "path/to/file.html: <input type='email' ...>"
];

test('Check <input> tags for email/tel types without autocomplete', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const inputRegex = /<input\b[^>]*>/gi;
        let match;
        while ((match = inputRegex.exec(content)) !== null) {
            const tag = match[0];
            const isEmailOrTel = /type\s*=\s*(["']?)(email|tel)\1/i.test(tag);
            if (isEmailOrTel) {
                const hasAutocomplete = /\bautocomplete\b/i.test(tag);
                if (!hasAutocomplete) {
                    const offenderStr = `${file}: ${tag}`;
                    if (!ALLOWLIST.includes(offenderStr)) {
                        offenders.push(offenderStr);
                    }
                }
            }
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found <input type="email" | type="tel"> without autocomplete attribute. Please add an autocomplete attribute or add to ALLOWLIST in tests/check-input-autocomplete.test.js');
});

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

test('Check that any dir attribute in HTML files is ltr, rtl, or auto', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    // Match ' dir=' preceded by whitespace to avoid matching attributes like 'data-dir='
    // Match unquoted values, or single/double quoted values
    const dirRegex = /(?:\s)dir\s*=\s*(?:(["'])([^"'>\s]*)\1|([^"'>\s]+))/gi;
    const validDirs = ['ltr', 'rtl', 'auto'];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        let match;

        while ((match = dirRegex.exec(content)) !== null) {
            // match[2] is the value if quoted, match[3] if unquoted
            const dirValue = (match[2] || match[3] || '').toLowerCase().trim();
            if (!validDirs.includes(dirValue)) {
                offenders.push(`${file}: found invalid dir="${dirValue}"`);
            }
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found HTML files with invalid dir attribute. Must be ltr, rtl, or auto.');
});

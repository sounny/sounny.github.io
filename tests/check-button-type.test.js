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

const ALLOWLIST_COUNT = 7;

test('Check <button> tags for missing type attribute', (t) => {
    const htmlFiles = findHtmlFiles('.');
    let missingTypeCount = 0;
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const buttonRegex = /<button\b([^>]*)>/gi;
        let match;
        while ((match = buttonRegex.exec(content)) !== null) {
            const attributes = match[1];
            if (!/\btype\s*=/i.test(attributes)) {
                missingTypeCount++;
                offenders.push(`${file}: ${match[0]}`);
            }
        }
    }

    assert.ok(missingTypeCount <= ALLOWLIST_COUNT, `Found ${missingTypeCount} <button> tags missing a type attribute, which exceeds the allowlist count of ${ALLOWLIST_COUNT}.\nOffenders:\n${offenders.join('\n')}\nPlease add a type attribute to new <button> tags.`);
});

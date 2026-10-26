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

const MAX_MISSING_NAMES = 0;

test('Count of <input>, <select>, and <textarea> elements inside a <form> without a name attribute does not exceed baseline', () => {
    const htmlFiles = findHtmlFiles('.');
    let totalMissingNames = 0;
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');

        const formRegex = /<form\b[^>]*>([\s\S]*?)<\/form>/gi;
        let formMatch;

        while ((formMatch = formRegex.exec(content)) !== null) {
            const formInner = formMatch[1];

            const elemRegex = /<(input|select|textarea)\b([^>]*)>/gi;
            let elemMatch;
            while ((elemMatch = elemRegex.exec(formInner)) !== null) {
                const attrs = elemMatch[2];

                // Ensure we match "name=" as a standalone attribute, not part of another attribute like "data-name="
                if (!/(?:\s|^)name\s*=/i.test(attrs)) {
                    totalMissingNames++;
                    offenders.push({ file, element: elemMatch[0] });
                }
            }
        }
    }

    assert.ok(
        totalMissingNames <= MAX_MISSING_NAMES,
        `Found ${totalMissingNames} <input>, <select>, or <textarea> elements inside a <form> without a 'name' attribute. The allowed maximum is ${MAX_MISSING_NAMES}. Offenders:\n` +
        offenders.map(o => `  ${o.file}: ${o.element}`).join('\n')
    );
});

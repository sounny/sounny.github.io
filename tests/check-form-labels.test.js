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
];

test('Check input, select, and textarea tags for labels or aria-labels', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        // Match input, select, textarea
        const regex = /<(input|select|textarea)\b[^>]*>/gi;
        let match;

        while ((match = regex.exec(content)) !== null) {
            const tag = match[0];
            const tagName = match[1].toLowerCase();

            // Exclude types that don't need labels
            const typeMatch = /\btype\s*=\s*(["']?)([^"'\s>]+)\1/i.exec(tag);
            const type = typeMatch ? typeMatch[2].toLowerCase() : (tagName === 'input' ? 'text' : null);

            if (tagName === 'input' && ['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) {
                continue; // Skip these types
            }

            const hasAriaLabel = /\baria-label\s*=/i.test(tag);
            const hasAriaLabelledBy = /\baria-labelledby\s*=/i.test(tag);

            const idMatch = /\bid\s*=\s*(["'])(.*?)\1/i.exec(tag);
            const id = idMatch ? idMatch[2] : null;

            let hasLabelFor = false;
            if (id) {
                const labelForRegex = new RegExp(`<label\\b[^>]*\\bfor\\s*=\\s*(["'])${id}\\1`, 'i');
                hasLabelFor = labelForRegex.test(content);
            }

            let isWrappedInLabel = false;
            // Check if the closest preceding label/end-label is a start tag
            const before = content.substring(0, match.index);
            const lastLabelStart = before.lastIndexOf('<label');
            const lastLabelEnd = before.lastIndexOf('</label>');
            if (lastLabelStart > lastLabelEnd) {
                isWrappedInLabel = true;
            }

            if (!hasAriaLabel && !hasAriaLabelledBy && !hasLabelFor && !isWrappedInLabel) {
                const offenderStr = `${file}: ${tag}`;
                if (!ALLOWLIST.includes(offenderStr)) {
                    offenders.push(offenderStr);
                }
            }
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found <input>, <select>, or <textarea> elements with no associated label, aria-label, or aria-labelledby. Please add a label or add to ALLOWLIST in tests/check-form-labels.test.js');
});

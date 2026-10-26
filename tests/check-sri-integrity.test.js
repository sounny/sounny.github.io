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

const MAX_OFFENDERS = 4;

test('Check cross-origin scripts and stylesheets for integrity attribute', () => {
    const htmlFiles = findHtmlFiles('.');
    let count = 0;
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');

        const scriptRegex = /<script\b[^>]*>/gi;
        let match;
        while ((match = scriptRegex.exec(content)) !== null) {
            const tag = match[0];
            const srcMatch = tag.match(/src\s*=\s*["'](https?:\/\/[^"']+|\/\/[^"']+)["']/i);
            if (srcMatch) {
                if (!/\bintegrity\s*=/i.test(tag)) {
                    count++;
                    offenders.push(`${file}: ${tag}`);
                }
            }
        }

        const linkRegex = /<link\b[^>]*>/gi;
        while ((match = linkRegex.exec(content)) !== null) {
            const tag = match[0];
            const isStylesheet = /rel\s*=\s*["']stylesheet["']/i.test(tag);
            if (isStylesheet) {
                const hrefMatch = tag.match(/href\s*=\s*["'](https?:\/\/[^"']+|\/\/[^"']+)["']/i);
                if (hrefMatch) {
                    if (!/\bintegrity\s*=/i.test(tag)) {
                        count++;
                        offenders.push(`${file}: ${tag}`);
                    }
                }
            }
        }
    }

    assert.ok(
        count <= MAX_OFFENDERS,
        `Found ${count} cross-origin scripts/stylesheets without an integrity attribute. This exceeds the baseline of ${MAX_OFFENDERS}. Offenders:\n${offenders.join('\n')}`
    );
});

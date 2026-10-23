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

test('Check for <meta charset="utf-8"> in <head> of HTML files', (t) => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        // Strip the leading "./" if present to match the allowlist correctly
        const normalizedFile = file.startsWith('.' + path.sep) ? file.slice(2) : file;

        if (ALLOWLIST.includes(normalizedFile)) {
            continue;
        }

        const content = fs.readFileSync(file, 'utf8');

        // Find the <head> section
        const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);

        if (!headMatch) {
            // No <head> tag means no meta charset in the head
            offenders.push(normalizedFile);
            continue;
        }

        const headContent = headMatch[1];

        // Check for <meta charset="utf-8">
        const hasMetaCharset = /<meta\s+charset=(["']?)utf-8\1\s*\/?>/i.test(headContent);

        if (!hasMetaCharset) {
            offenders.push(normalizedFile);
            continue;
        }

        const noComments = headContent.replace(/<!--[\s\S]*?-->/g, '');
        const tagMatches = [...noComments.matchAll(/<([a-z0-9\-]+)[^>]*>/gi)];

        let metaCharsetIndex = -1;
        for (let i = 0; i < tagMatches.length; i++) {
            const tagName = tagMatches[i][1].toLowerCase();
            const tagContent = tagMatches[i][0];
            if (tagName === 'meta' && /charset=/i.test(tagContent)) {
                metaCharsetIndex = i;
                break;
            }
        }

        if (metaCharsetIndex >= 5) {
            offenders.push(normalizedFile);
        }
    }

    assert.deepStrictEqual(offenders, [], 'Found HTML files missing <meta charset="utf-8"> in <head> or it is not within the first five elements. Please add the tag or add to ALLOWLIST in tests/check-meta-charset.test.js');
});

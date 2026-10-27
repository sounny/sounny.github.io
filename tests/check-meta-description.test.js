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

test('Check that HTML files have a <meta name="description"> tag', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        let hasDescription = false;

        // Find all <meta> tags
        const metaRegex = /<meta\b[^>]*>/gi;
        let match;
        while ((match = metaRegex.exec(content)) !== null) {
            const tag = match[0];
            // Check if the <meta> tag has name="description" (case-insensitive)
            if (/\bname\s*=\s*(["']?)description\1/i.test(tag)) {
                hasDescription = true;
                break;
            }
        }

        if (!hasDescription) {
            if (!ALLOWLIST.includes(file)) {
                offenders.push(file);
            }
        }
    }

    assert.deepStrictEqual(
        offenders,
        [],
        'Found HTML files without <meta name="description">. Please add it or add to ALLOWLIST in tests/check-meta-description.test.js'
    );
});

test('Check that HTML files do not share identical <meta name="description"> tags', () => {
    const htmlFiles = findHtmlFiles('.');
    const descriptions = new Map();

    for (const file of htmlFiles) {
        if (ALLOWLIST.includes(file)) continue;

        const content = fs.readFileSync(file, 'utf8');
        const metaRegex = /<meta\b[^>]*>/gi;
        let match;
        while ((match = metaRegex.exec(content)) !== null) {
            const tag = match[0];
            if (/\bname\s*=\s*(["']?)description\1/i.test(tag)) {
                const contentMatch = tag.match(/\bcontent\s*=\s*(["'])(.*?)\1/i);
                if (contentMatch) {
                    const desc = contentMatch[2].trim();
                    if (desc) {
                        if (!descriptions.has(desc)) {
                            descriptions.set(desc, []);
                        }
                        descriptions.get(desc).push(file);
                    }
                }
            }
        }
    }

    let identicalCount = 0;
    const duplicatedDescriptions = {};
    for (const [desc, files] of descriptions.entries()) {
        if (files.length > 1) {
            identicalCount += files.length;
            duplicatedDescriptions[desc] = files;
        }
    }

    const MAX_IDENTICAL = 0; // Baseline

    if (identicalCount > MAX_IDENTICAL) {
        console.error('Duplicated descriptions found:');
        console.error(JSON.stringify(duplicatedDescriptions, null, 2));
    }

    assert.ok(
        identicalCount <= MAX_IDENTICAL,
        `Number of pages sharing identical descriptions (${identicalCount}) exceeds the baseline limit of ${MAX_IDENTICAL}.`
    );
});

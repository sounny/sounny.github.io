const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

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

test('Check for <main> element or role="main"', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const hasMainTag = /<main\b/i.test(content);
        const hasRoleMain = /role\s*=\s*(['"]?)main\1/i.test(content);

        if (!hasMainTag && !hasRoleMain) {
            offenders.push(file);
        }
    }

    if (offenders.length > 0) {
        console.warn('WARNING: The following HTML files are missing a <main> element or role="main":');
        offenders.forEach(file => console.warn(`- ${file}`));
    }
});

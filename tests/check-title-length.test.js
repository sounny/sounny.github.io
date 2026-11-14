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

test('Check pages whose <title> text is empty or longer than 70 characters', () => {
    const htmlFiles = findHtmlFiles('.');
    const offenders = [];

    for (const file of htmlFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const titleRegex = /<title[^>]*>([\s\S]*?)<\/title>/gi;
        let match;
        while ((match = titleRegex.exec(content)) !== null) {
            const titleText = match[1].trim();
            if (titleText.length === 0 || titleText.length > 70) {
                offenders.push(`${file}: "${titleText}" (${titleText.length} chars)`);
            }
        }
    }

    if (offenders.length > 0) {
        console.warn('WARNING: The following pages have <title> tags that are empty or longer than 70 characters:');
        offenders.forEach(offender => console.warn(`  - ${offender}`));
    }
});

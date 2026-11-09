const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('Check that robots.txt has a Sitemap line with an absolute https URL', () => {
    const robotsPath = path.resolve(__dirname, '../robots.txt');

    if (!fs.existsSync(robotsPath)) {
        assert.fail('robots.txt not found at the root of the repository');
        return;
    }

    const content = fs.readFileSync(robotsPath, 'utf8');
    const lines = content.split(/\r?\n/);

    let hasValidSitemap = false;

    for (const line of lines) {
        if (/^Sitemap:\s*https:\/\//i.test(line.trim())) {
            hasValidSitemap = true;
            break;
        }
    }

    assert.ok(hasValidSitemap, 'robots.txt must contain a Sitemap line with an absolute https URL');
});

const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert');

test('privacy.html should contain an h1 element', () => {
    const content = fs.readFileSync('privacy.html', 'utf8');
    assert.ok(/<h1\b/i.test(content), 'privacy.html does not contain an h1 element');
});

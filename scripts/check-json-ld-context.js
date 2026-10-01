const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html;
try {
    html = fs.readFileSync(indexPath, 'utf-8');
} catch (err) {
    console.error('Error reading index.html:', err.message);
    process.exit(1);
}

const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
let match;
let foundContext = false;

while ((match = regex.exec(html)) !== null) {
    try {
        const json = JSON.parse(match[1]);
        const context = json['@context'];

        if (context) {
            let hasSchemaOrg = false;
            if (typeof context === 'string') {
                hasSchemaOrg = context.includes('schema.org');
            } else if (Array.isArray(context)) {
                hasSchemaOrg = context.some(item => typeof item === 'string' && item.includes('schema.org'));
            }

            if (hasSchemaOrg) {
                foundContext = true;
                break;
            }
        }
    } catch (e) {
        // Invalid JSON, continue
    }
}

if (!foundContext) {
    console.error('Error: index.html must contain a <script type="application/ld+json"> whose JSON includes "@context" (string or array) with a schema.org URL.');
    process.exit(1);
}

console.log('check-json-ld-context.js: Passed');

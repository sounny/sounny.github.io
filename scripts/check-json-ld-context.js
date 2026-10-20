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

let foundContext = false;
let searchPos = 0;

while (true) {
    const startTag = html.indexOf('<script', searchPos);
    if (startTag === -1) break;

    const endTag = html.indexOf('</script>', startTag);
    if (endTag === -1) break;

    const scriptContentWithTag = html.substring(startTag, endTag);
    const closeBracket = scriptContentWithTag.indexOf('>');

    if (closeBracket !== -1) {
        const tagAttributes = scriptContentWithTag.substring(0, closeBracket);
        // Case insensitive match for type
        const typeMatch = tagAttributes.match(/type\s*=\s*["']application\/ld\+json["']/i);
        if (typeMatch) {
            const jsonText = scriptContentWithTag.substring(closeBracket + 1);
            try {
                const json = JSON.parse(jsonText);
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
    }

    searchPos = endTag + 9;
}

if (!foundContext) {
    console.error('Error: index.html must contain a <script type="application/ld+json"> whose JSON includes "@context" (string or array) with a schema.org URL.');
    process.exit(1);
}

console.log('check-json-ld-context.js: Passed');

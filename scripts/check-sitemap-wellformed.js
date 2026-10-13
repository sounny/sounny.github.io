const fs = require('fs');
const path = require('path');

function isWellFormedXml(xml) {
    const tags = [];
    const tagRegex = /<\/?([a-zA-Z0-9_:-]+)(?:\s+[^>]*)?>/g;
    let match;
    while ((match = tagRegex.exec(xml)) !== null) {
        const fullTag = match[0];
        const tagName = match[1];

        if (fullTag.startsWith('<?') || fullTag.startsWith('<!')) continue;
        if (fullTag.endsWith('/>')) continue;

        if (fullTag.startsWith('</')) {
            if (tags.length === 0 || tags[tags.length - 1] !== tagName) {
                return false;
            }
            tags.pop();
        } else {
            tags.push(tagName);
        }
    }
    return tags.length === 0;
}

function checkSitemap(filename) {
    const filePath = path.join(__dirname, '..', filename);
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (e) {
        console.error(`Error reading ${filename}: ${e.message}`);
        process.exit(1);
    }

    if (!isWellFormedXml(content)) {
        console.error(`Error: ${filename} is not well-formed XML.`);
        process.exit(1);
    }

    if (!content.includes('<loc>')) {
        console.error(`Error: ${filename} does not contain at least one <loc> tag.`);
        process.exit(1);
    }
}

checkSitemap('sitemap.xml');
checkSitemap('sounny_sitemap.xml');
console.log('Both sitemap.xml and sounny_sitemap.xml are well-formed XML with at least one <loc>.');

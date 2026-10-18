const fs = require('fs');
const path = require('path');

const MAX_ALLOWED_STYLES = 33;
const rootDir = process.cwd();

// Find all HTML files in the top-level directory
const htmlFiles = fs.readdirSync(rootDir).filter(file => file.endsWith('.html'));

let totalStylesCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Regular expression to match inline styles: `style="..."` or `style='...'`
    const styleRegex = /style\s*=\s*(["'])(?:(?=(\\?))\2.)*?\1/g;

    const matches = content.match(styleRegex);
    if (matches) {
        totalStylesCount += matches.length;
    }
});

console.log(`Total inline styles found: ${totalStylesCount} (Allowlist: ${MAX_ALLOWED_STYLES})`);

if (totalStylesCount > MAX_ALLOWED_STYLES) {
    console.error(`Error: Found ${totalStylesCount} inline styles, which exceeds the allowlisted limit of ${MAX_ALLOWED_STYLES}. Please do not add new inline styles.`);
    process.exit(1);
} else {
    console.log(`Success: Inline styles count (${totalStylesCount}) is within the allowlisted limit.`);
}

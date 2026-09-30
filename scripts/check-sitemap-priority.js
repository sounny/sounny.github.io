const fs = require('fs');
const path = require('path');

function checkPriority(filePath, isMainSitemap) {
    if (!fs.existsSync(filePath)) {
        if (isMainSitemap) {
            console.error(`Error: ${filePath} does not exist.`);
            process.exit(1);
        }
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const priorityRegex = /<priority>([^<]+)<\/priority>/g;
    let match;
    let count = 0;

    while ((match = priorityRegex.exec(content)) !== null) {
        count++;
        const valStr = match[1].trim();
        const val = Number(valStr);
        if (isNaN(val) || val < 0 || val > 1) {
            console.error(`Error in ${filePath}: invalid priority value '${valStr}'. Must be a number in [0, 1].`);
            process.exit(1);
        }
    }

    if (isMainSitemap && count === 0) {
        console.error(`Error in ${filePath}: must contain at least one <priority> tag.`);
        process.exit(1);
    }

    console.log(`Success: Checked ${count} priority tags in ${path.basename(filePath)}.`);
}

const mainSitemap = path.join(__dirname, '..', 'sitemap.xml');
const secondarySitemap = path.join(__dirname, '..', 'sounny_sitemap.xml');

checkPriority(mainSitemap, true);
checkPriority(secondarySitemap, false);

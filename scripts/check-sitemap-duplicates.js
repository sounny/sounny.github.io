const fs = require('fs');

function checkSitemap(file) {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const regex = /<loc>(.*?)<\/loc>/g;
    let match;
    const locs = new Set();
    while ((match = regex.exec(content)) !== null) {
        const url = match[1];
        if (locs.has(url)) {
            console.error(`Duplicate <loc> found in ${file}: ${url}`);
            process.exit(1);
        }
        locs.add(url);
    }
}

checkSitemap('sitemap.xml');
checkSitemap('sounny_sitemap.xml');

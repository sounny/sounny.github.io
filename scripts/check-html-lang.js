const fs = require('fs');
const path = require('path');

const checkHtmlLang = () => {
    const files = ['index.html', 'privacy.html'];
    let error = false;

    files.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
            console.error(`[check-html-lang] Error: ${file} does not exist.`);
            error = true;
            return;
        }

        const html = fs.readFileSync(filePath, 'utf8');

        const htmlTagMatch = html.match(/<html([^>]*)>/i);

        if (!htmlTagMatch) {
            console.error(`[check-html-lang] Error: No <html> tag found in ${file}.`);
            error = true;
            return;
        }

        const htmlAttributes = htmlTagMatch[1];
        const langMatch = htmlAttributes.match(/\blang=(["'])en\1/i) || htmlAttributes.match(/\blang=en\b/i);

        if (!langMatch) {
            console.error(`[check-html-lang] Error: ${file} does not contain lang="en" in its <html> tag.`);
            error = true;
        }
    });

    if (error) {
        process.exit(1);
    }

    console.log('[check-html-lang] Success: index.html and privacy.html contain lang="en".');
};

checkHtmlLang();

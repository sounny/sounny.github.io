const fs = require('fs');
const path = require('path');

function checkFile(content, filepath) {
    let inString = false;
    let stringChar = '';
    let inBlockComment = false;
    let inLineComment = false;
    let inHtmlComment = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1] || '';
        const prevChar = content[i - 1] || '';

        // Handle transitions out of comments/strings
        if (inBlockComment) {
            if (char === '*' && nextChar === '/') {
                inBlockComment = false;
                i++; // Skip '/'
            }
            continue;
        }

        if (inLineComment) {
            if (char === '\n' || char === '\r') {
                inLineComment = false;
            }
            continue;
        }

        if (inHtmlComment) {
            if (char === '-' && nextChar === '-' && content[i + 2] === '>') {
                inHtmlComment = false;
                i += 2; // Skip '->'
            }
            continue;
        }

        if (inString) {
            if (char === stringChar && prevChar !== '\\') {
                inString = false;
            }
            continue;
        }

        // Handle transitions into comments/strings
        if (char === '/' && nextChar === '*') {
            inBlockComment = true;
            i++;
            continue;
        }

        if (char === '/' && nextChar === '/') {
            inLineComment = true;
            i++;
            continue;
        }

        if (char === '<' && nextChar === '!' && content.slice(i, i + 4) === '<!--') {
            inHtmlComment = true;
            i += 3;
            continue;
        }

        if (char === '"' || char === "'" || char === "`") {
            inString = true;
            stringChar = char;
            continue;
        }

        // Now we are outside strings and comments, check for 'arguments' word
        if (content.slice(i, i + 9) === 'arguments') {
            // Check if it's a standalone word
            const before = prevChar;
            const after = content[i + 9] || '';
            const isWordBoundaryBefore = !(/[a-zA-Z0-9_$]/.test(before));
            const isWordBoundaryAfter = !(/[a-zA-Z0-9_$]/.test(after));

            if (isWordBoundaryBefore && isWordBoundaryAfter) {
                // Check allowlist
                const contextRadius = 40;
                const context = content.slice(Math.max(0, i - contextRadius), Math.min(content.length, i + 9 + contextRadius));
                if (context.includes('function gtag(){dataLayer.push(arguments);}')) {
                    // Allowed
                } else {
                    return { found: true, line: content.slice(0, i).split('\n').length, context: context };
                }
            }
        }
    }
    return { found: false };
}

function scanDirectory(dir) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'tests' && entry.name !== '.git') {
                files = files.concat(scanDirectory(fullPath));
            }
        } else if (entry.isFile()) {
            if (fullPath.endsWith('.js') || fullPath.endsWith('.html') || fullPath.endsWith('.css')) {
                files.push(fullPath);
            }
        }
    }
    return files;
}

if (require.main === module) {
    const rootDir = process.cwd();
    const filesToScan = scanDirectory(rootDir);
    let hasError = false;

    for (const file of filesToScan) {
        const content = fs.readFileSync(file, 'utf8');
        const result = checkFile(content, file);
        if (result.found) {
            console.error(`Error: Found forbidden use of 'arguments' in ${file} at line ${result.line}`);
            console.error(`Context: ...${result.context}...`);
            hasError = true;
        }
    }

    if (hasError) {
        console.error('Please use rest parameters (...args) instead of the implicit arguments object.');
        process.exit(1);
    } else {
        console.log('No forbidden uses of arguments object found.');
        process.exit(0);
    }
}

module.exports = { checkFile };

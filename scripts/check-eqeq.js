const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert');

// Simple tokenizer that skips strings and comments
function tokenize(content) {
    const tokens = [];
    let i = 0;
    while (i < content.length) {
        const char = content[i];

        // Skip strings
        if (char === '"' || char === "'" || char === '`') {
            const quote = char;
            let str = char;
            i++;
            while (i < content.length) {
                if (content[i] === '\\') {
                    str += content[i] + content[i+1];
                    i += 2;
                } else if (content[i] === quote) {
                    str += content[i];
                    i++;
                    break;
                } else {
                    str += content[i];
                    i++;
                }
            }
            continue;
        }

        // Skip single line comments
        if (char === '/' && content[i+1] === '/') {
            let comment = '//';
            i += 2;
            while (i < content.length && content[i] !== '\n') {
                comment += content[i];
                i++;
            }
            continue;
        }

        // Skip multi line comments
        if (char === '/' && content[i+1] === '*') {
            let comment = '/*';
            i += 2;
            while (i < content.length) {
                if (content[i] === '*' && content[i+1] === '/') {
                    comment += '*/';
                    i += 2;
                    break;
                }
                comment += content[i];
                i++;
            }
            continue;
        }

        tokens.push({ type: 'char', value: char, index: i });
        i++;
    }
    return tokens;
}

test('Check for == or != (excluding == null)', () => {
    function walkSync(currentDirPath, callback) {
        fs.readdirSync(currentDirPath).forEach((name) => {
            const filePath = path.join(currentDirPath, name);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
                callback(filePath, stat);
            } else if (stat.isDirectory()) {
                if (!filePath.includes('node_modules') && !filePath.includes('tests') && !filePath.includes('.git') && !filePath.includes('scripts')) {
                    walkSync(filePath, callback);
                }
            }
        });
    }

    const filesToCheck = [];
    walkSync('.', (filePath, stat) => {
        if (filePath.endsWith('.js') || filePath.endsWith('.html')) {
            filesToCheck.push(filePath);
        }
    });

    let foundErrors = false;
    let errors = [];

    // Allowlist for known occurrences
    const allowlist = [
        // example: "js/main.js:42"
    ];

    filesToCheck.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const tokens = tokenize(content);

        for (let i = 0; i < tokens.length; i++) {
            const t1 = tokens[i];

            if (t1.value === '=' || t1.value === '!') {
                let eqCount = 0;
                let j = i;
                while (j < tokens.length && (tokens[j].value === '=' || (j === i && tokens[j].value === '!'))) {
                    if (tokens[j].index === (j === i ? t1.index : tokens[j-1].index + 1)) {
                        eqCount++;
                        j++;
                    } else {
                        break;
                    }
                }

                if (eqCount === 2) { // == or !=
                    const isNotEq = t1.value === '!';
                    const tokenStr = isNotEq ? '!=' : '==';

                    // Check if null is right after
                    const rest = content.substring(tokens[j-1].index + 1);
                    const matchNext = rest.match(/^\s*null\b/);

                    // Check if null is right before
                    const prev = content.substring(0, t1.index);
                    const matchPrev = prev.match(/\bnull\s*$/);

                    let isAllowed = matchNext || matchPrev;

                    if (!isAllowed) {
                        const line = content.substring(0, t1.index).split('\n').length;
                        const allowKey = `${filePath}:${line}`;
                        if (!allowlist.includes(allowKey)) {
                            foundErrors = true;
                            errors.push(`Found ${tokenStr} in ${filePath} on line ${line}`);
                        }
                    }
                }

                // Skip the rest of the equal signs
                if (eqCount > 1) {
                    i = j - 1;
                }
            }
        }
    });

    if (foundErrors) {
        assert.fail(errors.join('\n'));
    }
});

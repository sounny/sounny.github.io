const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

const allowlist = [];

function findEmptyCatchBlocks(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let state = 'NORMAL';
    let i = 0;

    const emptyCatches = [];

    while (i < content.length) {
        const c = content[i];
        const next = content[i + 1];

        if (state === 'NORMAL') {
            if (c === '/' && next === '/') {
                state = 'LINE_COMMENT';
                i += 2;
                continue;
            } else if (c === '/' && next === '*') {
                state = 'BLOCK_COMMENT';
                i += 2;
                continue;
            } else if (c === '<' && next === '!' && content[i+2] === '-' && content[i+3] === '-') {
                state = 'HTML_COMMENT';
                i += 4;
                continue;
            } else if (c === '"') {
                state = 'STRING_DOUBLE';
                i++;
                continue;
            } else if (c === "'") {
                state = 'STRING_SINGLE';
                i++;
                continue;
            } else if (c === '`') {
                state = 'STRING_TEMPLATE';
                i++;
                continue;
            }

            if (c === 'c' && content.substring(i, i + 5) === 'catch') {
                const prev = i > 0 ? content[i - 1] : ' ';
                const nextChar = content[i + 5] || ' ';
                if (!/[a-zA-Z0-9_$]/.test(prev) && !/[a-zA-Z0-9_$]/.test(nextChar)) {
                    let j = i + 5;
                    function skipWhitespaceAndComments() {
                        while (j < content.length) {
                            if (/\s/.test(content[j])) {
                                j++;
                            } else if (content[j] === '/' && content[j+1] === '/') {
                                j += 2;
                                while (j < content.length && content[j] !== '\n') j++;
                            } else if (content[j] === '/' && content[j+1] === '*') {
                                j += 2;
                                while (j < content.length - 1 && !(content[j] === '*' && content[j+1] === '/')) j++;
                                j += 2;
                            } else {
                                break;
                            }
                        }
                    }

                    skipWhitespaceAndComments();

                    if (content[j] === '(') {
                        let openParens = 1;
                        j++;
                        while (j < content.length && openParens > 0) {
                            if (content[j] === '(') openParens++;
                            else if (content[j] === ')') openParens--;
                            j++;
                        }
                        skipWhitespaceAndComments();
                    }

                    if (content[j] === '{') {
                        let blockStart = j;
                        j++;
                        skipWhitespaceAndComments();
                        if (content[j] === '}') {
                            const lines = content.substring(0, i).split('\n');
                            emptyCatches.push({ line: lines.length, index: i });
                        }
                    }
                }
            }
        } else if (state === 'LINE_COMMENT') {
            if (c === '\n') state = 'NORMAL';
        } else if (state === 'BLOCK_COMMENT') {
            if (c === '*' && next === '/') {
                state = 'NORMAL';
                i++;
            }
        } else if (state === 'HTML_COMMENT') {
            if (c === '-' && next === '-' && content[i+2] === '>') {
                state = 'NORMAL';
                i += 2;
            }
        } else if (state === 'STRING_DOUBLE') {
            if (c === '\\') i++;
            else if (c === '"') state = 'NORMAL';
        } else if (state === 'STRING_SINGLE') {
            if (c === '\\') i++;
            else if (c === "'") state = 'NORMAL';
        } else if (state === 'STRING_TEMPLATE') {
            if (c === '\\') i++;
            else if (c === '`') state = 'NORMAL';
        }

        i++;
    }

    return emptyCatches;
}

function walk(dir, done) {
    let results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        let i = 0;
        (function next() {
            let file = list[i++];
            if (!file) return done(null, results);
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    if (!file.includes('node_modules') && !file.includes('tests') && !file.includes('.git')) {
                        walk(file, function(err, res) {
                            results = results.concat(res);
                            next();
                        });
                    } else {
                        next();
                    }
                } else {
                    if (file.endsWith('.js') || file.endsWith('.html')) {
                        results.push(file);
                    }
                    next();
                }
            });
        })();
    });
}

test('no empty catch blocks in site .js and .html files', (t, done) => {
    walk('.', (err, files) => {
        if (err) throw err;

        let hasErrors = false;

        files.forEach(file => {
            const relPath = path.relative('.', file);
            if (allowlist.includes(relPath)) return;

            const emptyCatches = findEmptyCatchBlocks(file);
            if (emptyCatches.length > 0) {
                emptyCatches.forEach(c => {
                    console.error(`Empty catch block found in ${relPath} at line ${c.line}`);
                });
                hasErrors = true;
            }
        });

        assert.ok(!hasErrors, 'Found empty catch blocks. See output for details.');
        done();
    });
});

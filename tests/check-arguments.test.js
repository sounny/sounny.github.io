const test = require('node:test');
const assert = require('node:assert');
const { checkFile } = require('../scripts/check-arguments.js');

test('should find forbidden use of arguments', (t) => {
    const code = `
        function myFunc() {
            console.log(arguments);
        }
    `;
    const result = checkFile(code, 'dummy.js');
    assert.strictEqual(result.found, true);
});

test('should ignore arguments in allowed context', (t) => {
    const code = `
        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXX');
        </script>
    `;
    const result = checkFile(code, 'dummy.html');
    assert.strictEqual(result.found, false);
});

test('should ignore arguments in string', (t) => {
    const code = `
        function myFunc() {
            const str = "the arguments are";
            const str2 = 'the arguments are';
            const str3 = \`the arguments are\`;
        }
    `;
    const result = checkFile(code, 'dummy.js');
    assert.strictEqual(result.found, false);
});

test('should ignore arguments in block comment', (t) => {
    const code = `
        /*
        * Function with arguments
        */
        function myFunc() {
        }
    `;
    const result = checkFile(code, 'dummy.js');
    assert.strictEqual(result.found, false);
});

test('should ignore arguments in line comment', (t) => {
    const code = `
        function myFunc() {
            // These are the arguments
        }
    `;
    const result = checkFile(code, 'dummy.js');
    assert.strictEqual(result.found, false);
});

test('should ignore arguments in html comment', (t) => {
    const code = `
        <!-- These are the arguments -->
        <div></div>
    `;
    const result = checkFile(code, 'dummy.html');
    assert.strictEqual(result.found, false);
});

test('should ignore arguments inside word', (t) => {
    const code = `
        function myFunc(the_arguments) {
            console.log(the_arguments);
        }
    `;
    const result = checkFile(code, 'dummy.js');
    assert.strictEqual(result.found, false);
});

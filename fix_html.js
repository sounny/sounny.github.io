const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// Add role="navigation" to mainNav if missing
if (!html.includes('<nav class="navbar" id="mainNav" role="navigation"')) {
    html = html.replace('<nav class="navbar" id="mainNav">', '<nav class="navbar" id="mainNav" role="navigation" aria-label="Main Navigation">');
}

// Add role="banner" to header if missing
if (!html.includes('<header class="masthead" role="banner"')) {
    html = html.replace('<header class="masthead">', '<header class="masthead" role="banner">');
}

// Add role="main" to main if missing
if (!html.includes('<main role="main"')) {
    html = html.replace('<main>', '<main role="main">');
}

// Add role="contentinfo" to footer if missing
if (!html.includes('<footer class="footer" role="contentinfo"')) {
    html = html.replace('<footer class="footer">', '<footer class="footer" role="contentinfo">');
}

fs.writeFileSync('index.html', html);
console.log('HTML updated');

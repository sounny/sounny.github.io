const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && fs.statSync(f).isFile());

let hasError = false;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const videoRegex = /<video\b([^>]*)>/gi;
  let match;

  while ((match = videoRegex.exec(content)) !== null) {
    const attrs = match[1];
    const hasAutoplay = /\bautoplay\b/i.test(attrs);
    const hasMuted = /\bmuted\b/i.test(attrs);

    if (hasAutoplay && !hasMuted) {
      console.error(`Error in ${file}: <video> tag has 'autoplay' but lacks 'muted' attribute.`);
      hasError = true;
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('check-video-muted.js passed.');
}

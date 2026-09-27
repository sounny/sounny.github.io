const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');

const titleMatch = content.match(/<title>(.*?)<\/title>/);
const ogTitleMatch = content.match(/<meta property="og:title" content="(.*?)" \/>/);
const twitterTitleMatch = content.match(/<meta name="twitter:title" content="(.*?)" \/>/);
const langMatch = content.match(/<html lang="(.*?)">/);

if (!titleMatch) {
  console.error('Error: <title> tag not found.');
  process.exit(1);
}
if (!ogTitleMatch) {
  console.error('Error: <meta property="og:title"> tag not found.');
  process.exit(1);
}
if (!twitterTitleMatch) {
  console.error('Error: <meta name="twitter:title"> tag not found.');
  process.exit(1);
}
if (!langMatch || langMatch[1] !== 'en') {
  console.error('Error: <html lang="en"> not found or invalid.');
  process.exit(1);
}

const title = titleMatch[1];
const ogTitle = ogTitleMatch[1];
const twitterTitle = twitterTitleMatch[1];

if (title !== ogTitle) {
  console.error(`Error: og:title ("${ogTitle}") does not match <title> ("${title}").`);
  process.exit(1);
}

if (title !== twitterTitle) {
  console.error(`Error: twitter:title ("${twitterTitle}") does not match <title> ("${title}").`);
  process.exit(1);
}

console.log('Metadata regression check passed.');

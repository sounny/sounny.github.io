const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

test('sounny_sitemap.xml URLs are in sitemap.xml', () => {
  const sitemapXml = fs.readFileSync('sitemap.xml', 'utf8');
  const sounnySitemapXml = fs.readFileSync('sounny_sitemap.xml', 'utf8');

  const extractUrls = (xml) => {
    const regex = /<loc>(.*?)<\/loc>/g;
    const urls = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
      urls.push(match[1]);
    }
    return urls;
  };

  const sitemapUrls = extractUrls(sitemapXml);
  const sounnySitemapUrls = extractUrls(sounnySitemapXml);

  const allowlist = ['https://sounny.github.io/map/index.html'];

  for (const url of sounnySitemapUrls) {
    if (allowlist.includes(url)) {
      continue;
    }
    assert.ok(sitemapUrls.includes(url), `URL ${url} is missing from sitemap.xml`);
  }
});

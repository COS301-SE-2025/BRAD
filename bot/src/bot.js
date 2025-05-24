require('dotenv').config();
const puppeteer = require('puppeteer');

(async () => {
  const domain = 'http://example.com'; // Hardcoded for Demo 1
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(domain, { waitUntil: 'networkidle2' });

  const content = await page.content();
  console.log(`Scanned content for ${domain}:\n`, content.substring(0, 200)); // preview

  await browser.close();
})();

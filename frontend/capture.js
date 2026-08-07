const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login');

  console.log('Logging in...');
  await page.type('input[type="email"]', 'emp@hrms.com');
  await page.type('input[type="password"]', 'Emp@12345');
  
  // Submit login form - find the button
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0' })
  ]);

  console.log('On dashboard, capturing screenshot...');
  // Force dark mode if we can
  await page.evaluate(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });

  // Give it a second for any animations or state updates
  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.screenshot({ path: 'C:\\Users\\ayush\\.gemini\\antigravity-ide\\brain\\c2155c96-9c1b-45a0-b0fa-78c86a444041\\screenshot.png', fullPage: true });

  console.log('Screenshot saved to artifact folder!');
  await browser.close();
})();

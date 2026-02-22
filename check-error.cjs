const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Listen to console and print errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        } else {
            console.log('BROWSER LOG:', msg.text());
        }
    });

    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
    });

    page.on('requestfailed', request => {
        console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    try {
        await page.goto('http://localhost:5173/inventory/archive', { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('Navigation successful, waiting 2 seconds for any lazy errors...');
        await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
        console.log('Navigation error:', err.message);
    }

    await browser.close();
})();

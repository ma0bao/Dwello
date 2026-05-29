import puppeteer from 'puppeteer';

const BASE_URL = process.argv[2] || 'http://localhost:3000';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function screenshot(page, name, setup) {
  if (setup) await setup(page);
  await delay(800);
  await page.screenshot({ path: `temporary screenshots/screenshot-${name}.png`, fullPage: false });
  console.log(`✓ temporary screenshots/screenshot-${name}.png`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Landing page
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await screenshot(page, '1-landing');

  // 2. Landlord dashboard
  await screenshot(page, '2-landlord', async (p) => {
    await p.evaluate(() => showView('landlord'));
  });

  // 3. Landlord — Properties tab
  await screenshot(page, '3-landlord-properties', async (p) => {
    await p.evaluate(() => landlordSection('properties'));
  });

  // 4. Landlord — Tenants tab
  await screenshot(page, '4-landlord-tenants', async (p) => {
    await p.evaluate(() => landlordSection('tenants'));
  });

  // 5. Landlord — Messaging tab
  await screenshot(page, '5-landlord-messaging', async (p) => {
    await p.evaluate(() => landlordSection('messaging'));
  });

  // 6. Tenant dashboard
  await screenshot(page, '6-tenant', async (p) => {
    await p.evaluate(() => showView('tenant'));
  });

  // 7. Tenant — Messages
  await screenshot(page, '7-tenant-messages', async (p) => {
    await p.evaluate(() => tenantSection('messages'));
  });

  // 8. Tenant — Maintenance modal
  await screenshot(page, '8-tenant-maintenance-modal', async (p) => {
    await p.evaluate(() => {
      tenantSection('maintenance');
      openMaintenanceModal();
    });
  });

  await browser.close();
  console.log('\nAll screenshots saved.');
})();

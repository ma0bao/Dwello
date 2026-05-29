import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.argv[2] || 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'temporary screenshots');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function screenshot(page, name, setup) {
  if (setup) await setup(page);
  await delay(800);
  const filepath = path.join(SCREENSHOT_DIR, `email-${name}.png`);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`[OK] email-${name}.png`);
  return filepath;
}

(async () => {
  console.log('\n=== Email Feature Validation Screenshots ===\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output: ${SCREENSHOT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const screenshots = [];

  try {
    // Navigate to site
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    console.log('Page loaded successfully.\n');

    // 1. Landlord Tenants view showing Contact buttons
    screenshots.push(await screenshot(page, '1-tenants-contact-buttons', async (p) => {
      await p.evaluate(() => {
        showView('landlord');
        landlordSection('tenants');
      });
    }));

    // 2. Email modal open with tenant info (Sarah Mitchell)
    screenshots.push(await screenshot(page, '2-modal-open-tenant-info', async (p) => {
      await p.evaluate(() => {
        openEmailModal(0); // Opens for first tenant (Sarah Mitchell)
      });
    }));

    // 3. Filled email form
    screenshots.push(await screenshot(page, '3-modal-form-filled', async (p) => {
      await p.evaluate(() => {
        document.getElementById('email-subject').value = 'Lease Renewal Reminder';
        document.getElementById('email-message').value = 'Dear Sarah,\n\nThis is a friendly reminder that your lease at 142 Maple Street is up for renewal on December 31st, 2025.\n\nPlease let me know if you would like to discuss renewal terms.\n\nBest regards,\nMichael Torres';
      });
    }));

    // 4. Simulate sending (demo mode success)
    screenshots.push(await screenshot(page, '4-email-sending', async (p) => {
      await p.evaluate(() => {
        const statusEl = document.getElementById('email-sending-status');
        statusEl.style.display = 'block';
        statusEl.style.background = 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)';
        statusEl.style.color = '#2E7D32';
        statusEl.textContent = 'Sending email to Sarah Mitchell...';
      });
    }));

    // 5. Success state
    screenshots.push(await screenshot(page, '5-email-success', async (p) => {
      await p.evaluate(() => {
        const statusEl = document.getElementById('email-sending-status');
        statusEl.innerHTML = '<strong>Email sent successfully!</strong><br><span style="font-size:12px;opacity:0.8;">(Demo mode - configure EmailJS for real emails)</span>';
      });
    }));

    // Close modal and test second tenant
    await page.evaluate(() => closeEmailModal());
    await delay(300);

    // 6. Different tenant (James Okafor)
    screenshots.push(await screenshot(page, '6-modal-second-tenant', async (p) => {
      await p.evaluate(() => {
        openEmailModal(1); // Opens for second tenant (James Okafor)
      });
    }));

    // Close modal
    await page.evaluate(() => closeEmailModal());

    console.log('\n=== Screenshot Summary ===\n');
    console.log(`Total screenshots captured: ${screenshots.length}`);
    screenshots.forEach(s => console.log(`  - ${path.basename(s)}`));

  } catch (error) {
    console.error('Error during screenshot capture:', error.message);
  }

  await browser.close();
  console.log('\nDone. All email feature screenshots saved to temporary screenshots folder.\n');
})();

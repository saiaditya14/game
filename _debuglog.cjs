const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', async (msg) => {
    if (msg.text().includes('DEBUG owner lookup miss')) {
      const args = await Promise.all(msg.args().map((a) => a.jsonValue().catch(() => '<unserializable>')));
      console.log('DEBUG:', JSON.stringify(args));
    }
  });
  page.on('pageerror', (err) => console.log('PAGE EXCEPTION:', err.message));
  await page.addInitScript(() => { try { window.localStorage.clear(); } catch {} });
  await page.goto('http://localhost:5173/game/monopoly', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /CREATE/i }).click();
  const chooseRules = page.getByRole('button', { name: /Choose Rules/i });
  await chooseRules.waitFor({ state: 'visible', timeout: 20000 });
  await chooseRules.click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Begin Quest/i }).click();
  await page.waitForTimeout(1800);

  const rollBtn = page.getByRole('button', { name: /Roll Dice/i });
  await rollBtn.click();
  await page.waitForTimeout(2200);
  const buy = page.getByRole('button', { name: /^Buy \$/i });
  if (await buy.count()) { await buy.click(); await page.waitForTimeout(1000); }

  // grab the actual console object dump
  const dump = await page.evaluate(() => {
    return window.__lastDebug || 'no debug var';
  });
  console.log('DUMP', dump);

  await browser.close();
})();

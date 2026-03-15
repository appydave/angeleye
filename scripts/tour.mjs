/**
 * tour.mjs — headed browser tour of AngelEye (opens on screen)
 * Usage: node scripts/tour.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5050';

const browser = await chromium.launch({ headless: false, slowMo: 700 });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

console.log('Observer...');
await page.goto(BASE_URL);
await page.waitForTimeout(2500);

console.log('Organiser...');
await page.getByText('Organiser').first().click();
await page.waitForTimeout(2000);

// Assign first inbox session
const assign = page.getByText('→ Assign').first();
if (await assign.count() > 0) {
  console.log('Opening assign dropdown...');
  await assign.click();
  await page.waitForTimeout(1200);
  const option = page.getByRole('button').filter({ hasText: /Deckhand|Appydave|AngleEye|FliVideo/ }).first();
  if (await option.count() > 0) {
    console.log('Selecting workspace...');
    await option.click();
    await page.waitForTimeout(1500);
  } else {
    await page.keyboard.press('Escape');
  }
}

// New workspace
console.log('Creating workspace...');
await page.getByText('+ New Workspace').click();
await page.waitForTimeout(800);
await page.getByPlaceholder('Workspace name…').fill('TestWorkspace');
await page.waitForTimeout(600);
await page.keyboard.press('Escape'); // cancel — don't actually create
await page.waitForTimeout(800);

// Settings
console.log('Settings...');
await page.getByText('Settings').first().click();
await page.waitForTimeout(1500);

// Back to Observer
console.log('Back to Observer...');
await page.getByText('Observer').first().click();
await page.waitForTimeout(2000);

console.log('Tour complete — closing browser');
await browser.close();

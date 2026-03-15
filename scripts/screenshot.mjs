/**
 * screenshot.mjs — headless screenshot capture for AngelEye
 * Usage: node scripts/screenshot.mjs [output-dir]
 * Output dir defaults to /tmp/angeleye-screenshots
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:5050';
const OUT_DIR = process.argv[2] ?? '/tmp/angeleye-screenshots';
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

async function snap(name) {
  const p = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: p });
  console.log(`  saved: ${p}`);
}

console.log('AngelEye screenshot tour...');

// Observer
await page.goto(BASE_URL);
await page.waitForTimeout(1500);
await snap('01-observer');

// Organiser
await page.getByText('Organiser').first().click();
await page.waitForTimeout(1500);
await snap('02-organiser');

// Assign dropdown
const assign = page.getByText('→ Assign').first();
if (await assign.count() > 0) {
  await assign.click();
  await page.waitForTimeout(600);
  await snap('03-assign-dropdown');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

// New workspace input
await page.getByText('+ New Workspace').click();
await page.waitForTimeout(500);
await snap('04-new-workspace');
await page.keyboard.press('Escape');

// Settings
await page.getByText('Settings').first().click();
await page.waitForTimeout(800);
await snap('05-settings');

await browser.close();
console.log(`Done — ${OUT_DIR}`);

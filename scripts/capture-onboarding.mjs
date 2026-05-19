// 온보딩 화면만 별도 캡처 (localStorage seed 안 함)
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { resolve } from 'path';

const URL = 'http://localhost:3001';
const OUT = resolve(process.cwd(), 'screenshots');

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 636, height: 1048 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  // localStorage 비우고 → 강제 onboarding
  await page.addInitScript(`localStorage.clear();`);
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/portrait-0-onboarding.png` });
  await ctx.close();
  await browser.close();
  console.log('saved onboarding screenshot');
}
run().catch((e) => { console.error(e); process.exit(1); });

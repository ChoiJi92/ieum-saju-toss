// 앱인토스 콘솔 스크린샷 자동 캡처
// 출력: ./screenshots/ (세로형 636×1048 + 가로형 1504×741)

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { resolve } from 'path';

const URL = 'http://localhost:3001';
const OUT = resolve(process.cwd(), 'screenshots');

// 데모용 명식 — 콘솔 스샷에 노출되므로 본인 이름 X. 중립값 사용.
const mockProfile = {
  id: 'demo-self',
  name: '이음',
  year: 1995,
  month: 3,
  day: 15,
  calendar: 'solar',
  leapMonth: false,
  hour: 10,
  minute: 0,
  gender: 'female',
  relation: '본인',
  isSelf: true,
  createdAt: Date.now(),
};

const seedScript = `
  try {
    localStorage.setItem('ieum-saju.profiles.v2', ${JSON.stringify(JSON.stringify([mockProfile]))});
    localStorage.setItem('ieum-saju.active.v2', ${JSON.stringify(JSON.stringify(mockProfile.id))});
  } catch (e) { console.error('seed failed', e); }
`;

async function gotoHome(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
}

async function clickByText(page, text) {
  const loc = page.getByText(text, { exact: false }).first();
  await loc.waitFor({ state: 'visible', timeout: 8000 });
  await loc.click();
  await page.waitForTimeout(1200);
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  // 세로형 636×1048
  {
    const ctx = await browser.newContext({
      viewport: { width: 636, height: 1048 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.addInitScript(seedScript);

    // 1) Home
    await gotoHome(page);
    await page.screenshot({ path: `${OUT}/portrait-1-home.png` });

    // 2) Today (hero card "자세히 보기")
    try {
      await clickByText(page, '자세히 보기');
      await page.screenshot({ path: `${OUT}/portrait-2-today.png` });
    } catch (e) {
      console.warn('today click failed:', e.message);
    }

    // 3) Saju (re-home, then click)
    await gotoHome(page);
    try {
      await clickByText(page, '내 사주 명식');
      await page.screenshot({ path: `${OUT}/portrait-3-saju.png` });
    } catch (e) {
      console.warn('saju click failed:', e.message);
    }

    // 4) Month (이달의 운세)
    await gotoHome(page);
    try {
      await clickByText(page, '이달의 운세');
      await page.screenshot({ path: `${OUT}/portrait-4-month.png` });
    } catch (e) {
      console.warn('month click failed:', e.message);
    }

    await ctx.close();
  }

  // 가로형 1504×741
  {
    const ctx = await browser.newContext({
      viewport: { width: 1504, height: 741 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.addInitScript(seedScript);
    await gotoHome(page);
    await page.screenshot({ path: `${OUT}/landscape-1-home.png` });
    await ctx.close();
  }

  await browser.close();
  console.log('Saved to', OUT);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

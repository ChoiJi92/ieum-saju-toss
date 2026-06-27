// 앱인토스 콘솔 스크린샷 자동 캡처 — v2 (펫 중심 메인)
// 출력: ./screenshots/ (세로형 636×1048 + 가로형 1504×741)
// 실행: dev 서버(:3000) 켠 뒤  node scripts/capture-screenshots.mjs

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { resolve } from 'path';

const URL = process.env.SHOT_URL || 'http://localhost:3000';
const OUT = resolve(process.cwd(), 'screenshots');

// 데모 명식 — 콘솔에 노출되므로 중립 이름. 1992-07-11 = 황금쥐(土일간+子일지), 히어로로 적합.
const profiles = [
  { id: 'demo-self', name: '이음', year: 1992, month: 7, day: 11, calendar: 'solar', leapMonth: false, gender: 'female', relation: '본인', isSelf: true, createdAt: 1700000000000 },
  { id: 'demo-1', name: '하늘', year: 1985, month: 11, day: 3, calendar: 'solar', leapMonth: false, gender: 'male', relation: '가족', isSelf: false, createdAt: 1700000000001 },
  { id: 'demo-2', name: '바다', year: 1995, month: 5, day: 5, calendar: 'solar', leapMonth: false, gender: 'female', relation: '친구', isSelf: false, createdAt: 1700000000002 },
  { id: 'demo-3', name: '봄', year: 1983, month: 6, day: 30, calendar: 'solar', leapMonth: false, gender: 'female', relation: '연인', isSelf: false, createdAt: 1700000000003 },
];

// 상태 시드: 프로필 4명(도감 풍성) + 정령 성장(게이지 62%) + 스트릭 7일 + 가이드/웰컴 완료
const seedScript = `
  try {
    const today = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); })();
    localStorage.setItem('ieum-saju.profiles.v2', ${JSON.stringify(JSON.stringify(profiles))});
    localStorage.setItem('ieum-saju.active.v2', ${JSON.stringify(JSON.stringify('demo-self'))});
    localStorage.setItem('ieum-saju.spirit.v2', JSON.stringify({
      '언덕쥐': { bond: 248, stage: 2, todayKey: today, gainedToday: 30, actions: { feed: true, pet: false, meditate: false }, bonuses: { fortune: false, attend: true }, adsToday: 0 },
      '노을말': { bond: 60, stage: 1, todayKey: today, gainedToday: 0, actions: { feed: false, pet: false, meditate: false }, bonuses: { fortune: false, attend: false }, adsToday: 0 },
    }));
    localStorage.setItem('ieum-saju.streak.v1', JSON.stringify({ streak: 7, lastDate: today, maxStreak: 7, claimed: [3, 7] }));
    localStorage.setItem('ieum-saju.guide.care.v1', '1');
    localStorage.setItem('ieum-saju.v2-welcome.v1', '1');
  } catch (e) { console.error('seed failed', e); }
`;

async function gotoHome(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
}

async function clickByText(page, text, timeout = 8000) {
  const loc = page.getByText(text, { exact: false }).first();
  await loc.waitFor({ state: 'visible', timeout });
  await loc.click();
  await page.waitForTimeout(1100);
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();

  // ── 세로형 636×1048 ──
  {
    const ctx = await browser.newContext({ viewport: { width: 636, height: 1048 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.addInitScript(seedScript);

    // 1) 펫홈 — 히어로 (황금쥐 + 스트릭 🔥7일 + 게이지 62%)
    await gotoHome(page);
    await page.screenshot({ path: `${OUT}/portrait-1-home.png` });

    // 2) 오늘의 운세 (정령의 한 마디 + 점수)
    try {
      await clickByText(page, '오늘 운세');
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${OUT}/portrait-2-today.png` });
    } catch (e) { console.warn('today failed:', e.message); }

    // 3) 일진 달력
    await gotoHome(page);
    try {
      await clickByText(page, '운세 더보기');
      await clickByText(page, '일진 달력');
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/portrait-3-calendar.png` });
    } catch (e) { console.warn('calendar failed:', e.message); }

    // 4) 도감 (4정령 수집 상태) — 수집된 정령이 보이도록 스크롤
    await gotoHome(page);
    try {
      await clickByText(page, '도감');
      await page.waitForTimeout(800);
      await page.evaluate(() => { const el = document.querySelector('.ie-scroll'); if (el) el.scrollTop = 560; });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${OUT}/portrait-4-collection.png` });
    } catch (e) { console.warn('collection failed:', e.message); }

    await ctx.close();
  }

  // ── 0) 소환 연출 (신규 유저 플로우 — 시드 없이 온보딩 진행) ──
  {
    const ctx = await browser.newContext({ viewport: { width: 636, height: 1048 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await gotoHome(page);
    try {
      await clickByText(page, '정령 깨우러 가기');
      await page.getByPlaceholder('이름').fill('이음');
      const sel = page.locator('select');
      await sel.nth(0).selectOption('1992');
      await sel.nth(1).selectOption('07');
      await sel.nth(2).selectOption('11');
      await page.getByRole('button', { name: '여자' }).click();
      await clickByText(page, '정령 깨우기');
      // 소환 결과(정령 등장)까지 대기 후 캡처
      await page.getByText('만나러 가기', { exact: false }).first().waitFor({ state: 'visible', timeout: 8000 });
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/portrait-0-summon.png` });
    } catch (e) { console.warn('summon failed:', e.message); }
    await ctx.close();
  }

  // ── 가로형 1504×741 — 펫홈 ──
  {
    const ctx = await browser.newContext({ viewport: { width: 1504, height: 741 }, deviceScaleFactor: 1 });
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

// 자미두수 스모크 4분기: 생시있는유저/생시없는유저/홈별칭호/공궁케이스
// 실행: node scripts/test-jamidusu-smoke.mjs  (dev 서버 :3001 필요)
import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';

// ── 공통 헬퍼 ──

const IMAGE_WORDS = ['새싹', '노을', '언덕', '달빛', '이슬'];
const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
const ALL_SPIRIT_STORE = Object.fromEntries(
  IMAGE_WORDS.flatMap((w) => ANIMALS.map((a) => [`${w}${a}`, { bond: 0, stage: 1, hatched: true }]))
);

/**
 * 프로필 + 정령 부화 상태를 localStorage에 심는다.
 * profiles 배열의 첫 번째 항목을 active로 설정.
 */
async function seedUser(page, profile) {
  const profiles = [profile];
  await page.evaluate(({ profiles, spiritStore }) => {
    localStorage.setItem('ieum-saju.profiles.v2', JSON.stringify(profiles));
    localStorage.setItem('ieum-saju.active.v2', JSON.stringify(profiles[0].id));
    localStorage.setItem('ieum-saju.v2-welcome.v1', '1');
    localStorage.setItem('ieum-saju.spirit.v2', JSON.stringify(spiritStore));
  }, { profiles, spiritStore: ALL_SPIRIT_STORE });
}

/**
 * 현재 페이지(홈)에서 운세 더보기 → 자미두수 메뉴 클릭 → 자미두수 화면으로 이동.
 * 이동 후 최대 2000ms 대기.
 */
async function navigateToJamidusu(page) {
  // 운세 더보기 버튼 클릭
  await page.getByText('운세 더보기').first().click();
  await page.waitForTimeout(600);
  // 자미두수 메뉴 항목 클릭 (sub: '내 명궁의 별')
  const jamiBtn = page.getByText('자미두수', { exact: false }).first();
  await jamiBtn.click();
  await page.waitForTimeout(1200);
}

// 오행국 뱃지 텍스트 패턴 (土5국, 水2국, 木3국, 金4국, 火6국)
const BUREAU_RE = /[水木金土火][23456]국/;

let passed = 0;
let failed = 0;
const results = [];

function record(name, ok, detail) {
  if (ok) {
    passed++;
    results.push(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    results.push(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// S1: 생시 있는 유저 — 티저 → 광고 bypass → 결과 확인
// ─────────────────────────────────────────────────────────────────────────────
{
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  const PROFILE_WITH_HOUR = {
    id: 'test-s1', relation: '본인', isSelf: true, createdAt: 1,
    name: '서아', year: 1995, month: 3, day: 15, calendar: 'solar', gender: 'female',
    hour: 10, minute: 0,
  };

  await page.goto(BASE);
  await seedUser(page, PROFILE_WITH_HOUR);
  await page.reload();
  await page.waitForTimeout(800);

  await navigateToJamidusu(page);

  // 티저 화면 확인
  const teaserText = await page.getByText('내 명궁에 어떤 별이 떠 있을까?', { exact: false }).count();
  record('S1-1 티저 텍스트', teaserText > 0);

  // 광고 버튼 클릭 (dev bypass — 바로 결과)
  const adBtn = page.getByText('광고 보고 내 별 보기', { exact: false }).first();
  const adBtnCount = await adBtn.count();
  record('S1-2 광고 버튼 존재', adBtnCount > 0);

  if (adBtnCount > 0) {
    await adBtn.click();
    await page.waitForTimeout(1200);

    // 결과: "을 품은" 히어로 텍스트
    const heroText = await page.getByText('을 품은', { exact: false }).count();
    record('S1-3 결과 히어로 "을 품은"', heroText > 0);

    // 오행국 뱃지 (土5국 etc)
    const allText = await page.locator('body').innerText();
    const bureauOk = BUREAU_RE.test(allText);
    const bureauMatch = allText.match(BUREAU_RE)?.[0] ?? '없음';
    record('S1-4 오행국 뱃지', bureauOk, bureauMatch);

    // 미니 명반: 부처궁/재백궁/관록궁 텍스트 노출
    const spouseCount = await page.getByText('부처궁', { exact: false }).count();
    const wealthCount = await page.getByText('재백궁', { exact: false }).count();
    const careerCount = await page.getByText('관록궁', { exact: false }).count();
    record('S1-5 미니 명반 부처궁', spouseCount > 0);
    record('S1-6 미니 명반 재백궁', wealthCount > 0);
    record('S1-7 미니 명반 관록궁', careerCount > 0);

    // 푸터
    const footerCount = await page.getByText('전체 12궁 명반은 준비 중이에요', { exact: false }).count();
    record('S1-8 푸터', footerCount > 0);
  } else {
    record('S1-3 결과 히어로 "을 품은"', false, '광고 버튼 없어 건너뜀');
    record('S1-4 오행국 뱃지', false, '건너뜀');
    record('S1-5 미니 명반 부처궁', false, '건너뜀');
    record('S1-6 미니 명반 재백궁', false, '건너뜀');
    record('S1-7 미니 명반 관록궁', false, '건너뜀');
    record('S1-8 푸터', false, '건너뜀');
  }

  record('S1-X pageerror 없음', errors.length === 0, errors[0]?.slice(0, 100));
  await page.screenshot({ path: '/tmp/smoke-s1.png' });
  await ctx.close();
  await browser.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// S2: 생시 없는 유저 — 잠금 화면 + 광고 버튼 없음
// ─────────────────────────────────────────────────────────────────────────────
{
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  const PROFILE_NO_HOUR = {
    id: 'test-s2', relation: '본인', isSelf: true, createdAt: 1,
    name: '지훈', year: 1994, month: 3, day: 15, calendar: 'solar', gender: 'male',
    // hour 없음
  };

  await page.goto(BASE);
  await seedUser(page, PROFILE_NO_HOUR);
  await page.reload();
  await page.waitForTimeout(800);

  await navigateToJamidusu(page);

  // 잠금 텍스트 확인
  const lockText = await page.getByText('자미두수는 태어난 시간이 필요해요', { exact: false }).count();
  record('S2-1 잠금 텍스트', lockText > 0);

  const inputLink = await page.getByText('생시 입력하러 가기', { exact: false }).count();
  record('S2-2 생시 입력 링크', inputLink > 0);

  // 광고 버튼 없어야 함
  const adBtn = await page.getByText('광고 보고 내 별 보기', { exact: false }).count();
  record('S2-3 광고 버튼 없음', adBtn === 0, adBtn > 0 ? '광고 버튼이 보임' : undefined);

  record('S2-X pageerror 없음', errors.length === 0, errors[0]?.slice(0, 100));
  await page.screenshot({ path: '/tmp/smoke-s2.png' });
  await ctx.close();
  await browser.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// S3: 홈 별칭호 — 생시 있음: "{alias}을 품은 정령" 노출 / 생시 없음: 해당 텍스트 없음
// ─────────────────────────────────────────────────────────────────────────────
{
  // 3a: 생시 있는 유저 → 홈에서 "을 품은 정령" 노출
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageA = await ctxA.newPage();
  const errorsA = [];
  pageA.on('pageerror', (e) => errorsA.push(String(e)));

  const PROFILE_WITH_HOUR = {
    id: 'test-s3a', relation: '본인', isSelf: true, createdAt: 1,
    name: '서아', year: 1995, month: 3, day: 15, calendar: 'solar', gender: 'female',
    hour: 10, minute: 0,
  };

  await pageA.goto(BASE);
  await seedUser(pageA, PROFILE_WITH_HOUR);
  await pageA.reload();
  await pageA.waitForTimeout(1200);

  const homeBodyA = await pageA.locator('body').innerText();
  const aliasTextA = homeBodyA.match(/을 품은 정령/);
  record('S3a 홈 별칭호 노출 (생시 있음)', aliasTextA !== null);
  record('S3a-X pageerror 없음', errorsA.length === 0, errorsA[0]?.slice(0, 100));
  await pageA.screenshot({ path: '/tmp/smoke-s3a.png' });
  await ctxA.close();

  // 3b: 생시 없는 유저 → 홈에서 "을 품은 정령" 없음
  const ctxB = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pageB = await ctxB.newPage();
  const errorsB = [];
  pageB.on('pageerror', (e) => errorsB.push(String(e)));

  const PROFILE_NO_HOUR = {
    id: 'test-s3b', relation: '본인', isSelf: true, createdAt: 1,
    name: '지훈', year: 1994, month: 3, day: 15, calendar: 'solar', gender: 'male',
  };

  await pageB.goto(BASE);
  await seedUser(pageB, PROFILE_NO_HOUR);
  await pageB.reload();
  await pageB.waitForTimeout(1200);

  const homeBodyB = await pageB.locator('body').innerText();
  const aliasTextB = homeBodyB.match(/을 품은 정령/);
  record('S3b 홈 별칭호 없음 (생시 없음)', aliasTextB === null, aliasTextB ? '텍스트 발견됨' : undefined);
  record('S3b-X pageerror 없음', errorsB.length === 0, errorsB[0]?.slice(0, 100));
  await pageB.screenshot({ path: '/tmp/smoke-s3b.png' });
  await ctxB.close();

  await browser.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// S4: 공궁 케이스 — 1990-01-20 solar, hour=11 (오시) → 차성 배너 확인
// ─────────────────────────────────────────────────────────────────────────────
{
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  const PROFILE_GONGUNG = {
    id: 'test-s4', relation: '본인', isSelf: true, createdAt: 1,
    name: '은하', year: 1990, month: 1, day: 20, calendar: 'solar', gender: 'female',
    hour: 11, minute: 0,
  };

  await page.goto(BASE);
  await seedUser(page, PROFILE_GONGUNG);
  await page.reload();
  await page.waitForTimeout(800);

  await navigateToJamidusu(page);

  // 티저 화면 확인 — 생시 있으므로 티저가 뜸
  const teaserText = await page.getByText('내 명궁에 어떤 별이 떠 있을까?', { exact: false }).count();
  record('S4-1 티저 화면', teaserText > 0);

  // 광고 버튼 클릭 (dev bypass)
  const adBtn = page.getByText('광고 보고 내 별 보기', { exact: false }).first();
  const adBtnCount = await adBtn.count();
  if (adBtnCount > 0) {
    await adBtn.click();
    await page.waitForTimeout(1500);

    // 차성 배너: "명궁이 비어 맞은편 천이궁의 별을 빌려 봐요"
    const borrowedBanner = await page.getByText('빌려 봐요', { exact: false }).count();
    record('S4-2 공궁 차성 배너 "빌려 봐요"', borrowedBanner > 0);

    // 검증용: 실제 배너 텍스트 출력
    if (borrowedBanner === 0) {
      const bodyText = await page.locator('body').innerText();
      const hasLifePalaceSection = bodyText.includes('명궁 — 내 삶의 중심별');
      console.log(`  [S4 debug] 명궁 섹션 있음: ${hasLifePalaceSection}`);
    }
  } else {
    record('S4-2 공궁 차성 배너 "빌려 봐요"', false, '광고 버튼 없어 건너뜀');
  }

  record('S4-X pageerror 없음', errors.length === 0, errors[0]?.slice(0, 100));
  await page.screenshot({ path: '/tmp/smoke-s4.png' });
  await ctx.close();
  await browser.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// 결과 출력
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n자미두수 스모크 결과:');
for (const r of results) console.log(r);
console.log(`\n총계: ${passed}/${passed + failed} PASS`);
if (failed > 0) {
  console.log(`실패 ${failed}건 — 스크린샷: /tmp/smoke-s{1..4}.png`);
  process.exit(1);
}
process.exit(0);

// 궁합 결과 공유 링크 로컬 검증 — T1~T4
import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';

// 두 사람 SharePayload: {v:1, a:{서아 1992-07-11 female}, b:{지훈 1994-03-15 male}}
// encodeShare = base64url(JSON.stringify(payload))
function encodeB64Url(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const SHARE_OBJ = { v: 1, a: { n: '서아', y: 1992, m: 7, d: 11, g: 'female' }, b: { n: '지훈', y: 1994, m: 3, d: 15, g: 'male' } };
const SHARE_PAYLOAD = encodeB64Url(JSON.stringify(SHARE_OBJ));

const PROFILE = [{
  id: 'test-self', relation: '본인', isSelf: true, createdAt: 1,
  name: '서아', year: 1992, month: 7, day: 11, calendar: 'solar', gender: 'female',
}];

const IMAGE_WORDS = ['새싹', '노을', '언덕', '달빛', '이슬'];
const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
const ALL_SPIRIT_STORE = Object.fromEntries(
  IMAGE_WORDS.flatMap((w) => ANIMALS.map((a) => [`${w}${a}`, { bond: 0, stage: 1, hatched: true }]))
);

function seedUser(page) {
  return page.evaluate(({ profiles, spiritStore }) => {
    localStorage.setItem('ieum-saju.profiles.v2', JSON.stringify(profiles));
    localStorage.setItem('ieum-saju.active.v2', JSON.stringify('test-self'));
    localStorage.setItem('ieum-saju.v2-welcome.v1', '1');
    localStorage.setItem('ieum-saju.spirit.v2', JSON.stringify(spiritStore));
  }, { profiles: PROFILE, spiritStore: ALL_SPIRIT_STORE });
}

const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

// 기존 유저 세팅
await page.goto(BASE);
await seedUser(page);

// ── T1: 공유 링크 진입 → 궁합 결과 화면 자동 표시 (두 사람 이름 노출) ──
await page.goto(`${BASE}/?p=${SHARE_PAYLOAD}`);
await page.waitForTimeout(1800);
const p1visible = await page.getByText('서아', { exact: false }).count();
const p2visible = await page.getByText('지훈', { exact: false }).count();
const heartVisible = await page.getByText('♥', { exact: false }).count();
const resultScore = await page.locator('text=/\\d+점/').count();
// 결과 화면: 점수 링 or 이름 쌍 중 하나라도 있으면 결과 표시됨
const t1pass = (p1visible > 0 && p2visible > 0) || heartVisible > 0;
console.log('T1 공유 진입 → 결과 화면:', t1pass ? 'PASS' : 'FAIL (스크린샷 참조)');
console.log(`   p1이름 노출:${p1visible > 0} p2이름 노출:${p2visible > 0} 하트:${heartVisible > 0} 점수링:${resultScore > 0}`);
await page.screenshot({ path: 'reply-cards/_test-share-t1-entry.png' });

// ── T2: 결과 화면의 "결과 공유하기" 버튼 → 클립보드 복사 + decode 일치 ──
await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const shareBtn = page.getByText('결과 공유하기', { exact: false });
const shareBtnCount = await shareBtn.count();
console.log('T2 공유 버튼 존재:', shareBtnCount > 0 ? 'PASS' : 'FAIL');
if (shareBtnCount > 0) {
  await shareBtn.first().click();
  await page.waitForTimeout(800);
  const copyMsg = await page.getByText('복사했어요', { exact: false }).count();
  const sentMsg = await page.getByText('보냈어요', { exact: false }).count();
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  // 클립보드에서 p= 파라미터 추출하고 decode
  const pMatch = clip.match(/[?&]p=([^&\s]+)/);
  let decodeOk = false;
  if (pMatch) {
    try {
      const b64 = pMatch[1].replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(b64);
      const decoded = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      const obj = JSON.parse(decoded);
      decodeOk = obj.v === 1 && obj.a?.n === '서아' && obj.b?.n === '지훈';
    } catch { /* decode 실패 */ }
  }
  console.log('   복사 메시지:', (copyMsg > 0 || sentMsg > 0) ? 'PASS' : 'FAIL');
  console.log('   클립보드 앞80자:', clip.slice(0, 80));
  console.log('   페이로드 decode 일치:', decodeOk ? 'PASS' : 'FAIL');
}
await page.screenshot({ path: 'reply-cards/_test-share-t2-button.png' });

// ── T3: 공유 결과 화면의 "궁합 보러 가기" CTA → 입력 화면 전환 ──
// 다시 공유 링크로 진입 (pendingShare 재설정)
await seedUser(page);
await page.goto(`${BASE}/?p=${SHARE_PAYLOAD}`);
await page.waitForTimeout(1800);
const ctaBtn = page.getByText('궁합 보러 가기', { exact: false });
const ctaCount = await ctaBtn.count();
console.log('T3 "궁합 보러 가기" CTA 존재:', ctaCount > 0 ? 'PASS' : 'FAIL');
if (ctaCount > 0) {
  await ctaBtn.first().click();
  await page.waitForTimeout(800);
  // 입력 화면: "첫 번째" 또는 "두 번째" 또는 "상대" 텍스트
  const inputScreen = await page.getByText('첫 번째', { exact: false }).count()
    + await page.getByText('두 번째', { exact: false }).count();
  console.log('   입력 화면 전환:', inputScreen > 0 ? 'PASS' : 'FAIL (스크린샷 참조)');
}
await page.screenshot({ path: 'reply-cards/_test-share-t3-cta.png' });

// ── T4: 깨진 페이로드 → 크래시 없이 홈 표시 ──
const ctx4 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page4 = await ctx4.newPage();
const errors4 = [];
page4.on('pageerror', (e) => errors4.push(String(e)));
await page4.goto(BASE);
await page4.evaluate(({ profiles, spiritStore }) => {
  localStorage.setItem('ieum-saju.profiles.v2', JSON.stringify(profiles));
  localStorage.setItem('ieum-saju.active.v2', JSON.stringify('test-self'));
  localStorage.setItem('ieum-saju.v2-welcome.v1', '1');
  localStorage.setItem('ieum-saju.spirit.v2', JSON.stringify(spiritStore));
}, { profiles: PROFILE, spiritStore: ALL_SPIRIT_STORE });
await page4.goto(`${BASE}/?p=NOT_VALID_BASE64!!!`);
await page4.waitForTimeout(1500);
const homeVisible4 = await page4.getByText('운세 더보기', { exact: false }).count();
const crashed4 = errors4.length > 0;
console.log('T4 깨진 페이로드:', !crashed4 ? 'PASS 크래시 없음' : `FAIL 에러: ${errors4[0]?.slice(0, 80)}`);
console.log('   홈 표시:', homeVisible4 > 0 ? 'PASS' : '(확인 필요 — 스크린샷 참조)');
await page4.screenshot({ path: 'reply-cards/_test-share-t4-badpayload.png' });
await ctx4.close();

console.log('\n콘솔 에러(T1~T3):', errors.length === 0 ? '없음' : errors.join('\n'));
await browser.close();

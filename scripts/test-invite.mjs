// 궁합 초대 링크 로컬 검증 — 기존 유저 진입 / 초대 버튼 / 신규 유저(온보딩 후 라우팅)
import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';
const PAYLOAD = 'eyJuIjoi7KeA7ZuIIiwieSI6MTk5NCwibSI6MywiZCI6MTUsImciOiJtYWxlIn0'; // 지훈 1994-03-15 male

const PROFILE = [{
  id: 'test-self', relation: '본인', isSelf: true, createdAt: 1,
  name: '서아', year: 1992, month: 7, day: 11, calendar: 'solar', gender: 'female',
}];

// 60갑자 spirit key: imageWord(새싹/노을/언덕/달빛/이슬) × 동물(쥐~돼지)
const IMAGE_WORDS = ['새싹', '노을', '언덕', '달빛', '이슬'];
const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
const ALL_SPIRIT_STORE = Object.fromEntries(
  IMAGE_WORDS.flatMap((w) => ANIMALS.map((a) => [`${w}${a}`, { bond: 0, stage: 1, hatched: true }]))
);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

// 기존 유저 세팅 (프로필 + 웰컴 완료 + 정령 부화 완료)
await page.goto(BASE);
await page.evaluate(({ profiles, spiritStore }) => {
  localStorage.setItem('ieum-saju.profiles.v2', JSON.stringify(profiles));
  localStorage.setItem('ieum-saju.active.v2', JSON.stringify('test-self'));
  localStorage.setItem('ieum-saju.v2-welcome.v1', '1');
  localStorage.setItem('ieum-saju.spirit.v2', JSON.stringify(spiritStore));
}, { profiles: PROFILE, spiritStore: ALL_SPIRIT_STORE });

// ── 테스트 1: 초대 링크 진입 → 궁합 화면 자동 이동 + 상대 프리필 ──
await page.goto(`${BASE}/?p=${PAYLOAD}`);
await page.waitForTimeout(1500);
const banner = await page.getByText('님이 궁합을 요청했어요').count();
const nameVal = await page.locator('input').first().inputValue().catch(() => '');
const p2name = await page.locator('input').nth(1).inputValue().catch(() => '');
const selects = await page.locator('select').all();
const selVals = [];
for (const s of selects) selVals.push(await s.inputValue());
console.log('T1 초대 진입:', banner > 0 ? 'PASS 배너 표시' : 'FAIL 배너 없음');
console.log('   p1 이름:', nameVal, '| p2 이름:', p2name, '| selects:', selVals.join(','));
await page.screenshot({ path: 'reply-cards/_test-invite-entry.png' });

// ── 테스트 2: 일반 진입 → 초대 버튼 → 클립보드 복사 폴백 ──
await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
await page.goto(BASE);
await page.waitForTimeout(800);
// 정령 부화 상태 재확인 후 운세 더보기 → 궁합
await page.evaluate((spiritStore) => {
  localStorage.setItem('ieum-saju.spirit.v2', JSON.stringify(spiritStore));
}, ALL_SPIRIT_STORE);
await page.reload();
await page.waitForTimeout(800);
// 운세 더보기 버튼 클릭 (부화된 홈 화면의 버튼)
await page.getByText('운세 더보기').first().click();
await page.waitForTimeout(600);
// 궁합 항목 클릭: label '궁합' 또는 sub '두 사람 결'
const gunghapBtn = page.getByText('두 사람 결').first();
const gunghapBtnCount = await gunghapBtn.count();
if (gunghapBtnCount === 0) {
  // 폴백: label 텍스트로 시도
  await page.getByText('궁합').first().click();
} else {
  await gunghapBtn.click();
}
await page.waitForTimeout(600);
const inviteBtn = page.getByText('상대방 초대하기');
const btnCount = await inviteBtn.count();
console.log('T2 초대 버튼:', btnCount > 0 ? 'PASS 버튼 존재' : 'FAIL 버튼 없음');
if (btnCount > 0) {
  await inviteBtn.first().click();
  await page.waitForTimeout(800);
  // inviteMsg 텍스트에 '복사' 또는 '보냈' 포함 여부 체크
  const copied = await page.getByText('복사했어요', { exact: false }).count();
  const sentMsg = await page.getByText('보냈어요', { exact: false }).count();
  const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  console.log('   복사 메시지:', (copied > 0 || sentMsg > 0) ? 'PASS' : 'FAIL', '| 클립보드:', clip.slice(0, 80));
}
await page.screenshot({ path: 'reply-cards/_test-invite-button.png' });

// ── 테스트 3: 신규 유저(프로필 없음) 초대 진입 → 온보딩 유지 + 대기 초대 ──
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page2 = await ctx2.newPage();
await page2.goto(`${BASE}/?p=${PAYLOAD}`);
await page2.waitForTimeout(1200);
// 온보딩 화면 고유 텍스트: '직접 입력하기' 또는 '토스로 로그인하기' 또는 '정령이 깃들어 있어요'
const onboarding = await page2.getByText('직접 입력하기').count();
const onboarding2 = await page2.getByText('정령', { exact: false }).count();
const hasOnboarding = onboarding > 0 || onboarding2 > 0;
console.log('T3 신규 유저: 온보딩 표시', hasOnboarding ? 'PASS' : 'FAIL (스크린샷 참조)');
await page2.screenshot({ path: 'reply-cards/_test-invite-newuser.png' });
await ctx2.close();

// ── 테스트 4: 깨진 base64 → 크래시 없이 홈 표시 ──
const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page3 = await ctx3.newPage();
const errors3 = [];
page3.on('pageerror', (e) => errors3.push(String(e)));
await page3.evaluate(({ profiles, spiritStore }) => {
  // 기존 유저로 세팅해야 홈이 뜸
}, { profiles: PROFILE, spiritStore: ALL_SPIRIT_STORE });
// 먼저 기존 유저 상태 세팅
await page3.goto(BASE);
await page3.evaluate(({ profiles, spiritStore }) => {
  localStorage.setItem('ieum-saju.profiles.v2', JSON.stringify(profiles));
  localStorage.setItem('ieum-saju.active.v2', JSON.stringify('test-self'));
  localStorage.setItem('ieum-saju.v2-welcome.v1', '1');
  localStorage.setItem('ieum-saju.spirit.v2', JSON.stringify(spiritStore));
}, { profiles: PROFILE, spiritStore: ALL_SPIRIT_STORE });
await page3.goto(`${BASE}/?p=NOT_VALID_BASE64!!!`);
await page3.waitForTimeout(1200);
const homeVisible3 = await page3.getByText('운세 더보기').count();
const crashed = errors3.length > 0;
console.log('T4 깨진 base64:', !crashed ? 'PASS 크래시 없음' : `FAIL 에러: ${errors3[0]?.slice(0, 80)}`);
console.log('   홈 표시:', homeVisible3 > 0 ? 'PASS' : '(확인 필요 — 스크린샷 참조)');
await page3.screenshot({ path: 'reply-cards/_test-invite-badpayload.png' });
await ctx3.close();

console.log('콘솔 에러:', errors.length === 0 ? '없음' : errors.join('\n'));
await browser.close();

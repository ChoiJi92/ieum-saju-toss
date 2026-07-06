// 자미두수 스모크 4분기: 생시있는유저/생시없는유저/홈별칭호/공궁케이스
// 실행: node scripts/test-jamidusu-smoke.mjs  (dev 서버 :3001 필요)
// Phase 3 갱신: 풀 12궁 그리드 + 바텀시트 + 진태양시 안내 + 푸터 텍스트
import { chromium } from 'playwright';

const BASE = 'http://localhost:3004';

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
 * 고정 sleep 대신 텍스트 visible 기반으로 대기해 플레이키 방지.
 */
async function navigateToJamidusu(page) {
  // 운세 더보기 버튼 클릭
  await page.getByText('운세 더보기').first().click();
  // 자미두수 메뉴가 나타날 때까지 대기
  const jamiBtn = page.getByText('자미두수', { exact: false }).first();
  await jamiBtn.waitFor({ state: 'visible' });
  await jamiBtn.click();
  // 자미두수 화면 랜딩 — 티저 또는 잠금 텍스트 중 하나가 보일 때까지 대기
  await page.getByText(/내 명궁에 어떤 별이 떠 있을까\?|자미두수는 태어난 시간이 필요해요/, { exact: false }).first().waitFor({ state: 'visible' }).catch(() => {});
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
  const ctx = await browser.newContext({ viewport: { width: 375, height: 844 } });
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

    // 그리드 12궁 셀: 셀은 p.name.replace('궁','') 로 렌더 → 축약형 확인
    // cnt===1 조건: 각 궁명이 정확히 한 번만 렌더돼야 중복 렌더 오탐을 막음
    const PALACE_ABBRS = ['명', '형제', '부처', '자녀', '재백', '질액', '천이', '노복', '관록', '전택', '복덕', '부모'];
    let gridCellCount = 0;
    for (const abbr of PALACE_ABBRS) {
      const cnt = await page.getByText(abbr, { exact: true }).count();
      if (cnt === 1) gridCellCount++;
    }
    record('S1-5 그리드 12궁 셀', gridCellCount === 12, `${gridCellCount}/12`);

    // 명궁 카드 밝기 첨자: JamiChartGrid에서 <sub> 태그로만 렌더됨
    // body.innerText()로 잡으면 '리'·'평' 등이 일반 문장에서도 매칭돼 항상 통과하므로
    // <sub> 요소의 innerText만 한정해 검사
    const BRIGHTNESS_GRADES = ['묘', '왕', '득', '리', '평', '불', '함'];
    const subTexts = await page.locator('sub').allInnerTexts();
    const hasBrightness = subTexts.some((t) => BRIGHTNESS_GRADES.includes(t.trim()));
    record('S1-6 명궁 카드 밝기 첨자', hasBrightness, hasBrightness ? undefined : '밝기 등급 텍스트 없음');

    // 복덕 셀 탭 → 바텀시트 "복덕궁" 제목 + 풀이 텍스트 노출
    const bokdeokCell = page.getByText('복덕', { exact: true }).first();
    const bokdeokCount = await bokdeokCell.count();
    if (bokdeokCount > 0) {
      // 시트 열기 전 body 텍스트 스냅샷
      const bodyBefore = await page.locator('body').innerText();
      await bokdeokCell.click();
      // 바텀시트 제목 "복덕궁"이 나타날 때까지 대기
      const sheetTitleLoc = page.getByText('복덕궁', { exact: false }).first();
      await sheetTitleLoc.waitFor({ state: 'visible' }).catch(() => {});
      const sheetTitle = await page.getByText('복덕궁', { exact: false }).count();
      record('S1-7 복덕 바텀시트 제목', sheetTitle > 0);
      // 풀이 텍스트: 시트가 추가한 텍스트 diff > 100자 → 풀이 렌더됨
      // (시트 열기 전 body는 이미 200자 이상이므로 절대 length 기준은 항상 통과 — diff로 판별)
      const bodyAfter = await page.locator('body').innerText();
      const hasProse = bodyAfter.length - bodyBefore.length > 100;
      record('S1-8 복덕 바텀시트 풀이 텍스트', hasProse, hasProse ? undefined : `시트 추가 텍스트 부족(+${bodyAfter.length - bodyBefore.length}자)`);
      // 시트 닫기 — BottomSheet 백드롭(position:fixed, inset:0, zIndex:70)을 클릭
      // (10,10)은 그리드 셀과 겹칠 수 있으므로 백드롭 오버레이를 직접 locator로 잡아 클릭
      const backdrop = page.locator('[style*="rgba(10,7,20"]').first();
      const backdropCount = await backdrop.count();
      if (backdropCount > 0) {
        await backdrop.click({ position: { x: 10, y: 10 } });
      } else {
        await page.keyboard.press('Escape');
      }
      // 시트가 DOM에서 사라질 때까지 대기
      await sheetTitleLoc.waitFor({ state: 'hidden' }).catch(() => {});
    } else {
      record('S1-7 복덕 바텀시트 제목', false, '복덕 셀 없어 건너뜀');
      record('S1-8 복덕 바텀시트 풀이 텍스트', false, '건너뜀');
    }

    // 지금 나의 운 (Phase 4)
    // 실측(2026-07-06): S1 프로필(1995-03-15 female) 렌더 후 사화 라벨 등장 횟수
    //   화록·화권·화과·화기 각 3회 (생년사화 명궁카드 1 + 대한 1 + 올해 1)
    //   → cnt >= 3 = "올해 카드까지 렌더됨" 검증 (>= 2는 생년+대한만으로 통과해 올해 누락 회귀를 못 잡음)
    const nowLuck = await page.getByText('지금 나의 운', { exact: true }).count();
    record('S1-9 지금 나의 운 섹션', nowLuck === 1);
    const bodyNow = await page.locator('body').innerText();
    record('S1-10 대한 헤더 패턴', /\d{1,3}-\d{1,3}세/.test(bodyNow) && /궁 대한/.test(bodyNow));
    record('S1-11 올해 카드 헤더', /\d{4} [가-힣]{2}년/.test(bodyNow) && bodyNow.includes('올해는') && /올해는 [가-힣]+궁 위/.test(bodyNow));
    // 사화 라벨 카운트 — 대한+올해 각 4종 모두 렌더됐는지 확인
    // 각 라벨은 실측 3회 등장(생년사화 명궁카드 1 + 대한 1 + 올해 1) → >= 3: 올해 카드 누락 회귀 검출
    let mutagenRows = 0;
    for (const m of ['화록', '화권', '화과', '화기']) {
      const cnt = (bodyNow.match(new RegExp(m, 'g')) ?? []).length;
      if (cnt >= 3) mutagenRows++;
    }
    record('S1-12 사화 줄 (대한+올해 각 4)', mutagenRows === 4, `${mutagenRows}/4 라벨`);
    record('S1-13 준비중 푸터 제거', !bodyNow.includes('대한(10년 운)은 준비 중'));
  } else {
    record('S1-3 결과 히어로 "을 품은"', false, '광고 버튼 없어 건너뜀');
    record('S1-4 오행국 뱃지', false, '건너뜀');
    record('S1-5 그리드 12궁 셀', false, '건너뜀');
    record('S1-6 명궁 카드 밝기 첨자', false, '건너뜀');
    record('S1-7 복덕 바텀시트 제목', false, '건너뜀');
    record('S1-8 복덕 바텀시트 풀이 텍스트', false, '건너뜀');
    record('S1-9 지금 나의 운 섹션', false, '건너뜀');
    record('S1-10 대한 헤더 패턴', false, '건너뜀');
    record('S1-11 올해 카드 헤더', false, '건너뜀');
    record('S1-12 사화 줄 (대한+올해 각 4)', false, '건너뜀');
    record('S1-13 준비중 푸터 제거', false, '건너뜀');
  }

  record('S1-X pageerror 없음', errors.length === 0, errors[0]?.slice(0, 100));
  await page.screenshot({ path: '/tmp/smoke-s1.png' });
  await ctx.close();
  await browser.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// S2: 생시 없는 유저 — 잠금 화면 → 시진 입력 → 티저 자동 전환
// ─────────────────────────────────────────────────────────────────────────────
{
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 844 } });
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

  const lockSub = await page.getByText('정확하지 않은 계산은 보여드리지 않아요', { exact: false }).count();
  record('S2-2 잠금 부제목', lockSub > 0);

  // 광고 버튼 없어야 함
  const adBtn = await page.getByText('광고 보고 내 별 보기', { exact: false }).count();
  record('S2-3 광고 버튼 없음', adBtn === 0, adBtn > 0 ? '광고 버튼이 보임' : undefined);

  // 새 CTA: 태어난 시간 입력하기
  const inputBtn = page.getByText('태어난 시간 입력하기', { exact: false }).first();
  const inputBtnCount = await inputBtn.count();
  record('S2-4 시간 입력 버튼 존재', inputBtnCount > 0);

  if (inputBtnCount > 0) {
    // 버튼 탭 → 시진 바텀시트 열림
    await inputBtn.click();
    // 진태양시 안내 문구가 보일 때까지 대기
    await page.getByText('진태양시', { exact: false }).first().waitFor({ state: 'visible' }).catch(() => {});

    // S2-5: 시진 시트 진태양시 안내
    const sijinNoteCount = await page.getByText('진태양시', { exact: false }).count();
    record('S2-5 시진 시트 진태양시 안내', sijinNoteCount > 0);

    // S2-6: 시진 목록에서 미시 항목 확인
    const miRow = page.getByText('미시 (13:30~15:30)', { exact: false }).first();
    const miCount = await miRow.count();
    record('S2-6 시진 시트 미시 항목', miCount > 0);

    if (miCount > 0) {
      await miRow.click();
      // updateProfile 후 chart 재계산 → 티저 화면으로 전환될 때까지 대기
      await page.getByText('내 명궁에 어떤 별이 떠 있을까?', { exact: false }).first().waitFor({ state: 'visible' }).catch(() => {});

      // S2-7: 시진 입력 후 티저 전환
      const teaserText = await page.getByText('내 명궁에 어떤 별이 떠 있을까?', { exact: false }).count();
      record('S2-7 시진 입력 후 티저 전환', teaserText > 0);
    } else {
      record('S2-7 시진 입력 후 티저 전환', false, '미시 항목 없어 건너뜀');
    }
  } else {
    record('S2-5 시진 시트 진태양시 안내', false, '입력 버튼 없어 건너뜀');
    record('S2-6 시진 시트 미시 항목', false, '입력 버튼 없어 건너뜀');
    record('S2-7 시진 입력 후 티저 전환', false, '건너뜀');
  }

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
  const ctxA = await browser.newContext({ viewport: { width: 375, height: 844 } });
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
  const ctxB = await browser.newContext({ viewport: { width: 375, height: 844 } });
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
  const ctx = await browser.newContext({ viewport: { width: 375, height: 844 } });
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

    // 차성 배너 없을 때 보조 진단 — record 경유로 결과에 포함
    if (borrowedBanner === 0) {
      const bodyText = await page.locator('body').innerText();
      const hasLifePalaceSection = bodyText.includes('명궁 — 내 삶의 중심별');
      record('S4-2a 명궁 섹션 존재(진단)', hasLifePalaceSection, '차성 배너 없을 때만 체크');
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
// S5: 첫 대한 전 — 어린 프로필은 대한 카드 대신 안내 문구
// 실측: 2024-07-15 solar female → 火6국 (bureau.number=6), 허세 2026-2024+1=3 < 6 → daehan null
// ─────────────────────────────────────────────────────────────────────────────
{
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  // 실측: 2024-07-15 → 火6국, 허세 3세 < 6 → 첫 대한 전
  // ⚠️ 2024년생은 2029년(허세 6)에 첫 대한 진입 → 그해 S5 프로필 재조정 필요
  const PROFILE_KID = {
    id: 'test-s5', relation: '본인', isSelf: true, createdAt: 1,
    name: '아름', year: 2024, month: 7, day: 15, calendar: 'solar', gender: 'female',
    hour: 10, minute: 0,
  };

  await page.goto(BASE);
  await seedUser(page, PROFILE_KID);
  await page.reload();
  await page.waitForTimeout(800);
  await navigateToJamidusu(page);

  const adBtn = page.getByText('광고 보고 내 별 보기', { exact: false }).first();
  if ((await adBtn.count()) > 0) {
    await adBtn.click();
    await page.waitForTimeout(1500);
    const body5 = await page.locator('body').innerText();
    record('S5-1 첫 대한 전 안내', body5.includes('아직 첫 대한이 시작되기 전'));
    record('S5-2 올해 카드는 표시', body5.includes('올해는'));
    record('S5-3 대한 헤더 없음', !/\d{1,3}-\d{1,3}세/.test(body5));
  } else {
    record('S5-1 첫 대한 전 안내', false, '광고 버튼 없어 건너뜀');
    record('S5-2 올해 카드는 표시', false, '건너뜀');
    record('S5-3 대한 헤더 없음', false, '건너뜀');
  }

  record('S5-X pageerror 없음', errors.length === 0, errors[0]?.slice(0, 100));
  await page.screenshot({ path: '/tmp/smoke-s5.png' });
  await ctx.close();
  await browser.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// S6: 대한·유년 같은 천간 — 올해 카드 사화 4행 대신 이어짐 문구 (P5-A)
// 프로필: 1974-03-15 男 10시 — 2026(병오년) 현재 대한 46-55세 관록궁, 대한궁 천간=병 (유년 천간과 충돌)
// ⚠️ 유년 천간이 바뀌는 2027년(정미년)엔 이 프로필은 충돌이 아님 → 그해 충돌 프로필 재선정 필요
//    재선정 시 제약: 명궁에 생년사화 별이 앉지 않는 프로필이어야 함 (앉으면 기준 카운트 2→3으로 깨짐)
// ─────────────────────────────────────────────────────────────────────────────
{
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 844 } });
  const page = await ctx.newPage();
  const errors6 = [];
  page.on('pageerror', (e) => errors6.push(String(e)));

  const PROFILE_S6 = {
    id: 'test-s6', relation: '본인', isSelf: true, createdAt: 1,
    name: '준혁', year: 1974, month: 3, day: 15, calendar: 'solar', gender: 'male',
    hour: 10, minute: 0,
  };

  await page.goto(BASE);
  await seedUser(page, PROFILE_S6);
  await page.reload();
  await page.waitForTimeout(800);
  await navigateToJamidusu(page);

  const adBtn = page.getByText('광고 보고 내 별 보기', { exact: false }).first();
  const adBtnCount = await adBtn.count();
  if (adBtnCount > 0) {
    await adBtn.click();
    await page.waitForTimeout(1500);
    const body6 = await page.locator('body').innerText();

    record('S6-1 이어짐 문구', body6.includes('대한과 똑같아요'), body6.includes('대한과 똑같아요') ? '' : '병오년(2026)이 지났다면 S6 충돌 프로필 재선정 필요');
    record('S6-2 대한 카드 정상', /\d{1,3}-\d{1,3}세/.test(body6) && /궁 대한/.test(body6));
    let dedupRows = 0;
    for (const m of ['화록', '화권', '화과', '화기']) {
      const cnt = (body6.match(new RegExp(m, 'g')) ?? []).length;
      if (cnt === 2) dedupRows++; // 생년사화 그리드센터 1 + 대한 1; 올해 행 제거됨 (3이면 dedupe 미적용, 1이면 대한 카드 누락)
    }
    record('S6-3 올해 사화 행 제거', dedupRows === 4, `${dedupRows}/4 라벨`);
  } else {
    record('S6-1 이어짐 문구', false, '광고 버튼 없어 건너뜀');
    record('S6-2 대한 카드 정상', false, '건너뜀');
    record('S6-3 올해 사화 행 제거', false, '건너뜀');
  }

  record('S6-X pageerror 없음', errors6.length === 0, errors6[0]?.slice(0, 100));
  await page.screenshot({ path: '/tmp/smoke-s6.png' });
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
  console.log(`실패 ${failed}건 — 스크린샷: /tmp/smoke-s{1..6}.png`);
  process.exit(1);
}
process.exit(0);

#!/usr/bin/env node
/**
 * 정밀 리포트 결제 복구 흐름 로컬 테스트.
 *
 * 실제 결제 없이 "결제는 됐는데 지급이 안 끝난 주문"을 만들어, 화면이 그걸 제대로
 * 주워 담고 토스에 지급 확정을 알리는지 본다. 이걸 안 만들어두고 실기기로만 확인하다
 * 990원을 두 번 태웠다. 그 버그(지급 확정 누락)는 여기서 잡혔어야 했다.
 *
 *   node scripts/test-report-iap.mjs           dev 서버(:3001) 켜둔 채로 실행
 *   TEST_URL=http://localhost:3000 node ...    포트 변경
 *
 * 동작 원리
 * - DevTools 목이 window.__ait 로 상태를 노출한다. iap.pendingOrders 에 주문을 심으면
 *   IAP.getPendingOrders() 가 그걸 돌려준다.
 * - 목의 completeProductGrant 는 pendingOrders 에서 해당 주문을 제거한다.
 *   그래서 "배열이 비었는가"로 지급 확정이 불렸는지 알 수 있다.
 * - 서버는 전부 가로챈다. AI 호출도 결제도 일어나지 않는다.
 */
import { chromium } from 'playwright';

// 전역 URL 생성자를 가리지 않도록 이름을 따로 쓴다.
const BASE_URL = process.env.TEST_URL || 'http://localhost:3001';
const SKU = 'ait.0000032205.c5c5ad40.783ba55c34.7928202033';
const ORDER_KEY = (pid) => `ieum-saju.report.orderId.v2:${pid}`;
const BODY_KEY = (pid) => `ieum-saju.report.body.v2:${pid}`;

const PROFILE_A = 'test-a';
const PROFILE_B = 'test-b';

const profiles = [
  { id: PROFILE_A, name: '가나다', year: 1992, month: 5, day: 13, calendar: 'solar', leapMonth: false, gender: 'male', relation: '본인', isSelf: true, createdAt: 1700000000000 },
  { id: PROFILE_B, name: '라마바', year: 1988, month: 3, day: 2, calendar: 'solar', leapMonth: false, gender: 'female', relation: '가족', isSelf: false, createdAt: 1700000000001 },
];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, authorization, apikey',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};
const CH1 = '## 1. 조각이 맞물리는 자리\n\n테스트 본문입니다.\n\n> 한 문장.\n';
const CH2 = '## 2. 그 구조가 시기와 만나면\n\n테스트 본문입니다.\n\n> 한 문장.\n';

/** 서버 호출을 전부 가로채고, 무엇이 불렸는지 기록한다. */
async function stubServer(page, { report, grantStatus = 200, generateStatus = 200 }) {
  const calls = { grant: [], generate: [], fetch: [] };
  await page.route('**/report/grant', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    calls.grant.push(JSON.parse(route.request().postData() || '{}'));
    const st = Array.isArray(grantStatus)
      ? (grantStatus[calls.grant.length - 1] ?? grantStatus[grantStatus.length - 1])
      : grantStatus;
    const ok = st === 200;
    await route.fulfill({
      status: st,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: ok ? '{"ok":true}' : '{"error":"NOT_PAID","reason":"ORDER_IN_PROGRESS"}',
    });
  });
  await page.route('**/report/generate', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const body = JSON.parse(route.request().postData() || '{}');
    calls.generate.push(body);
    if (generateStatus !== 200) {
      return route.fulfill({ status: generateStatus, headers: { ...CORS, 'content-type': 'application/json' }, body: '{"error":"GENERATION_FAILED"}' });
    }
    await route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'text/plain; charset=utf-8' }, body: body.chapter === 2 ? CH2 : CH1 });
  });
  await page.route('**/report/fetch**', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const orderId = new URL(route.request().url()).searchParams.get('orderId');
    calls.fetch.push(orderId);
    const r = report(orderId);
    if (!r) return route.fulfill({ status: 404, headers: { ...CORS, 'content-type': 'application/json' }, body: '{"error":"NOT_FOUND"}' });
    await route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(r) });
  });
  return calls;
}

function seed({ activeId, orders = {}, bodies = {}, pending = [] }) {
  // localStorage 시드는 한 번만. 알을 깨운 뒤 새로고침해도 지워지지 않아야 한다.
  // pendingOrders 는 메모리라 매 로드마다 다시 심는다.
  return `
  if (!localStorage.getItem('__test_seeded')) {
    localStorage.clear();
    localStorage.setItem('__test_seeded', '1');
    localStorage.setItem('ieum-saju.profiles.v2', ${JSON.stringify(JSON.stringify(profiles))});
    localStorage.setItem('ieum-saju.active.v2', ${JSON.stringify(JSON.stringify(activeId))});
    localStorage.setItem('ieum-saju.v2-welcome.v1', '1');
    localStorage.setItem('ieum-saju.guide.care.v1', '1');
    (function(){
      var d = new Date();
      var today = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      var sp = {}; sp['언덕쥐'] = { bond: 248, stage: 2, todayKey: today, gainedToday: 30,
        actions:{feed:true,pet:false,meditate:false}, bonuses:{fortune:false,attend:true}, adsToday:0 };
      localStorage.setItem('ieum-saju.spirit.v2', JSON.stringify(sp));
    })();
    ${Object.entries(orders).map(([pid, oid]) => `localStorage.setItem(${JSON.stringify(ORDER_KEY(pid))}, ${JSON.stringify(oid)});`).join('\n')}
    ${Object.entries(bodies).map(([pid, b]) => `localStorage.setItem(${JSON.stringify(BODY_KEY(pid))}, ${JSON.stringify(JSON.stringify(b))});`).join('\n')}
  }
    (function(){
      var want = ${JSON.stringify(pending)};
      if (!want.length) return;
      // DevTools 목이 준비된 뒤에 심어야 한다. 상태 싱글턴이 생길 때까지 짧게 기다린다.
      var tries = 0;
      var t = setInterval(function(){
        var st = window.__ait;
        if (st && st.patch) {
          st.patch('iap', { pendingOrders: want });
          clearInterval(t);
        } else if (++tries > 100) clearInterval(t);
      }, 20);
    })();
  `;
}

/**
 * 알 상태면 홈에 메뉴가 없다. 정령 이름은 프로필마다 다르므로 미리 심을 수 없어,
 * 세 가지 교감을 직접 눌러 깨운다. 어떤 명식이든 통한다.
 */
async function hatchIfNeeded(page) {
  const menu = page.getByText('운세 더보기', { exact: false }).first();
  if (await menu.isVisible().catch(() => false)) return;
  for (const label of ['먹이주기', '쓰다듬기', '명상하기']) {
    const btn = page.getByText(label, { exact: false }).first();
    if (!(await btn.isVisible().catch(() => false))) continue;
    await btn.click();
    await page.waitForTimeout(1200);
  }
  // 부화가 끝나면 "첫 운세 듣기" 화면에 멈춘다. 새로고침하면 평소 홈으로 들어간다.
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
}

async function openReport(page, settleMs = 2500) {
  await hatchIfNeeded(page);
  await page.getByText('운세 더보기', { exact: false }).first().click({ timeout: 15000 });
  await page.waitForTimeout(700);
  await page.getByText('정밀 리포트', { exact: false }).first().click();
  // 402 재시도처럼 몇 초 걸리는 경로가 있어 시나리오마다 다르게 준다.
  await page.waitForTimeout(settleMs);
}

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? '✓' : '✗'} ${name}${detail ? `\n      ${detail}` : ''}`);
}

const browser = await chromium.launch();

async function scenario(title, { activeId, orders, bodies, pending, report, grantStatus, generateStatus, settleMs }, assert) {
  console.log(`\n━━ ${title} ━━`);
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 } });
  const page = await ctx.newPage();
  // 처리되지 않은 Promise 거부는 웹뷰에서 조용히 쌓이다가 SDK 브리지를 흔든다.
  // 실제로 결제 시트가 멈춘 원인이었으므로 시나리오마다 지켜본다.
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(`pageerror: ${e}`));
  // 미처리 Promise 거부는 pageerror 로 오지 않는다. 페이지 안에서 직접 받아 모은다.
  await page.addInitScript(`
    window.__unhandled = [];
    window.addEventListener('unhandledrejection', function (e) {
      window.__unhandled.push(String(e && e.reason));
    });
  `);
  const calls = await stubServer(page, { report, grantStatus, generateStatus });
  await page.addInitScript(seed({ activeId, orders, bodies, pending }));
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2200);
  await openReport(page, settleMs);
  const state = await page.evaluate(() => ({
    pending: (window.__ait?.state?.iap?.pendingOrders ?? []).map((o) => o.orderId),
    body: document.body.innerText,
    unhandled: window.__unhandled ?? [],
  }));
  pageErrors.push(...state.unhandled.map((u) => `unhandledrejection: ${u}`));
  await assert({ calls, state, page, pageErrors });
  check('떠도는 오류가 없다', pageErrors.length === 0, pageErrors.slice(0, 2).join(' | '));
  await ctx.close();
}

const pendingOrder = (orderId) => ({ orderId, sku: SKU, paymentCompletedDate: '2026-08-29T00:00:00Z' });

// ── 1. 저장본 없이 미지급 주문만 있을 때 ────────────────────────────
await scenario('미지급 주문 회수 — 저장본 없음', {
  activeId: PROFILE_A,
  pending: [pendingOrder('pend-1')],
  report: () => null,                       // 서버에 아직 기록 없음
}, ({ calls, state }) => {
  check('grant 를 불렀다', calls.grant.some((g) => g.orderId === 'pend-1'),
    `grant=${JSON.stringify(calls.grant.map((g) => g.orderId))}`);
  check('지급 확정을 알렸다 (pendingOrders 비었음)', state.pending.length === 0,
    `남은 pending=${JSON.stringify(state.pending)}`);
  check('생성을 걸었다', calls.generate.some((g) => g.orderId === 'pend-1'),
    `generate=${JSON.stringify(calls.generate.map((g) => `${g.orderId}#${g.chapter}`))}`);
});

// ── 2. 저장본이 있는데 새 미지급 주문이 생겼을 때 (오늘의 버그) ──────
await scenario('미지급 주문 회수 — 저장본이 이미 있음', {
  activeId: PROFILE_A,
  orders: { [PROFILE_A]: 'old-1' },
  bodies: { [PROFILE_A]: { orderId: 'old-1', ch1: CH1, ch2: CH2 } },
  pending: [pendingOrder('new-2')],
  report: () => null,
}, ({ state }) => {
  check('새 주문의 지급 확정을 알렸다', state.pending.length === 0,
    `남은 pending=${JSON.stringify(state.pending)} — 확정을 안 하면 다음 결제가 막힌다`);
  check('저장본을 그대로 보여준다', state.body.includes('조각이 맞물리는 자리'));
});

// ── 3. 다른 프로필의 주문은 건드리지 않는다 ─────────────────────────
await scenario('다른 프로필이 찜한 주문은 안 집는다', {
  activeId: PROFILE_A,
  orders: { [PROFILE_B]: 'b-owned' },       // B 가 자기 것으로 적어둠
  pending: [pendingOrder('b-owned')],
  report: () => null,
}, ({ calls, state }) => {
  check('B 의 주문으로 grant 하지 않았다', !calls.grant.some((g) => g.orderId === 'b-owned'),
    `grant=${JSON.stringify(calls.grant.map((g) => g.orderId))}`);
  check('B 의 주문을 확정하지도 않았다', state.pending.includes('b-owned'),
    `남은 pending=${JSON.stringify(state.pending)}`);
  check('A 는 목차 화면이다', state.body.includes('990원'), state.body.slice(0, 80));
});

// ── 4. 프로필을 바꾸면 앞사람 리포트가 안 보인다 ────────────────────
await scenario('프로필 전환 — 앞사람 리포트가 안 보인다', {
  activeId: PROFILE_B,
  orders: { [PROFILE_A]: 'a-1' },
  bodies: { [PROFILE_A]: { orderId: 'a-1', ch1: CH1, ch2: CH2 } },
  report: () => null,
}, ({ state }) => {
  check('B 에게 목차와 결제 버튼이 뜬다', state.body.includes('990원'), state.body.slice(0, 120));
  check('A 의 본문이 안 보인다', !state.body.includes('테스트 본문'));
});

// ── 5. 이미 산 사람은 결제 버튼을 다시 안 본다 ──────────────────────
await scenario('재진입 — 결제 버튼이 스치지 않는다', {
  activeId: PROFILE_A,
  orders: { [PROFILE_A]: 'a-1' },
  bodies: { [PROFILE_A]: { orderId: 'a-1', ch1: CH1, ch2: CH2 } },
  report: () => null,
}, ({ calls, state }) => {
  check('990원 버튼이 없다', !state.body.includes('990원'), state.body.slice(0, 120));
  check('본문이 보인다', state.body.includes('테스트 본문'));
  check('서버에 묻지 않았다 (캐시로 끝)', calls.fetch.length === 0,
    `fetch=${JSON.stringify(calls.fetch)}`);
});


// ── 6. 결제 검증이 실패했을 때 (결제 직후 토스가 아직 진행 중이라고 답하는 경우) ──
await scenario('결제 검증 실패 — 402', {
  activeId: PROFILE_A,
  pending: [pendingOrder('pend-402')],
  report: () => null,
  grantStatus: 402,
  settleMs: 13000,
}, ({ state }) => {
  check('실패 화면으로 떨어진다', state.body.includes('만들지 못했어요'), state.body.slice(0, 120));
  check('다시 시도 버튼이 있다', state.body.includes('다시 시도'));
  check('결제가 남아 있다고 안내한다', state.body.includes('결제는 그대로'));
  // 여기서 지급 확정을 안 하면 미지급으로 남아 다음 결제가 막힌다.
  check('지급 확정은 하지 않는다 (아직 우리 것이 아님)', state.pending.includes('pend-402'),
    `남은 pending=${JSON.stringify(state.pending)}`);
});

// ── 7. 서버가 아직 만드는 중일 때 ───────────────────────────────────
await scenario('서버가 생성 중 — 대기 화면으로 붙는다', {
  activeId: PROFILE_A,
  orders: { [PROFILE_A]: 'gen-1' },
  report: () => ({
    status: 'generating', content: null, content_1: null, content_2: null,
    profile_name: '가나다', completed_at: null,
    generating_since: new Date().toISOString(),
  }),
}, ({ calls, state }) => {
  check('대기 화면이 뜬다', state.body.includes('걸려요') || state.body.includes('읽고 있어요'),
    state.body.slice(0, 120));
  check('중복 생성을 걸지 않는다', calls.generate.length === 0,
    `generate=${JSON.stringify(calls.generate.map((g) => `${g.orderId}#${g.chapter}`))}`);
});

// ── 8. 죽은 채로 남은 생성 작업을 이어받는다 ────────────────────────
await scenario('생성이 죽어 있으면 이어받는다', {
  activeId: PROFILE_A,
  orders: { [PROFILE_A]: 'stale-1' },
  report: () => ({
    status: 'generating', content: null, content_1: null, content_2: null,
    profile_name: '가나다', completed_at: null,
    generating_since: new Date(Date.now() - 10 * 60 * 1000).toISOString(),   // 10분 전
  }),
}, ({ calls, state }) => {
  check('생성을 다시 건다', calls.generate.some((g) => g.orderId === 'stale-1'),
    `generate=${JSON.stringify(calls.generate.map((g) => `${g.orderId}#${g.chapter}`))}`);
  check('본문이 나온다', state.body.includes('테스트 본문'));
});

// ── 9. 지난번 생성이 실패로 끝난 경우 ───────────────────────────────
await scenario('실패로 끝난 주문은 자동 재생성하지 않는다', {
  activeId: PROFILE_A,
  orders: { [PROFILE_A]: 'failed-1' },
  report: () => ({
    status: 'failed', content: null, content_1: null, content_2: null,
    profile_name: '가나다', completed_at: null, generating_since: null,
  }),
}, ({ calls, state }) => {
  check('토큰을 자동으로 태우지 않는다', calls.generate.length === 0,
    `generate=${JSON.stringify(calls.generate.map((g) => `${g.orderId}#${g.chapter}`))}`);
  check('사람이 정하도록 실패 화면을 보여준다', state.body.includes('다시 시도'), state.body.slice(0, 120));
});

// ── 10. 1장만 있고 2장이 없는 경우 ──────────────────────────────────
await scenario('2장이 없으면 이어서 만든다', {
  activeId: PROFILE_A,
  orders: { [PROFILE_A]: 'half-1' },
  report: () => ({
    status: 'partial', content: null, content_1: CH1, content_2: null,
    profile_name: '가나다', completed_at: null, generating_since: null,
  }),
}, ({ calls, state }) => {
  check('1장을 바로 보여준다', state.body.includes('조각이 맞물리는 자리'));
  check('2장 생성을 건다', calls.generate.some((g) => g.chapter === 2),
    `generate=${JSON.stringify(calls.generate)}`);
});


// ── 11. 402 가 잠깐 났다가 풀리는 경우 (진짜 결제인데 토스 반영이 늦을 때) ──
await scenario('402 가 잠깐 났다가 풀리면 회복한다', {
  activeId: PROFILE_A,
  pending: [pendingOrder('slow-1')],
  report: () => null,
  grantStatus: [402, 200],        // 첫 시도만 실패
  settleMs: 9000,
}, ({ calls, state }) => {
  check('다시 물어봤다', calls.grant.length >= 2, `grant 호출 ${calls.grant.length}회`);
  check('실패 화면을 안 보여준다', !state.body.includes('만들지 못했어요'), state.body.slice(0, 100));
  check('본문까지 나온다', state.body.includes('테스트 본문'));
  check('지급 확정도 됐다', state.pending.length === 0, `남은 pending=${JSON.stringify(state.pending)}`);
});


// ── 12. 실제 결제 버튼을 눌렀을 때 ──────────────────────────────────
await scenario('결제 흐름 — 떠도는 거부 없이 끝난다', {
  activeId: PROFILE_A,
  report: () => null,
  settleMs: 6000,
}, async ({ calls, state, page, pageErrors }) => {
  // 목차에서 결제 버튼을 누른다. DevTools 목이 결제를 성공으로 흉내낸다.
  await page.getByText('990원으로 전부 읽기', { exact: false }).first().click();
  await page.waitForTimeout(6000);   // 타이머(2.5초)가 지나고도 조용해야 한다
  const after = await page.evaluate(() => document.body.innerText);
  pageErrors.push(...(await page.evaluate(() => window.__unhandled ?? [])).map((u) => `unhandledrejection: ${u}`));
  check('결제 후 본문이 나온다', after.includes('테스트 본문'), after.slice(0, 100));
  check('grant 가 불렸다', calls.grant.length >= 1, `grant=${calls.grant.length}회`);
  check('타이머가 지난 뒤에도 떠도는 거부가 없다', pageErrors.length === 0,
    pageErrors.slice(0, 3).join(' | '));
});

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n─────────────────────────`);
console.log(`${results.length - failed.length}/${results.length} 통과`);
process.exit(failed.length ? 1 : 0);

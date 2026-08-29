/**
 * 스레드/SNS 댓글 리플용 정령 티저 카드 생성기.
 *
 * 사용법:
 *   npx tsx scripts/make-reply-card.ts 1994-03-15
 *   npx tsx scripts/make-reply-card.ts 1994-03-15 --time 14 --lunar --name 지훈
 *   npx tsx scripts/make-reply-card.ts 1994-03-15 1988-11-02 2001-07-30   # 배치
 *   npx tsx scripts/make-reply-card.ts --open                              # 여는 글용 카드
 *
 * 출력: reply-cards/YYYY-MM-DD-정령이름.png (1080×1350, 4:5)
 *
 * 설계 의도 — "1화 무료" 티저:
 *   보여주는 것: 아기 정령 + 이름 + 일주/희소성 한 줄
 *   가리는 것: 진화형(실루엣/?), 오늘·하반기 운세, 궁합 → 앱 인입 훅
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { computeMyeongsik } from '../src/lib/saju';
import { spiritFromMyeongsik, STAGE_LABEL, type Spirit } from '../src/lib/spirit';

const ROOT = resolve(import.meta.dirname, '..');
const OUT_DIR = resolve(ROOT, 'reply-cards');

// 한자 → 한글 (60갑자 일주를 '계사일주'처럼 표기)
const STEM_KO: Record<string, string> = { 甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무', 己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계' };
const BRANCH_KO: Record<string, string> = { 子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해' };
// 오행 → 쉬운 한글 표현
const ELEM_FRIENDLY: Record<string, string> = { wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물' };
// 한글 → 한자 역매핑 (--ilju 병인 처럼 일주만 아는 댓글용)
const STEM_FROM_KO = Object.fromEntries(Object.entries(STEM_KO).map(([h, k]) => [k, h]));
const BRANCH_FROM_KO = Object.fromEntries(Object.entries(BRANCH_KO).map(([h, k]) => [k, h]));

// ── CLI 파싱 ─────────────────────────────────────────────
type Job = { year: number; month: number; day: number; hour?: number; lunar: boolean; leap: boolean; name?: string; ilju?: string };

function parseArgs(argv: string[]): Job[] {
  const dates: string[] = [];
  let hour: number | undefined;
  let lunar = false;
  let leap = false;
  let name: string | undefined;
  let ilju: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--time') hour = Number(argv[++i]);
    else if (a === '--lunar') lunar = true;
    else if (a === '--leap') leap = true;
    else if (a === '--name') name = argv[++i];
    else if (a === '--ilju') ilju = argv[++i].replace(/일주$/, '');
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(a)) dates.push(a);
    else console.warn(`무시된 인자: ${a}`);
  }
  if (!dates.length && !ilju) {
    console.error('사용법: npx tsx scripts/make-reply-card.ts YYYY-MM-DD [--time HH] [--lunar] [--leap] [--name 닉네임] | --ilju 병인');
    process.exit(1);
  }
  // 일주만 아는 케이스 — 생일 없이 일주에서 바로 정령 산출 (날짜는 루프에서 역탐색)
  if (!dates.length && ilju) {
    if (!STEM_FROM_KO[ilju[0]] || !BRANCH_FROM_KO[ilju[1]]) {
      console.error(`일주 해석 불가: ${ilju} (예: --ilju 병인)`);
      process.exit(1);
    }
    return [{ year: 0, month: 0, day: 0, lunar: false, leap: false, name, ilju }];
  }
  return dates.map((d) => {
    const [y, m, dd] = d.split('-').map(Number);
    return { year: y, month: m, day: dd, hour, lunar, leap: lunar && leap, name };
  });
}

// ── 카드 HTML ─────────────────────────────────────────────
function rarityLine(s: Spirit): { badge: string; hook: string } {
  switch (s.rarity.key) {
    case 'legend': return { badge: `전설 ${'✦'.repeat(4)}`, hook: `60갑자 중 단 ${s.rarity.pct}만 타고나는 천을귀인 일주` };
    case 'spirit': return { badge: `영물 ${'✦'.repeat(3)}`, hook: `단 ${s.rarity.pct}만 타고나는 괴강 일주` };
    case 'rare':   return { badge: `희귀 ${'✦'.repeat(2)}`, hook: `${s.rarity.pct}만 타고나는 기운 강한 일주` };
    default:       return { badge: '일반 ✦', hook: '진화시키면 이야기가 달라지는 정령' };
  }
}


/**
 * 여는 글용 카드 — 특정인이 아니라 "당신은 어느 쪽인가"를 묻는다.
 *
 * 답글 카드와 같은 세계관을 쓰되, 개인 정보가 없으니 다섯 계열을 나란히 세운다.
 * 링크도 등급 설명도 넣지 않는다. 댓글을 달게 만드는 것이 이 카드의 유일한 일이다.
 */
const OPEN_ELEMENTS = [
  { prefix: '새싹', ko: '새싹', vibe: '시작과 생명력', color: '#7EE0A0' },
  { prefix: '노을', ko: '노을', vibe: '열정과 표현', color: '#FF9E82' },
  { prefix: '언덕', ko: '언덕', vibe: '안정과 신뢰', color: '#FFD27A' },
  { prefix: '달빛', ko: '달빛', vibe: '결단과 세련', color: '#D6D9E0' },
  { prefix: '이슬', ko: '이슬', vibe: '지혜와 유연함', color: '#7BA8FF' },
];
const OPEN_PICKS = ['용', '호랑이', '소', '뱀', '토끼'];

function openCardHtml(): string {
  const cells = OPEN_ELEMENTS.map((e, i) => `
    <div class="ocell">
      <img src="file://${resolve(ROOT, 'public', 'spirits')}/${e.prefix}${OPEN_PICKS[i]}/${e.prefix}${OPEN_PICKS[i]}-01-아기.png" alt="">
      <div class="oname" style="color:${e.color}">${e.ko}</div>
      <div class="ovibe">${e.vibe}</div>
    </div>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Apple SD Gothic Neo', Pretendard, sans-serif; }
  #card {
    width:1080px; height:1350px; position:relative; overflow:hidden; color:#F3EEFF;
    background: linear-gradient(180deg, #2A2046 0%, #1E1635 55%, #14101F 100%);
    display:flex; flex-direction:column; align-items:center; text-align:center;
    padding:96px 60px 48px;
  }
  .stars { position:absolute; inset:0; pointer-events:none; }
  .stars i { position:absolute; border-radius:50%; background:#fff; }
  .brand { font-size:29px; font-weight:800; letter-spacing:7px; color:#B79CFF; }
  .head { margin-top:30px; font-size:66px; font-weight:900; line-height:1.32; }
  .head em { font-style:normal; color:#FFD27A; }
  .sub { margin-top:26px; font-size:31px; line-height:1.72; color:#C9BEE8; font-weight:500; }
  .orow { margin-top:76px; display:flex; justify-content:center; gap:12px; }
  .ocell { width:186px; }
  .ocell img { width:172px; height:172px; object-fit:contain;
               filter:drop-shadow(0 14px 28px rgba(0,0,0,.5)); }
  .oname { margin-top:18px; font-size:35px; font-weight:900; }
  .ovibe { margin-top:9px; font-size:22px; color:#8F82B8; }
  .ask { margin-top:84px; font-size:42px; font-weight:800; line-height:1.6; }
  .wm { margin-top:auto; font-size:24px; font-weight:700; letter-spacing:5px; color:#6E5FA0; }
  </style></head><body>
  <div id="card">
    <div class="stars">${Array.from({ length: 34 }, (_, i) => {
      const x = (i * 37) % 100, y = (i * 53) % 100, s = 2 + (i % 3), o = 0.25 + (i % 4) * 0.12;
      return `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${o}"></i>`;
    }).join('')}</div>
    <div class="brand">이음사주</div>
    <div class="head">태어난 날이 정하는<br/><em>다섯 갈래의 기운</em></div>
    <div class="sub">새싹·노을·언덕·달빛·이슬.<br/>어느 기운을 갖고 태어났는지에 따라<br/>곁에 오는 정령이 달라져요.</div>
    <div class="orow">${cells}</div>
    <div class="ask">나는 어느 쪽일까</div>
    <div class="wm">이음사주 ✦</div>
  </div>
  </body></html>`;
}

function cardHtml(job: Job, spirit: Spirit, iljuHanja: string): string {
  const img = (stage: 1 | 2 | 3 | 4) => {
    const p = spirit.imageFor(stage);
    if (!p) return '';
    return `file://${resolve(ROOT, 'public')}${p.split('?')[0]}`;
  };
  const who = job.ilju
    ? `${job.ilju}일주에게`
    : job.name ? `${job.name}님에게` : `${job.lunar ? '음력 ' : ''}${job.year}. ${job.leap ? '윤' : ''}${job.month}. ${job.day}생에게`;
  const r = rarityLine(spirit);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Apple SD Gothic Neo', Pretendard, sans-serif; }
  #card {
    width: 1080px; height: 1350px; position: relative; overflow: hidden; color: #F3EEFF;
    background: linear-gradient(180deg, #2A2046 0%, #1E1635 55%, #14101F 100%);
    display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 68px 64px 44px;
  }
  .stars { position: absolute; inset: 0; pointer-events: none; }
  .stars i { position: absolute; border-radius: 50%; background: #fff; }
  .brand { font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #B79CFF; }
  .who { margin-top: 26px; font-size: 42px; color: #C9BEE8; font-weight: 600; }
  .headline { margin-top: 10px; font-size: 60px; font-weight: 900; }
  .glow { margin-top: 26px; width: 440px; height: 440px; position: relative; }
  .glow::before { content: ''; position: absolute; inset: -40px; border-radius: 50%;
    background: radial-gradient(circle, ${spirit.elem.raw}44 0%, transparent 65%); }
  .glow img { width: 100%; height: 100%; object-fit: contain; position: relative;
    filter: drop-shadow(0 20px 44px rgba(0,0,0,.45)); }
  .sname { margin-top: 14px; font-size: 72px; font-weight: 900; letter-spacing: 2px; }
  .badge { display: inline-block; margin-top: 18px; padding: 12px 30px; border-radius: 999px;
    background: ${spirit.rarity.raw}22; border: 2px solid ${spirit.rarity.raw};
    color: ${spirit.rarity.raw}; font-size: 32px; font-weight: 800; }
  .hook { margin-top: 16px; font-size: 31px; color: #C9BEE8; }
  .formula { margin-top: 10px; font-size: 28px; color: #8F82B8; }
  .evo { margin-top: 42px; width: 100%; padding: 30px 28px; border-radius: 32px;
    background: rgba(255,255,255,.05); border: 1.5px solid rgba(183,156,255,.25); }
  .evo-title { font-size: 28px; font-weight: 800; color: #B79CFF; letter-spacing: 2px; }
  .evo-row { margin-top: 22px; display: flex; align-items: center; justify-content: center; gap: 18px; }
  .slot { width: 150px; height: 150px; border-radius: 28px; background: rgba(255,255,255,.06);
    display: flex; align-items: center; justify-content: center; position: relative; }
  .slot img { width: 128px; height: 128px; object-fit: contain; }
  .slot.mystery img { filter: brightness(0); opacity: .85; }
  .slot .q { font-size: 62px; font-weight: 900; color: #6E5FA0; }
  .slot .tag { position: absolute; bottom: -34px; width: 100%; font-size: 23px; color: #8F82B8; font-weight: 700; }
  .arrow { font-size: 34px; color: #6E5FA0; }
  .evo-cap { margin-top: 42px; font-size: 27px; color: #C9BEE8; }
  .evo-cap b { color: #FFD27A; }
  .wm { margin-top: auto; font-size: 24px; font-weight: 700; letter-spacing: 5px; color: #6E5FA0; }
  </style></head><body>
  <div id="card">
    <div class="stars">${Array.from({ length: 34 }, (_, i) => {
      const x = (i * 37) % 100, y = (i * 53) % 100, s = 2 + (i % 3), o = 0.25 + (i % 4) * 0.12;
      return `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${o}"></i>`;
    }).join('')}</div>
    <div class="who">${who} 깃든 정령은</div>
    <div class="headline">${spirit.name}</div>
    <div class="glow"><img src="${img(1)}" alt=""></div>
    <div class="badge">${r.badge}</div>
    <div class="hook">${r.hook}</div>
    <div class="formula">${ELEM_FRIENDLY[spirit.elemKey]} 기운 + ${spirit.animal} · ${STEM_KO[iljuHanja[0]] ?? ''}${BRANCH_KO[iljuHanja[1]] ?? ''}일주</div>
    <div class="evo">
      <div class="evo-title">진화 미리보기</div>
      <div class="evo-row">
        <div class="slot"><img src="${img(1)}" alt=""><div class="tag">${STAGE_LABEL[1]}</div></div>
        <div class="arrow">›</div>
        <div class="slot"><div class="q">?</div><div class="tag">${STAGE_LABEL[2]}</div></div>
        <div class="arrow">›</div>
        <div class="slot"><div class="q">?</div><div class="tag">${STAGE_LABEL[3]}</div></div>
        <div class="arrow">›</div>
        <div class="slot mystery"><img src="${img(4)}" alt=""><div class="tag">✦ ${STAGE_LABEL[4]}</div></div>
      </div>
      <div class="evo-cap">지금은 <b>아기</b> 단계 — 직접 키워야 진화형을 볼 수 있어요</div>
    </div>
    <div class="wm">이음사주 ✦</div>
  </div>
  </body></html>`;
}

// ── 메인 ─────────────────────────────────────────────────
const argv = process.argv.slice(2);
const openMode = argv.includes('--open');
const jobs = openMode ? [] : parseArgs(argv);
mkdirSync(OUT_DIR, { recursive: true });

// 시스템 Chrome 사용 — playwright 크로미움 다운로드 불필요 (디스크 절약)
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });

if (openMode) {
  const tmp = resolve(OUT_DIR, '_open.html');
  writeFileSync(tmp, openCardHtml());
  await page.goto(`file://${tmp}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const out = resolve(OUT_DIR, '여는글-다섯기운.png');
  await page.screenshot({ path: out });
  rmSync(tmp, { force: true });
  await browser.close();
  console.log(out);
  process.exit(0);
}

for (const job of jobs) {
  // --ilju 케이스: 해당 일주가 나오는 양력 날짜를 역탐색 (60갑자 주기 → 60일 내 반드시 존재)
  if (job.ilju) {
    const targetGz = STEM_FROM_KO[job.ilju[0]] + BRANCH_FROM_KO[job.ilju[1]];
    for (let i = 0; i < 60; i++) {
      const d = new Date(2000, 0, 1 + i);
      const probe = computeMyeongsik({
        year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
        calendar: 'solar', gender: 'female', name: '게스트',
      });
      if (probe.pillars[2].top.c + probe.pillars[2].bot.c === targetGz) {
        job.year = d.getFullYear(); job.month = d.getMonth() + 1; job.day = d.getDate();
        break;
      }
    }
    if (!job.year) { console.error(`일주 탐색 실패: ${job.ilju}`); continue; }
  }

  const m = computeMyeongsik({
    year: job.year, month: job.month, day: job.day,
    hour: job.hour, calendar: job.lunar ? 'lunar' : 'solar', leapMonth: job.leap,
    gender: 'female', name: job.name ?? '게스트',
  });
  const spirit = spiritFromMyeongsik(m);
  const ilju = m.pillars[2].top.c + m.pillars[2].bot.c;

  const tmp = resolve(OUT_DIR, '.tmp-card.html');
  writeFileSync(tmp, cardHtml(job, spirit, ilju));
  await page.goto(`file://${tmp}`);
  await page.waitForLoadState('networkidle');

  const date = job.ilju
    ? `ilju-${job.ilju}`
    : `${job.year}-${String(job.month).padStart(2, '0')}-${String(job.day).padStart(2, '0')}${job.leap ? '-윤' : ''}`;
  const out = resolve(OUT_DIR, `${date}-${spirit.key}.png`);
  await page.locator('#card').screenshot({ path: out });
  rmSync(tmp);
  console.log(`✓ ${date} → ${spirit.name} (${spirit.rarity.ko} · ${ilju}일주) → ${out}`);
}

await browser.close();
if (existsSync(resolve(OUT_DIR, '.tmp-card.html'))) rmSync(resolve(OUT_DIR, '.tmp-card.html'));

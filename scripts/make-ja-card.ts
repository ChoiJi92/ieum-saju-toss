/**
 * 일본어 X(트위터) 게시용 카드 생성기.
 *
 * 매일 올리는 것은 `today` 다. 그날의 일진(日柱)으로 정령을 뽑아 카드를 만든다.
 *
 * 1080×1080 정사각. X 타임라인에서 잘리지 않고 세로를 가장 많이 차지하는 비율이다.
 *
 * 사용법:
 *   npx tsx scripts/make-ja-card.ts today        오늘의 일진 정령 (매일 올리는 것)
 *   npx tsx scripts/make-ja-card.ts lineup       오행 다섯 계열 소개 (참여 유도용)
 *   npx tsx scripts/make-ja-card.ts one 若葉 龍   특정 정령 한 마리 크게
 *
 * 출력: ja-cards/*.png (1080×1080)
 *
 * 설계 의도 — 티저:
 *   보여주는 것: 정령 그림과 계열 이름, "어느 것을 갖고 태어났는가"라는 질문
 *   가리는 것: 등급·운세·궁합. 링크도 넣지 않는다.
 *   본문 링크는 도달이 떨어지고, 카드에 URL 을 박으면 광고로 읽힌다.
 *   궁금해서 답글을 달게 만드는 것이 이 카드의 유일한 일이다.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { calculateSaju } from '@fullstackfamily/manseryeok';
import { makeSpirit, ZODIAC, type ElementKey, type ZodiacKey } from '../src/lib/spirit';
import { spiritNameJa, titleJa, personaJa, RARITY_JA } from '../src/lib/i18n-ja';

const ROOT = resolve(import.meta.dirname, '..');
const OUT_DIR = resolve(ROOT, 'ja-cards');
const SPIRITS = resolve(ROOT, 'public', 'ja-spirits');

/** 오행 다섯 계열. 파일 접두는 한국어, 표시는 일본어. */
const ELEMENTS = [
  { prefix: '새싹', ja: '若葉', reading: 'わかば', vibe: '生命力とはじまり', color: '#7EE0A0' },
  { prefix: '노을', ja: '夕焼け', reading: 'ゆうやけ', vibe: '情熱と表現', color: '#FF9E82' },
  { prefix: '언덕', ja: '黄金', reading: 'こがね', vibe: '安定と信頼', color: '#FFD27A' },
  { prefix: '달빛', ja: '月光', reading: 'げっこう', vibe: '決断と洗練', color: '#D6D9E0' },
  { prefix: '이슬', ja: '雫', reading: 'しずく', vibe: '知恵としなやかさ', color: '#7BA8FF' },
];

/** 계열마다 다른 십이지를 골라 그림이 반복돼 보이지 않게 한다. */
const PICKS = ['용', '호랑이', '소', '뱀', '토끼'];

/** 별은 고정 좌표로 찍는다. 매번 달라지면 같은 카드를 다시 만들 수 없다. */
function starField(): string {
  return Array.from({ length: 46 }, (_, i) => {
    const x = (i * 97) % 100, y = (i * 61) % 100;
    const s = 2 + (i % 3);
    const o = 0.2 + ((i * 7) % 5) / 10;
    return `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${o}"></i>`;
  }).join('');
}

function dataUri(file: string): string {
  return `data:image/png;base64,${readFileSync(resolve(SPIRITS, file)).toString('base64')}`;
}


/** 그날의 일진으로 정령을 뽑는다. scripts/_today-ja.ts 와 같은 계산. */
const STEM_ELEM: Record<string, ElementKey> = {
  甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire', 戊: 'earth',
  己: 'earth', 庚: 'metal', 辛: 'metal', 壬: 'water', 癸: 'water',
};
const BRANCH_ZOD = Object.fromEntries(
  (Object.keys(ZODIAC) as ZodiacKey[]).map((k) => [ZODIAC[k].cn, k]),
) as Record<string, ZodiacKey>;

function todaySpirit(date: Date) {
  const r = calculateSaju(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0,
    { applyTimeCorrection: false });
  const gz: string = r.dayPillarHanja;
  const sp = makeSpirit(STEM_ELEM[gz[0]] ?? 'wood', BRANCH_ZOD[gz[1]] ?? 'rat');
  return { gz, sp };
}

/**
 * 오늘의 정령 카드.
 *
 * 등급은 밝히되 근거(천을귀인 같은 말)는 쓰지 않는다. 읽는 사람이 모르는 말이고,
 * 한국판에서 세운 원칙이기도 하다.
 */
function todayHtml(date: Date): { html: string; name: string } {
  const { gz, sp } = todaySpirit(date);
  const el = ELEMENTS.find((e) => e.prefix === sp.key.slice(0, 2)) ?? ELEMENTS[0];
  const nameJa = spiritNameJa(sp.elemKey, sp.zodKey);
  const rarity = RARITY_JA[sp.rarity.key];
  const md = `${date.getMonth() + 1}月${date.getDate()}日`;
  const week = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  const img = dataUri(`${sp.key}.png`);

  const html = `
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1080px; height:1080px; position:relative; overflow:hidden; text-align:center;
    font-family:'Hiragino Sans','Noto Sans JP','Apple SD Gothic Neo',sans-serif;
    background:
      radial-gradient(860px 640px at 50% 30%, ${el.color}26, transparent 66%),
      linear-gradient(165deg, #1B1430 0%, #241A3E 46%, #171029 100%);
    color:#F3EEFF;
  }
  .stars { position:absolute; inset:0; }
  .stars i { position:absolute; background:#fff; border-radius:50%; }
  .date {
    padding-top:56px; font-size:29px; letter-spacing:.3em; color:#C9B6FF; font-weight:600;
  }
  /* 배지는 제 줄을 갖게 한다. inline 으로 두면 큰 그림과 같은 줄에 얹혀 아래로 밀린다. */
  .badgeRow { margin-top:16px; }
  .badge {
    display:inline-block; padding:8px 23px; border-radius:999px;
    font-size:22px; font-weight:800; letter-spacing:.1em;
    color:${el.color}; background:${el.color}1c; border:1.5px solid ${el.color}55;
  }
  .art { margin-top:10px; }
  img {
    width:372px; height:372px; object-fit:contain; display:block; margin:0 auto;
    filter:drop-shadow(0 22px 46px rgba(0,0,0,.55));
  }
  .name { margin-top:10px; font-size:60px; font-weight:800; color:${el.color}; }
  .title { margin-top:12px; font-size:30px; color:#CFC4E8; font-weight:600; }
  .persona {
    margin:24px auto 0; max-width:840px; font-size:27px; line-height:1.72; color:#BFB2DE;
  }
  .foot {
    position:absolute; bottom:42px; left:0; right:0;
    font-size:23px; color:#8B7FAE; letter-spacing:.16em;
  }
</style>
<div class="stars">${starField()}</div>
<div class="date">${md}（${week}）の精霊</div>
<div class="badgeRow"><span class="badge">${rarity.label}</span></div>
<div class="art"><img src="${img}" alt="" /></div>
<div class="name">${nameJa}</div>
<div class="title">${titleJa(sp.elemKey, sp.zodKey)}</div>
<div class="persona">${personaJa(sp.elemKey, sp.zodKey)}</div>
<div class="foot">イウム四柱推命</div>`;

  return { html, name: `today-${date.getMonth() + 1}-${date.getDate()}-${gz}.png` };
}

function lineupHtml(): string {
  const cells = ELEMENTS.map((e, i) => {
    const img = dataUri(`${e.prefix}${PICKS[i]}.png`);
    return `
      <div class="cell">
        <img src="${img}" alt="" />
        <div class="name" style="color:${e.color}">${e.ja}</div>
        <div class="reading">${e.reading}</div>
      </div>`;
  }).join('');

  return `
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1080px; height:1080px; position:relative; overflow:hidden;
    font-family:'Hiragino Sans','Noto Sans JP','Apple SD Gothic Neo',sans-serif;
    background:
      radial-gradient(900px 600px at 20% 12%, rgba(183,156,255,.30), transparent 62%),
      radial-gradient(760px 560px at 84% 78%, rgba(255,158,130,.20), transparent 60%),
      linear-gradient(165deg, #1B1430 0%, #241A3E 46%, #171029 100%);
    color:#F3EEFF;
  }
  .stars { position:absolute; inset:0; }
  .stars i {
    position:absolute; background:#fff; border-radius:50%;
  }
  .wrap { position:relative; padding:74px 60px 0; text-align:center; }
  .kicker {
    font-size:30px; letter-spacing:.34em; color:#C9B6FF; font-weight:600;
  }
  .title {
    margin-top:20px; font-size:62px; font-weight:800; line-height:1.3;
    letter-spacing:-.01em;
  }
  .title em { font-style:normal; color:#FFD27A; }
  .sub {
    margin-top:20px; font-size:27px; line-height:1.7; color:#CFC4E8; font-weight:500;
  }
  .row {
    margin-top:52px; display:flex; justify-content:center; gap:10px;
  }
  .cell { width:190px; }
  .cell img {
    width:186px; height:186px; object-fit:contain;
    filter:drop-shadow(0 12px 26px rgba(0,0,0,.5));
  }
  .name { margin-top:16px; font-size:33px; font-weight:800; }
  .reading { margin-top:7px; font-size:20px; color:#9C90BC; }
  .ask {
    margin:56px auto 0; max-width:780px;
    font-size:36px; font-weight:700; line-height:1.6;
  }
  .foot {
    position:absolute; bottom:44px; left:0; right:0; text-align:center;
    font-size:24px; color:#8B7FAE; letter-spacing:.16em;
  }
</style>
<div class="stars">${starField()}</div>
<div class="wrap">
  <div class="kicker">韓国の四柱推命</div>
  <div class="title">生まれた日が決める<br/><em>五つの気</em></div>
  <div class="sub">若葉・夕焼け・黄金・月光・雫。<br/>どれを持って生まれたかで、そばにいる精霊が変わります。</div>
  <div class="row">${cells}</div>
  <div class="ask">あなたはどれを<br/>持って生まれましたか。</div>
</div>
<div class="foot">イウム四柱推命</div>`;
}

function oneHtml(prefix: string, zodiac: string, ja: string, color: string): string {
  const img = dataUri(`${prefix}${zodiac}.png`);
  return `
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1080px; height:1080px; position:relative; overflow:hidden; text-align:center;
    font-family:'Hiragino Sans','Noto Sans JP',sans-serif;
    background:
      radial-gradient(820px 620px at 50% 32%, ${color}22, transparent 66%),
      linear-gradient(165deg, #1B1430 0%, #241A3E 46%, #171029 100%);
    color:#F3EEFF;
  }
  .kicker { margin-top:78px; font-size:30px; letter-spacing:.34em; color:#C9B6FF; font-weight:600; }
  img { width:440px; height:440px; object-fit:contain; margin-top:38px;
        filter:drop-shadow(0 22px 46px rgba(0,0,0,.55)); }
  .name { margin-top:30px; font-size:74px; font-weight:800; color:${color}; }
  .ask { margin:52px auto 0; max-width:780px; font-size:38px; font-weight:700; line-height:1.66; }
  .foot { position:absolute; bottom:44px; left:0; right:0; font-size:25px; color:#8B7FAE; letter-spacing:.16em; }
</style>
<div class="kicker">韓国の四柱推命</div>
<img src="${img}" alt="" />
<div class="name">${ja}</div>
<div class="ask">あなたのそばにいるのは<br/>どの精霊でしょうか。</div>
<div class="foot">イウム四柱推命</div>`;
}

/* ─── 실행 ─────────────────────────────────────────────────── */

const [mode = 'today', a, b] = process.argv.slice(2);
mkdirSync(OUT_DIR, { recursive: true });

let html: string;
let outName: string;

if (mode === 'today') {
  const r = todayHtml(new Date());
  html = r.html;
  outName = r.name;
} else if (mode === 'one') {
  const el = ELEMENTS.find((e) => e.ja === a) ?? ELEMENTS[0];
  const zodiac = b ?? '용';
  html = oneHtml(el.prefix, zodiac, el.ja, el.color);
  outName = `one-${el.ja}-${zodiac}.png`;
} else {
  html = lineupHtml();
  outName = 'lineup.png';
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(400);
const buf = await page.screenshot({ type: 'png' });
await browser.close();

const out = resolve(OUT_DIR, outName);
writeFileSync(out, buf);
console.log(out);

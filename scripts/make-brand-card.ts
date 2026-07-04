/**
 * 공유용 브랜드 OG 카드 생성기 (1200×630, 링크 미리보기 공용).
 *
 * getTossShareLink(deeplink, ogImageUrl) 의 ogImageUrl 로 물릴 이미지.
 * 궁합·앱 공유 등 모든 공유에 공통으로 쓰이는 브랜드 카드.
 *
 * 사용법: npx tsx scripts/make-brand-card.ts
 * 출력: public/share/og-brand.png
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname, '..');
const OUT_DIR = resolve(ROOT, 'public', 'share');

// 가운데 히어로 = 새싹개(앱 마스코트). 나머지는 오행 다양하게(흙·물·불·쇠)
const CAST: { folder: string; color: string; big?: boolean }[] = [
  { folder: '언덕돼지', color: '#FFD27A' },           // 흙
  { folder: '이슬용', color: '#7BA8FF' },             // 물
  { folder: '새싹개', color: '#5BD9AC', big: true },  // 나무 (가운데 히어로 · 마스코트)
  { folder: '노을말', color: '#FF9E82' },             // 불
  { folder: '달빛닭', color: '#D6C6FF' },             // 쇠
];

const spImg = (folder: string) =>
  `file://${resolve(ROOT, 'public', 'spirits', folder, `${folder}-01-아기.png`)}`;

function brandHtml(): string {
  const stars = Array.from({ length: 40 }, (_, i) => {
    const x = (i * 37) % 100, y = (i * 53) % 100, s = 2 + (i % 3), o = 0.2 + (i % 4) * 0.14;
    return `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${o}"></i>`;
  }).join('');
  const sprites = CAST.map((c) => {
    const size = c.big ? 210 : 150;
    const dy = c.big ? 0 : 26;
    return `<div class="sp" style="width:${size}px;height:${size}px;transform:translateY(${dy}px)">
      <span class="glow" style="background:radial-gradient(circle, ${c.color}55 0%, transparent 68%)"></span>
      <img src="${spImg(c.folder)}" alt="">
    </div>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Apple SD Gothic Neo', Pretendard, sans-serif; }
  #card {
    width: 1200px; height: 630px; position: relative; overflow: hidden; color: #F3EEFF;
    background: radial-gradient(120% 90% at 50% 8%, #33285A 0%, #221A3D 48%, #14101F 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 40px 60px;
  }
  .stars { position: absolute; inset: 0; pointer-events: none; }
  .stars i { position: absolute; border-radius: 50%; background: #fff; }
  .row { display: flex; align-items: center; justify-content: center; gap: 20px; height: 250px; }
  .sp { position: relative; display: flex; align-items: center; justify-content: center; }
  .sp .glow { position: absolute; inset: -26px; border-radius: 50%; }
  .sp img { width: 100%; height: 100%; object-fit: contain; position: relative;
    filter: drop-shadow(0 16px 34px rgba(0,0,0,.5)); }
  .brand { margin-top: 30px; font-size: 30px; font-weight: 800; letter-spacing: 9px; color: #B79CFF; }
  .headline { margin-top: 16px; font-size: 54px; font-weight: 900; letter-spacing: 1px; }
  .headline b { color: #FFD27A; }
  .sub { margin-top: 16px; font-size: 27px; font-weight: 500; color: #C9BEE8; }
  </style></head><body>
  <div id="card">
    <div class="stars">${stars}</div>
    <div class="row">${sprites}</div>
    <div class="brand">이음사주 ✦</div>
    <div class="headline">내 사주에 깃든 <b>정령</b>을 찾아보세요</div>
    <div class="sub">생년월일만 넣으면 나만의 정령이 깨어나요</div>
  </div>
  </body></html>`;
}

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1.5 });
const tmp = resolve(OUT_DIR, '.tmp-brand.html');
writeFileSync(tmp, brandHtml());
await page.goto(`file://${tmp}`);
await page.waitForLoadState('networkidle');
const out = resolve(OUT_DIR, 'og-brand.png');
await page.locator('#card').screenshot({ path: out });
rmSync(tmp);
await browser.close();
if (existsSync(tmp)) rmSync(tmp);
console.log(`✓ 브랜드 카드 → ${out}`);

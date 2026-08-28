/** 랭킹 스크린샷에서 '이음사주' 행에 빨간 테두리 강조 오버레이 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

// boxYFrac / boxHFrac = 이미지 높이 대비 강조박스 top/height 비율 (뷰로 확인 후 조정)
const shots = [
  { in: '/Users/choijihoon/.claude/uploads/eba5f13c-181f-4c9b-8688-d4b7b56b3363/0cfa1b0c-IMG_7991.png', out: '/tmp/rank-12.png', yFrac: Number(process.argv[2] ?? 0.60), hFrac: Number(process.argv[3] ?? 0.11) },
  { in: '/Users/choijihoon/.claude/uploads/eba5f13c-181f-4c9b-8688-d4b7b56b3363/1f4eecc6-IMG_7993.png', out: '/tmp/rank-42.png', yFrac: Number(process.argv[4] ?? 0.46), hFrac: Number(process.argv[5] ?? 0.115) },
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const s of shots) {
  const b64 = readFileSync(s.in).toString('base64');
  const probe = await browser.newPage();
  await probe.setContent(`<img id="i" src="data:image/png;base64,${b64}">`);
  const dim = await probe.$eval('#i', (el) => ({ w: el.naturalWidth, h: el.naturalHeight }));
  await probe.close();

  const page = await browser.newPage({ viewport: { width: dim.w, height: dim.h }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>
    *{margin:0;padding:0}
    #wrap{position:relative;width:${dim.w}px;height:${dim.h}px}
    #wrap img{display:block;width:${dim.w}px;height:${dim.h}px}
    #box{position:absolute;left:1.5%;width:97%;
      top:${(s.yFrac * 100).toFixed(2)}%;height:${(s.hFrac * 100).toFixed(2)}%;
      border:6px solid #FF2D55;border-radius:18px;box-shadow:0 0 0 3px rgba(255,45,85,.35),0 8px 24px rgba(255,45,85,.4);}
  </style></head><body><div id="wrap"><img src="data:image/png;base64,${b64}"><div id="box"></div></div></body></html>`);
  await page.locator('#wrap').screenshot({ path: s.out });
  await page.close();
  console.log(`✓ ${s.out} (${dim.w}x${dim.h}, box top ${(s.yFrac*100).toFixed(1)}%)`);
}
await browser.close();

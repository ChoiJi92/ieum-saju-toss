/**
 * 일본어 웹판 전용 정령 에셋 생성 — spirits-src(gitignore, 333MB) → public/ja-spirits(추적, ~5MB).
 *
 *   node scripts/gen-ja-assets.mjs
 *
 * 왜 필요한가:
 *   spirits-src 는 용량 때문에 git 에서 제외돼 있어서 Vercel 빌드에서 접근할 수 없다.
 *   JA 웹판은 아기 단계 60장만 쓰므로, 512px 로 최적화한 사본만 리포에 커밋한다.
 *   정령 이미지를 교체했다면 이 스크립트를 다시 실행해 커밋할 것.
 */
import { readdirSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'spirits-src');
const OUT = join(ROOT, 'public', 'ja-spirits');

if (!existsSync(SRC)) {
  console.error('❌ spirits-src 가 없습니다. 원본 에셋이 있는 환경에서 실행하세요.');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

let n = 0;
let bytes = 0;
for (const folder of readdirSync(SRC)) {
  const fdir = join(SRC, folder);
  if (!statSync(fdir).isDirectory()) continue;
  const baby = readdirSync(fdir).find((f) => f.includes('-01-') && f.endsWith('.png'));
  if (!baby) { console.warn(`  ⚠️ 아기 단계 없음: ${folder}`); continue; }
  const buf = await sharp(join(fdir, baby))
    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer();
  writeFileSync(join(OUT, `${folder}.png`), buf);
  n++;
  bytes += buf.length;
}

console.log(`✅ ${n}장 생성 — public/ja-spirits (${(bytes / 1024 / 1024).toFixed(1)}MB)`);

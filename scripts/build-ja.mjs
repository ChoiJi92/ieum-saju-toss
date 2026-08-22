/**
 * 일본어 웹판 빌드 — rsbuild 빌드 후 dist 를 웹 배포용으로 다이어트한다.
 *
 *   node scripts/build-ja.mjs
 *
 * 하는 일:
 *  1) APP_TARGET=ja rsbuild build
 *  2) dist/spirits 에서 아기(01) 단계만 남기고 삭제 — JA 화면은 imageFor(1)만 사용
 *  3) 남긴 이미지를 512px·256색으로 최적화 (원본 1.4MB → ~100KB)
 *  4) 한국판 전용 자산(share 등) 제거
 */
import { execSync } from 'node:child_process';
import { readdirSync, rmSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');

function dirSizeMB(dir) {
  let total = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else total += statSync(p).size;
    }
  };
  if (existsSync(dir)) walk(dir);
  return (total / 1024 / 1024).toFixed(1);
}

console.log('▶ rsbuild build (APP_TARGET=ja)');
execSync('npx rsbuild build', { cwd: ROOT, stdio: 'inherit', env: { ...process.env, APP_TARGET: 'ja' } });
console.log(`  빌드 직후: ${dirSizeMB(DIST)}MB`);

// 2) 아기 단계만 남기기
const spiritsDir = join(DIST, 'spirits');
let removed = 0;
let kept = 0;
if (existsSync(spiritsDir)) {
  for (const folder of readdirSync(spiritsDir)) {
    const fdir = join(spiritsDir, folder);
    if (!statSync(fdir).isDirectory()) continue;
    for (const file of readdirSync(fdir)) {
      if (file.includes('-01-')) kept++;
      else { rmSync(join(fdir, file), { force: true }); removed++; }
    }
  }
}
console.log(`▶ 정령 이미지 정리 — 유지 ${kept}장 / 삭제 ${removed}장`);

// 3) 한국판 전용 자산 제거
for (const junk of ['share', '.DS_Store', 'thai']) {
  const p = join(DIST, junk);
  if (existsSync(p)) { rmSync(p, { recursive: true, force: true }); console.log(`▶ 제거: ${junk}`); }
}

// 4) 이미지 최적화 — sharp (Vercel 빌드 환경에서도 동작)
console.log('▶ 이미지 최적화 (512px)');
const sharp = (await import('sharp')).default;
let optimized = 0;
for (const folder of readdirSync(spiritsDir)) {
  const fdir = join(spiritsDir, folder);
  if (!statSync(fdir).isDirectory()) continue;
  for (const file of readdirSync(fdir)) {
    if (!file.endsWith('.png')) continue;
    const p = join(fdir, file);
    const buf = await sharp(p)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 80, compressionLevel: 9, palette: true })
      .toBuffer();
    writeFileSync(p, buf);
    optimized++;
  }
}
console.log(`  최적화 완료: ${optimized}장`);

console.log(`\n✅ 완료 — dist: ${dirSizeMB(DIST)}MB`);

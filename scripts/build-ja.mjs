/**
 * 일본어 웹판 빌드 — rsbuild 빌드 후 dist 를 웹 배포용으로 다이어트한다.
 *
 *   node scripts/build-ja.mjs
 *
 * 하는 일:
 *  1) APP_TARGET=ja rsbuild build
 *  2) 한국판 전용 자산(spirits 원본·share 등) 제거 — JA 는 public/ja-spirits(커밋됨)만 사용
 *
 * 정령 이미지를 교체했다면 먼저 `node scripts/gen-ja-assets.mjs` 로 ja-spirits 를 갱신할 것.
 */
import { execSync } from 'node:child_process';
import { readdirSync, rmSync, statSync, existsSync } from 'node:fs';
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

// 2) 한국판 전용 자산 제거 (JA 는 public/ja-spirits 만 사용)
for (const junk of ['share', '.DS_Store', 'thai', 'spirits']) {
  const p = join(DIST, junk);
  if (existsSync(p)) { rmSync(p, { recursive: true, force: true }); console.log(`▶ 제거: ${junk}`); }
}

console.log(`\n✅ 완료 — dist: ${dirSizeMB(DIST)}MB`);

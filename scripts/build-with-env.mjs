#!/usr/bin/env node
import { existsSync, readFileSync, renameSync } from 'node:fs';
import { spawn } from 'node:child_process';

const envFile = process.argv[2];
if (!envFile) {
  console.error('Usage: node scripts/build-with-env.mjs <env-file>');
  process.exit(1);
}
if (!existsSync(envFile)) {
  console.error(`[build-with-env] env file not found: ${envFile}`);
  process.exit(1);
}

const raw = readFileSync(envFile, 'utf8');
const parsed = {};
for (const line of raw.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx <= 0) continue;
  const key = t.slice(0, idx).trim();
  const val = t.slice(idx + 1).trim();
  parsed[key] = val;
}

// SDK 3.x 부터 `ait build` 는 dist/ 를 패키징만 한다.
// 2.x 에서는 granite.config 의 web.commands.build 를 읽어 rsbuild 를 대신 돌려줬지만
// 그 설정이 없어졌으므로, 여기서 rsbuild build 를 먼저 실행해야 한다.
// 특히 VITE_* 값은 rsbuild 가 번들에 넣으므로 env 는 이쪽에 반드시 전달돼야 한다.
const env = { ...process.env, ...parsed };

// rsbuild 의 loadEnv 는 .env 도 함께 읽고, 거기 값이 이긴다.
// 그래서 로컬 .env 에만 있는 개발용 스위치가 운영 번들에 그대로 박히는 사고가 난다.
// 실제로 VITE_REPORT_MOCK_ORDER 가 들어가면 결제 없이 리포트가 나간다.
// 지정한 env 파일에 없는 개발 전용 키는 여기서 빈 값으로 눌러둔다.
const DEV_ONLY = ['VITE_REPORT_MOCK_ORDER', 'VITE_REPORT_MOCK_DELAY'];
for (const key of DEV_ONLY) {
  if (!(key in parsed)) {
    env[key] = '';
    if (process.env[key]) console.warn(`[build-with-env] ${key} 를 빈 값으로 덮어씀 (개발 전용)`);
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    child.on('error', reject);
  });
}

// rsbuild CLI 는 설정 파일을 읽기 전에 스스로 .env 를 로드해 process.env 를 덮어쓴다.
// 그래서 여기서 아무리 값을 넘겨도 로컬 .env 가 이긴다 — 설정 파일 안에서는 이미 늦다.
// 실제로 개발용 VITE_REPORT_MOCK_ORDER 가 운영 번들에 박혀서 결제를 건너뛸 뻔했다.
// 빌드하는 동안만 .env 를 치워두고, 끝나면 반드시 되돌린다.
const LOCAL = '.env';
const PARKED = '.env.__building';
const hasLocal = existsSync(LOCAL);

if (hasLocal) {
  if (existsSync(PARKED)) {
    console.error(`[build-with-env] ${PARKED} 가 남아 있어요. 이전 빌드가 비정상 종료된 흔적이니 직접 확인하고 지워주세요.`);
    process.exit(1);
  }
  renameSync(LOCAL, PARKED);
}
const restore = () => { if (hasLocal && existsSync(PARKED)) renameSync(PARKED, LOCAL); };
process.on('SIGINT', () => { restore(); process.exit(130); });
process.on('SIGTERM', () => { restore(); process.exit(143); });

try {
  await run('npx', ['rsbuild', 'build']);
  await run('npx', ['ait', 'build']);
} catch (e) {
  console.error(`[build-with-env] ${e.message}`);
  process.exit(1);
} finally {
  restore();
}

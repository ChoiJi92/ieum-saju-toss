#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
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

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    child.on('error', reject);
  });
}

try {
  await run('npx', ['rsbuild', 'build']);
  await run('npx', ['ait', 'build']);
} catch (e) {
  console.error(`[build-with-env] ${e.message}`);
  process.exit(1);
}

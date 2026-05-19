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

const child = spawn('ait', ['build'], {
  stdio: 'inherit',
  env: { ...process.env, ...parsed },
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

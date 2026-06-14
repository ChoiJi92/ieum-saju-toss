/**
 * 클라우드 동기화 — localStorage(주 저장소)를 Supabase에 백업/복원.
 *
 * 설계:
 *   - 오프라인 우선: 앱은 localStorage만으로 완전 동작. 서버는 백업·기기이동용.
 *   - 신원: 토스 로그인(exchange)이 발급한 { userKey, syncToken } (cloud creds).
 *   - 풀: 앱 시작 시 1회. 푸시: 변경 감지(해시) 시 디바운스 + 화면 이탈 시.
 *   - 병합: 이 기기가 마지막으로 본 서버 버전(lastSyncedAt)과 비교 —
 *       · 서버가 더 새로움 + 로컬 무변경 → 서버 적용(새 기기/타 기기 진행)
 *       · 충돌(둘 다 변경) → 진행도 점수 높은 쪽 우선(정령 성장은 후퇴하지 않으므로)
 */

import { signInWithToss } from './toss-auth';

const PROD_API = 'https://ieum-saju-api.vercel.app/api';
const API_BASE = (import.meta.env?.VITE_TOSS_AUTH_API as string | undefined)?.replace(/\/toss\/?$/, '') || PROD_API;
const STATE_URL = `${API_BASE}/state`;

const CREDS_KEY = 'ieum-saju.sync.creds.v1';
const META_KEY = 'ieum-saju.sync.meta.v1';

/** 동기화 대상 localStorage 키 (원본 문자열 그대로 백업 — 무손실) */
const SYNC_KEYS = [
  'ieum-saju.profiles.v2',
  'ieum-saju.active.v2',
  'ieum-saju.spirit.v2',
  'ieum-saju.streak.v1',
  'ieum-saju.mentor.v1',
  'ieum-saju.guide.care.v1',
] as const;

type Creds = { userKey: string; syncToken: string; linkedAt: string };
type Meta = { lastSyncedAt: string | null; lastHash: string | null };
type Blob = { v: 1; entries: Record<string, string | null> };

function readJson<T>(k: string): T | null {
  try { const r = localStorage.getItem(k); return r ? (JSON.parse(r) as T) : null; } catch { return null; }
}
function writeJson(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
}

export function getCreds(): Creds | null { return readJson<Creds>(CREDS_KEY); }
export function isLinked(): boolean { return Boolean(getCreds()); }
function getMeta(): Meta { return readJson<Meta>(META_KEY) ?? { lastSyncedAt: null, lastHash: null }; }

function collect(): Blob {
  const entries: Record<string, string | null> = {};
  for (const k of SYNC_KEYS) { try { entries[k] = localStorage.getItem(k); } catch { entries[k] = null; } }
  return { v: 1, entries };
}

function apply(blob: Blob) {
  for (const k of SYNC_KEYS) {
    const v = blob.entries[k];
    try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignore */ }
  }
}

function hashOf(blob: Blob): string {
  const s = SYNC_KEYS.map((k) => `${k}=${blob.entries[k] ?? ''}`).join('|');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31 + s.charCodeAt(i)) | 0);
  return String(h);
}

/** 진행도 점수 — 충돌 시 더 키운 쪽을 선택 (성장은 후퇴하지 않음) */
function progressScore(blob: Blob): number {
  let score = 0;
  try {
    const spirits = JSON.parse(blob.entries['ieum-saju.spirit.v2'] ?? '{}') as Record<string, { stage?: number; bond?: number }>;
    for (const p of Object.values(spirits)) score += (p.stage ?? 1) * 10_000 + (p.bond ?? 0);
  } catch { /* ignore */ }
  try {
    const profiles = JSON.parse(blob.entries['ieum-saju.profiles.v2'] ?? '[]') as unknown[];
    score += (Array.isArray(profiles) ? profiles.length : 0) * 1_000;
  } catch { /* ignore */ }
  try {
    const streak = JSON.parse(blob.entries['ieum-saju.streak.v1'] ?? '{}') as { maxStreak?: number };
    score += (streak.maxStreak ?? 0) * 100;
  } catch { /* ignore */ }
  return score;
}

async function remoteGet(c: Creds): Promise<{ found: boolean; data?: Blob; updatedAt?: string } | null> {
  try {
    const r = await fetch(`${STATE_URL}?userKey=${c.userKey}&token=${c.syncToken}`);
    if (!r.ok) return null;
    return (await r.json()) as { found: boolean; data?: Blob; updatedAt?: string };
  } catch { return null; }
}

async function remotePut(c: Creds, blob: Blob): Promise<string | null> {
  try {
    const r = await fetch(STATE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userKey: c.userKey, token: c.syncToken, data: blob }),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { ok: boolean; updatedAt: string };
    return j.ok ? j.updatedAt : null;
  } catch { return null; }
}

/** 원격 백업 삭제 (탈퇴 시) — 성공 여부와 무관하게 로컬 자격은 정리 */
export async function deleteRemoteAndUnlink(): Promise<void> {
  const c = getCreds();
  if (c) {
    try {
      await fetch(STATE_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userKey: c.userKey, token: c.syncToken }),
      });
    } catch { /* best effort */ }
  }
  try { localStorage.removeItem(CREDS_KEY); localStorage.removeItem(META_KEY); } catch { /* ignore */ }
}

/** 지금 푸시 (변경 없으면 스킵). 성공 시 meta 갱신 */
export async function pushNow(force = false): Promise<'pushed' | 'skipped' | 'failed' | 'unlinked'> {
  const c = getCreds();
  if (!c) return 'unlinked';
  const blob = collect();
  const h = hashOf(blob);
  const meta = getMeta();
  if (!force && meta.lastHash === h) return 'skipped';
  const updatedAt = await remotePut(c, blob);
  if (!updatedAt) return 'failed';
  writeJson(META_KEY, { lastSyncedAt: updatedAt, lastHash: h } satisfies Meta);
  return 'pushed';
}

/**
 * 풀 + 병합. 반환:
 *   'applied-reload' — 서버 상태를 적용했고 새로고침 필요(호출부에서 reload)
 *   'pushed' | 'in-sync' | 'failed' | 'unlinked'
 */
export async function pullMerge(): Promise<'applied-reload' | 'pushed' | 'in-sync' | 'failed' | 'unlinked'> {
  const c = getCreds();
  if (!c) return 'unlinked';
  const remote = await remoteGet(c);
  if (!remote) return 'failed';

  const local = collect();
  const localHash = hashOf(local);
  const meta = getMeta();

  if (!remote.found || !remote.data) {
    // 서버 비어있음 → 첫 백업
    const r = await pushNow(true);
    return r === 'pushed' ? 'pushed' : 'failed';
  }

  const serverIsNew = remote.updatedAt !== meta.lastSyncedAt; // 다른 기기(또는 첫 연결)에서 갱신됨
  const localChanged = meta.lastHash !== localHash;

  if (!serverIsNew) {
    if (localChanged) { const r = await pushNow(); return r === 'pushed' ? 'pushed' : 'failed'; }
    return 'in-sync';
  }

  // 서버가 새 버전
  if (!localChanged && meta.lastSyncedAt !== null) {
    // 로컬 무변경 → 서버 적용
    apply(remote.data);
    writeJson(META_KEY, { lastSyncedAt: remote.updatedAt ?? null, lastHash: hashOf(remote.data) } satisfies Meta);
    return 'applied-reload';
  }

  // 첫 연결(meta 없음) 또는 충돌 → 진행도 높은 쪽
  if (progressScore(remote.data) >= progressScore(local)) {
    apply(remote.data);
    writeJson(META_KEY, { lastSyncedAt: remote.updatedAt ?? null, lastHash: hashOf(remote.data) } satisfies Meta);
    return 'applied-reload';
  }
  const r = await pushNow(true);
  return r === 'pushed' ? 'pushed' : 'failed';
}

/** 이미 받은 토스 sync 자격으로 백업 연결 (온보딩에서 signInWithToss 직접 호출 시) — 첫 연결로 취급 */
export function linkCredsFromToss(sync: { userKey: string; syncToken: string }): void {
  writeJson(CREDS_KEY, { ...sync, linkedAt: new Date().toISOString() } satisfies Creds);
  try { localStorage.removeItem(META_KEY); } catch { /* 첫 연결 취급 */ }
}

/** 토스 로그인으로 백업 연결 (내정보에서 호출) */
export async function linkWithToss(): Promise<'linked-reload' | 'linked' | 'no-sync-support' | 'failed'> {
  try {
    const info = await signInWithToss();
    if (!info.sync) return 'no-sync-support'; // 백엔드 STATE_SYNC_SECRET 미설정
    writeJson(CREDS_KEY, { ...info.sync, linkedAt: new Date().toISOString() } satisfies Creds);
    try { localStorage.removeItem(META_KEY); } catch { /* 첫 연결로 취급 */ }
    const r = await pullMerge();
    if (r === 'applied-reload') return 'linked-reload';
    return r === 'failed' ? 'failed' : 'linked';
  } catch {
    return 'failed';
  }
}

let started = false;
/** 앱 시작 시 1회 — 연결돼 있으면 풀/병합 후 자동 푸시 루프 시작 */
export function initCloudSync(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (!isLinked()) return;
  void pullMerge().then((r) => { if (r === 'applied-reload') window.location.reload(); });
  // 변경 감지 푸시 — 45초 간격 + 화면 이탈 시
  window.setInterval(() => { void pushNow(); }, 45_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') void pushNow(); });
}

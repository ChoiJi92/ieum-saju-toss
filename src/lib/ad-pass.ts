const AD_PASS_KEY = 'ieum-saju.adPassUntil.v1';
export const AD_PASS_DURATION_MS = 5 * 60 * 1000;

function now() {
  return Date.now();
}

function readPassUntil(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(AD_PASS_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function getAdPassUntil(): number {
  return readPassUntil();
}

export function getAdPassRemainingMs(): number {
  return Math.max(0, getAdPassUntil() - now());
}

export function hasActiveAdPass(): boolean {
  const remaining = getAdPassRemainingMs();
  if (remaining > 0) return true;

  // 만료된 값이 남아있으면 정리
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(AD_PASS_KEY);
    } catch {
      // noop
    }
  }
  return false;
}

export function grantAdPass(durationMs = AD_PASS_DURATION_MS): number {
  const until = now() + durationMs;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(AD_PASS_KEY, String(until));
    } catch {
      // 저장 실패 시에도 기능 흐름은 유지
    }
  }
  return until;
}

export function clearAdPass() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AD_PASS_KEY);
  } catch {
    // noop
  }
}

export function formatAdPassRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

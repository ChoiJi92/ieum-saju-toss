/**
 * 궁합 결과 공유 링크 — 백엔드 없이 두 사람 정보를 링크 파라미터에 인코딩해서 공유.
 *
 * 흐름:
 *  1. 궁합 결과 화면 "결과 공유하기" → 두 사람 정보 담은 딥링크 → getTossShareLink → 공유 시트
 *  2. 받는 사람이 링크 클릭 → 토스가 앱 열며 intoss://ieum-saju/gunghap?p=… 진입
 *  3. 앱 부팅 시 getSchemeUri()에서 p 파라미터 파싱 → 궁합 화면에서 바로 두 사람 결과 렌더
 *
 * 서버 저장 없음 — 링크 자체가 데이터. base64url은 암호화가 아니라 눈에만 안 보이는 수준.
 */

/** 구형 단일인 페이로드 (기존 호환용 — 실기기 배포 전이라 신규 진입에서는 미사용) */
export type InvitePayload = {
  n: string;
  y: number;
  m: number;
  d: number;
  g?: 'male' | 'female';
};

/** 한 사람 정보 */
export type PersonPayload = {
  n: string;
  y: number;
  m: number;
  d: number;
  g?: 'male' | 'female';
};

/** 두 사람 궁합 결과 공유 페이로드 */
export type SharePayload = {
  v: 1;
  a: PersonPayload;
  b: PersonPayload;
};

const APP_SCHEME = 'intoss://ieum-saju';

/** 공유 링크 미리보기(OG) 이미지 — 궁합·앱 공유 공통 브랜드 카드 (백엔드 정적 호스팅) */
export const OG_IMAGE_URL = 'https://ieum-saju-api.vercel.app/og-brand.png';

// ── base64url (UTF-8 안전 — 한글 이름) ──
function encodeB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function decodeB64Url(s: string): string | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch { return null; }
}

/** 한 사람 페이로드 유효성 검사 */
function validatePerson(o: Partial<PersonPayload>): PersonPayload | null {
  if (typeof o.y !== 'number' || typeof o.m !== 'number' || typeof o.d !== 'number') return null;
  if (o.y < 1900 || o.y > 2100 || o.m < 1 || o.m > 12 || o.d < 1 || o.d > 31) return null;
  return {
    n: typeof o.n === 'string' ? o.n.slice(0, 20) : '',
    y: o.y, m: o.m, d: o.d,
    g: o.g === 'male' || o.g === 'female' ? o.g : undefined,
  };
}

export function encodeShare(p: SharePayload): string {
  return encodeB64Url(JSON.stringify(p));
}

/** 공유 페이로드 디코드 — 깨진 값은 관용적으로 null 반환 */
export function decodeShare(raw: string | null | undefined): SharePayload | null {
  if (!raw) return null;
  const json = decodeB64Url(raw);
  if (!json) return null;
  try {
    const o = JSON.parse(json) as Partial<SharePayload>;
    if (o.v !== 1 || typeof o.a !== 'object' || typeof o.b !== 'object') return null;
    const a = validatePerson(o.a as Partial<PersonPayload>);
    const b = validatePerson(o.b as Partial<PersonPayload>);
    if (!a || !b) return null;
    return { v: 1, a, b };
  } catch { return null; }
}

// ── 기존 단일인 decode (구형 링크 호환 — 실기기 배포 후 혹시 모를 구링크 대비) ──
export function encodeInvite(p: InvitePayload): string {
  return encodeB64Url(JSON.stringify(p));
}
export function decodeInvite(raw: string | null | undefined): InvitePayload | null {
  if (!raw) return null;
  const json = decodeB64Url(raw);
  if (!json) return null;
  try {
    const o = JSON.parse(json) as Partial<InvitePayload>;
    if (typeof o.y !== 'number' || typeof o.m !== 'number' || typeof o.d !== 'number') return null;
    if (o.y < 1900 || o.y > 2100 || o.m < 1 || o.m > 12 || o.d < 1 || o.d > 31) return null;
    return { n: typeof o.n === 'string' ? o.n.slice(0, 20) : '', y: o.y, m: o.m, d: o.d, g: o.g === 'male' || o.g === 'female' ? o.g : undefined };
  } catch { return null; }
}

/** 공유 딥링크 — 토스가 이 경로로 앱을 열어줌 */
export function buildShareDeeplink(p: SharePayload): string {
  return `${APP_SCHEME}/gunghap?p=${encodeShare(p)}`;
}

// ── 공유 ──
export type ShareResult = 'shared' | 'copied' | 'failed';

/** 토스 공유 링크 생성 + 네이티브 공유 시트. 브라우저(로컬 개발)는 클립보드 복사 폴백. */
export async function shareGunghapResult(p: SharePayload): Promise<ShareResult> {
  const deeplink = buildShareDeeplink(p);
  const aName = p.a.n || '나';
  const bName = p.b.n || '상대';
  const msg = `💌 ${aName}❤${bName} 궁합 결과가 나왔어요!\n클릭하면 두 사람의 정령 궁합을 바로 볼 수 있어요 🥚`;
  try {
    const api = await import('@apps-in-toss/web-framework');
    if (typeof api.getTossShareLink === 'function' && typeof api.share === 'function') {
      const link = await api.getTossShareLink(deeplink, OG_IMAGE_URL);
      await api.share({ message: `${msg}\n${link}` });
      return 'shared';
    }
  } catch { /* SDK 없음(브라우저) — 아래 폴백 */ }
  try {
    await navigator.clipboard.writeText(deeplink);
    return 'copied';
  } catch { return 'failed'; }
}

// ── 진입 파싱 ──
let pendingShare: SharePayload | null = null;

/** 공유 링크 대기 중인지 (온보딩 완료 후 라우팅 판단용) */
export function hasPendingShare(): boolean { return pendingShare !== null; }

/** 궁합 화면이 소비 — 한 번 읽으면 비움 (뒤로갔다 재진입 시 반복 표시 방지) */
export function consumePendingShare(): SharePayload | null {
  const p = pendingShare;
  pendingShare = null;
  return p;
}

/** URI 문자열에서 p 파라미터 추출 (intoss:// 커스텀 스킴은 URL 파서가 못 다뤄서 수동 파싱) */
function shareParamFrom(uri: string | null | undefined): string | null {
  if (!uri) return null;
  const q = uri.indexOf('?');
  if (q < 0) return null;
  return new URLSearchParams(uri.slice(q + 1)).get('p');
}

/**
 * 앱 부팅 시 1회 호출 — 공유 링크로 진입했으면 payload를 저장하고 반환.
 * 토스: getSchemeUri() / 브라우저(개발): window.location.search 의 ?p= 폴백.
 * 두 사람 페이로드(v:1) 우선, 구형 단일인 페이로드는 무시.
 */
export async function detectEntryShare(): Promise<SharePayload | null> {
  let raw: string | null = null;
  try {
    const api = await import('@apps-in-toss/web-framework');
    if (typeof api.getSchemeUri === 'function') raw = shareParamFrom(api.getSchemeUri());
  } catch { /* SDK 없음 */ }
  if (!raw && typeof window !== 'undefined') {
    raw = new URLSearchParams(window.location.search).get('p');
  }
  const p = decodeShare(raw);
  if (p) pendingShare = p;
  return p;
}

// ── 하위 호환 alias (AppShell 이전 코드 참조 대비) ──
/** @deprecated detectEntryShare 사용 */
export async function detectEntryInvite(): Promise<SharePayload | null> {
  return detectEntryShare();
}
/** @deprecated hasPendingShare 사용 */
export function hasPendingInvite(): boolean { return hasPendingShare(); }
/** @deprecated consumePendingShare 사용 */
export function consumePendingInvite(): SharePayload | null { return consumePendingShare(); }

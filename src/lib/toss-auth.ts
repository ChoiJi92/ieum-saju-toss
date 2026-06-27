/**
 * 토스 로그인 wrapper.
 *
 * 흐름:
 *   클라이언트: appLogin() → authorizationCode 받음
 *   → 백엔드(VITE_TOSS_AUTH_API) → access_token 교환 + user info fetch
 *   → 사용자 정보 응답 (이름·생년월일·성별·CI 등)
 *
 * 현재 단계: 사업자 검토 + Client ID 발급 대기 중이라 백엔드·실 API 미연결.
 * → 환경변수 미설정 시 mock 데이터로 fallback (UI 흐름 검증용).
 * Client ID 발급되면 .env 채우고 fallback 자동 disable.
 */

import type { SajuInput } from './saju';

/**
 * 백엔드 token exchange endpoint (Vercel Function).
 * `ait` (metro) 빌드가 rsbuild env를 받지 않으므로 production URL은 코드에 직접 적음.
 * 로컬 dev 등 다른 endpoint 쓰고 싶으면 VITE_TOSS_AUTH_API 로 덮어쓰기.
 */
const PROD_AUTH_API = 'https://ieum-saju-api.vercel.app/api/toss';
const AUTH_API = import.meta.env?.VITE_TOSS_AUTH_API || PROD_AUTH_API;

/** 토스 로그인이 활성화돼 있는지 — 환경변수 설정 여부로 판단 */
export function isTossLoginEnabled(): boolean {
  return Boolean(AUTH_API);
}

/** 토스 로그인으로 받는 사용자 정보 */
export type TossUserInfo = {
  /** 토스 회원 식별 키 — 동일 사용자 인식용 (서버 저장 시) */
  ci: string;
  name: string;
  /** 양력 (yyyy-mm-dd) */
  birthDate: string;
  gender: 'male' | 'female';
  phoneNumber?: string;
  email?: string;
  /** 상태 동기화 자격 (백엔드 STATE_SYNC_SECRET 설정 시 발급) — cloud-sync에서 사용 */
  sync?: { userKey: string; syncToken: string };
};

/** 토스 SDK 로드 (사용 가능 환경에서만) */
async function loadTossSdk(): Promise<{ appLogin: () => Promise<{ authorizationCode: string; referrer: string }> } | null> {
  try {
    const mod = await import('@apps-in-toss/web-framework');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (mod as any).appLogin;
    if (typeof fn === 'function') return { appLogin: fn };
    return null;
  } catch {
    return null;
  }
}

/**
 * 토스 로그인 실행.
 * 1) appLogin() → authorizationCode
 * 2) 백엔드에 전달 → user info
 * 환경 미지원·실패 시 throw (호출자에서 fallback 처리).
 */
export async function signInWithToss(): Promise<TossUserInfo> {
  // 1) SDK 호출
  const sdk = await loadTossSdk();
  if (!sdk) {
    throw new Error('TOSS_SDK_UNAVAILABLE');
  }
  const { authorizationCode, referrer } = await sdk.appLogin();

  // 2) 백엔드 token exchange
  if (!AUTH_API) {
    throw new Error('TOSS_AUTH_API_NOT_CONFIGURED');
  }

  const res = await fetch(`${AUTH_API}/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorizationCode, referrer }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`TOSS_EXCHANGE_FAILED_${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as TossUserInfo;
  return data;
}

/** TossUserInfo → SajuInput 변환 (시간은 미정, 사용자 직접 선택) */
export function tossInfoToSajuInput(info: TossUserInfo): Omit<SajuInput, 'hour' | 'minute'> {
  const [yStr, mStr, dStr] = info.birthDate.split('-');
  return {
    name: info.name,
    year: parseInt(yStr, 10),
    month: parseInt(mStr, 10),
    day: parseInt(dStr, 10),
    calendar: 'solar', // 토스는 양력만 제공
    leapMonth: false,
    gender: info.gender,
  };
}

/**
 * 데모 mock — Client ID 발급 전 UI 흐름 테스트용.
 * 실제 SDK가 동작하면 사용 안 됨.
 */
export function getMockTossUser(): TossUserInfo {
  return {
    ci: 'MOCK_CI_' + Math.random().toString(36).slice(2),
    name: '이음',
    birthDate: '1995-03-15',
    gender: 'female',
  };
}

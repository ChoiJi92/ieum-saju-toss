/**
 * 리포트 서버(Supabase Edge Function) 클라이언트.
 *
 * 엔드포인트와 키는 .env 의 VITE_REPORT_API / VITE_REPORT_KEY 로 주입한다.
 * 공개 저장소라 코드에 적지 않는다. 미설정이면 isReportEnabled() 가 false 가 되고
 * 화면은 "준비 중"으로 빠진다.
 *
 * 주의: import.meta.env 는 옵셔널 체이닝(?.)을 붙이면 rsbuild 가 치환하지 못한다.
 *       반드시 import.meta.env.VITE_X 형태로 쓸 것.
 */
const API = (import.meta.env.VITE_REPORT_API as string | undefined) ?? '';
const KEY = (import.meta.env.VITE_REPORT_KEY as string | undefined) ?? '';
/**
 * 개발용 — 결제 검증을 건너뛰는 열쇠.
 *
 * 로컬 DevTools 가 만드는 mock 주문번호는 토스가 모르는 값이라 검증을 통과할 수 없다.
 * 서버에 DEV_ORDER_SECRET 이 있고 이 값이 그것과 같을 때만 우회된다.
 * 운영 빌드에서는 scripts/build-with-env.mjs 가 빈 값으로 눌러 없앤다.
 */
const DEV_SECRET = (import.meta.env.VITE_REPORT_DEV_SECRET as string | undefined) || '';

export function isReportEnabled(): boolean {
  return Boolean(API && KEY);
}

function headers() {
  return { 'content-type': 'application/json', Authorization: `Bearer ${KEY}` };
}

/** 결제 직후 주문 기록. 리포트 생성은 기다리지 않고 권한만 남긴다. */
export async function grantReport(params: {
  orderId: string;
  sku: string;
  /** 토스가 판단한 실행 환경. sandbox(QR 테스트)면 true — 실제 결제가 아니다. */
  isTest?: boolean;
  userKey?: string | null;
  name: string;
  myeongsik: unknown;
}): Promise<void> {
  const res = await fetch(`${API}/grant`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(DEV_SECRET ? { ...params, devSecret: DEV_SECRET } : params),
  });
  if (!res.ok) {
    // 402(NOT_PAID)는 부르는 쪽이 재시도할지 판단해야 하므로 상태를 실어 보낸다.
    const e = new Error(`grant ${res.status}: ${await res.text().catch(() => '')}`) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
}

/** 장 하나를 생성(또는 저장본 조회)한다. 60초 안팎 걸린다. */
export async function generateChapter(orderId: string, chapter: 1 | 2): Promise<string> {
  const res = await fetch(`${API}/generate`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ orderId, chapter }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`generate ch${chapter} ${res.status}: ${body}`);
  return body;
}

export type SavedReport = {
  status: 'pending' | 'generating' | 'partial' | 'done' | 'failed';
  content: string | null;
  content_1: string | null;
  content_2: string | null;
  profile_name: string;
  completed_at: string | null;
  /** 생성을 시작한 시각. 너무 오래됐으면 죽은 작업이라 화면이 이어받는다. */
  generating_since: string | null;
};

/** 서버가 죽은 작업으로 보고 재생성을 허용하는 기준. index.ts 의 값과 맞춰둔다. */
export const STALE_GENERATING_MS = 3 * 60 * 1000;

/** 서버가 "만드는 중"이라고 하지만 실제로는 죽은 상태인지. */
export function isStaleGenerating(r: SavedReport): boolean {
  if (r.status !== 'generating' || !r.generating_since) return false;
  return Date.now() - new Date(r.generating_since).getTime() > STALE_GENERATING_MS;
}

/** 이미 만들어둔 리포트 조회 (다시 읽기용). 없으면 null. */
export async function fetchReport(orderId: string): Promise<SavedReport | null> {
  const res = await fetch(`${API}/fetch?orderId=${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.json();
}

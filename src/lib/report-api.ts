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
    method: 'POST', headers: headers(), body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`grant ${res.status}: ${await res.text().catch(() => '')}`);
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
};

/** 이미 만들어둔 리포트 조회 (다시 읽기용). 없으면 null. */
export async function fetchReport(orderId: string): Promise<SavedReport | null> {
  const res = await fetch(`${API}/fetch?orderId=${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  return res.json();
}

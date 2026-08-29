/**
 * 인앱결제 주문 검증 (앱인토스).
 *
 * 리포트 서버(Supabase Edge Function)가 "이 주문이 진짜 결제된 것인가"를 물어보는 자리다.
 * 토스 주문 조회 API 는 mTLS 를 요구하는데, Deno 런타임에서 클라이언트 인증서를 쓸 수
 * 있는지 확실하지 않아 이미 인증서가 붙어 있는 여기를 경유한다.
 *
 * Flow:
 *   Supabase /report/grant → POST { orderId, sku } + x-internal-key
 *   → 앱인토스 주문 조회 (mTLS)
 *   → { ok: boolean, status, reason }
 *
 * 이 엔드포인트는 사람이 부르는 곳이 아니다. 공유 비밀을 모르면 아무것도 안 한다.
 * CORS 를 열지 않는 것도 그래서다. 브라우저에서 부를 일이 없다.
 *
 * 환경 변수 (Vercel):
 *   TOSS_MTLS_CERT       — 앱인토스 콘솔 발급 인증서 (PEM). 토스 로그인과 같은 것.
 *   TOSS_MTLS_KEY        — 동일 개인키 (PEM)
 *   REPORT_INTERNAL_KEY  — Supabase 함수와 나눠 갖는 비밀. 이게 없으면 전부 거절한다.
 *   TOSS_ORDER_STATUS_URL — (선택) override
 *
 * 앱인토스 API spec (https://developers-apps-in-toss.toss.im/api/iap):
 *   POST /api-partner/v1/apps-in-toss/order/get-order-status
 *     body: { orderId }
 *     resp: { resultType, success: { orderId, status, reason, sku, statusDeterminedAt } }
 *     분당 3,000회 제한. 초과 시 HTTP 200 + resultType FAIL + code 4095.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Agent, fetch as undiciFetch } from 'undici';
import { timingSafeEqual } from 'crypto';

const DEFAULT_ORDER_STATUS_URL =
  'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/order/get-order-status';

/**
 * 지급해도 되는 상태.
 *
 * PAYMENT_COMPLETED = 결제는 끝났고 아직 지급 전. processProductGrant 시점이 여기다.
 * PURCHASED         = 지급까지 끝남. 앱을 다시 깔았거나 복구 흐름에서 만난다.
 *
 * REFUNDED 는 뺀다. 환불한 사람에게 다시 만들어 줄 이유가 없다.
 * ORDER_IN_PROGRESS 도 뺀다. 아직 결제가 안 끝났다.
 */
const PAID_STATUSES = new Set(['PAYMENT_COMPLETED', 'PURCHASED']);

type OrderStatusResponse = {
  resultType?: 'SUCCESS' | 'FAIL';
  success?: {
    orderId?: string;
    status?: string;
    reason?: string;
    sku?: string;
    statusDeterminedAt?: string;
  };
  error?: { code?: string; reason?: string };
};

let cachedMtlsAgent: Agent | null = null;

function normalizePem(value: string): string {
  // Vercel 환경변수에 PEM을 한 줄로 넣으면 줄바꿈이 literal "\n"로 저장되는 경우가 있어요.
  return value.replace(/\\n/g, '\n').trim();
}

function getMtlsAgent(): Agent | null {
  if (cachedMtlsAgent) return cachedMtlsAgent;
  const cert = process.env.TOSS_MTLS_CERT;
  const key = process.env.TOSS_MTLS_KEY;
  if (!cert || !key) return null;
  cachedMtlsAgent = new Agent({ connect: { cert: normalizePem(cert), key: normalizePem(key) } });
  return cachedMtlsAgent;
}

/** 길이가 달라도 안전하게 비교한다. 짧은 비교는 글자 수를 흘린다. */
function secretMatches(given: string | undefined, expected: string): boolean {
  if (!given) return false;
  const a = new TextEncoder().encode(given);
  const b = new TextEncoder().encode(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const internalKey = process.env.REPORT_INTERNAL_KEY;
  if (!internalKey) {
    console.error('[order-status] REPORT_INTERNAL_KEY 미설정 — 검증을 열어두지 않는다');
    return res.status(500).json({ error: 'NOT_CONFIGURED' });
  }
  const given = req.headers['x-internal-key'];
  if (!secretMatches(Array.isArray(given) ? given[0] : given, internalKey)) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const { orderId, sku } = (req.body ?? {}) as { orderId?: string; sku?: string };
  if (!orderId) return res.status(400).json({ error: 'MISSING_ORDER_ID' });

  const mtlsAgent = getMtlsAgent();
  if (!mtlsAgent) return res.status(500).json({ error: 'TOSS_MTLS_NOT_CONFIGURED' });

  const url = process.env.TOSS_ORDER_STATUS_URL || DEFAULT_ORDER_STATUS_URL;

  try {
    const upstream = await undiciFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
      dispatcher: mtlsAgent,
    });
    const data = (await upstream.json().catch(() => ({}))) as OrderStatusResponse;

    if (!upstream.ok || data.resultType !== 'SUCCESS' || !data.success) {
      // 4095 는 분당 한도 초과다. 우리 잘못이 아니니 상태를 구분해서 올려보낸다.
      const code = data.error?.code;
      console.error('[order-status] 조회 실패', upstream.status, code, data.error?.reason);
      return res.status(502).json({
        ok: false,
        error: code === '4095' ? 'RATE_LIMITED' : 'LOOKUP_FAILED',
        status: upstream.status,
      });
    }

    const s = data.success;

    // 토스가 다른 주문 얘기를 하면 우리가 물은 게 아니다.
    if (s.orderId && s.orderId !== orderId) {
      console.error('[order-status] orderId 불일치', orderId, s.orderId);
      return res.status(200).json({ ok: false, reason: 'ORDER_ID_MISMATCH', status: s.status });
    }

    // 남의 상품 주문으로 우리 리포트를 받아가지 못하게 한다.
    if (sku && s.sku && s.sku !== sku) {
      console.error('[order-status] sku 불일치', sku, s.sku);
      return res.status(200).json({ ok: false, reason: 'SKU_MISMATCH', status: s.status });
    }

    const ok = PAID_STATUSES.has(s.status ?? '');
    if (!ok) console.warn('[order-status] 미결제 주문', orderId, s.status, s.reason);

    return res.status(200).json({
      ok,
      status: s.status ?? 'UNKNOWN',
      sku: s.sku ?? null,
      reason: ok ? null : (s.reason ?? s.status ?? 'NOT_PAID'),
    });
  } catch (e) {
    console.error('[order-status] 예외', e);
    return res.status(502).json({ ok: false, error: 'UPSTREAM_ERROR' });
  }
}

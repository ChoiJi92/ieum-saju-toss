/**
 * 토스 로그인 연결 끊기 콜백.
 *
 * 토스 콘솔 → 토스 로그인 설정 → "연결 끊기 콜백 URL"에 등록.
 * 회원이 토스 앱에서 미니앱 연동 해지 시 토스가 이 URL로 알림.
 *
 * Flow:
 *   토스 → POST/GET {ci 또는 user_key} → 우리 서버
 *   → (현재는 서버 DB 없음 → 로그만 남김)
 *   → 200 OK 응답
 *
 * 향후 백엔드 DB 도입 시 여기서 사용자 데이터 삭제 처리.
 *
 * 환경 변수:
 *   ALLOWED_ORIGIN — CORS (exchange.ts와 동일 정책)
 *   DISCONNECT_BASIC_AUTH — (선택) Basic Auth 헤더 비교 시크릿
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

function setCors(res: VercelResponse) {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  // 선택 — Basic Auth 검증 (콘솔에 동일 헤더 등록 필요)
  const expectedAuth = process.env.DISCONNECT_BASIC_AUTH;
  if (expectedAuth) {
    const received = req.headers.authorization;
    if (received !== expectedAuth) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
  }

  // 토스에서 전달하는 식별값 (CI 또는 user_key — 정확한 필드명은 발급 후 확인)
  const payload = req.method === 'POST' ? (req.body ?? {}) : (req.query ?? {});
  const { ci, user_key, userKey } = payload as {
    ci?: string;
    user_key?: string;
    userKey?: string;
  };

  const userIdentifier = ci || user_key || userKey;

  // 로그만 남기고 200 응답 — 우리는 외부 서버 저장 X (개인정보처리방침 명시)
  console.info('[toss-disconnect] received', {
    userIdentifier: userIdentifier ? `${userIdentifier.slice(0, 8)}...` : 'unknown',
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // 향후 백엔드 DB 도입 시:
  //   await db.deleteUser(userIdentifier);
  //   await db.deleteUserHistory(userIdentifier);

  return res.status(200).json({
    success: true,
    message: 'Disconnect acknowledged',
  });
}

/**
 * 유저 상태 동기화 API — Supabase user_state 테이블의 키-값(JSONB) 저장소.
 *
 * 인증: 토스 로그인(exchange)에서 발급한 syncToken = HMAC_SHA256(STATE_SYNC_SECRET, userKey).
 *       클라이언트는 비밀키를 모르므로 타인의 userKey 토큰을 위조할 수 없다.
 *
 *   GET    /api/state?userKey=..&token=..          → { found, data?, updatedAt? }
 *   PUT    /api/state  { userKey, token, data }    → { ok, updatedAt }
 *   DELETE /api/state  { userKey, token }          → { ok }   (탈퇴 시 원격 삭제)
 *
 * 환경 변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STATE_SYNC_SECRET
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac, timingSafeEqual } from 'crypto';

const MAX_DATA_BYTES = 64_000; // 유저당 상태 블랍 상한 (~64KB, 평균 2~5KB)

function setCors(res: VercelResponse) {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function validToken(userKey: string, token: string): boolean {
  const secret = process.env.STATE_SYNC_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(userKey).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(token, 'utf8');
  return a.length === b.length && timingSafeEqual(new Uint8Array(a), new Uint8Array(b));
}

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return {
    endpoint: `${url.replace(/\/$/, '')}/rest/v1/user_state`,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    } as Record<string, string>,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const sb = supabase();
  if (!sb) return res.status(500).json({ error: 'SUPABASE_NOT_CONFIGURED' });

  // 인증 파라미터 (GET=query, PUT/DELETE=body)
  const src = req.method === 'GET' ? req.query : ((req.body ?? {}) as Record<string, unknown>);
  const userKey = typeof src.userKey === 'string' ? src.userKey : '';
  const token = typeof src.token === 'string' ? src.token : '';
  if (!/^[a-f0-9]{64}$/.test(userKey) || !token) return res.status(400).json({ error: 'BAD_REQUEST' });
  if (!validToken(userKey, token)) return res.status(401).json({ error: 'INVALID_TOKEN' });

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${sb.endpoint}?user_key=eq.${userKey}&select=data,updated_at`, { headers: sb.headers });
      if (!r.ok) throw new Error(`SUPABASE_GET_${r.status}`);
      const rows = (await r.json()) as Array<{ data: unknown; updated_at: string }>;
      if (!rows.length) return res.status(200).json({ found: false });
      return res.status(200).json({ found: true, data: rows[0].data, updatedAt: rows[0].updated_at });
    }

    if (req.method === 'PUT') {
      const data = (req.body as Record<string, unknown>)?.data;
      if (data == null || typeof data !== 'object') return res.status(400).json({ error: 'MISSING_DATA' });
      const json = JSON.stringify(data);
      if (Buffer.byteLength(json, 'utf8') > MAX_DATA_BYTES) return res.status(413).json({ error: 'DATA_TOO_LARGE' });
      const updatedAt = new Date().toISOString();
      const r = await fetch(sb.endpoint, {
        method: 'POST',
        headers: { ...sb.headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify([{ user_key: userKey, data, updated_at: updatedAt }]),
      });
      if (!r.ok) throw new Error(`SUPABASE_UPSERT_${r.status}: ${await r.text().catch(() => '')}`);
      return res.status(200).json({ ok: true, updatedAt });
    }

    if (req.method === 'DELETE') {
      const r = await fetch(`${sb.endpoint}?user_key=eq.${userKey}`, { method: 'DELETE', headers: sb.headers });
      if (!r.ok) throw new Error(`SUPABASE_DELETE_${r.status}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  } catch (e) {
    console.error('[state] error', (e as Error).message);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
}

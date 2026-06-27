/**
 * Keep-alive 핑 — Supabase 무료 티어는 7일 무활동 시 프로젝트가 일시정지됨.
 * vercel.json의 cron이 매일 호출해 가벼운 SELECT 1회로 활동을 유지한다.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** 등록된 키의 '종류'만 판별 (키 값은 노출하지 않음) — 설정 실수 진단용 */
function keyKind(key: string): string {
  if (key.startsWith('sb_secret_')) return 'sb_secret (신형 시크릿 — OK)';
  if (key.startsWith('sb_publishable_')) return 'sb_publishable (공개키 — ❌ 시크릿 키로 교체 필요)';
  // 레거시 JWT: payload.role 확인
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf8')) as { role?: string };
    if (payload.role === 'service_role') return 'legacy service_role (OK)';
    if (payload.role === 'anon') return 'legacy anon (❌ service_role로 교체 필요)';
    return `legacy jwt role=${payload.role ?? '?'}`;
  } catch {
    return 'unknown';
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(200).json({ ok: false, reason: 'NOT_CONFIGURED' });
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/user_state?select=user_key&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    return res.status(200).json({ ok: r.ok, status: r.status, keyKind: keyKind(key) });
  } catch {
    return res.status(200).json({ ok: false, keyKind: keyKind(key) });
  }
}

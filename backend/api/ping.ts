/**
 * Keep-alive 핑 — Supabase 무료 티어는 7일 무활동 시 프로젝트가 일시정지됨.
 * vercel.json의 cron이 매일 호출해 가벼운 SELECT 1회로 활동을 유지한다.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(200).json({ ok: false, reason: 'NOT_CONFIGURED' });
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/user_state?select=user_key&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    return res.status(200).json({ ok: r.ok });
  } catch {
    return res.status(200).json({ ok: false });
  }
}

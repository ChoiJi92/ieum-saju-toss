/**
 * 토스 로그인 token exchange + user info fetch (앱인토스).
 *
 * Flow:
 *   클라이언트 → POST { authorizationCode, referrer }
 *   → 앱인토스 token endpoint (mTLS)
 *   → 앱인토스 user info endpoint (Bearer)
 *   → 클라이언트로 정규화된 user info 응답
 *
 * 환경 변수 (Vercel):
 *   TOSS_MTLS_CERT       — 앱인토스 콘솔 발급 인증서 (PEM)
 *   TOSS_MTLS_KEY        — 동일 개인키 (PEM)
 *   TOSS_USERINFO_AES_KEY — 사용자 정보 복호화용 AES-256 키 (Base64, 토스가 승인 후 이메일 발급)
 *   TOSS_USERINFO_AES_AAD — 동일하게 발급된 AAD (raw 문자열 또는 Base64)
 *   TOSS_TOKEN_URL       — (선택) override
 *   TOSS_USERINFO_URL    — (선택) override
 *   ALLOWED_ORIGIN       — (선택) CORS
 *
 * 앱인토스 API spec (https://developers-apps-in-toss.toss.im/login/develop.html):
 *   POST /api-partner/v1/apps-in-toss/user/oauth2/generate-token
 *     body: { authorizationCode, referrer }   (JSON)
 *     resp: { resultType, success: { accessToken, refreshToken, ... } }
 *   GET  /api-partner/v1/apps-in-toss/user/oauth2/login-me
 *     header: Authorization: Bearer <accessToken>
 *     resp: { success: { ... AES-256 encrypted fields ... } }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Agent, fetch as undiciFetch } from 'undici';
import { createDecipheriv, createSecretKey, createHash, createHmac } from 'crypto';

const DEFAULT_TOKEN_URL =
  'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/generate-token';
const DEFAULT_USERINFO_URL =
  'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/login-me';

type TossTokenPayload = {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number | string;
  scope?: string;
};

type TossTokenResponse = TossTokenPayload & {
  resultType?: string;
  success?: TossTokenPayload;
  error?: { reason?: string; description?: string };
};

type TossUserInfoResponse = {
  resultType?: string;
  success?: Record<string, string | undefined>;
  error?: { reason?: string; description?: string };
};

type NormalizedUser = {
  ci: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
};

/**
 * AES-256-GCM 복호화 — 토스가 발급한 키/AAD 사용.
 * 포맷: encrypted = base64([iv(12) | ciphertext | tag(16)])
 * AAD는 raw 문자열 (예: "TOSS") — base64로 보이면 디코드, 아니면 utf8 그대로.
 */
function decryptField(encrypted: string, keyB64: string, aadRaw: string): string {
  const buf = Buffer.from(encrypted, 'base64');
  const key = createSecretKey(Uint8Array.from(Buffer.from(keyB64, 'base64')));
  // AAD: 공식 샘플처럼 전달받은 AAD 문자열을 그대로 바이트로 사용합니다.
  const aad = Uint8Array.from(Buffer.from(aadRaw, 'utf8'));
  // [iv(12) | ciphertext | tag(16)]
  const iv = Uint8Array.from(buf.subarray(0, 12));
  const tag = Uint8Array.from(buf.subarray(buf.length - 16));
  const ct = Uint8Array.from(buf.subarray(12, buf.length - 16));
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  const part1 = Uint8Array.from(decipher.update(ct));
  const part2 = Uint8Array.from(decipher.final());
  const out = new Uint8Array(part1.length + part2.length);
  out.set(part1, 0);
  out.set(part2, part1.length);
  return new TextDecoder().decode(out);
}

function normalizeUser(raw: Record<string, string | undefined>): NormalizedUser | null {
  const keyB64 = process.env.TOSS_USERINFO_AES_KEY;
  const aadB64 = process.env.TOSS_USERINFO_AES_AAD;

  const decode = (v: string | undefined): string | undefined => {
    if (!v) return undefined;
    if (!keyB64 || !aadB64) return v; // 키 미설정 시 raw 그대로 (실패 가능)
    try {
      return decryptField(v, keyB64, aadB64);
    } catch (e) {
      console.error('[toss-decrypt] failed', e);
      return undefined;
    }
  };

  const normalizeBirthDate = (value: string | undefined): string | undefined => {
    if (!value) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{8}$/.test(value)) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
    return value;
  };

  const ci = decode(raw.ci) || String(raw.userKey ?? '');
  const name = decode(raw.name);
  const birthDate = normalizeBirthDate(
    decode(raw.birthday) || decode(raw.birth) || decode(raw.birthDate) || decode(raw.birthdate)
  );
  const genderRaw = decode(raw.gender);

  if (!ci || !name || !birthDate || !genderRaw) return null;
  const normalizedGender = genderRaw.toUpperCase();
  const gender: 'male' | 'female' =
    normalizedGender === 'M' || normalizedGender === 'MALE' || genderRaw === '1'
      ? 'male'
      : 'female';
  return { ci, name, birthDate, gender };
}

let cachedMtlsAgent: Agent | null = null;

function normalizePem(value: string): string {
  // Vercel 환경변수에 PEM을 한 줄로 넣으면 줄바꿈이 literal "\\n"로 저장되는 경우가 있어요.
  // undici TLS Agent는 실제 개행이 포함된 PEM을 요구하므로 여기서 보정합니다.
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

function setCors(res: VercelResponse) {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });

  const { authorizationCode, referrer } = (req.body ?? {}) as {
    authorizationCode?: string;
    referrer?: string;
  };
  if (!authorizationCode) return res.status(400).json({ error: 'MISSING_AUTHORIZATION_CODE' });

  const TOKEN_URL = process.env.TOSS_TOKEN_URL || DEFAULT_TOKEN_URL;
  const USERINFO_URL = process.env.TOSS_USERINFO_URL || DEFAULT_USERINFO_URL;

  const mtlsAgent = getMtlsAgent();
  if (!mtlsAgent) {
    return res.status(500).json({ error: 'TOSS_MTLS_NOT_CONFIGURED' });
  }

  try {
    // 1) authorizationCode → accessToken
    const tokenRes = await undiciFetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizationCode, referrer: referrer || 'DEFAULT' }),
      dispatcher: mtlsAgent,
    });
    const tokenData = (await tokenRes.json().catch(() => ({}))) as TossTokenResponse;
    const accessToken = tokenData.success?.accessToken || tokenData.accessToken;

    if (!tokenRes.ok || !accessToken) {
      const tokenDataKeys = Object.keys(tokenData ?? {});
      console.error('[toss-exchange] token failed', tokenRes.status, {
        resultType: tokenData.resultType,
        hasSuccess: Boolean(tokenData.success),
        tokenDataKeys,
        error: tokenData.error,
      });
      return res.status(502).json({ error: 'TOKEN_EXCHANGE_FAILED', status: tokenRes.status });
    }

    // 2) accessToken → user info
    const userRes = await undiciFetch(USERINFO_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      dispatcher: mtlsAgent,
    });
    const userData = (await userRes.json().catch(() => ({}))) as TossUserInfoResponse;

    if (!userRes.ok || !userData.success) {
      console.error('[toss-exchange] userinfo failed', userRes.status, userData);
      return res.status(502).json({ error: 'USERINFO_FAILED', status: userRes.status });
    }

    // 3) 정규화 + 복호화 + 응답
    const user = normalizeUser(userData.success);
    if (!user) {
      console.error('[toss-exchange] decrypt or missing fields', Object.keys(userData.success));
      return res.status(502).json({ error: 'INCOMPLETE_USER_INFO' });
    }

    // 4) 상태 동기화 자격 발급 — userKey=sha256(CI) (원본 CI는 DB에 저장 안 함),
    //    syncToken=HMAC(secret, userKey) → /api/state 인증용. 비밀키 미설정 시 생략(동기화 비활성).
    const syncSecret = process.env.STATE_SYNC_SECRET;
    const sync = syncSecret
      ? (() => {
          const userKey = createHash('sha256').update(user.ci).digest('hex');
          const syncToken = createHmac('sha256', syncSecret).update(userKey).digest('hex');
          return { userKey, syncToken };
        })()
      : undefined;

    return res.status(200).json({ ...user, sync });
  } catch (e) {
    const err = e as Error & { code?: string; cause?: unknown };
    const cause = err.cause as (Error & { code?: string }) | undefined;
    console.error('[toss-exchange] error', {
      name: err.name,
      message: err.message,
      code: err.code,
      causeName: cause?.name,
      causeMessage: cause?.message,
      causeCode: cause?.code,
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: err.message,
      cause: cause?.message || cause?.code,
    });
  }
}

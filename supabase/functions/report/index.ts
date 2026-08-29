/**
 * 유료 사주 리포트 서버.
 *
 *   POST /report/grant     주문 기록만 남긴다 (processProductGrant 콜백에서 즉시 호출, 빠름)
 *   POST /report/generate  장 하나를 생성하며 스트리밍한다. 이미 있으면 저장본을 흘려보낸다.
 *   GET  /report/fetch     저장된 리포트를 한 번에 준다 (다시 읽기용)
 *
 * 설계 메모
 * - 생성은 order_id + 장 당 1회. 두 번째부터는 저장본을 재사용한다.
 *   비용 문제이기도 하지만, 같은 사람이 볼 때마다 다른 리포트가 나오면 그게 더 이상하다.
 * - 4,000자를 한 호출로 스트리밍하면 Edge Function 실행 한도에 걸려 함수가 중간에 죽고,
 *   그러면 저장이 안 돼서 status 가 generating 에 영구히 남는다. 그래서 장 단위로 쪼갠다.
 * - "이 사람이 결제했는가"의 최종 근거는 토스의 IAP.getCompletedOrRefundedOrders() 다.
 *   여기서는 클라이언트가 보낸 order_id 를 신뢰한다. 아래 TODO 참고.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SYSTEM_PROMPT, buildUserPrompt, type Chapter } from './prompt.ts';

const MODEL = 'claude-sonnet-5';
/**
 * 장당 2,000자 안팎이면 본문은 3,000토큰이면 충분하지만, 모델이 먼저 생각을 하면
 * 그 토큰까지 여기서 나간다. 5000 으로 잡았더니 생각만 하다 한도에 닿아
 * 본문이 0자로 오는 일이 있었다. 실제 과금은 쓴 만큼이라 넉넉히 잡는다.
 */
const MAX_TOKENS = 16000;
/** 하루 생성 상한(장 기준). 버그로 루프가 돌 때 지갑을 막는 최후 방어선. */
const DAILY_LIMIT = 400;
/** 이만큼 지나도록 안 끝나면 죽은 것으로 보고 재시도를 허용한다. */
const STALE_GENERATING_MS = 2 * 60 * 1000;

// Supabase 가 새 키 체계(sb_secret_…)로 넘어가는 중이라 런타임에 따라 이름이 다르다.
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  ?? Deno.env.get('SB_SECRET_KEY')
  ?? '';
if (!SERVICE_KEY) console.error('service role key 없음 — DB 접근이 anon 으로 떨어진다');

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── CORS ────────────────────────────────────────────────────────────────────
/** 콤마 구분. 미설정 시 * (개발용) */
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = ALLOWED.length === 0
    ? '*'
    : (origin && ALLOWED.includes(origin) ? origin : ALLOWED[0]);
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
  });
}

function textStream(body: BodyInit, origin: string | null, cached: boolean): Response {
  return new Response(body, {
    headers: {
      ...corsHeaders(origin),
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-cached': cached ? '1' : '0',
    },
  });
}

// ─── 라우팅 ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  // 호출 경로가 배포 환경에 따라 /report/grant 또는 /functions/v1/report/grant 로 온다.
  // 마지막 세그먼트만 보면 둘 다 안전하게 처리된다.
  const seg = new URL(req.url).pathname.split('/').filter(Boolean);
  const action = seg[seg.length - 1] ?? '';

  try {
    if (req.method === 'POST' && action === 'grant') return await handleGrant(req, origin);
    if (req.method === 'POST' && action === 'generate') return await handleGenerate(req, origin);
    if (req.method === 'GET' && action === 'fetch') return await handleFetch(req, origin);
    return json({ error: 'NOT_FOUND', action }, 404, origin);
  } catch (e) {
    console.error('unhandled', e);
    return json({ error: 'INTERNAL', message: String(e) }, 500, origin);
  }
});

// ─── /grant ──────────────────────────────────────────────────────────────────
/**
 * 결제 직후 processProductGrant 콜백에서 호출한다.
 * 리포트 생성을 여기서 기다리면 콜백 타임아웃에 걸리므로, 주문 기록만 남기고 즉시 응답한다.
 * 지급의 단위는 리포트가 아니라 "리포트를 받을 권한"이다.
 */
async function handleGrant(req: Request, origin: string | null): Promise<Response> {
  const { orderId, sku, userKey, name, myeongsik, isTest } = await req.json();

  if (!orderId || typeof orderId !== 'string') return json({ error: 'orderId 필요' }, 400, origin);
  if (!sku || typeof sku !== 'string') return json({ error: 'sku 필요' }, 400, origin);
  if (!myeongsik || typeof myeongsik !== 'object') return json({ error: 'myeongsik 필요' }, 400, origin);

  // 이미 있으면 명식을 덮어쓰지 않는다. 결제 시점의 입력이 기준.
  const { data: existing } = await supabase
    .from('reports').select('order_id').eq('order_id', orderId).maybeSingle();
  if (existing) return json({ ok: true, already: true }, 200, origin);

  const { error } = await supabase.from('reports').insert({
    order_id: orderId,
    sku,
    user_key: userKey ?? null,
    profile_name: (typeof name === 'string' && name.trim()) || '고객',
    myeongsik,
    is_test: isTest === true,
    status: 'pending',
  });

  if (error) {
    console.error('grant insert', error);
    return json({ error: 'DB_ERROR', detail: error.message, code: error.code }, 500, origin);
  }
  return json({ ok: true }, 200, origin);
}

// ─── /fetch ──────────────────────────────────────────────────────────────────
async function handleFetch(req: Request, origin: string | null): Promise<Response> {
  const orderId = new URL(req.url).searchParams.get('orderId');
  if (!orderId) return json({ error: 'orderId 필요' }, 400, origin);

  const { data } = await supabase
    .from('reports')
    .select('status, content, content_1, content_2, profile_name, completed_at')
    .eq('order_id', orderId).maybeSingle();

  if (!data) return json({ error: 'NOT_FOUND' }, 404, origin);
  return json(data, 200, origin);
}

// ─── /generate ───────────────────────────────────────────────────────────────
async function handleGenerate(req: Request, origin: string | null): Promise<Response> {
  const body = await req.json();
  const orderId: string = body.orderId;
  const chapter: Chapter = body.chapter === 2 ? 2 : 1;
  if (!orderId) return json({ error: 'orderId 필요' }, 400, origin);

  const { data: row } = await supabase
    .from('reports').select('*').eq('order_id', orderId).maybeSingle();

  // TODO(결제검증): 지금은 클라이언트가 보낸 order_id 를 신뢰한다.
  //   grant 되지 않은 주문은 여기서 막히지만, 가짜 order_id 로 grant 부터 호출하면 통과한다.
  //   토스 IAP 서버 API 로 주문을 검증하는 절차를 붙여야 한다. 그전까지는 DAILY_LIMIT 이 손해 상한.
  if (!row) return json({ error: 'NOT_GRANTED' }, 403, origin);

  const col = chapter === 1 ? 'content_1' : 'content_2';

  // 이미 만들어둔 장이면 그걸 준다. 재생성하지 않는다.
  const saved: string | null = row[col];
  if (saved) return textStream(saved, origin, true);

  // 2장은 1장이 있어야 이어 쓸 수 있다. 없으면 1장부터.
  if (chapter === 2 && !row.content_1) {
    return json({ error: 'CHAPTER_1_REQUIRED' }, 409, origin);
  }

  // 다른 요청이 같은 장을 생성 중이면 중복 호출을 막는다 (단, 죽은 건 재시도 허용).
  if (row.status === 'generating' && row.generating_since) {
    const age = Date.now() - new Date(row.generating_since).getTime();
    if (age < STALE_GENERATING_MS) return json({ error: 'ALREADY_GENERATING' }, 409, origin);
  }

  // 하루 상한
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('reports').select('order_id', { count: 'exact', head: true })
    .gte('created_at', since.toISOString());
  if ((count ?? 0) >= DAILY_LIMIT) {
    console.error(`daily limit hit: ${count}`);
    return json({ error: 'DAILY_LIMIT' }, 429, origin);
  }

  await supabase.from('reports')
    .update({ status: 'generating', generating_since: new Date().toISOString() })
    .eq('order_id', orderId);

  // 스트리밍하지 않는다.
  // SSE 를 청크마다 파싱하면 Edge Function CPU 한도를 먹어서, 긴 응답의 뒷부분이
  // 잘린 채 함수가 죽는다(글자 수·소요 시간이 매번 달라지는 증상). 한 번에 받아
  // 한 번만 파싱하면 CPU 를 거의 쓰지 않아 안정적이다.
  // 대기 시간은 화면에서 명식표·오행 차트를 먼저 보여주며 덮는다.
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // 배열 + cache_control 로 넣어야 프롬프트 캐싱이 걸린다. 입력 비용이 10분의 1 수준으로 떨어짐.
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: buildUserPrompt(row.profile_name, row.myeongsik, chapter, row.content_1),
      }],
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    await supabase.from('reports')
      .update({ status: 'failed', error: `anthropic ${upstream.status}: ${detail.slice(0, 500)}`, generating_since: null })
      .eq('order_id', orderId);
    console.error('anthropic error', upstream.status, detail);
    return json({ error: 'GENERATION_FAILED', status: upstream.status }, 502, origin);
  }

  const result = await upstream.json();
  const text: string = (result.content ?? [])
    .filter((b: { type: string }) => b.type === 'text')
    .map((b: { text: string }) => b.text).join('');
  const usage = result.usage ?? {};
  const inputTokens = (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0)
    + (usage.cache_creation_input_tokens ?? 0);
  const outputTokens = usage.output_tokens ?? 0;

  if (text.length < 500) {
    // 블록 구성을 같이 남긴다. 본문이 비었는데 thinking 만 잔뜩 있으면 한도 문제다.
    const blocks = (result.content ?? [])
      .map((b: { type: string }) => b.type).join(',');
    const detail = `ch${chapter}: ${text.length}자, stop=${result.stop_reason}, blocks=[${blocks}], out=${outputTokens}`;
    await supabase.from('reports')
      .update({ status: 'failed', error: detail, generating_since: null })
      .eq('order_id', orderId);
    console.error('too short', orderId, detail);
    return json({ error: 'TOO_SHORT', detail }, 502, origin);
  }

  const c1 = chapter === 1 ? text : row.content_1;
  const c2 = chapter === 2 ? text : row.content_2;
  const complete = Boolean(c1 && c2);

  const { error: saveErr } = await supabase.from('reports').update({
    [chapter === 1 ? 'content_1' : 'content_2']: text,
    content: complete ? `${c1}\n\n${c2}` : null,
    status: complete ? 'done' : 'partial',
    model: MODEL,
    input_tokens: (row.input_tokens ?? 0) + inputTokens,
    output_tokens: (row.output_tokens ?? 0) + outputTokens,
    completed_at: complete ? new Date().toISOString() : null,
    generating_since: null,
    error: null,
  }).eq('order_id', orderId);

  if (saveErr) console.error('save failed', orderId, chapter, saveErr);

  return textStream(text, origin, false);
}

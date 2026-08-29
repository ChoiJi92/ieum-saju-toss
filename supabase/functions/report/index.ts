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
/**
 * 모델이 답을 쓰기 전에 얼마나 생각할지.
 *
 * 실측: 지정하지 않으면 두 장에 출력 12,574 토큰을 쓰는데 본문은 3,000 토큰뿐이고
 * 나머지 76%가 생각이었다. 그만큼 시간과 돈이 화면에 안 보이는 곳으로 나간다.
 * 한 장이 85초까지 늘어나면 Edge Function wall clock 한도(무료 150초)에 위험하게 가까워진다.
 *
 * 끄지는 않는다. 우리가 파는 게 조각을 잇는 추론이라 하필 그 부분이다.
 * (이 모델은 budget_tokens 를 받지 않는다. thinking.type 은 adaptive, 조절은 effort 로 한다.)
 */
const EFFORT = 'medium';
/** 하루 생성 상한(장 기준). 버그로 루프가 돌 때 지갑을 막는 최후 방어선. */
const DAILY_LIMIT = 400;
/**
 * 이만큼 지나도록 안 끝나면 죽은 것으로 보고 재시도를 허용한다.
 *
 * 한 장에 실측 60초 안팎(effort=medium). 이 값이 생성 시간보다 짧으면 멀쩡히 만드는 중인
 * 작업이 죽은 것으로 판정돼서, 그 사이 들어온 재시도가 두 번째 생성을 시작한다.
 * 돈이 두 배로 나가고 결과 둘이 경쟁한다. 실측의 세 배로 벌려둔다.
 */
const STALE_GENERATING_MS = 3 * 60 * 1000;

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
    // Authorization 헤더 때문에 요청마다 사전 확인(OPTIONS)이 한 번씩 더 붙는다.
    // 상태를 지켜보는 동안 그게 그대로 두 배가 되므로 브라우저가 결과를 들고 있게 한다.
    'Access-Control-Max-Age': '86400',
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

// ─── 결제 검증 ───────────────────────────────────────────────────────────────
/**
 * 이 주문이 진짜 토스 결제인지 확인한다.
 *
 * 이게 없으면 누구든 아무 orderId 로 /grant 를 부른 뒤 /generate 를 불러 공짜로 가져간다.
 * /generate 는 "행이 있는가"만 보기 때문에, 자기가 방금 만든 행이 그대로 통과한다.
 * 저장소가 공개라 그 방법도 코드에 적혀 있는 셈이다. 여기서 막는다.
 *
 * 토스 주문 조회는 mTLS 를 요구하는데 이 런타임에서 클라이언트 인증서를 쓸 수 있는지
 * 확실하지 않아, 인증서가 이미 붙어 있는 Vercel 함수를 경유한다.
 *
 * 검증기가 설정돼 있지 않으면 통과시키지 않는다(fail-closed). 설정을 빠뜨린 채 배포해서
 * 조용히 무방비가 되는 것보다, 아무도 못 사는 게 낫다.
 */
async function verifyOrder(orderId: string, sku: string): Promise<{ ok: boolean; reason: string }> {
  const url = Deno.env.get('ORDER_VERIFY_URL');
  const key = Deno.env.get('REPORT_INTERNAL_KEY');
  if (!url || !key) {
    console.error('ORDER_VERIFY_URL / REPORT_INTERNAL_KEY 미설정 — 결제 검증 없이 열 수 없다');
    return { ok: false, reason: 'VERIFIER_NOT_CONFIGURED' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-key': key },
      body: JSON.stringify({ orderId, sku }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: data.error ?? `VERIFY_${res.status}` };
    return { ok: data.ok === true, reason: data.reason ?? data.status ?? 'NOT_PAID' };
  } catch (e) {
    // 토스가 느리거나 Vercel 이 자고 있을 수 있다. 통과시키지 않는다.
    console.error('order verify 실패', e);
    return { ok: false, reason: 'VERIFY_UNREACHABLE' };
  }
}

// ─── /grant ──────────────────────────────────────────────────────────────────
/**
 * 결제 직후 processProductGrant 콜백에서 호출한다.
 * 리포트 생성을 여기서 기다리면 콜백 타임아웃에 걸리므로, 주문 기록만 남기고 즉시 응답한다.
 * 지급의 단위는 리포트가 아니라 "리포트를 받을 권한"이다.
 */
async function handleGrant(req: Request, origin: string | null): Promise<Response> {
  const { orderId, sku, userKey, name, myeongsik, isTest, devSecret } = await req.json();

  if (!orderId || typeof orderId !== 'string') return json({ error: 'orderId 필요' }, 400, origin);
  if (!sku || typeof sku !== 'string') return json({ error: 'sku 필요' }, 400, origin);
  if (!myeongsik || typeof myeongsik !== 'object') return json({ error: 'myeongsik 필요' }, 400, origin);

  // 이미 있으면 명식을 덮어쓰지 않는다. 결제 시점의 입력이 기준.
  const { data: existing } = await supabase
    .from('reports').select('order_id').eq('order_id', orderId).maybeSingle();
  if (existing) return json({ ok: true, already: true }, 200, origin);

  // 개발용 우회. DEV_ORDER_SECRET 을 아는 요청만 검증을 건너뛴다.
  // 로컬 DevTools 의 mock 주문은 토스가 모르는 번호라 검증을 통과할 수 없기 때문이다.
  // 운영에는 이 환경변수를 두지 않는다. 없으면 어떤 값을 보내도 우회가 안 된다.
  const devKey = Deno.env.get('DEV_ORDER_SECRET');
  const bypass = Boolean(devKey) && devSecret === devKey;

  if (!bypass) {
    const v = await verifyOrder(orderId, sku);
    if (!v.ok) {
      console.warn('결제 검증 실패', orderId, v.reason);
      return json({ error: 'NOT_PAID', reason: v.reason }, 402, origin);
    }
  }

  const { error } = await supabase.from('reports').insert({
    order_id: orderId,
    sku,
    user_key: userKey ?? null,
    profile_name: (typeof name === 'string' && name.trim()) || '고객',
    myeongsik,
    // 검증을 건너뛴 개발용 주문은 실매출로 세면 안 된다. 무조건 테스트로 기록한다.
    is_test: isTest === true || bypass,
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
    // generating_since 도 준다. 화면이 "만드는 중"과 "만들다 죽었다"를 구분해야
    // 죽은 작업을 이어받을 수 있다. 이게 없으면 대기 화면에서 영영 못 빠져나온다.
    .select('status, content, content_1, content_2, profile_name, completed_at, generating_since, input_tokens, output_tokens, model, created_at, error')
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
      // 생각하는 양을 조절한다. 위 EFFORT 주석 참고.
      thinking: { type: 'adaptive' },
      output_config: { effort: EFFORT },
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

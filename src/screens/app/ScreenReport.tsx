/**
 * 유료 정밀 리포트 화면.
 *
 * 흐름: 목차(intro) → 결제 → 1장 생성 대기(working) → 읽기(reading, 2장은 뒤에서 받아둠)
 *
 * 생성이 장당 60초쯤 걸린다. 빈 화면으로 기다리게 하면 이탈하므로 대기 중에는
 * 명식 여덟 글자를 띄워둔다. 이미 계산된 값이라 공짜로 보여줄 수 있고,
 * "지금 이걸 읽고 있다"는 화면이라 기다림이 작업으로 읽힌다.
 *
 * 결제는 IAP.createOneTimePurchaseOrder 로 붙어 있다. processProductGrant 안에서는
 * 리포트를 만들지 않고 주문 기록만 남긴다 — 생성까지 기다리면 콜백이 타임아웃된다.
 */
import { useEffect, useRef, useState } from 'react';
import { V2Screen, V2TopBar, V2Glass, withAlpha, SelfSpiritSlot } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { buildReportOutline } from '../../lib/report-outline';
import { buildReportPayload } from '../../lib/report-payload';
import { grantReport, generateChapter, fetchReport, isReportEnabled, isStaleGenerating } from '../../lib/report-api';
import { TG_KR, DZ_KR, type Myeongsik } from '../../lib/saju';
import { MyeongsikPanel, DaewoonPanel, YearTable, PullQuote } from './ReportVisuals';
import type { Spirit } from '../../lib/spirit';
import { IAP, Environment } from '@apps-in-toss/web-framework';

const GOLD = '#FFD27A';
/** 앱인토스 콘솔에 등록된 상품 ID. 공급가 900원 + 부가세 = 결제액 990원. */
const SKU = 'ait.0000032205.c5c5ad40.783ba55c34.7928202033';
/**
 * 저장은 프로필마다 따로 한다.
 *
 * 리포트는 특정 명식으로 쓴 글이라 사람이 바뀌면 다른 글이어야 한다. 키를 하나만 두면
 * 내정보에서 다른 사람 사주로 바꿔도 앞사람 리포트가 그대로 떴다.
 * 상품이 소모성(CONSUMABLE)이라 사람마다 따로 사는 것이 맞기도 하다.
 */
const ORDER_KEY = (profileId: string) => `ieum-saju.report.orderId.v2:${profileId}`;
/**
 * 본문까지 로컬에 둔다.
 *
 * 주문번호만 저장하면 다시 들어올 때마다 서버에 물어봐야 하고, 그 왕복이 끝나기 전까지
 * 화면은 목차 상태다. 이미 산 사람에게 "990원으로 전부 읽기"가 잠깐 보였다가 사라진다.
 * 한 번 만들어진 리포트는 내용이 변하지 않으므로 통째로 들고 있다가 즉시 그린다.
 */
const BODY_KEY = (profileId: string) => `ieum-saju.report.body.v2:${profileId}`;

/** 프로필 구분 없이 쓰던 예전 키. 아래에서 한 번만 옮겨온다. */
const ORDER_KEY_V1 = 'ieum-saju.report.orderId.v1';
const BODY_KEY_V1 = 'ieum-saju.report.body.v1';

type Cached = { orderId: string; ch1: string; ch2: string | null };

/**
 * 예전 키에 남은 주문을 지금 보고 있는 프로필 앞으로 옮긴다.
 *
 * v1 은 프로필 구분이 없었으므로 어느 사람 것인지 알 수 없다. 다만 그 시절에는
 * 활성 프로필로만 살 수 있었으니, 처음 열리는 프로필에 붙여주는 것이 유일한 단서다.
 * 이걸 안 하면 이미 결제한 사람이 목차 화면으로 떨어져 다시 사야 한다.
 */
function migrateV1(profileId: string) {
  try {
    const old = localStorage.getItem(ORDER_KEY_V1);
    if (!old) return;
    if (!localStorage.getItem(ORDER_KEY(profileId))) {
      localStorage.setItem(ORDER_KEY(profileId), old);
      const body = localStorage.getItem(BODY_KEY_V1);
      if (body) localStorage.setItem(BODY_KEY(profileId), body);
    }
    localStorage.removeItem(ORDER_KEY_V1);
    localStorage.removeItem(BODY_KEY_V1);
  } catch { /* 옮기지 못해도 서버에 원본이 있다 */ }
}

/**
 * 다른 프로필이 이미 자기 것으로 적어둔 주문번호들.
 *
 * 미지급 주문을 주워 담을 때 이걸 빼야 한다. 안 그러면 A 로 결제하다 실패한 주문이
 * 남아 있는 상태에서 B 를 열었을 때, A 의 주문번호로 B 의 리포트를 만들어버린다.
 * 결제는 프로필마다 따로이므로 주문도 주인이 있다.
 */
function claimedByOthers(currentProfileId: string): Set<string> {
  const out = new Set<string>();
  try {
    const mineKey = ORDER_KEY(currentProfileId);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('ieum-saju.report.orderId.v2:') || k === mineKey) continue;
      const v = localStorage.getItem(k);
      if (v) out.add(v);
    }
  } catch { /* 못 읽으면 아무것도 제외하지 않는다 */ }
  return out;
}

function readCache(profileId: string, orderId: string | null): Cached | null {
  if (!orderId) return null;
  try {
    const raw = localStorage.getItem(BODY_KEY(profileId));
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    return c?.orderId === orderId && c.ch1 ? c : null;
  } catch { return null; }
}

function writeCache(profileId: string, orderId: string, ch1: string, ch2: string | null) {
  try { localStorage.setItem(BODY_KEY(profileId), JSON.stringify({ orderId, ch1, ch2 })); }
  catch { /* 저장 공간이 없어도 서버에 원본이 있다 */ }
}

/**
 * 개발용 — 이미 만들어둔 주문 번호를 넣어두면 결제·생성을 건너뛰고 그 리포트를 그대로 읽는다.
 * 서버가 저장본을 돌려주므로 AI 호출이 없고 비용도 0원이다.
 * .env 에만 넣고 .env.prod 에는 넣지 않는다(값이 없으면 자동으로 정상 동작).
 */
const MOCK_ORDER = (import.meta.env.VITE_REPORT_MOCK_ORDER as string | undefined) || '';
/** 개발용 — 저장본은 즉시 오므로 대기 화면을 볼 수 없다. 이 값만큼 일부러 늦춘다(ms). */
const MOCK_DELAY = Number(import.meta.env.VITE_REPORT_MOCK_DELAY ?? 0) || 0;

type Phase = 'intro' | 'restoring' | 'working' | 'reading' | 'error';

const WAIT_LINES = [
  '여덟 글자를 읽고 있어요',
  '넘치는 기운과 부족한 기운을 세는 중이에요',
  '지금 지나는 대운을 살펴보고 있어요',
  '문장을 다듬고 있어요',
];

export default function ScreenReport({ back, spirit }: { back: () => void; spirit: Spirit }) {
  const { myeongsik, profile, activeId } = useSaju();

  // 첫 렌더에 이미 답을 알고 있어야 결제 버튼이 스쳐 보이지 않는다.
  // 그래서 localStorage 는 effect 가 아니라 여기서 읽는다.
  // 저장 키는 프로필마다 나눈다. 사람이 바뀌면 다른 리포트여야 한다.
  const pid = activeId ?? '';
  const [boot] = useState(() => {
    if (MOCK_ORDER || !pid) return { order: null, cache: null };
    migrateV1(pid);
    const order = localStorage.getItem(ORDER_KEY(pid));
    return { order, cache: readCache(pid, order) };
  });

  const [phase, setPhase] = useState<Phase>(
    boot.cache ? 'reading' : boot.order ? 'restoring' : 'intro',
  );
  const [ch1, setCh1] = useState<string | null>(boot.cache?.ch1 ?? null);
  const [ch2, setCh2] = useState<string | null>(boot.cache?.ch2 ?? null);
  /** 결제한 흔적이 있으면 목차로 돌아가도 다시 팔지 않는다. */
  const [paid, setPaid] = useState(Boolean(boot.order));
  const [err, setErr] = useState<string>('');
  const [tick, setTick] = useState(0);
  const started = useRef(false);
  /**
   * 우리가 건 생성 요청이 아직 떠 있는가.
   *
   * 그 요청이 본문을 들고 돌아올 예정이라, 옆에서 상태를 또 물어볼 이유가 없다.
   * 이걸 안 보면 2분 동안 5초마다 한 번씩, 사전 확인까지 합쳐 쉰 번 가까이 두드린다.
   */
  const mine = useRef(false);

  // effect 안에서 항상 최신 값을 보기 위한 통로. deps 를 비워두려면 이게 필요하다.
  const dataRef = useRef({ myeongsik, profile });
  dataRef.current = { myeongsik, profile };

  // 대기 문구 순환
  useEffect(() => {
    if (phase !== 'working') return;
    const t = setInterval(() => setTick((v) => v + 1), 4200);
    return () => clearInterval(t);
  }, [phase]);

  /**
   * 화면에 들어올 때 서버 상태를 확인한다.
   *
   * 생성 도중에 화면을 닫아도 서버는 끝까지 만들어 저장한다(결제가 날아가지 않는다).
   * 문제는 "아직 만드는 중"에 다시 들어온 경우다. 그때 생성을 다시 걸면 서버가
   * 중복이라며 막고, 화면은 그걸 실패로 오해한다. 그래서 여기서 상태를 먼저 보고
   * generating 이면 기다리는 화면으로 붙여둔 뒤 완성될 때까지 지켜본다.
   */
  useEffect(() => {
    if (!isReportEnabled() || MOCK_ORDER) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    /**
     * 지켜보는 간격. 갈수록 늘린다.
     *
     * 한 장에 60초쯤 걸리는데 5초 고정이면 열두 번을 헛되이 묻는다.
     * 처음엔 촘촘히 보다가 길어지면 뜸하게 본다.
     */
    const nextWait = (ms: number) => Math.min(Math.round(ms * 1.6), 20000);
    const FIRST_WAIT = 4000;

    const check = async (orderId: string, wait = FIRST_WAIT) => {
      try {
        const r = await fetchReport(orderId);
        if (!alive) return;
        if (!r) {
          // 결제한 주문인데 서버에 기록이 없다. 자동으로 만들면 실수로 돈이 나가므로
          // 목차로 돌리되, 이미 낸 사람이라 버튼은 "다시 불러오기"가 된다.
          if (!boot.cache) setPhase('intro');
          return;
        }

        if (r.content_1) {
          setCh1(r.content_1);
          setCh2(r.content_2);
          writeCache(pid, orderId, r.content_1, r.content_2);
          setPhase('reading');
          if (!r.content_2 && !mine.current) {
            // 1장만 있는 상태. 서버가 2장을 만들고 있으면 기다리고,
            // 아무도 안 만들고 있으면(1장 직후에 나간 경우) 여기서 이어서 건다.
            if (r.status === 'generating') timer = setTimeout(() => check(orderId, nextWait(wait)), wait);
            else generateChapter(orderId, 2).then((t) => {
              if (!alive) return;
              setCh2(t);
              writeCache(pid, orderId, r.content_1!, t);
            }).catch(() => {});
          }
          return;
        }
        if (r.status === 'generating') {
          setPhase('working');
          // 앱을 껐다 켜면 서버 쪽 생성이 같이 끊겼을 수 있다. 그때는 아무도 만들고 있지
          // 않은데 상태만 "만드는 중"으로 남아, 지켜보기만 하면 영영 안 끝난다.
          // 너무 오래된 작업이면 여기서 이어받는다. 서버도 같은 기준으로 재생성을 허용한다.
          if (isStaleGenerating(r)) { started.current = false; await runGeneration(orderId); return; }
          // 우리가 건 생성이면 그 응답이 본문을 들고 온다. 따로 물어볼 필요가 없다.
          if (mine.current) return;
          started.current = true;          // 중복 생성 요청을 막는다
          timer = setTimeout(() => check(orderId, nextWait(wait)), wait);
          return;
        }
        // 결제만 기록되고 아직 아무도 만들지 않은 상태. 여기서 이어 만든다.
        if (r.status === 'pending') {
          setPhase('working');
          started.current = false;
          await runGeneration(orderId);
          return;
        }
        // 한 번 실패한 건 자동으로 다시 걸지 않는다. 원인이 그대로면 들어올 때마다
        // 실패하면서 토큰만 태운다. 버튼을 눌러 사람이 정하게 둔다.
        if (r.status === 'failed') { setErr('지난번 생성이 끝나지 못했어요'); setPhase('error'); return; }
        if (!boot.cache) setPhase('intro');
      } catch {
        // 조회 실패. 캐시가 있으면 그걸 계속 읽히고, 없으면 목차로 남긴다.
        if (alive && !boot.cache) setPhase('intro');
      }
    };

    /**
     * 결제는 끝났는데 지급이 마무리되지 않은 주문을 회수한다.
     *
     * processProductGrant 중에 앱이 죽거나 통신이 끊기면 토스에는 결제가 남고
     * 우리에게는 아무것도 안 남는다. 실제로 QR 테스트에서 돈만 나가고
     * "환불하세요"가 뜬 적이 있다. 그 주문을 여기서 주워 담는다.
     */
    const sweepPending = async () => {
      const { myeongsik: ms, profile: pf } = dataRef.current;
      if (!ms || !pf) return;
      let mine;
      try {
        if (!IAP.getPendingOrders.isSupported()) return;
        const { orders } = await IAP.getPendingOrders();
        // 다른 프로필이 자기 것으로 적어둔 주문은 건드리지 않는다.
        const others = claimedByOthers(pid);
        mine = orders.find((o) => o.sku === SKU && !others.has(o.orderId));
      } catch { return; }        // 지원하지 않는 버전이거나 조회 실패 — 다음에 다시 본다
      if (!mine || !alive) return;

      localStorage.setItem(ORDER_KEY(pid), mine.orderId);
      setPaid(true);
      started.current = true;
      setPhase('working');
      // 지급 확정과 기록은 runGeneration 안에서 함께 처리한다.
      // 여기서 따로 부르면 두 경로가 갈라져, 한쪽만 고치는 실수가 또 난다.
      if (alive) await runGeneration(mine.orderId);
    };

    // 두 장이 다 손에 있으면 끝난 리포트다. 내용이 바뀔 일이 없으니 서버에 묻지 않는다.
    if (boot.cache?.ch2) return;
    if (boot.order) check(boot.order);
    else sweepPending();

    return () => { alive = false; clearTimeout(timer); };
  }, []);

  if (!myeongsik || !profile) return null;
  const who = { year: profile.year, gender: profile.gender };
  const outline = buildReportOutline(myeongsik, who);

  /**
   * 토스에 "지급 끝났다"고 알린다.
   *
   * 정상 결제 흐름에서는 processProductGrant 가 true 를 돌려주는 것으로 끝난다.
   * 문제는 그 콜백이 실패한 뒤 나중에 되살리는 경우다. 그때는 이걸 따로 불러야
   * 주문이 ORDER_COMPLETED 로 넘어간다. 안 부르면 토스에는 미지급으로 남고,
   * 그 상태가 오래 가면 자동 환불될 수 있다 — 리포트는 나갔는데 돈은 돌아간다.
   *
   * 이미 확정된 주문에 다시 불러도 손해가 없으므로 조용히 삼킨다.
   */
  async function confirmGrant(orderId: string) {
    if (MOCK_ORDER) return;
    try {
      if (!IAP.completeProductGrant.isSupported()) return;
      await IAP.completeProductGrant({ params: { orderId } });
    } catch (e) {
      console.warn('지급 확정 실패 — 다음에 다시 시도한다', e);
    }
  }

  /** 주문 기록이 서버에 없으면 여기서 채운다. 결제 콜백에서 놓쳤을 수 있다. */
  async function ensureGranted(orderId: string) {
    if (MOCK_ORDER) return;
    try {
      const r = await fetchReport(orderId);
      if (r) return;                       // 이미 있다
    } catch { /* 조회 실패면 아래에서 만들어본다 */ }
    await grantReport({
      orderId, sku: SKU,
      isTest: Environment.environment === 'sandbox',
      name: profile!.name || '고객',
      myeongsik: buildReportPayload(myeongsik!, profile!),
    });
  }

  /** 주문번호를 손에 쥔 뒤 1장을 만들고, 2장은 읽는 동안 뒤에서 받아둔다. */
  async function runGeneration(orderId: string) {
    try {
      localStorage.setItem(ORDER_KEY(pid), orderId);
      setPaid(true);
      // 이게 켜져 있는 동안은 지켜보는 쪽이 서버를 따로 두드리지 않는다.
      // 이 요청이 본문을 들고 돌아오기 때문이다.
      mine.current = true;
      await ensureGranted(orderId);
      // 권한이 서버에 남는 순간 지급은 끝난 것이다. 본문을 다 만들기 전에 알린다.
      // 이 자리를 빼면, 결제 콜백이 실패했다가 여기로 되살아난 주문이 토스에는
      // 영영 미지급으로 남는다. 실제로 그 일이 있었다.
      await confirmGrant(orderId);
      if (MOCK_ORDER && MOCK_DELAY) await new Promise((r) => setTimeout(r, MOCK_DELAY));
      const a = await generateChapter(orderId, 1);
      setCh1(a);
      writeCache(pid, orderId, a, null);
      setPhase('reading');
      // 2장이 끝나야 우리 손을 뗀다. 그전에 놓으면 지켜보는 쪽이 2장을 또 물어본다.
      generateChapter(orderId, 2).then((b) => {
        setCh2(b);
        writeCache(pid, orderId, a, b);
      }).catch(() => { /* 아래에서 재시도 버튼 */ })
        .finally(() => { mine.current = false; });
    } catch (e) {
      mine.current = false;
      started.current = false;
      setErr(String(e));
      setPhase('error');
    }
  }

  /**
   * 결제 → 지급 → 생성.
   *
   * processProductGrant 는 결제가 끝난 뒤 토스가 부르는 콜백이다. 여기서 true 를 돌려줘야
   * 거래가 완료되고, false 면 지급 실패로 처리된다. 그래서 이 안에서는 리포트를 만들지 않고
   * "주문을 받았다"는 기록만 남긴다. 생성까지 기다리면 1분이 걸려 콜백이 타임아웃된다.
   * 지급의 단위는 리포트가 아니라 리포트를 받을 권한이다.
   */
  function startPurchase() {
    const cleanup = IAP.createOneTimePurchaseOrder({
      options: {
        sku: SKU,
        processProductGrant: async ({ orderId }) => {
          // 주문번호부터 남긴다. 이게 있으면 서버 기록이 늦어져도 나중에 복구할 수 있다.
          localStorage.setItem(ORDER_KEY(pid), orderId);

          // 서버 기록을 끝까지 기다리면 안 된다.
          // Edge Function 은 한동안 호출이 없으면 잠들어 있다가 깨어나는데(콜드 스타트),
          // 그 몇 초 사이에 토스가 지급 실패로 판단해 결제를 통째로 되돌린다.
          // 실제로 서버에는 주문이 정상 기록됐는데 화면에는 "환불하세요"가 뜬 적이 있다.
          // 그래서 짧게만 기다리고, 늦으면 지급은 성공으로 처리한다.
          // 기록이 빠졌더라도 생성 단계에서 이 주문번호로 다시 채운다.
          try {
            const isTest = Environment.environment === 'sandbox';
            await Promise.race([
              grantReport({
                orderId, sku: SKU, isTest,
                name: profile!.name || '고객',
                myeongsik: buildReportPayload(myeongsik!, profile!),
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('grant timeout')), 2500)),
            ]);
          } catch (e) {
            console.warn('grant 지연 — 생성 단계에서 다시 시도한다', e);
          }
          return true;
        },
      },
      onEvent: (event) => {
        cleanup();
        const orderId = (event as { data?: { orderId?: string } }).data?.orderId;
        if (orderId) runGeneration(orderId);
        else {
          // 지급은 끝났으니 주문번호는 저장돼 있다. 그걸로 이어서 만든다.
          const saved = localStorage.getItem(ORDER_KEY(pid));
          if (saved) runGeneration(saved);
          else { started.current = false; setErr('주문 정보를 받지 못했어요'); setPhase('error'); }
        }
      },
      onError: (e) => {
        cleanup();
        started.current = false;
        const code = (e as { code?: string })?.code ?? '';
        // 사용자가 그냥 닫은 건 실패가 아니다. 조용히 목차로 돌린다.
        if (code === 'USER_CANCELED') { setPhase('intro'); return; }
        setErr(code || String(e));
        setPhase('error');
      },
    });
  }

  function start() {
    if (started.current) return;
    started.current = true;
    setPhase('working');

    // 개발용: 결제를 건너뛰고 저장된 리포트를 그대로 읽는다
    if (MOCK_ORDER) { runGeneration(MOCK_ORDER); return; }

    // 이미 산 주문이 있으면 다시 결제하지 않는다
    const saved = localStorage.getItem(ORDER_KEY(pid));
    if (saved) { runGeneration(saved); return; }

    if (!IAP.createOneTimePurchaseOrder.isSupported()) {
      started.current = false;
      setErr('앱 버전이 낮아 결제를 지원하지 않아요. 토스를 업데이트해 주세요.');
      setPhase('error');
      return;
    }
    startPurchase();
  }

  return (
    <V2Screen seed={71}>
      <V2TopBar onBack={back} title="정밀 리포트" />

      {phase === 'intro' && <Intro outline={outline} onStart={start} enabled={isReportEnabled()} paid={paid} />}
      {phase === 'restoring' && <Restoring />}
      {phase === 'working' && <Waiting ms={myeongsik} spirit={spirit} line={WAIT_LINES[tick % WAIT_LINES.length]} />}
      {phase === 'error' && <Failed message={err} onRetry={() => { setPhase('intro'); }} />}

      {phase === 'reading' && (
        <>
          {ch1 && <Markdown text={ch1} ms={myeongsik} profile={who} />}
          {ch2
            ? <Markdown text={ch2} ms={myeongsik} profile={who} />
            : <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--v2-ink-dim)' }}>
                2장을 쓰고 있어요…
              </div>}
        </>
      )}

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

/* ─── 목차 ────────────────────────────────────────────────── */
function Intro({ outline, onStart, enabled, paid }: {
  outline: ReturnType<typeof buildReportOutline>; onStart: () => void; enabled: boolean; paid: boolean;
}) {
  return (
    <>
      <V2Glass style={{ background: `linear-gradient(150deg, ${withAlpha(GOLD, .13)}, rgba(183,156,255,.10))`, border: `1.5px solid ${withAlpha(GOLD, .3)}` }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1.5 }}>
          {outline.headline}
        </div>
        <div style={{ fontSize: 13, color: 'var(--v2-ink-mid)', lineHeight: 1.7, marginTop: 10 }}>
          앱의 다른 화면들은 조각을 하나씩 알려줍니다. 기토 일간, 편관, 화개살, 부족한 쇠처럼요.
          전부 맞는 말이지만 그 조각들이 어떻게 맞물리는지는 어디에도 없어요. 이 리포트가 그걸 씁니다.
        </div>
      </V2Glass>

      {outline.chapters.map((ch) => (
        <V2Glass key={ch.no} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-ink)' }}>
            {ch.no}장 · {ch.title}
          </div>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {ch.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ color: withAlpha(GOLD, .75), fontSize: 11 }}>·</span>
                <span style={{ fontSize: 13.5, color: 'var(--v2-ink-mid)', lineHeight: 1.6 }}>{it}</span>
              </div>
            ))}
          </div>
        </V2Glass>
      ))}

      <div
        onClick={enabled ? onStart : undefined}
        style={{
          marginTop: 22, padding: '17px 20px', borderRadius: 16, textAlign: 'center',
          background: enabled ? withAlpha(GOLD, .18) : 'rgba(255,255,255,.06)',
          border: `1.5px solid ${enabled ? withAlpha(GOLD, .4) : 'rgba(255,255,255,.12)'}`,
          cursor: enabled ? 'pointer' : 'default',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: enabled ? 'var(--v2-ink)' : 'var(--v2-ink-dim)' }}>
          {!enabled ? '준비 중이에요' : paid ? '내 리포트 불러오기' : '990원으로 전부 읽기'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', marginTop: 5 }}>
          {!enabled ? '곧 만나보실 수 있어요'
            : paid ? '이미 결제하셨어요. 추가 비용은 없습니다'
            : '한 번 결제하면 언제든 다시 볼 수 있어요'}
        </div>
      </div>
    </>
  );
}

/* ─── 저장본 불러오는 중 ──────────────────────────────────── */
/**
 * 결제 기록은 있는데 본문이 아직 손에 없을 때 잠깐 지나가는 화면.
 *
 * 여기서 목차를 그리면 이미 산 사람에게 "990원으로 전부 읽기"가 스쳐 보인다.
 * 대부분 캐시로 바로 넘어가므로 이 화면은 기기를 바꿨을 때나 보인다.
 */
function Restoring() {
  return (
    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 11 }}>
      {['62%', '94%', '88%', '96%', '71%'].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 22 : 14, borderRadius: 8, width: w,
          background: 'rgba(255,255,255,.06)',
          animation: `ie-pulse 1.6s ${i * 0.18}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`@keyframes ie-pulse{0%,100%{opacity:.35}50%{opacity:.75}}`}</style>
    </div>
  );
}

/* ─── 생성 대기 ───────────────────────────────────────────── */
function Waiting({ ms, spirit, line }: {
  ms: NonNullable<ReturnType<typeof useSaju>['myeongsik']>;
  spirit: Spirit;
  line: string;
}) {
  return (
    <>
      <V2Glass style={{ textAlign: 'center', paddingTop: 20, paddingBottom: 26 }}>
        {/* 내 정령이 생각하고 있는 모습. 1분을 빈 화면으로 두면 이탈하는데,
            읽고 있는 주체가 보이면 기다림이 작업으로 읽힌다. */}
        <div style={{ position: 'relative', width: 150, margin: '0 auto' }}>
          <SelfSpiritSlot spirit={spirit} size={132} tag={false} />
          <div style={{ position: 'absolute', top: 4, right: -2, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{
                width: 6 + i * 4, height: 6 + i * 4, borderRadius: '50%',
                background: withAlpha(GOLD, 0.55), border: `1px solid ${withAlpha(GOLD, 0.4)}`,
                animation: `ie-think 1.8s ${i * 0.26}s ease-in-out infinite`,
              }} />
            ))}
          </div>
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-ink)', marginTop: 10 }}>{line}</div>
        <div style={{ fontSize: 12.5, color: 'var(--v2-ink-dim)', marginTop: 7 }}>
          1분쯤 걸려요. 나갔다 들어와도 이어서 만들어 드려요.
        </div>

        {/* 대기 중 볼거리 — 이미 계산된 값이라 공짜다 */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 9 }}>
          {ms.pillars.map((p) => (
            <div key={p.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: 'var(--v2-ink-dim)', marginBottom: 5 }}>{p.label}</div>
              <div style={{
                width: 52, borderRadius: 12, padding: '9px 0',
                background: withAlpha(GOLD, .1), border: `1px solid ${withAlpha(GOLD, .26)}`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-ink)' }}>{p.top.c}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-ink)' }}>{p.bot.c}</div>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--v2-ink-dim)', marginTop: 5 }}>
                {TG_KR[p.top.c] ?? ''}{DZ_KR[p.bot.c] ?? ''}
              </div>
            </div>
          ))}
        </div>
      </V2Glass>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            height: 13, borderRadius: 7, background: 'rgba(255,255,255,.06)',
            width: ['92%', '78%', '86%'][i],
            animation: `ie-pulse 1.6s ${i * 0.22}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes ie-pulse{0%,100%{opacity:.35}50%{opacity:.75}}
        @keyframes ie-think{0%,100%{opacity:.25;transform:translateY(3px)}50%{opacity:1;transform:translateY(-3px)}}
      `}</style>
    </>
  );
}

/* ─── 실패 ────────────────────────────────────────────────── */
function Failed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <V2Glass style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-ink)' }}>리포트를 만들지 못했어요</div>
      <div style={{ fontSize: 12.5, color: 'var(--v2-ink-dim)', marginTop: 8, lineHeight: 1.6 }}>
        결제는 그대로 남아 있어요. 다시 시도하면 새로 만들어 드립니다.
      </div>
      <div onClick={onRetry} style={{
        marginTop: 16, padding: '13px 0', borderRadius: 14, cursor: 'pointer',
        background: withAlpha(GOLD, .16), border: `1px solid ${withAlpha(GOLD, .34)}`,
        fontSize: 14.5, fontWeight: 800, color: 'var(--v2-ink)',
      }}>다시 시도</div>
      <div style={{ fontSize: 10, color: 'var(--v2-ink-dim)', marginTop: 10, wordBreak: 'break-all' }}>
        {message.slice(0, 160)}
      </div>
    </V2Glass>
  );
}

/* ─── 마크다운 ────────────────────────────────────────────── */
/** 서버가 주는 마크다운은 제목 두 단계, 굵은 글씨, 목록, 문단뿐이라 직접 처리한다. */
function inline(s: string, key: number) {
  return (
    <span key={key}>
      {s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} style={{ color: 'var(--v2-ink)', fontWeight: 800 }}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>,
      )}
    </span>
  );
}

function Markdown({ text, ms, profile }: {
  text: string;
  ms: Myeongsik;
  profile: { year: number; gender: 'male' | 'female' };
}) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 연속된 목록은 한 덩어리로 묶는다. 줄 단위로 그리면 표를 만들 수 없다.
  const blocks: { kind: 'line' | 'list'; lines: string[] }[] = [];
  for (const line of lines) {
    const isItem = line.startsWith('- ');
    const last = blocks[blocks.length - 1];
    if (isItem && last?.kind === 'list') last.lines.push(line);
    else blocks.push({ kind: isItem ? 'list' : 'line', lines: [line] });
  }

  const thisYear = new Date().getFullYear();

  return (
    <div style={{ marginTop: 18 }}>
      {blocks.map((blk, i) => {
        if (blk.kind === 'list') {
          // "- **2026년(병오)** — 설명" 꼴이면 표로. 아니면 그냥 목록.
          const rows = blk.lines.map((l) => {
            const m = l.match(/^-\s*\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
            return m ? { head: m[1], body: m[2] } : null;
          });
          if (rows.length >= 2 && rows.every(Boolean)) {
            return <YearTable key={i} rows={rows as { head: string; body: string }[]} thisYear={thisYear} />;
          }
          return (
            <div key={i}>
              {blk.lines.map((l, j) => (
                <div key={j} style={{ display: 'flex', gap: 9, marginTop: 9, alignItems: 'baseline' }}>
                  <span style={{ color: withAlpha(GOLD, .7), fontSize: 11 }}>·</span>
                  <span style={{ fontSize: 14, lineHeight: 1.78, color: 'var(--v2-ink-mid)' }}>
                    {inline(l.slice(2), j)}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        const line = blk.lines[0];

        if (line.startsWith('## ')) {
          const title = line.slice(3);
          // 각 장을 그림으로 연다. 1장은 근거가 되는 여덟 글자, 2장은 대운 흐름.
          const isFirst = title.trimStart().startsWith('1');
          return (
            <div key={i}>
              <div style={{
                fontSize: 19, fontWeight: 800, color: 'var(--v2-ink)',
                marginTop: i === 0 ? 0 : 34, marginBottom: 4,
              }}>{title}</div>
              {isFirst
                ? <MyeongsikPanel ms={ms} />
                : <DaewoonPanel ms={ms} profile={profile} />}
            </div>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <div key={i} style={{
              fontSize: 15, fontWeight: 800, color: GOLD, marginTop: 26, marginBottom: 10,
            }}>{line.slice(4)}</div>
          );
        }
        if (line.startsWith('> ')) {
          return <PullQuote key={i} text={line.slice(2).replace(/\*\*/g, '')} />;
        }
        return (
          <p key={i} style={{ fontSize: 14.5, lineHeight: 1.85, color: 'var(--v2-ink-mid)', marginTop: 13 }}>
            {inline(line, i)}
          </p>
        );
      })}
    </div>
  );
}

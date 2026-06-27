/**
 * 토스 미니앱 리워드 광고 wrapper.
 *
 * 정책 원칙:
 * - 'rewarded': userEarnedReward 이벤트 수신 (정령 기운 보너스 지급 기준)
 * - 'watched':  보상 이벤트가 없더라도 광고가 실제 노출(show/impression)된 뒤 닫힌 경우.
 *               통합 SDK가 토스 자체(하우스) 광고를 노출하거나 iOS에서 userEarnedReward를
 *               안/늦게 쏘는 케이스에서도 "광고 시청 = 콘텐츠 해제"가 되도록 해 사용자가 갇히지 않게 함.
 * - 'dismissed': 광고가 노출되기 전에 사용자가 닫음 → 해제 불가(끝까지 보도록 안내)
 * - 'failed' / onError: 로드·표시 실패 (호출부에서 재시도/폴백 처리)
 * - Apps in Toss 인앱 광고 2.0 ver2 통합 SDK(loadFullScreenAd/showFullScreenAd)를 우선 사용
 * - 개발/QA에서는 공식 테스트 리워드 ID(ait-ad-test-rewarded-id)를 사용해야 함
 */

/** 리워드(보상형) 광고 그룹 ID — .env 의 VITE_AD_GROUP_ID */
export const AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID || 'TEST_AD_GROUP';

/** 전면형(interstitial) 광고 그룹 ID — 리워드와 별도 발급. .env 에 VITE_INTERSTITIAL_AD_GROUP_ID 로 작성(미설정 시 빈 값 → 전면광고 비활성). */
export const INTERSTITIAL_AD_GROUP_ID = import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID || '';

const AD_ENABLED = AD_GROUP_ID !== 'TEST_AD_GROUP' && AD_GROUP_ID.length > 0;

type WebFramework = typeof import('@apps-in-toss/web-framework');
type RewardedAdResult = 'rewarded' | 'watched' | 'dismissed' | 'failed' | 'unsupported' | 'not_configured';

let adApi: WebFramework | null = null;
let isLoading = false;
let isLoaded = false;
let loadingPromise: Promise<boolean> | null = null;

async function loadAdApi() {
  if (adApi) return adApi;
  try {
    adApi = await import('@apps-in-toss/web-framework');
    return adApi;
  } catch {
    console.warn('[ads] web-framework not available');
    return null;
  }
}

function isSupported(fn: unknown): boolean {
  if (typeof fn !== 'function') return false;
  try {
    return (fn as { isSupported?: () => boolean }).isSupported?.() === true;
  } catch {
    return false;
  }
}

export async function preloadRewardedAdForResult() {
  if (!AD_ENABLED) return false;
  if (isLoaded) return true;
  if (isLoading && loadingPromise) return loadingPromise;

  const api = await loadAdApi();
  const loadFn = api?.loadFullScreenAd;

  if (!isSupported(loadFn)) {
    console.info('[ads] loadFullScreenAd unsupported');
    return false;
  }

  isLoading = true;
  loadingPromise = new Promise<boolean>((resolve) => {
    let settled = false;
    let unregister: (() => void) | undefined;

    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      isLoading = false;
      isLoaded = ok;
      loadingPromise = null;
      unregister?.();
      resolve(ok);
    };

    try {
      unregister = loadFn!({
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event) => {
          if (event.type === 'loaded') {
            settle(true);
          }
        },
        onError: (error) => {
          console.warn('[ads] reward load failed', error);
          settle(false);
        },
      });
      // 콜드 스타트(세션 첫 광고)는 SDK 워밍업+필 요청에 5초 이상 걸릴 수 있어 넉넉히.
      setTimeout(() => settle(false), 12000);
    } catch (error) {
      console.warn('[ads] reward load threw', error);
      settle(false);
    }
  });

  return loadingPromise;
}

/**
 * 리워드 광고를 표시.
 * - 보상 이벤트(userEarnedReward) 수신 → 'rewarded'
 * - 보상 이벤트는 없지만 광고가 실제 노출된 뒤 닫힘 → 'watched' (콘텐츠 해제 허용)
 * - 노출 전에 닫힘 → 'dismissed' / 로드·표시 실패 → 'failed'
 */
export async function showRewardedAdForResult(): Promise<RewardedAdResult> {
  if (!AD_ENABLED) return 'not_configured';

  const api = await loadAdApi();
  const showFn = api?.showFullScreenAd;

  if (!isSupported(showFn)) return 'unsupported';

  const loaded = await preloadRewardedAdForResult();
  if (!loaded) return 'failed';

  // show는 로드된 광고를 1회 소진한다. 이후에는 반드시 새 load가 필요하다.
  isLoaded = false;

  return new Promise<RewardedAdResult>((resolve) => {
    let settled = false;
    let rewarded = false;
    let displayed = false; // 광고가 실제로 화면에 노출됐는지 (show 또는 impression)
    let unregister: (() => void) | undefined;

    const settle = (result: RewardedAdResult) => {
      if (settled) return;
      settled = true;
      unregister?.();
      resolve(result);
      // Chain preload — 한 광고 소진 직후 다음 광고 백그라운드 로드.
      // 같은 세션에서 다른 메뉴 진입 시 즉시 ready 상태로 만들기 위함.
      // 실패는 무시 (다음 게이트에서 재시도).
      preloadRewardedAdForResult().catch(() => {});
    };

    try {
      unregister = showFn!({
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event) => {
          // 운영 진단용 — 어떤 이벤트 시퀀스가 오는지 추적 (특히 iOS userEarnedReward 미수신 케이스)
          console.info('[ads] reward event:', event.type);
          switch (event.type) {
            case 'userEarnedReward':
              rewarded = true;
              settle('rewarded');
              break;
            case 'show':
            case 'impression':
              displayed = true;
              break;
            case 'dismissed':
              // 보상 이벤트가 없더라도, 광고가 실제 노출된 뒤 닫혔다면 '시청 완료'로 간주(콘텐츠 해제용).
              // 노출 전에 닫혔다면(=사용자가 바로 닫음) 'dismissed' → 해제 불가.
              settle(rewarded ? 'rewarded' : displayed ? 'watched' : 'dismissed');
              break;
            case 'failedToShow':
              settle('failed');
              break;
            case 'requested':
            case 'clicked':
              break;
          }
        },
        onError: (error) => {
          console.warn('[ads] reward show failed', error);
          settle('failed');
        },
      });
      // dismissed 이벤트가 끝내 누락되는 경우 대비. 노출됐었다면 '시청'으로 인정.
      setTimeout(() => settle(rewarded ? 'rewarded' : displayed ? 'watched' : 'failed'), 60_000);
    } catch (error) {
      console.warn('[ads] reward show threw', error);
      settle('failed');
    }
  });
}

/**
 * 전면형(interstitial) 광고 1회 노출. 노출 빈도 제어(라우트별 하루 1회)는 호출부(InterstitialView)가 담당.
 * INTERSTITIAL_AD_GROUP_ID 미설정/미지원 환경에선 조용히 패스.
 */
export async function showInterstitialAd(): Promise<void> {
  if (!INTERSTITIAL_AD_GROUP_ID) return;

  const api = await loadAdApi();
  const loadFn = api?.loadFullScreenAd;
  const showFn = api?.showFullScreenAd;
  if (!isSupported(loadFn) || !isSupported(showFn)) return;

  const loaded = await new Promise<boolean>((resolve) => {
    let done = false;
    let unregister: (() => void) | undefined;
    const fin = (ok: boolean) => { if (done) return; done = true; unregister?.(); resolve(ok); };
    try {
      unregister = loadFn!({
        options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
        onEvent: (event) => { if (event.type === 'loaded') fin(true); },
        onError: () => fin(false),
      });
      setTimeout(() => fin(false), 5000);
    } catch { fin(false); }
  });
  if (!loaded) return;

  await new Promise<void>((resolve) => {
    let done = false;
    let unregister: (() => void) | undefined;
    const fin = () => { if (done) return; done = true; unregister?.(); resolve(); };
    try {
      unregister = showFn!({
        options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
        onEvent: (event) => { if (event.type === 'dismissed' || event.type === 'failedToShow') fin(); },
        onError: () => fin(),
      });
      setTimeout(fin, 60_000);
    } catch { fin(); }
  });
}

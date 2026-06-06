/**
 * 토스 미니앱 리워드 광고 wrapper.
 *
 * 정책 원칙:
 * - 결과 공개는 userEarnedReward 이벤트가 발생했을 때만 허용
 * - dismissed / failedToShow / onError 로는 결과를 열지 않음
 * - Apps in Toss 인앱 광고 2.0 ver2 통합 SDK(loadFullScreenAd/showFullScreenAd)를 우선 사용
 * - 개발/QA에서는 공식 테스트 리워드 ID(ait-ad-test-rewarded-id)를 사용해야 함
 */

/** 리워드(보상형) 광고 그룹 ID — .env 의 VITE_AD_GROUP_ID */
export const AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID || 'TEST_AD_GROUP';

/** 전면형(interstitial) 광고 그룹 ID — 리워드와 별도 발급. .env 에 VITE_INTERSTITIAL_AD_GROUP_ID 로 작성(미설정 시 빈 값 → 전면광고 비활성). */
export const INTERSTITIAL_AD_GROUP_ID = import.meta.env.VITE_INTERSTITIAL_AD_GROUP_ID || '';

const AD_ENABLED = AD_GROUP_ID !== 'TEST_AD_GROUP' && AD_GROUP_ID.length > 0;

type WebFramework = typeof import('@apps-in-toss/web-framework');
type RewardedAdResult = 'rewarded' | 'dismissed' | 'failed' | 'unsupported' | 'not_configured';

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
      setTimeout(() => settle(false), 5000);
    } catch (error) {
      console.warn('[ads] reward load threw', error);
      settle(false);
    }
  });

  return loadingPromise;
}

/**
 * 리워드 광고를 표시하고, 끝까지 시청해 보상 이벤트를 받은 경우에만 'rewarded'를 반환.
 * dismissed/failed/onError는 결과 공개로 이어지면 안 된다.
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
          switch (event.type) {
            case 'userEarnedReward':
              rewarded = true;
              settle('rewarded');
              break;
            case 'dismissed':
              settle(rewarded ? 'rewarded' : 'dismissed');
              break;
            case 'failedToShow':
              settle('failed');
              break;
            case 'requested':
            case 'show':
            case 'impression':
            case 'clicked':
              break;
          }
        },
        onError: (error) => {
          console.warn('[ads] reward show failed', error);
          settle('failed');
        },
      });
      // Android 특정 버전에서 dismissed 누락 가능. 단, reward 이벤트 없으면 결과 공개 금지.
      setTimeout(() => settle(rewarded ? 'rewarded' : 'failed'), 60_000);
    } catch (error) {
      console.warn('[ads] reward show threw', error);
      settle('failed');
    }
  });
}

let lastInterstitialAt = 0;
const INTERSTITIAL_COOLDOWN_MS = 60_000;

/**
 * 전면형(interstitial) 광고 1회 노출. 비차단(fire-and-forget). 쿨다운 내 재호출은 무시.
 * INTERSTITIAL_AD_GROUP_ID 미설정/미지원 환경에선 조용히 패스.
 */
export async function showInterstitialAd(): Promise<void> {
  if (!INTERSTITIAL_AD_GROUP_ID) return;
  const t = Date.now();
  if (t - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return;

  const api = await loadAdApi();
  const loadFn = api?.loadFullScreenAd;
  const showFn = api?.showFullScreenAd;
  if (!isSupported(loadFn) || !isSupported(showFn)) return;
  lastInterstitialAt = t;

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

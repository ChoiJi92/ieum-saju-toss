/**
 * 토스 미니앱 AdMob 광고 wrapper.
 *
 * - 운세 진입 직전 인터스티셜 노출 (운세 보기마다)
 * - 광고 로드 실패 / 환경 미지원 시 fallback (그냥 결과 보여주기)
 * - 광고 그룹 ID(`adGroupId`)는 출시 전 토스 콘솔에서 발급받아 .env 또는 상수로 주입
 *
 * AdMob API:
 *   showAdMobInterstitialAd({ onEvent, options: { adGroupId } })
 *   onEvent(data) — { type: 'opened' | 'closed' | 'failed' | ... }
 */

// 콘솔 발급 전 placeholder. 출시 직전 실제 ID로 교체.
export const AD_GROUP_ID = import.meta.env?.VITE_AD_GROUP_ID || 'TEST_AD_GROUP';

let adApi: typeof import('@apps-in-toss/web-framework') | null = null;

async function loadAdApi() {
  if (adApi) return adApi;
  try {
    adApi = await import('@apps-in-toss/web-framework');
    return adApi;
  } catch (e) {
    console.warn('[ads] web-framework not available — running in browser dev mode');
    return null;
  }
}

/**
 * 인터스티셜 광고 노출 후 콜백.
 * 광고가 닫히면 onClose 호출 (실제 결과 화면으로 이동).
 * 광고 로드 실패 / 미지원 환경이면 onClose 즉시 호출 (광고 없이 진행).
 */
export async function showInterstitialThen(onClose: () => void) {
  const api = await loadAdApi();

  // 토스 web-framework 에서 export 되는 함수명. 1.5.x에서는 `showAdMobInterstitialAd` 시그니처.
  // (RN/web 양쪽에서 동일 이름. web-bridge가 토스 앱 native 로 IPC 전달)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const showFn: any = (api as any)?.showAdMobInterstitialAd;

  if (!showFn || typeof showFn !== 'function') {
    // 데스크톱 dev 환경 또는 Granite 미설치 → 즉시 결과로
    console.info('[ads] showAdMobInterstitialAd unavailable → fallback to result');
    onClose();
    return;
  }

  let resolved = false;
  const finish = () => {
    if (resolved) return;
    resolved = true;
    onClose();
  };

  try {
    showFn({
      onEvent: (data: { type?: string }) => {
        // 가능한 type: 'opened' / 'closed' / 'failed' / 'rewarded' 등 (AdMob 표준)
        if (!data?.type) return;
        if (data.type === 'closed' || data.type === 'failed' || data.type === 'dismissed') {
          finish();
        }
      },
      options: { adGroupId: AD_GROUP_ID },
    });
    // 안전 fallback — 8초 안에 콜백 안 오면 강제 진행
    setTimeout(finish, 8000);
  } catch (e) {
    console.warn('[ads] interstitial threw — fallback', e);
    finish();
  }
}

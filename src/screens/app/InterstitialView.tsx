import { useEffect } from 'react';
import { showInterstitialAd } from '../../lib/ads';

/** 전면형 라우트 진입 시 짧은 광고 1회(쿨다운). 콘텐츠는 즉시 렌더(비차단). */
export default function InterstitialView({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  useEffect(() => {
    showInterstitialAd().catch(() => {});
  }, [routeKey]);
  return <>{children}</>;
}

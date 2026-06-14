import { useEffect, useState } from 'react';
import { showInterstitialAd } from '../../lib/ads';

/**
 * 전면형 라우트 — 진입 시 광고를 "먼저" 보여주고, 광고가 끝나면 콘텐츠 공개.
 * showInterstitialAd()는 광고 닫힘 후 resolve(쿨다운·미지원·실패 시 즉시 resolve)되므로,
 * 이걸 기다렸다 children을 렌더하면 '읽다가 끊김' 없이 광고→콘텐츠 순서가 보장됨.
 * 안전장치: 광고가 끝내 resolve 안 되더라도 8초 후 콘텐츠를 공개해 갇힘 방지.
 */
export default function InterstitialView({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    let cancelled = false;
    const reveal = () => { if (!cancelled) setReady(true); };
    const safety = window.setTimeout(reveal, 8000);
    showInterstitialAd().finally(() => { window.clearTimeout(safety); reveal(); });
    return () => { cancelled = true; window.clearTimeout(safety); };
  }, [routeKey]);

  if (!ready) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(180deg, #2a2046, #1e1635 55%, #14101f)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ fontFamily: 'var(--v2-serif)', fontSize: 40, color: '#fff', textShadow: '0 0 24px rgba(183,156,255,.9)', animation: 'v2-breathe 1.6s ease-in-out infinite' }}>✦</div>
        <div style={{ fontSize: 13, color: 'var(--v2-ink-dim)', fontFamily: 'var(--v2-font)' }}>운세를 준비하고 있어요…</div>
      </div>
    );
  }
  return <>{children}</>;
}

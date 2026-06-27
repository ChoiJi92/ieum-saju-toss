import { useEffect, useState } from 'react';
import { showInterstitialAd } from '../../lib/ads';

/**
 * 전면형 라우트 — 진입 시 광고를 "먼저" 보여주고, 끝나면 콘텐츠 공개.
 * 노출 빈도: 라우트별 "하루 1회"(자정 리셋). 같은 날 재방문은 광고 없이 즉시 공개, 다음 날엔 다시 노출.
 * showInterstitialAd()는 광고 닫힘 후 resolve(쿨다운·미지원·실패 시 즉시)되므로 기다렸다 children 렌더.
 * 안전장치: 광고가 끝내 resolve 안 돼도 8초 후 콘텐츠 공개(갇힘 방지).
 */
const KEY = 'ieum-saju.interstitial.v1';
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function shownToday(routeKey: string): boolean {
  try { return (JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, string>)[routeKey] === todayStr(); } catch { return false; }
}
function markShown(routeKey: string): void {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, string>;
    o[routeKey] = todayStr();
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch { /* ignore */ }
}

export default function InterstitialView({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  const [ready, setReady] = useState(() => shownToday(routeKey)); // 오늘 이미 봤으면 즉시 공개(로딩 없음)

  useEffect(() => {
    if (shownToday(routeKey)) { setReady(true); return; }
    let cancelled = false;
    const reveal = () => { if (!cancelled) setReady(true); };
    const safety = window.setTimeout(reveal, 8000);
    // 광고가 실제로 끝/실패로 resolve된 뒤에 "오늘 봄" 기록 — 광고 실패 시 슬롯 소진(수익 누락) 방지
    showInterstitialAd().finally(() => { markShown(routeKey); window.clearTimeout(safety); reveal(); });
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

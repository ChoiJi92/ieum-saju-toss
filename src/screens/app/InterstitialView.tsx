import { useState } from 'react';
import { V2Screen, V2TopBar, V2Button, V2Glass, SelfSpiritSlot } from './_kit';
import { showInterstitialAd } from '../../lib/ads';
import { 이가 } from '../../lib/hangul';
import type { Spirit } from '../../lib/spirit';

/**
 * 전면형 라우트 — 광고를 먼저 보여주고 끝나면 콘텐츠 공개.
 *
 * 예전에는 진입하자마자 광고를 자동 재생했다. 화면에는 "운세를 준비하고 있어요…"만 떠서
 * 광고가 나올 거라는 걸 알 방법이 없었고, 2026-09-01 검수에서 그 이유로 반려됐다.
 *   "유저가 예상하기 어려운 시점에 광고가 노출돼요. 광고 노출 전에 유저가 인지할 수 있도록
 *    CTA 문구나 UI를 추가해 주세요."
 * 그래서 눌러야 시작하는 문으로 바꿨다. 이미 승인받은 RewardedGate 와 같은 모양이다.
 *
 * 노출 빈도: 라우트별 하루 1회(자정 리셋). 같은 날 재방문은 문 없이 바로 열린다.
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

export default function InterstitialView({ routeKey, title, back, spirit, children }: {
  routeKey: string;
  title: string;
  back: () => void;
  spirit: Spirit;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(() => shownToday(routeKey)); // 오늘 이미 봤으면 바로 공개
  const [loading, setLoading] = useState(false);

  const watch = async () => {
    if (loading) return;
    setLoading(true);
    // 광고가 끝내 응답하지 않아도 8초 뒤에는 열어준다 (사용자를 가두지 않는다).
    const safety = window.setTimeout(() => { markShown(routeKey); setReady(true); }, 8000);
    try {
      await showInterstitialAd();
    } finally {
      window.clearTimeout(safety);
      markShown(routeKey);
      setReady(true);
    }
  };

  if (ready) return <>{children}</>;

  return (
    <V2Screen seed={19}>
      <V2TopBar onBack={back} title={title} />
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <SelfSpiritSlot spirit={spirit} size={140} tag={false} />
        <h2 className="v2-hero" style={{ margin: '8px 0 6px' }}>{title}</h2>
        <p className="v2-body" style={{ color: 'var(--v2-ink-dim)', margin: '0 20px' }}>
          광고가 끝나면 {이가(title)} 열려요 ✦
        </p>
      </div>
      <V2Glass style={{ marginTop: 18, textAlign: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--v2-ink-dim)' }}>
          하루에 한 번만 나와요. 오늘은 다시 열어도 광고 없이 바로 보여요.
        </span>
      </V2Glass>
      <div style={{ marginTop: 24 }}>
        <V2Button onClick={watch}>{loading ? '광고 여는 중…' : `광고 보고 ${title} 열기 ✦`}</V2Button>
      </div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

import { useEffect, useRef, useState } from 'react';
import { V2Screen, V2TopBar, V2Button, V2Glass, SelfSpiritSlot } from './_kit';
import { preloadRewardedAdForResult, showRewardedAdForResult } from '../../lib/ads';
import type { Spirit } from '../../lib/spirit';

export default function RewardedGate({ title, back, spirit, unlocked, onUnlock, children }: { title: string; back: () => void; spirit: Spirit; unlocked: boolean; onUnlock: () => void; children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  // 로드/표시가 반복 실패하면 콘텐츠가 영영 안 열리는 일이 없도록 폴백 카운터
  const failRef = useRef(0);

  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const canBypass = import.meta.env.DEV && import.meta.env.VITE_AD_DEV_BYPASS !== 'false' && isLocalhost;

  useEffect(() => {
    if (unlocked) return;
    let cancelled = false;
    (async () => {
      if (canBypass) { setPreparing(false); setMessage('로컬 개발모드: 광고 없이 볼 수 있어요.'); return; }
      setPreparing(true);
      const ready = await preloadRewardedAdForResult();
      if (cancelled) return;
      setPreparing(false);
      if (!ready) setMessage('광고 준비가 늦어지고 있어요. 잠시 후 다시 시도해주세요.');
    })();
    return () => { cancelled = true; };
  }, [canBypass, unlocked]);

  const watch = async () => {
    if (loading || preparing) return;
    setLoading(true); setMessage(null);
    let r = await showRewardedAdForResult();
    // 콜드 스타트로 첫 로드가 실패하면 SDK가 데워진 상태로 1회 조용히 재시도
    if (r === 'failed') {
      setMessage('광고 준비 중… 잠시만요');
      r = await showRewardedAdForResult();
    }
    setLoading(false);
    // 광고를 끝까지(또는 실제 노출 후) 봤으면 공개
    if (r === 'rewarded' || r === 'watched') { onUnlock(); return; }
    // 광고를 띄울 수 없는 환경/미설정이면 콘텐츠를 가두지 않고 공개
    if (r === 'unsupported' || r === 'not_configured') { onUnlock(); return; }
    // 노출 전에 사용자가 닫음 → 끝까지 보도록 안내 (재시도 가능)
    if (r === 'dismissed') { setMessage('광고를 끝까지 보면 운세가 열려요.'); return; }
    // 'failed' — 로드/표시 실패가 반복되면 사용자를 가두지 않도록 폴백 공개
    failRef.current += 1;
    if (failRef.current >= 2) { setMessage('광고가 원활하지 않아 이번엔 바로 열어드릴게요.'); onUnlock(); return; }
    setMessage('광고를 불러오지 못했어요. 다시 시도해주세요.');
  };

  if (unlocked) return <>{children}</>;

  return (
    <V2Screen seed={19}>
      <V2TopBar onBack={back} title={title} />
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <SelfSpiritSlot spirit={spirit} size={140} tag={false} />
        <h2 className="v2-hero" style={{ margin: '8px 0 6px' }}>{title}</h2>
        <p className="v2-body" style={{ color: 'var(--v2-ink-dim)', margin: '0 20px' }}>광고를 끝까지 보면 이 운세가 열려요 ✦</p>
      </div>
      {message && <V2Glass style={{ marginTop: 18, textAlign: 'center' }}><span style={{ color: canBypass ? 'var(--v2-mint)' : 'var(--v2-peach)', fontSize: 13, fontWeight: 700 }}>{message}</span></V2Glass>}
      <div style={{ marginTop: 24 }}>
        <V2Button onClick={watch}>{loading ? '광고 여는 중…' : preparing ? '광고 준비 중…' : '광고 보고 운세 열기 ✦'}</V2Button>
        {canBypass && <V2Button kind="glass" style={{ marginTop: 10 }} onClick={onUnlock}>로컬: 광고 없이 보기</V2Button>}
      </div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

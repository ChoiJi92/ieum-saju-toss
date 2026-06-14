import { useEffect, useState } from 'react';
import { V2Screen, V2TopBar, V2Button, V2Glass, SpiritSlot } from './_kit';
import { preloadRewardedAdForResult, showRewardedAdForResult } from '../../lib/ads';
import type { Spirit } from '../../lib/spirit';

export default function RewardedGate({ title, back, spirit, unlocked, onUnlock, children }: { title: string; back: () => void; spirit: Spirit; unlocked: boolean; onUnlock: () => void; children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

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
    if (r === 'rewarded') { onUnlock(); return; }
    if (r === 'dismissed') setMessage('광고를 끝까지 보면 운세가 열려요.');
    else if (r === 'not_configured') setMessage('아직 광고가 설정되지 않았어요.');
    else if (r === 'unsupported') setMessage('지금 환경에선 광고를 볼 수 없어요. 토스 앱에서 확인해주세요.');
    else setMessage('광고를 불러오지 못했어요. 다시 시도해주세요.');
  };

  if (unlocked) return <>{children}</>;

  return (
    <V2Screen seed={19}>
      <V2TopBar onBack={back} title={title} />
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <SpiritSlot spirit={spirit} size={140} tag={false} />
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

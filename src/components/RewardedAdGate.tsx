import { useEffect, useState } from 'react';
import { IEButton, IEModal, MoodOrb } from './ie';
import { preloadRewardedAdForResult, showRewardedAdForResult } from '../lib/ads';
import { grantAdPass, hasActiveAdPass } from '../lib/ad-pass';

type RewardedAdGateProps = {
  title: string;
  description?: string;
  onCancel: () => void;
  onUnlocked?: () => void;
  children?: React.ReactNode;
};

export function RewardedAdGate({
  title,
  description = '짧은 리워드 광고를 끝까지 보면 결과를 바로 열어드릴게요.',
  onCancel,
  onUnlocked,
  children,
}: RewardedAdGateProps) {
  const [unlocked, setUnlocked] = useState(() => hasActiveAdPass());
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [adReady, setAdReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isLocalhost = typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  // 기본값: 로컬 DEV에서는 우회 ON. 명시적으로 false일 때만 끔.
  const devBypassEnabled = import.meta.env.DEV && import.meta.env.VITE_AD_DEV_BYPASS !== 'false';
  const canBypassInLocal = isLocalhost && devBypassEnabled;

  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      if (hasActiveAdPass()) {
        setUnlocked(true);
        onUnlocked?.();
        return;
      }

      if (canBypassInLocal) {
        setPreparing(false);
        setAdReady(false);
        setMessage('로컬 개발모드: 광고 없이 결과 확인이 가능합니다.');
        return;
      }

      setPreparing(true);
      const ready = await preloadRewardedAdForResult();
      if (cancelled) return;
      setAdReady(ready);
      setPreparing(false);
      if (!ready) {
        setMessage('광고 준비가 조금 늦어지고 있어요. 잠시 후 다시 시도해주세요.');
      }
    };

    preload();

    return () => {
      cancelled = true;
    };
  }, [canBypassInLocal, onUnlocked]);

  const handleBypassUnlock = () => {
    if (!canBypassInLocal) return;
    setUnlocked(true);
    onUnlocked?.();
  };

  const handleWatchAd = async () => {
    if (loading || preparing) return;
    setLoading(true);
    setMessage(null);

    const result = await showRewardedAdForResult();
    setLoading(false);
    setAdReady(false);

    if (result === 'rewarded') {
      grantAdPass();
      setUnlocked(true);
      onUnlocked?.();
      return;
    }

    if (result === 'dismissed') {
      setMessage('광고 시청이 완료되지 않았어요. 결과를 보려면 광고를 끝까지 시청해주세요.');
      return;
    }

    if (result === 'not_configured') {
      setMessage('아직 광고 ID가 설정되지 않았어요. 테스트할 때는 리워드 테스트 ID를 넣어주세요.');
      return;
    }

    if (result === 'unsupported') {
      setMessage('현재 환경에서는 광고를 볼 수 없어요. 토스 앱 QR 테스트 환경에서 다시 확인해주세요.');
      return;
    }

    setMessage('광고를 불러오지 못했어요. 네트워크 상태를 확인하고 다시 시도해주세요.');
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cp-bg)' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <MoodOrb size={120} />
          <div style={{ marginTop: 16, fontSize: 14, fontWeight: 700, color: 'var(--cp-text-mid)' }}>
            결과 열람 방식을 선택해주세요
          </div>
        </div>
      </div>

      <IEModal
        open
        title={title}
        body={
          <div>
            <p style={{ margin: 0 }}>{description}</p>
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 14,
                background: 'rgba(157, 123, 255, 0.10)',
                color: 'var(--cp-text-mid)',
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              광고를 끝까지 시청하면 즉시 결과가 열리고,
              그 뒤 5분 동안은 이음패스로 다른 메뉴도 바로 볼 수 있어요.
            </div>
            {message && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 14,
                  background: canBypassInLocal ? 'rgba(61, 199, 149, 0.16)' : 'rgba(255, 139, 108, 0.14)',
                  color: canBypassInLocal ? '#1E7A5B' : '#C65A3D',
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                {message}
              </div>
            )}
            {canBypassInLocal && (
              <div style={{ marginTop: 12 }}>
                <IEButton onClick={handleBypassUnlock} style={{ width: '100%', background: '#3DC795' }}>
                  로컬 개발용: 광고 없이 결과 보기
                </IEButton>
              </div>
            )}
          </div>
        }
        cancelLabel="돌아가기"
        confirmLabel={
          loading
            ? '광고 여는 중…'
            : preparing
              ? '광고 준비 중…'
              : adReady
                ? '광고 보고 결과보기'
                : '광고 다시 시도하기'
        }
        onCancel={loading || preparing ? () => {} : onCancel}
        onConfirm={handleWatchAd}
      />
    </div>
  );
}

export function RewardedUnlockButton({
  disabled,
  onClick,
  children = '광고 보고 결과보기',
}: {
  disabled?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <IEButton
      onClick={() => !disabled && onClick()}
      style={{ opacity: disabled ? 0.45 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
    >
      {children}
    </IEButton>
  );
}

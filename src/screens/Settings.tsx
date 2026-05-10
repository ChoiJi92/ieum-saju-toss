import { IECard, IETopBar } from '../components/ie';
import { useRouter, ScreenId } from '../lib/router';

/**
 * 11 설정 — 광고 모델로 프리미엄 항목 제거.
 * (원본 프로토타입에 있던 '💎 프리미엄' / paywall 링크 X)
 */
export default function ScreenSettings() {
  const { back, go } = useRouter();

  const items: Array<{
    ic: string;
    lbl: string;
    sub?: string;
    go?: () => void;
    danger?: boolean;
  }> = [
    { ic: '👤', lbl: '내 정보', sub: '김토스 · 1998.06.14', go: () => go('input' as ScreenId) },
    { ic: '🔔', lbl: '알림 설정', sub: '매일 오전 9시 · 켜짐' },
    { ic: '📚', lbl: '히스토리', sub: '풀이 기록 보기', go: () => go('history' as ScreenId) },
    { ic: '📜', lbl: '약관 / 정책' },
    { ic: '🚪', lbl: '로그아웃', danger: true },
  ];

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 62, flexShrink: 0 }} />
      <IETopBar onBack={back} title="설정" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        <IECard flat style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((x, i) => (
            <div
              key={x.lbl}
              onClick={x.go}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 18px',
                borderBottom: i < items.length - 1 ? '1px solid var(--cp-border)' : 'none',
                cursor: x.go ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontSize: 18 }}>{x.ic}</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: x.danger ? '#FF8B6C' : 'var(--cp-text)',
                  }}
                >
                  {x.lbl}
                </div>
                {x.sub && (
                  <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                    {x.sub}
                  </div>
                )}
              </div>
              {x.go && <span style={{ fontSize: 18, color: 'var(--cp-text-mute)' }}>›</span>}
            </div>
          ))}
        </IECard>
        <div
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 11,
            color: 'var(--cp-text-mute)',
          }}
        >
          이음사주 v1.0.0
        </div>
      </div>
    </div>
  );
}

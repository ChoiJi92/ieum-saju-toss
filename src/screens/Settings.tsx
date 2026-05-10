import { IECard, IETopBar } from '../components/ie';
import { useRouter, ScreenId } from '../lib/router';
import { useSaju } from '../lib/saju-state';

/**
 * 11 설정 — 광고 모델로 프리미엄 항목 제거.
 * 약관·개인정보 처리방침은 노션 공개 URL 외부 링크.
 */

const TERMS_URL =
  'https://fantasy-bait-347.notion.site/35c1c45e9e7981c39010d7e155fdcc16';
const PRIVACY_URL =
  'https://fantasy-bait-347.notion.site/35c1c45e9e798101b98fe0c70bef0961';

/** 외부 URL 열기 — 토스 web-bridge 가 있으면 그걸로, 없으면 window.open */
function openExternal(url: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (typeof w.openExternalUrl === 'function') {
    w.openExternalUrl(url);
  } else if (typeof w.openLink === 'function') {
    w.openLink(url);
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export default function ScreenSettings() {
  const { back, go } = useRouter();
  const { profile } = useSaju();

  const items: Array<{
    ic: string;
    lbl: string;
    sub?: string;
    go?: () => void;
    danger?: boolean;
  }> = [
    {
      ic: '👤',
      lbl: '내 정보',
      sub: profile
        ? `${profile.name} · ${profile.year}.${String(profile.month).padStart(2, '0')}.${String(profile.day).padStart(2, '0')}`
        : '미입력',
      go: () => go('input' as ScreenId),
    },
    { ic: '🔔', lbl: '알림 설정', sub: '매일 오전 9시 · 켜짐' },
    { ic: '📚', lbl: '히스토리', sub: '풀이 기록 보기', go: () => go('history' as ScreenId) },
    { ic: '📋', lbl: '서비스 이용약관', go: () => openExternal(TERMS_URL) },
    { ic: '🔒', lbl: '개인정보 처리방침', go: () => openExternal(PRIVACY_URL) },
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

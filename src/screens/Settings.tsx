import { useState } from 'react';
import { IECard, IEModal, IETopBar } from '../components/ie';
import { useRouter, ScreenId } from '../lib/router';
import { useSaju } from '../lib/saju-state';

/**
 * 11 설정 — 광고 모델로 프리미엄 항목 제거.
 * 약관·개인정보 처리방침은 인앱 페이지 (terms·privacy 화면).
 */

export default function ScreenSettings() {
  const { back, go, reset: resetRouter } = useRouter();
  const { profile, profiles, reset: resetSaju } = useSaju();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogoutConfirm = () => {
    resetSaju();
    setLogoutOpen(false);
    resetRouter('onboarding');
  };

  const items: Array<{
    ic: string;
    lbl: string;
    sub?: string;
    go?: () => void;
    danger?: boolean;
  }> = [
    {
      ic: '🌙',
      lbl: '사주 프로필',
      sub: profile ? `${profile.name} · 등록 ${profiles.length}개` : '미입력',
      go: () => go('profiles' as ScreenId),
    },
    { ic: '📋', lbl: '서비스 이용약관', go: () => go('terms' as ScreenId) },
    { ic: '🔒', lbl: '개인정보 처리방침', go: () => go('privacy' as ScreenId) },
    { ic: '🚪', lbl: '회원 탈퇴 · 정보 초기화', sub: '입력한 모든 정보 삭제 · 토스 연동 해지', go: () => setLogoutOpen(true), danger: true },
  ];

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
      <IEModal
        open={logoutOpen}
        title="회원 탈퇴 · 정보 초기화"
        body={
          <>
            입력한 사주 정보와 모든 풀이 데이터가
            <br />
            영구 삭제되고 처음 화면으로 돌아가요.
            <br />
            토스 로그인 정보도 함께 폐기돼요.
          </>
        }
        confirmLabel="탈퇴하기"
        cancelLabel="취소"
        danger
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}

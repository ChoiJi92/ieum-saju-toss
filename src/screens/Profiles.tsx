import { useState } from 'react';
import { IECard, IEModal, IETopBar } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju, type ProfileRelation, type StoredProfile } from '../lib/saju-state';

/**
 * 사주 프로필 관리 화면.
 * 본인 + 가족·친구·연인·기타 사주 다중 저장.
 * 활성 사주 = 모든 화면(오늘·이달·신년 등)의 기준.
 */

const RELATION_COLORS: Record<ProfileRelation, string> = {
  본인: '#9D7BFF',
  가족: '#3DC795',
  친구: '#5B8DEF',
  연인: '#F495C9',
  기타: '#FFC857',
};

export default function ScreenProfiles() {
  const { back, go } = useRouter();
  const { profiles, activeId, setActive, removeProfile, startEditingProfile } = useSaju();
  const [removeTarget, setRemoveTarget] = useState<StoredProfile | null>(null);

  const handleEdit = (p: StoredProfile) => {
    if (p.isSelf) {
      go('input');
    } else {
      startEditingProfile(p.id);
      go('addProfile');
    }
  };

  const handleRemove = () => {
    if (!removeTarget) return;
    removeProfile(removeTarget.id);
    setRemoveTarget(null);
  };

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title="사주 프로필" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        {/* 상단 안내 */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--cp-text-mid)',
            lineHeight: 1.6,
            margin: '8px 0 16px',
          }}
        >
          가족·친구·연인의 사주를 저장해두면 매번 입력 안 해도 돼요.
          <br />
          탭하면 그 사주로 풀이를 볼 수 있어요.
        </p>

        {/* 프로필 카드들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {profiles.map((p) => {
            const active = p.id === activeId;
            const color = RELATION_COLORS[p.relation];
            return (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                style={{
                  background: active ? color + '15' : 'var(--cp-bg-paper)',
                  border: `1.5px solid ${active ? color + '88' : 'var(--cp-border)'}`,
                  borderRadius: 'var(--cp-radius-lg)',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: 'var(--cp-font)',
                  transition: 'transform .12s',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${color}, ${color}88)`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: '#fff',
                    fontWeight: 800,
                  }}
                >
                  {p.name.slice(0, 1)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: color + '20',
                        color,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 0.3,
                      }}
                    >
                      {p.relation}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--cp-text-dim)',
                        fontWeight: 700,
                      }}
                    >
                      {p.gender === 'male' ? '남' : '여'}
                    </span>
                    {active && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: color,
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: 0.3,
                        }}
                      >
                        활성
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cp-text)' }}>
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--cp-text-dim)',
                      marginTop: 2,
                      fontWeight: 600,
                    }}
                  >
                    {p.year}.{String(p.month).padStart(2, '0')}.
                    {String(p.day).padStart(2, '0')}
                    {' '}
                    ({p.calendar === 'lunar' ? '음력' : '양력'})
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(p);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cp-text-mid)',
                      fontSize: 16,
                    }}
                    aria-label="편집"
                  >
                    ✏️
                  </button>
                  {!p.isSelf && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemoveTarget(p);
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--cp-text-mute)',
                        fontSize: 16,
                      }}
                      aria-label="삭제"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 새로 등록 CTA */}
        <button
          onClick={() => go('addProfile')}
          style={{
            marginTop: 14,
            width: '100%',
            padding: 16,
            borderRadius: 'var(--cp-radius-lg)',
            background: 'var(--cp-bg-paper)',
            border: '1.5px dashed var(--cp-border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            color: 'var(--cp-text-mid)',
            fontWeight: 800,
            fontSize: 14,
            fontFamily: 'var(--cp-font)',
          }}
        >
          <span style={{ fontSize: 18 }}>＋</span>
          새 사주 등록
        </button>

        {/* 안내 푸터 */}
        <IECard flat style={{ marginTop: 18, padding: 14, background: 'var(--cp-bg)' }}>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', lineHeight: 1.6, fontWeight: 600 }}>
            ⓘ 본인 외 가족·친구·연인의 정보를 입력하실 때는, 해당 정보 입력에 대한 책임은
            본인에게 있어요. 회사는 별도로 제3자 동의를 확인하지 않아요.
          </div>
        </IECard>
      </div>

      <IEModal
        open={!!removeTarget}
        title="이 사주를 삭제할까요?"
        body={
          removeTarget ? (
            <>
              <strong style={{ color: 'var(--cp-text)' }}>{removeTarget.name}</strong>의 사주 정보가
              삭제돼요.
              <br />
              풀이 기록은 함께 사라지지 않아요.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}

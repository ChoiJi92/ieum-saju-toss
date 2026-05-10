import { useEffect, useState } from 'react';
import { IECard, IETopBar, MoodOrb, OHAENG } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { showInterstitialThen } from '../lib/ads';

export default function ScreenMoney() {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);

  useEffect(() => {
    showInterstitialThen(() => setAdDone(true));
  }, []);

  if (!adDone)
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          padding: 24,
          background: 'var(--cp-bg)',
        }}
      >
        <MoodOrb size={120} palette={['#3DC795', '#FFC857']} />
        <div style={{ fontSize: 14, color: 'var(--cp-text-mid)', fontWeight: 700 }}>
          돈의 흐름을 살피는 중이에요…
        </div>
      </div>
    );

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 62, flexShrink: 0 }} />
      <IETopBar onBack={back} title="재물운" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        {/* 본인 정보 칩 */}
        {profile && myeongsik && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'var(--cp-bg-paper)',
                border: '1px solid var(--cp-border)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--cp-text-mid)',
              }}
            >
              <span>{profile.name}</span>
              <span style={{ color: 'var(--cp-text-mute)' }}>·</span>
              <strong style={{ color: OHAENG[myeongsik.ilgan.ohaeng].c, fontSize: 12 }}>
                {myeongsik.ilgan.c}
                {OHAENG[myeongsik.ilgan.ohaeng].cn}
              </strong>
            </span>
          </div>
        )}
        <IECard pop>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'rgba(42,35,51,0.7)',
                  letterSpacing: 1,
                }}
              >
                이번 달 재물운
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: '#fff',
                  textShadow: '0 2px 12px rgba(80,60,110,0.3)',
                  marginTop: 4,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                76점
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2A2333', marginTop: 4 }}>
                안정 흐름
              </div>
            </div>
            <span style={{ fontSize: 60 }}>💰</span>
          </div>
        </IECard>

        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>이번 주 흐름</div>
          {[
            { day: '월', s: 60, hint: '큰 지출 주의' },
            { day: '화', s: 70, hint: '평이' },
            { day: '수', s: 82, hint: '들어옴 ↑' },
            { day: '목', s: 78, hint: '안정' },
            { day: '금', s: 88, hint: '행운의 날' },
            { day: '토', s: 65, hint: '소비 주의' },
            { day: '일', s: 72, hint: '평이' },
          ].map((x) => (
            <div key={x.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div
                style={{
                  width: 24,
                  fontSize: 13,
                  fontWeight: 800,
                  color: x.s >= 80 ? '#3DC795' : 'var(--cp-text)',
                }}
              >
                {x.day}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: 'var(--cp-bg)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${x.s}%`,
                    height: '100%',
                    background: x.s >= 80 ? '#3DC795' : x.s >= 70 ? '#FFC857' : '#FF8B6C',
                    borderRadius: 999,
                  }}
                />
              </div>
              <div
                style={{
                  width: 90,
                  fontSize: 11,
                  color: 'var(--cp-text-dim)',
                  textAlign: 'right',
                }}
              >
                {x.hint}
              </div>
            </div>
          ))}
        </IECard>

        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>이번 달 행운 행동</div>
          {[
            { ic: '💸', lbl: '자투리 모으기', sub: '평소보다 +12% 모일 흐름' },
            { ic: '📊', lbl: '주식 점검', sub: '수요일 오전이 좋음' },
            { ic: '🎁', lbl: '경조사 챙기기', sub: '받는 사람도 너도 운 ↑' },
          ].map((x) => (
            <div
              key={x.lbl}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
                borderTop: '1px solid var(--cp-border)',
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: '#3DC79520',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                {x.ic}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{x.lbl}</div>
                <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                  {x.sub}
                </div>
              </div>
              <span style={{ fontSize: 14, color: 'var(--cp-text-dim)' }}>›</span>
            </div>
          ))}
        </IECard>
      </div>
    </div>
  );
}

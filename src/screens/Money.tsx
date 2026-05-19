import { useMemo, useState } from 'react';
import { IECard, IETopBar, OHAENG } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { RewardedAdGate } from '../components/RewardedAdGate';
import { moneyForecast } from '../lib/money';

export default function ScreenMoney() {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);
  const [openAction, setOpenAction] = useState<number | null>(null);

  const forecast = useMemo(
    () => (myeongsik ? moneyForecast(myeongsik, new Date()) : null),
    [myeongsik]
  );

  if (!adDone)
    return (
      <RewardedAdGate
        title="재물운 보기"
        description="돈 들어오는 흐름을 보려면 리워드 광고를 시청해주세요."
        onCancel={back}
        onUnlocked={() => setAdDone(true)}
      />
    );

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                {OHAENG[myeongsik.ilgan.ohaeng].label} 기운
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
                {forecast?.monthScore ?? 0}점
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2A2333', marginTop: 4 }}>
                {forecast?.mood ?? '평이'}
              </div>
            </div>
            <span style={{ fontSize: 60 }}>💰</span>
          </div>
        </IECard>

        {/* 이번 달 풀이 */}
        {forecast?.monthBody && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>🌙 이번 달 흐름</div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--cp-text-mid)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {forecast.monthBody}
            </p>
          </IECard>
        )}

        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>📅 이번 주 흐름</div>
          {(forecast?.week ?? []).map((x, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div
                style={{
                  width: 24,
                  fontSize: 13,
                  fontWeight: 800,
                  color: x.score >= 80 ? '#3DC795' : 'var(--cp-text)',
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
                    width: `${x.score}%`,
                    height: '100%',
                    background: x.score >= 80 ? '#3DC795' : x.score >= 70 ? '#FFC857' : '#FF8B6C',
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
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>✅ 이번 달 행운 행동</div>
          {(forecast?.actions ?? []).map((x, i) => {
            const open = openAction === i;
            return (
              <div
                key={x.lbl}
                style={{ borderTop: i === 0 ? '1px solid var(--cp-border)' : '1px solid var(--cp-border)' }}
              >
                <button
                  onClick={() => setOpenAction(open ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
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
                      flexShrink: 0,
                    }}
                  >
                    {x.ic}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cp-text)' }}>{x.lbl}</div>
                    <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                      {x.sub}
                    </div>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="var(--cp-text-dim)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: 'transform 0.2s',
                      transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {open && (
                  <div
                    style={{
                      padding: '4px 0 14px 44px',
                      fontSize: 13,
                      color: 'var(--cp-text-mid)',
                      lineHeight: 1.65,
                    }}
                  >
                    {x.detail}
                  </div>
                )}
              </div>
            );
          })}
        </IECard>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { IECard, IETopBar, OHAENG, ScoreRow } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { RewardedAdGate } from '../components/RewardedAdGate';
import { healthForecast } from '../lib/health';

export default function ScreenHealth() {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);
  const [openTip, setOpenTip] = useState<number | null>(null);
  const today = useMemo(() => new Date(), []);

  const forecast = useMemo(
    () => (myeongsik ? healthForecast(myeongsik, today) : null),
    [myeongsik, today]
  );

  if (!adDone)
    return (
      <RewardedAdGate
        title="건강운 보기"
        description="몸의 결·주의 포인트를 보려면 리워드 광고를 시청해주세요."
        onCancel={back}
        onUnlocked={() => setAdDone(true)}
      />
    );

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title="건강운" />
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

        {/* 히어로 점수 카드 */}
        <IECard pop>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'rgba(42,35,51,0.7)',
                  letterSpacing: 1,
                }}
              >
                나의 건강운
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
                {forecast?.score ?? 0}점
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2A2333', marginTop: 4 }}>
                {forecast?.mood ?? '평이'} · {forecast?.tagline ?? ''}
              </div>
            </div>
            <span style={{ fontSize: 60 }}>🍃</span>
          </div>
        </IECard>

        {/* 일간 건강 결 */}
        {forecast?.body && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>나의 건강 결</div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--cp-text-mid)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {forecast.body}
            </p>
          </IECard>
        )}

        {/* 4 axis */}
        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>건강 4축</div>
          {(forecast?.axes ?? []).map((x, i, arr) => (
            <div
              key={x.lbl}
              style={{
                paddingBottom: i < arr.length - 1 ? 10 : 0,
                marginBottom: i < arr.length - 1 ? 10 : 0,
                borderBottom: i < arr.length - 1 ? '1px solid var(--cp-border)' : 'none',
              }}
            >
              <ScoreRow icon={x.ic} label={x.lbl} score={x.score} color={x.color} />
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--cp-text-dim)',
                  lineHeight: 1.5,
                  margin: '2px 0 0 48px',
                  fontWeight: 600,
                }}
              >
                {x.oneLine}
              </p>
            </div>
          ))}
        </IECard>

        {/* 약한 부위 카드 */}
        {forecast?.weak && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                케어가 필요한 부위 — {forecast.weak.ohaengKr} 기운 약화
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: '#FF8B6C20',
                  color: '#FF8B6C',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {forecast.weak.parts}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--cp-text-dim)',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                흔한 신호: {forecast.weak.symptoms}
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--cp-text-mid)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {forecast.weak.body}
            </p>
          </IECard>
        )}

        {/* 추천 음식 + 활동 */}
        {forecast?.weak && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>추천 음식·활동</div>
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--cp-text-dim)',
                  letterSpacing: 0.4,
                  marginBottom: 8,
                }}
              >
                🍽️ 추천 음식
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {forecast.weak.foods.map((f) => (
                  <span
                    key={f}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      background: '#6FCFC920',
                      color: '#1F8E87',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--cp-text-dim)',
                  letterSpacing: 0.4,
                  marginBottom: 8,
                }}
              >
                🏃 추천 활동
              </div>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: '#9D7BFF20',
                  color: '#9D7BFF',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {forecast.weak.activity}
              </span>
            </div>
          </IECard>
        )}

        {/* 강점 키워드 */}
        {forecast?.keywords && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>이달의 케어 키워드</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {forecast.keywords.map((k) => (
                <span
                  key={k}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: '#6FCFC920',
                    color: '#1F8E87',
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.3,
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </IECard>
        )}

        {/* 이번 달 흐름 */}
        {forecast?.monthFlow && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>이번 달 컨디션 흐름</div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--cp-text-mid)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {forecast.monthFlow}
            </p>
          </IECard>
        )}

        {/* 건강 팁 (아코디언) */}
        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>건강 팁</div>
          {(forecast?.tips ?? []).map((x, i) => {
            const open = openTip === i;
            return (
              <div
                key={x.lbl}
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--cp-border)',
                }}
              >
                <button
                  onClick={() => setOpenTip(open ? null : i)}
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
                      background: '#6FCFC920',
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
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cp-text)' }}>
                      {x.lbl}
                    </div>
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

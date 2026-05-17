import { useMemo, useState } from 'react';
import { IECard, IETopBar, OHAENG, ScoreRow } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { RewardedAdGate } from '../components/RewardedAdGate';
import { loveForecast } from '../lib/love';

const MONTH_LABEL = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function ScreenLove() {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);
  const [openTip, setOpenTip] = useState<number | null>(null);
  const today = useMemo(() => new Date(), []);

  const forecast = useMemo(
    () => (myeongsik ? loveForecast(myeongsik, today) : null),
    [myeongsik, today]
  );

  if (!adDone)
    return (
      <RewardedAdGate
        title="연애운 보기"
        description="끌리는 타입과 인연 흐름을 보려면 리워드 광고를 시청해주세요."
        onCancel={back}
        onUnlocked={() => setAdDone(true)}
      />
    );

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title="연애운" />
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
                나의 연애운
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
            <span style={{ fontSize: 60 }}>💞</span>
          </div>
        </IECard>

        {/* 일간 연애 톤 풀이 */}
        {forecast?.body && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
              나의 연애 결
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--cp-text-mid)',
                lineHeight: 1.7,
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {forecast.body}
            </p>
          </IECard>
        )}

        {/* 4 axis */}
        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>연애 4축</div>
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

        {/* 도화살 */}
        {forecast?.dohwa && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>🌸</span>
              <div style={{ fontSize: 13, fontWeight: 800 }}>도화살 분석</div>
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--cp-text-mid)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {forecast.dohwa.line}
            </p>
          </IECard>
        )}

        {/* 끌리는 타입 */}
        {forecast?.attractedTypes && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
              끌리는 타입
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {forecast.attractedTypes.map((t, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--cp-radius-md)',
                    background: i === 0 ? '#FF8FB120' : '#9D7BFF20',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{i === 0 ? '💗' : '💜'}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cp-text)' }}>
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </IECard>
        )}

        {/* 인연 시기 */}
        {forecast?.timing && (
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              인연 들어오는 시기
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#FF8FB1',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {MONTH_LABEL[forecast.timing.month - 1]}
              </span>
              <span style={{ fontSize: 12, color: 'var(--cp-text-dim)', fontWeight: 700 }}>
                전후가 가장 강한 신호
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--cp-text-mid)',
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {forecast.timing.reason}
            </p>
          </IECard>
        )}

        {/* 연애 팁 (아코디언) */}
        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>연애 팁</div>
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
                      background: '#FF8FB120',
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

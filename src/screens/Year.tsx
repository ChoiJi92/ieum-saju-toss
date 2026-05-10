import { useEffect, useMemo, useState } from 'react';
import { IECard, IECopy, IETopBar, MoodOrb, OHAENG } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { showInterstitialThen } from '../lib/ads';
import { yearForecast } from '../lib/year';

export default function ScreenYear({ copy }: { copy: IECopy }) {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);

  // 한 해 예측 — 2026년 12월 운세
  const forecast = useMemo(
    () => (myeongsik ? yearForecast(myeongsik.ilgan.c, new Date().getFullYear()) : null),
    [myeongsik]
  );

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
        <MoodOrb size={120} palette={['#FFC857', '#FF8B6C']} />
        <div style={{ fontSize: 14, color: 'var(--cp-text-mid)', fontWeight: 700 }}>
          한 해의 흐름을 살피는 중이에요…
        </div>
      </div>
    );

  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const scores = forecast
    ? forecast.months.map((m) => m.score)
    : [70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70, 70];
  const bestIdx = forecast ? forecast.bestMonth - 1 : 7;

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 62, flexShrink: 0 }} />
      <IETopBar onBack={back} title="2026년 신년운세" />
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

        <div style={{ padding: '4px 0 16px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', fontWeight: 800, letterSpacing: 1 }}>
            {forecast?.year ?? new Date().getFullYear()} · 丙午年
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, margin: '8px 0 4px' }}>
            {forecast?.tagline ?? copy.yearTagline}
          </h2>
          <div style={{ marginTop: 14 }}>
            <MoodOrb
              size={140}
              label={forecast?.mood ?? '한 해의 흐름'}
              score={String(forecast?.yearScore ?? 0)}
              palette={['#FFC857', '#FF8B6C']}
            />
          </div>
        </div>

        <IECard style={{ marginTop: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>월별 흐름</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, marginBottom: 8 }}>
            {scores.map((s, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  style={{
                    width: '100%',
                    height: `${s}%`,
                    background:
                      i === bestIdx
                        ? 'linear-gradient(180deg, #FFC857, #FF8B6C)'
                        : 'linear-gradient(180deg, #C9B6F0, #9D7BFF)',
                    borderRadius: '6px 6px 2px 2px',
                    boxShadow: i === bestIdx ? '0 4px 12px rgba(255,200,87,0.4)' : 'none',
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {months.map((m, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 9,
                  color: i === bestIdx ? '#FF8B6C' : 'var(--cp-text-dim)',
                  fontWeight: i === bestIdx ? 800 : 600,
                }}
              >
                {m.replace('월', '')}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 14,
              padding: 12,
              background: '#FFF0EE',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>✨</span>
            <div style={{ fontSize: 12, color: '#FF8B6C', fontWeight: 700, lineHeight: 1.4 }}>
              <strong style={{ fontWeight: 800 }}>{bestIdx + 1}월</strong>은 한 해의 정점. 큰 결정을 미뤘다면 이때.
            </div>
          </div>
        </IECard>

        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>분야별 한 줄</div>
          {[
            { ic: '💞', lbl: '연애',   body: forecast?.fields.love.oneLine   ?? '한 해 인연 흐름.', c: '#F495C9' },
            { ic: '💰', lbl: '재물',   body: forecast?.fields.money.oneLine  ?? '한 해 재물 흐름.', c: '#3DC795' },
            { ic: '🌱', lbl: '커리어', body: forecast?.fields.career.oneLine ?? '한 해 커리어 흐름.', c: '#FFC857' },
            { ic: '🍵', lbl: '건강',   body: forecast?.fields.health.oneLine ?? '한 해 건강 흐름.', c: '#5B8DEF' },
          ].map((x) => (
            <div
              key={x.lbl}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid var(--cp-border)',
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: x.c + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                {x.ic}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, width: 56 }}>{x.lbl}</span>
              <span style={{ fontSize: 13, color: 'var(--cp-text-mid)', flex: 1 }}>{x.body}</span>
            </div>
          ))}
        </IECard>
      </div>
    </div>
  );
}

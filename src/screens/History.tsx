import { IETopBar } from '../components/ie';
import { useRouter } from '../lib/router';

/**
 * 10 히스토리 — 이전 풀이 모아보기.
 * 광고 ❌ — 이전 결과 다시 보기는 광고 안 띄움 (운세 새로 보는 게 아님).
 */
export default function ScreenHistory() {
  const { back, go } = useRouter();

  const days = [
    { d: '오늘 · 11.05', lbl: '럭키비키 모드', s: 84, c: '#9D7BFF' },
    { d: '어제 · 11.04', lbl: '잔잔한 흐름', s: 72, c: '#3DC795' },
    { d: '11.03', lbl: '약간 흐림', s: 58, c: '#FFC857' },
    { d: '11.02', lbl: '맑은 컨디션', s: 81, c: '#FF8B6C' },
    { d: '11.01', lbl: '집중 모드', s: 76, c: '#5B8DEF' },
    { d: '10.31', lbl: '밤하늘처럼 잔잔', s: 68, c: '#F495C9' },
  ];

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 62, flexShrink: 0 }} />
      <IETopBar onBack={back} title="히스토리" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        <div
          style={{ display: 'flex', gap: 8, padding: '8px 0 16px', overflowX: 'auto' }}
          className="ie-scroll"
        >
          {['전체', '오늘의운세', '신년운세', '궁합', '재물운'].map((t, i) => (
            <button
              key={t}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: i === 0 ? 'var(--cp-text)' : 'var(--cp-bg-paper)',
                color: i === 0 ? '#fff' : 'var(--cp-text-mid)',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: i === 0 ? 'none' : '1px solid var(--cp-border)',
                flex: '0 0 auto',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {days.map((x, i) => (
            <div
              key={i}
              onClick={() => go('today')}
              style={{
                padding: 16,
                borderRadius: 'var(--cp-radius-lg)',
                background: 'var(--cp-bg-paper)',
                border: '1px solid var(--cp-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${x.c}, ${x.c}88)`,
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${x.c}55`,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--cp-text-dim)',
                    fontWeight: 700,
                    letterSpacing: 0.3,
                  }}
                >
                  {x.d}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{x.lbl}</div>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: x.c,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {x.s}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

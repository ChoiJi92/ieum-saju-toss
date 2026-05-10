import { IECopy, IELogo, MoodOrb, Reveal, Sparkle } from '../components/ie';
import { useRouter, ScreenId } from '../lib/router';

/**
 * 03 홈 — 프로토타입 ScreenHome 이식 + 광고 모델 적용 (프리미엄 nudge 제거).
 * 히어로 카드(오늘의 운세) + 점수 칩 4 + 메뉴 그리드 (페이월 X).
 */
export default function ScreenHome({ copy }: { copy: IECopy }) {
  const { go } = useRouter();

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일 ${
    ['일', '월', '화', '수', '목', '금', '토'][today.getDay()]
  }요일`;

  type Menu = { id: ScreenId; icon: string; title: string; sub: string; color: string };
  const menus: Menu[] = [
    { id: 'today',   icon: '☁️', title: '오늘의 운세',   sub: '데일리 풀이',     color: '#FF8B6C' },
    { id: 'saju',    icon: '🔮', title: '내 사주 명식', sub: '8자 깊이 풀이',     color: '#9D7BFF' },
    { id: 'year',    icon: '✨', title: '신년운세',     sub: '한 해의 흐름',     color: '#FFC857' },
    { id: 'gunghap', icon: '💞', title: '궁합',          sub: '둘이 어울리는지',  color: '#F495C9' },
    { id: 'money',   icon: '💰', title: '재물운',        sub: '돈 들어오는 흐름',  color: '#3DC795' },
    { id: 'history', icon: '📚', title: '히스토리',     sub: '지난 풀이 모아봐', color: '#5B8DEF' },
  ];

  return (
    <div
      className="ie-screen"
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {/* 헤더 */}
        <div style={{ padding: '74px 20px 0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IELogo size={32} />
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.4 }}>
                이음사주
              </span>
            </div>
            <button
              onClick={() => go('settings')}
              style={{
                background: 'transparent',
                border: 'none',
                width: 36,
                height: 36,
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="var(--cp-text-mid)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 히어로 카드 */}
        <div style={{ padding: '0 20px 20px' }}>
          <Reveal>
            <div
              onClick={() => go('today')}
              style={{
                padding: 24,
                borderRadius: 'var(--cp-radius-xl)',
                background: 'linear-gradient(135deg, #C9B6F0 0%, #FFB69E 100%)',
                boxShadow: '0 12px 28px rgba(157,123,255,0.28)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
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
                      letterSpacing: 1,
                      color: 'rgba(42,35,51,0.7)',
                    }}
                  >
                    {dateStr}
                  </div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      marginTop: 6,
                      letterSpacing: -0.6,
                      color: '#2A2333',
                    }}
                  >
                    {copy.todayTitle}
                    <br />
                    <span
                      style={{
                        color: '#fff',
                        textShadow: '0 2px 8px rgba(80,60,110,0.3)',
                      }}
                    >
                      {copy.todayMood}
                    </span>
                  </div>
                </div>
                <MoodOrb size={84} />
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'rgba(42,35,51,0.78)',
                  margin: '14px 0 0',
                  lineHeight: 1.5,
                }}
              >
                {copy.todayLine}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#2A2333',
                    background: 'rgba(255,255,255,0.55)',
                    padding: '6px 12px',
                    borderRadius: 999,
                  }}
                >
                  자세히 보기 →
                </span>
              </div>
              <Sparkle
                size={18}
                color="#FFC857"
                style={{ position: 'absolute', top: 20, right: 130 }}
              />
            </div>
          </Reveal>
        </div>

        {/* 점수 칩 */}
        <div
          style={{ padding: '0 20px 20px', display: 'flex', gap: 8, overflowX: 'auto' }}
          className="ie-scroll"
        >
          {[
            { lbl: '총운', s: 84, c: '#9D7BFF' },
            { lbl: '재물', s: 76, c: '#3DC795' },
            { lbl: '연애', s: 92, c: '#F495C9' },
            { lbl: '건강', s: 68, c: '#FFC857' },
          ].map((x) => (
            <div
              key={x.lbl}
              style={{
                flex: '0 0 auto',
                padding: '10px 14px',
                borderRadius: 14,
                background: 'var(--cp-bg-paper)',
                border: '1px solid var(--cp-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 90,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: x.c,
                }}
              />
              <span
                style={{ fontSize: 11, color: 'var(--cp-text-dim)', fontWeight: 700 }}
              >
                {x.lbl}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: x.c,
                  marginLeft: 'auto',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {x.s}
              </span>
            </div>
          ))}
        </div>

        {/* 메뉴 그리드 */}
        <div style={{ padding: '0 20px 32px' }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--cp-text-mid)',
              marginBottom: 12,
              letterSpacing: 0.3,
            }}
          >
            다른 풀이
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            {menus
              .filter((m) => m.id !== 'today')
              .map((m) => (
                <div
                  key={m.id}
                  onClick={() => go(m.id)}
                  style={{
                    padding: 16,
                    borderRadius: 'var(--cp-radius-lg)',
                    background: 'var(--cp-bg-paper)',
                    border: '1px solid var(--cp-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 10,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: m.color + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    {m.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: 'var(--cp-text)',
                      }}
                    >
                      {m.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--cp-text-dim)',
                        fontWeight: 500,
                        marginTop: 2,
                      }}
                    >
                      {m.sub}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ⚠️ 광고 모델: 프리미엄 nudge 카드 제거 (Phase A 결정) */}
      </div>
    </div>
  );
}

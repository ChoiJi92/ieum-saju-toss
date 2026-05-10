import { CSSProperties, useState } from 'react';
import { IEButton, IECard, IEInput, IETopBar } from '../components/ie';
import { useRouter } from '../lib/router';

/**
 * 02 정보입력 — 프로토타입 ScreenInput 이식.
 * 이름 · 생년월일 (양력/음력 + 윤달) · 시진 (12지 바텀시트, 모름 가능) · 성별.
 */

type Calendar = 'solar' | 'lunar';
type Gender = 'female' | 'male';

const SIJIN_LIST: [string, string, string][] = [
  ['子', '자시 (23:30~01:30)', '23:30~01:30'],
  ['丑', '축시 (01:30~03:30)', '01:30~03:30'],
  ['寅', '인시 (03:30~05:30)', '03:30~05:30'],
  ['卯', '묘시 (05:30~07:30)', '05:30~07:30'],
  ['辰', '진시 (07:30~09:30)', '07:30~09:30'],
  ['巳', '사시 (09:30~11:30)', '09:30~11:30'],
  ['午', '오시 (11:30~13:30)', '11:30~13:30'],
  ['未', '미시 (13:30~15:30)', '13:30~15:30'],
  ['申', '신시 (15:30~17:30)', '15:30~17:30'],
  ['酉', '유시 (17:30~19:30)', '17:30~19:30'],
  ['戌', '술시 (19:30~21:30)', '19:30~21:30'],
  ['亥', '해시 (21:30~23:30)', '21:30~23:30'],
];
const SIJIN_LABEL: Record<string, string> = Object.fromEntries(
  SIJIN_LIST.map(([k, lbl]) => [k, lbl])
);

const inputStyle: CSSProperties = {
  width: '100%',
  height: 56,
  padding: '0 14px',
  background: 'var(--cp-bg-paper)',
  border: '2px solid var(--cp-border)',
  borderRadius: 'var(--cp-radius-md)',
  fontFamily: 'var(--cp-font)',
  fontSize: 17,
  fontWeight: 700,
  color: 'var(--cp-text)',
  textAlign: 'center',
  outline: 'none',
  boxSizing: 'border-box',
  fontVariantNumeric: 'tabular-nums',
};

export default function ScreenInput() {
  const { back, go } = useRouter();
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [calendar, setCalendar] = useState<Calendar>('solar');
  const [leapMonth, setLeapMonth] = useState(false);
  const [sijin, setSijin] = useState('未');
  const [unknownTime, setUnknownTime] = useState(false);
  const [sijinOpen, setSijinOpen] = useState(false);
  const [gender, setGender] = useState<Gender>('female');

  const canNext =
    name.trim().length > 0 &&
    year.length === 4 &&
    month.length === 2 &&
    day.length === 2;

  const handleNext = () => {
    if (!canNext) return;
    // TODO: Phase D — 백엔드 사주 계산 호출. 지금은 home 으로.
    console.log('input', { name, calendar, leapMonth, year, month, day, sijin, unknownTime, gender });
    go('home');
  };

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 62, flexShrink: 0 }} />
      <IETopBar onBack={back} title="내 정보 입력" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 120px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, margin: '12px 0 6px', whiteSpace: 'pre-line' }}>
          {'너의 사주를\n풀어줄게'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--cp-text-dim)', margin: '0 0 28px', lineHeight: 1.5 }}>
          입력한 정보는 풀이에만 사용해요
        </p>

        <IEInput label="이름" value={name} onChange={setName} placeholder="이름" />

        {/* 생년월일 */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <label
              style={{
                fontSize: 11,
                color: 'var(--cp-text-dim)',
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              생년월일
            </label>
            <div style={{ display: 'flex', background: 'var(--cp-bg)', borderRadius: 999, padding: 3 }}>
              {(['solar', 'lunar'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setCalendar(k);
                    if (k === 'solar') setLeapMonth(false);
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: calendar === k ? 'var(--cp-text)' : 'transparent',
                    color: calendar === k ? '#fff' : 'var(--cp-text-dim)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--cp-font)',
                  }}
                >
                  {k === 'solar' ? '양력' : '음력'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 8 }}>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              inputMode="numeric"
              placeholder="YYYY"
              style={inputStyle}
            />
            <input
              value={month}
              onChange={(e) => setMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
              maxLength={2}
              inputMode="numeric"
              placeholder="MM"
              style={inputStyle}
            />
            <input
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
              maxLength={2}
              inputMode="numeric"
              placeholder="DD"
              style={inputStyle}
            />
          </div>
          {calendar === 'lunar' && (
            <div
              onClick={() => setLeapMonth(!leapMonth)}
              style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '10px 14px',
                background: leapMonth ? 'rgba(157,123,255,0.08)' : 'var(--cp-bg)',
                borderRadius: 12,
                border: leapMonth ? '1.5px solid var(--cp-lavender)' : '1.5px solid transparent',
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: `1.5px solid ${leapMonth ? 'var(--cp-lavender)' : 'var(--cp-text-mute)'}`,
                  background: leapMonth ? 'var(--cp-lavender)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {leapMonth && (
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>
                )}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: leapMonth ? 'var(--cp-lavender)' : 'var(--cp-text)',
                }}
              >
                윤달
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--cp-text-dim)',
                  marginLeft: 'auto',
                }}
              >
                이 달이 윤달이에요
              </span>
            </div>
          )}
        </div>

        {/* 시진 */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--cp-text-dim)',
              fontWeight: 700,
              letterSpacing: 0.4,
              marginBottom: 6,
            }}
          >
            태어난 시간
          </label>
          <button
            onClick={() => setSijinOpen(true)}
            style={{
              width: '100%',
              height: 56,
              padding: '0 18px',
              textAlign: 'left',
              background: 'var(--cp-bg-paper)',
              border: '2px solid var(--cp-border)',
              borderRadius: 'var(--cp-radius-md)',
              fontFamily: 'var(--cp-font)',
              fontSize: 16,
              fontWeight: 700,
              color: unknownTime ? 'var(--cp-text-dim)' : 'var(--cp-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{unknownTime ? '모름' : SIJIN_LABEL[sijin]}</span>
            <span style={{ fontSize: 14, color: 'var(--cp-text-dim)' }}>▾</span>
          </button>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--cp-text-dim)' }}>
            모르면 '모름'을 선택해주세요
          </div>
        </div>

        {/* 성별 */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--cp-text-dim)',
              fontWeight: 700,
              letterSpacing: 0.4,
              marginBottom: 6,
            }}
          >
            성별
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['female', 'male'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setGender(k)}
                style={{
                  height: 56,
                  borderRadius: 'var(--cp-radius-md)',
                  background: gender === k ? 'var(--cp-text)' : 'var(--cp-bg-paper)',
                  color: gender === k ? '#fff' : 'var(--cp-text)',
                  border: gender === k ? 'none' : '2px solid var(--cp-border)',
                  fontFamily: 'var(--cp-font)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all .12s',
                }}
              >
                {k === 'female' ? '여자' : '남자'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 시진 바텀시트 */}
      {sijinOpen && (
        <div
          onClick={() => setSijinOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(42,35,51,0.55)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="ie-scroll"
            style={{
              width: '100%',
              maxHeight: '80%',
              overflowY: 'auto',
              background: 'var(--cp-bg-paper)',
              borderRadius: '20px 20px 0 0',
              padding: '12px 0 28px',
              animation: 'ie-in .25s cubic-bezier(.2,.9,.3,1)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                background: 'var(--cp-border)',
                borderRadius: 2,
                margin: '4px auto 12px',
              }}
            />
            <div
              style={{
                padding: '0 20px 8px',
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--cp-text)',
              }}
            >
              태어난 시간 선택
            </div>
            {[
              ['unknown', '모름', '시간을 정확히 모를 때 선택'] as [string, string, string],
              ...SIJIN_LIST,
            ].map(([k, lbl, range]) => {
              const selected =
                (k === 'unknown' && unknownTime) ||
                (k !== 'unknown' && !unknownTime && sijin === k);
              return (
                <div
                  key={k}
                  onClick={() => {
                    if (k === 'unknown') setUnknownTime(true);
                    else {
                      setUnknownTime(false);
                      setSijin(k);
                    }
                    setSijinOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 22px',
                    cursor: 'pointer',
                    background: selected ? 'rgba(157,123,255,0.08)' : 'transparent',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      color: 'var(--cp-lavender)',
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    {selected ? '✓' : ''}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cp-text)' }}>
                      {lbl}
                    </div>
                    <div
                      style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 2 }}
                    >
                      {range}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 하단 CTA */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 24px 32px',
          background: 'linear-gradient(180deg, transparent, var(--cp-bg) 30%)',
        }}
      >
        <IEButton
          onClick={handleNext}
          style={{
            opacity: canNext ? 1 : 0.4,
            cursor: canNext ? 'pointer' : 'not-allowed',
          }}
        >
          풀이 시작하기
        </IEButton>
      </div>
    </div>
  );
}

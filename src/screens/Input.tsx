import { useEffect, useState } from 'react';
import { IEButton, IECheckbox, IEDateSelect, IEInput, IETopBar } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';

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

/** 12지 시진 → 24시 (각 시진 중간 시각) */
const SIJIN_HOUR: Record<string, number> = {
  子: 0,  丑: 2,  寅: 4,  卯: 6,
  辰: 8,  巳: 10, 午: 12, 未: 14,
  申: 16, 酉: 18, 戌: 20, 亥: 22,
};


/** 시 → 시진 한자 (편집 모드 prefill용 역매핑) */
function hourToSijin(hour: number): string {
  const entries = Object.entries(SIJIN_HOUR) as [string, number][];
  const match = entries.find(([, h]) => h === hour);
  return match?.[0] ?? '未';
}

export default function ScreenInput() {
  const { back, go } = useRouter();
  const { setSelf, selfProfile } = useSaju();
  const isEdit = !!selfProfile;

  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [calendar, setCalendar] = useState<Calendar>('solar');
  const [leapMonth, setLeapMonth] = useState(false);
  const [sijin, setSijin] = useState('未');
  const [unknownTime, setUnknownTime] = useState(true); // 디폴트 모름
  const [sijinOpen, setSijinOpen] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);

  // 편집 모드 — 기존 정보로 prefill
  useEffect(() => {
    if (!selfProfile) return;
    setName(selfProfile.name);
    setYear(String(selfProfile.year));
    setMonth(String(selfProfile.month).padStart(2, '0'));
    setDay(String(selfProfile.day).padStart(2, '0'));
    setCalendar(selfProfile.calendar);
    setLeapMonth(selfProfile.leapMonth ?? false);
    if (selfProfile.hour !== undefined) {
      setUnknownTime(false);
      setSijin(hourToSijin(selfProfile.hour));
    } else {
      setUnknownTime(true);
    }
    setGender(selfProfile.gender);
  }, [selfProfile]);

  const canNext =
    name.trim().length > 0 &&
    year.length === 4 &&
    month.length === 2 &&
    day.length === 2 &&
    gender !== null;

  const handleNext = () => {
    if (!canNext || gender === null) return;
    setSelf({
      name: name.trim(),
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      day: parseInt(day, 10),
      calendar,
      leapMonth: calendar === 'lunar' ? leapMonth : false,
      hour: unknownTime ? undefined : SIJIN_HOUR[sijin],
      minute: 0,
      gender,
    });
    if (isEdit) back();
    else go('home');
  };

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title="내 정보 입력" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 120px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, margin: '12px 0 6px', whiteSpace: 'pre-line' }}>
          {'당신의 사주를\n풀어드릴게요'}
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
            <IEDateSelect
              value={year}
              onChange={(v) => {
                setYear(v);
                if (v && month && day) {
                  const last = new Date(parseInt(v, 10), parseInt(month, 10), 0).getDate();
                  if (parseInt(day, 10) > last) setDay(String(last).padStart(2, '0'));
                }
              }}
              placeholder="년"
              options={Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
                const y = 1900 + i;
                return { value: String(y), label: `${y}년` };
              }).reverse()}
            />
            <IEDateSelect
              value={month}
              onChange={(v) => {
                setMonth(v);
                if (year && v && day) {
                  const last = new Date(parseInt(year, 10), parseInt(v, 10), 0).getDate();
                  if (parseInt(day, 10) > last) setDay(String(last).padStart(2, '0'));
                }
              }}
              placeholder="월"
              options={Array.from({ length: 12 }, (_, i) => ({
                value: String(i + 1).padStart(2, '0'),
                label: `${i + 1}월`,
              }))}
            />
            <IEDateSelect
              value={day}
              onChange={setDay}
              placeholder="일"
              options={Array.from(
                {
                  length:
                    year && month
                      ? new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate()
                      : 31,
                },
                (_, i) => ({
                  value: String(i + 1).padStart(2, '0'),
                  label: `${i + 1}일`,
                })
              )}
            />
          </div>
          {calendar === 'lunar' && (
            <div style={{ marginTop: 10 }}>
              <IECheckbox checked={leapMonth} onChange={setLeapMonth}>
                윤달
              </IECheckbox>
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
              color: 'var(--cp-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{unknownTime ? '모름' : SIJIN_LABEL[sijin]}</span>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="var(--cp-text-dim)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
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
            {(['male', 'female'] as const).map((k) => (
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


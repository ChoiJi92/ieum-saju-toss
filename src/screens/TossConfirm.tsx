import { CSSProperties, useEffect, useState } from 'react';
import { IEButton, IECard, IETopBar } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';

/**
 * 토스 로그인 직후 확인 화면.
 * 토스가 준 정보 (이름·생년월일·성별) 확인 + 출생 시간만 사용자가 선택.
 * 시 모름이 디폴트라 그대로 '시작'하면 즉시 Home 진입.
 *
 * 정보가 잘못됐으면 "정보 수정하기 ›" → Input 화면 (직접 입력)으로 fallback.
 */

const SIJIN_LIST: [string, string][] = [
  ['子', '자시 (23:30~01:30)'],
  ['丑', '축시 (01:30~03:30)'],
  ['寅', '인시 (03:30~05:30)'],
  ['卯', '묘시 (05:30~07:30)'],
  ['辰', '진시 (07:30~09:30)'],
  ['巳', '사시 (09:30~11:30)'],
  ['午', '오시 (11:30~13:30)'],
  ['未', '미시 (13:30~15:30)'],
  ['申', '신시 (15:30~17:30)'],
  ['酉', '유시 (17:30~19:30)'],
  ['戌', '술시 (19:30~21:30)'],
  ['亥', '해시 (21:30~23:30)'],
];
const SIJIN_LABEL: Record<string, string> = Object.fromEntries(SIJIN_LIST);
const SIJIN_HOUR: Record<string, number> = {
  子: 0,  丑: 2,  寅: 4,  卯: 6,
  辰: 8,  巳: 10, 午: 12, 未: 14,
  申: 16, 酉: 18, 戌: 20, 亥: 22,
};

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

export default function ScreenTossConfirm() {
  const { back, reset, go } = useRouter();
  const { tossPending, setTossPending, setSelf } = useSaju();

  const [sijin, setSijin] = useState('未');
  const [unknownTime, setUnknownTime] = useState(true);
  const [isLunar, setIsLunar] = useState(false);
  const [sijinOpen, setSijinOpen] = useState(false);

  // 토스 정보 없이 직접 진입했으면 Onboarding으로
  useEffect(() => {
    if (!tossPending) {
      reset('onboarding');
    }
  }, [tossPending, reset]);

  if (!tossPending) return null;

  const handleStart = () => {
    setSelf({
      ...tossPending,
      calendar: isLunar ? 'lunar' : 'solar',
      hour: unknownTime ? undefined : SIJIN_HOUR[sijin],
      minute: 0,
    });
    setTossPending(null);
    reset('home');
  };

  const handleEditInfo = () => {
    setTossPending(null);
    go('input');
  };

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title="" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 120px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: '12px 0 6px' }}>
          받아온 정보예요
        </h2>
        <p style={{ fontSize: 13, color: 'var(--cp-text-dim)', margin: '0 0 22px', lineHeight: 1.5 }}>
          토스에서 가져온 정보가 맞는지 확인해주세요
        </p>

        {/* 받은 정보 — 읽기 전용 카드 */}
        <IECard style={{ marginBottom: 14 }}>
          <Row label="이름" value={tossPending.name} />
          <Divider />
          <Row
            label="생년월일"
            value={`${tossPending.year}.${String(tossPending.month).padStart(2, '0')}.${String(tossPending.day).padStart(2, '0')} (양력)`}
          />
          <Divider />
          <Row label="성별" value={tossPending.gender === 'male' ? '남자' : '여자'} />
        </IECard>

        {/* 음력 토글 (토스는 양력만 주므로 음력 출생자는 변환 필요) */}
        <div style={{ marginBottom: 18 }}>
          <button
            onClick={() => setIsLunar((v) => !v)}
            style={{
              width: '100%',
              padding: '12px 14px',
              background: isLunar ? 'rgba(157,123,255,0.10)' : 'var(--cp-bg-paper)',
              border: isLunar ? '1.5px solid var(--cp-lavender)' : '1px solid var(--cp-border)',
              borderRadius: 'var(--cp-radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
              fontFamily: 'var(--cp-font)',
            }}
          >
            <span style={{ fontSize: 18 }}>{isLunar ? '🌙' : '☀️'}</span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: isLunar ? 'var(--cp-lavender)' : 'var(--cp-text)',
                }}
              >
                {isLunar ? '음력 생일이에요' : '내 생일은 음력이에요'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 2, fontWeight: 600 }}>
                {isLunar
                  ? '음력으로 계산해요 (탭하면 양력으로 복귀)'
                  : '토스 정보는 양력 기준 — 음력 출생자만 탭'}
              </div>
            </div>
          </button>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '8px 0 6px', letterSpacing: -0.3 }}>
          마지막으로, 태어난 시간만 알려주세요
        </h3>
        <p style={{ fontSize: 12, color: 'var(--cp-text-dim)', margin: '0 0 12px' }}>
          정확히 모르면 '모름' 그대로 두셔도 돼요
        </p>

        {/* 시진 선택 — Input.tsx 동일 패턴 (모름 = 옵션 첫 항목) */}
        <button
          onClick={() => setSijinOpen((v) => !v)}
          style={{
            ...inputStyle,
            textAlign: 'left',
            padding: '0 14px',
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
        {sijinOpen && (
          <IECard flat style={{ marginTop: 8, padding: 0, maxHeight: 320, overflowY: 'auto' }}>
            {(
              [
                ['unknown', '모름'] as [string, string],
                ...SIJIN_LIST,
              ]
            ).map(([key, label]) => {
              const selected =
                (key === 'unknown' && unknownTime) ||
                (key !== 'unknown' && !unknownTime && sijin === key);
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'unknown') {
                      setUnknownTime(true);
                    } else {
                      setUnknownTime(false);
                      setSijin(key);
                    }
                    setSijinOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: selected ? 'rgba(157,123,255,0.08)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--cp-border)',
                    fontFamily: 'var(--cp-font)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--cp-text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </IECard>
        )}
      </div>

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
        <IEButton onClick={handleStart}>풀이 시작</IEButton>
        <button
          onClick={handleEditInfo}
          style={{
            marginTop: 10,
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--cp-font)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--cp-text-mid)',
            padding: '8px',
          }}
        >
          정보 수정하기 ›
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          background: 'var(--cp-lavender)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="5 12 10 17 19 7" />
        </svg>
      </span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--cp-text-dim)', fontWeight: 700, letterSpacing: 0.4 }}>
          {label}
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--cp-text)' }}>{value}</span>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--cp-border)', margin: '4px 0' }} />;
}

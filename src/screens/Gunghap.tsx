import { CSSProperties, useMemo, useState } from 'react';
import {
  IEButton,
  IECard,
  IECopy,
  IEDateSelect,
  IEInput,
  IETopBar,
  MoodOrb,
  ScoreRow,
  Sparkle,
} from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { RewardedAdGate } from '../components/RewardedAdGate';
import { calcGunghap, ilganOf, type GunghapResult } from '../lib/gunghap';

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

export default function ScreenGunghap({ copy }: { copy: IECopy }) {
  const { back } = useRouter();
  const { profile, myeongsik, profiles, activeId } = useSaju();
  const [step, setStep] = useState<'input' | 'ad' | 'result'>('input');
  const [mode, setMode] = useState<'saved' | 'manual'>('manual');
  const [pickerOpen, setPickerOpen] = useState(false);

  // 상대 정보
  const [otherName, setOtherName] = useState('');
  const [otherYear, setOtherYear] = useState('');
  const [otherMonth, setOtherMonth] = useState('');
  const [otherDay, setOtherDay] = useState('');

  // 저장된 사주(본인·활성 제외) 목록
  const savedCandidates = profiles.filter((p) => p.id !== activeId);
  const hasSaved = savedCandidates.length > 0;

  const pickSaved = (id: string) => {
    const p = savedCandidates.find((x) => x.id === id);
    if (!p) return;
    setOtherName(p.name);
    setOtherYear(String(p.year));
    setOtherMonth(String(p.month).padStart(2, '0'));
    setOtherDay(String(p.day).padStart(2, '0'));
    setMode('saved');
    setPickerOpen(false);
  };

  // 두 사람 일간 + 사주 시드 → 궁합 결과 (같은 일간끼리도 다른 점수)
  const result: GunghapResult | null = useMemo(() => {
    if (step !== 'result') return null;
    if (!myeongsik) return null;
    const other = ilganOf(parseInt(otherYear, 10), parseInt(otherMonth, 10), parseInt(otherDay, 10));
    if (!other) return null;
    const my = myeongsik.ilgan.c as Parameters<typeof calcGunghap>[0];
    // 시드 = 본인 명식 8자 + 상대 생년월일
    const seed =
      myeongsik.pillars.map((p) => p.top.c + p.bot.c).join('') +
      `_${otherYear}${otherMonth}${otherDay}`;
    return calcGunghap(my, other, seed);
  }, [step, myeongsik, otherYear, otherMonth, otherDay]);
  const canRun =
    !!profile &&
    otherName.trim().length > 0 &&
    otherYear.length === 4 &&
    otherMonth.length === 2 &&
    otherDay.length === 2;

  if (step === 'input') {
    return (
      <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <IETopBar onBack={back} title="궁합" />
        <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 120px' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, margin: '12px 0 6px' }}>
            {copy.ghTitle}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--cp-text-dim)', margin: '0 0 24px' }}>
            상대의 정보를 입력해줘
          </p>

          {/* 나 — profile 자동 채움 */}
          <IECard style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>👤</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>나</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--cp-text-dim)',
                  letterSpacing: 0.4,
                }}
              >
                내 정보 자동 입력
              </span>
            </div>
            <IEInput label="이름" value={profile?.name ?? ''} onChange={() => {}} />
            <div style={{ marginBottom: 8 }}>
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
                생년월일
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 8 }}>
                <input value={profile?.year ?? ''} readOnly style={inputStyle} />
                <input
                  value={profile ? String(profile.month).padStart(2, '0') : ''}
                  readOnly
                  style={inputStyle}
                />
                <input
                  value={profile ? String(profile.day).padStart(2, '0') : ''}
                  readOnly
                  style={inputStyle}
                />
              </div>
            </div>
          </IECard>

          {/* 상대 — 입력 받기 (저장된 사주 선택 가능) */}
          <IECard style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>💞</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>상대</span>
              {hasSaved && (
                <button
                  onClick={() => setPickerOpen((v) => !v)}
                  style={{
                    marginLeft: 'auto',
                    padding: '5px 10px',
                    borderRadius: 999,
                    background: '#F495C920',
                    color: '#D04E94',
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'var(--cp-font)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  저장된 사주에서 선택
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: 'transform 0.2s',
                      transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </div>

            {hasSaved && pickerOpen && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 8,
                  background: 'var(--cp-bg)',
                  borderRadius: 'var(--cp-radius-md)',
                  border: '1px solid var(--cp-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {savedCandidates.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => pickSaved(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      background: 'var(--cp-bg-paper)',
                      border: '1px solid var(--cp-border)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--cp-font)',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--cp-text-mid)' }}>
                      {p.relation}
                    </span>
                    <strong style={{ fontSize: 13, color: 'var(--cp-text)' }}>{p.name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginLeft: 'auto' }}>
                      {p.year}.{String(p.month).padStart(2, '0')}.
                      {String(p.day).padStart(2, '0')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {mode === 'saved' && (
              <div
                style={{
                  marginBottom: 10,
                  padding: '8px 12px',
                  background: '#F495C915',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#D04E94',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                저장된 사주를 불러왔어요
                <button
                  onClick={() => {
                    setMode('manual');
                    setOtherName('');
                    setOtherYear('');
                    setOtherMonth('');
                    setOtherDay('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#D04E94',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  지우기 ✕
                </button>
              </div>
            )}

            <IEInput
              label="이름"
              value={otherName}
              onChange={(v) => {
                setOtherName(v);
                if (mode === 'saved') setMode('manual');
              }}
              placeholder="상대 이름"
            />
            <div style={{ marginBottom: 8 }}>
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
                생년월일
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 8 }}>
                <IEDateSelect
                  value={otherYear}
                  onChange={(v) => {
                    setOtherYear(v);
                    if (v && otherMonth && otherDay) {
                      const last = new Date(parseInt(v, 10), parseInt(otherMonth, 10), 0).getDate();
                      if (parseInt(otherDay, 10) > last) setOtherDay(String(last).padStart(2, '0'));
                    }
                  }}
                  placeholder="년"
                  options={Array.from(
                    { length: new Date().getFullYear() - 1900 + 1 },
                    (_, i) => {
                      const y = 1900 + i;
                      return { value: String(y), label: `${y}년` };
                    }
                  ).reverse()}
                />
                <IEDateSelect
                  value={otherMonth}
                  onChange={(v) => {
                    setOtherMonth(v);
                    if (otherYear && v && otherDay) {
                      const last = new Date(parseInt(otherYear, 10), parseInt(v, 10), 0).getDate();
                      if (parseInt(otherDay, 10) > last) setOtherDay(String(last).padStart(2, '0'));
                    }
                  }}
                  placeholder="월"
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: String(i + 1).padStart(2, '0'),
                    label: `${i + 1}월`,
                  }))}
                />
                <IEDateSelect
                  value={otherDay}
                  onChange={setOtherDay}
                  placeholder="일"
                  options={Array.from(
                    {
                      length:
                        otherYear && otherMonth
                          ? new Date(parseInt(otherYear, 10), parseInt(otherMonth, 10), 0).getDate()
                          : 31,
                    },
                    (_, i) => ({
                      value: String(i + 1).padStart(2, '0'),
                      label: `${i + 1}일`,
                    })
                  )}
                />
              </div>
            </div>
          </IECard>
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
          <IEButton
            onClick={() => canRun && setStep('ad')}
            style={{
              opacity: canRun ? 1 : 0.4,
              cursor: canRun ? 'pointer' : 'not-allowed',
            }}
          >
            궁합 보기
          </IEButton>
        </div>
      </div>
    );
  }

  if (step === 'ad')
    return (
      <RewardedAdGate
        title="궁합 결과 보기"
        description="두 사람의 궁합 결과를 보려면 리워드 광고를 시청해주세요."
        onCancel={() => setStep('input')}
        onUnlocked={() => setStep('result')}
      />
    );

  return (
    <GunghapResult
      onBack={() => setStep('input')}
      myName={profile?.name ?? '나'}
      otherName={otherName || '상대'}
      result={result}
    />
  );
}

function GunghapResult({
  onBack,
  myName,
  otherName,
  result,
}: {
  onBack: () => void;
  myName: string;
  otherName: string;
  result: GunghapResult | null;
}) {
  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={onBack} title="궁합 결과" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        {/* paired orbs */}
        <div
          style={{
            position: 'relative',
            height: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '8px 0 20px',
          }}
        >
          <div style={{ position: 'relative', width: 220, height: 140 }}>
            <div style={{ position: 'absolute', left: 0, top: 10 }}>
              <MoodOrb size={120} palette={['#9D7BFF', '#C9B6F0']} />
            </div>
            <div style={{ position: 'absolute', right: 0, top: 10 }}>
              <MoodOrb size={120} palette={['#FF8B6C', '#FFB69E']} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%,-50%)',
              }}
            >
              <Sparkle size={36} color="#FFC857" />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', fontWeight: 800, letterSpacing: 1 }}>
            {myName} × {otherName}
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1,
              margin: '8px 0',
              background: 'linear-gradient(135deg, #9D7BFF, #FF8B6C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {result?.totalScore ?? 0}점
          </div>
          <div style={{ fontSize: 14, color: 'var(--cp-text-mid)', fontWeight: 700 }}>
            {result?.tagline ?? '두 사람의 결'}
          </div>
        </div>

        <IECard>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>세부 궁합</div>
          {(result?.axes ?? []).map((x, i, arr) => (
            <div
              key={x.lbl}
              style={{
                paddingBottom: i < arr.length - 1 ? 14 : 0,
                marginBottom: i < arr.length - 1 ? 14 : 0,
                borderBottom: i < arr.length - 1 ? '1px solid var(--cp-border)' : 'none',
              }}
            >
              <ScoreRow icon={x.ic} label={x.lbl} score={x.score} color={x.color} />
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--cp-text-mid)',
                  lineHeight: 1.55,
                  margin: '6px 0 0 48px',
                }}
              >
                {x.body}
              </p>
            </div>
          ))}
        </IECard>

        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>두 사람의 결</div>
          <p style={{ fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.7, margin: 0 }}>
            {result
              ? `${result.myIlgan}(나)과 ${result.otherIlgan}(상대)의 만남. ${result.comment}`
              : '두 사람의 사주 정보를 입력해주세요.'}
          </p>
        </IECard>

        {result && (
          <>
            {/* 잘 맞는 점 */}
            <IECard style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>💚</span> 잘 맞는 점
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {result.strengths.map((s, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 13,
                      color: 'var(--cp-text-mid)',
                      lineHeight: 1.65,
                      padding: '8px 0',
                      borderBottom:
                        i < result.strengths.length - 1 ? '1px solid var(--cp-border)' : 'none',
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: '#3DC795', fontWeight: 800, flexShrink: 0 }}>·</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </IECard>

            {/* 주의할 점 */}
            <IECard style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>⚠️</span> 주의할 점
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {result.cautions.map((c, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 13,
                      color: 'var(--cp-text-mid)',
                      lineHeight: 1.65,
                      padding: '8px 0',
                      borderBottom:
                        i < result.cautions.length - 1 ? '1px solid var(--cp-border)' : 'none',
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <span style={{ color: '#FF8B6C', fontWeight: 800, flexShrink: 0 }}>·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </IECard>

            {/* 추천 데이트 */}
            <IECard style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>💞</span> 추천 데이트
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.dates.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 'var(--cp-radius-md)',
                      background: '#F495C915',
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: 'var(--cp-text)',
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: '#F495C9',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </IECard>

            {/* 장기 전망 */}
            <IECard style={{ marginTop: 14 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>🌱</span> 장기 전망
              </div>
              <p
                style={{ fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.7, margin: 0 }}
              >
                {result.longTerm}
              </p>
            </IECard>

            {/* 5합 보너스 카드 — 5합일 때만 */}
            {result.hap && (
              <IECard
                style={{
                  marginTop: 14,
                  background: 'linear-gradient(135deg, #FFF6E1, #FFE2D0)',
                  border: 'none',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 8,
                    color: '#A86A1A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  ✨ 천간 5합 ({result.myIlgan} × {result.otherIlgan})
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: '#7A5117',
                    lineHeight: 1.7,
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  두 사람의 일간이 천간 오합 중 하나로 묶여요. 사주 합 중 가장 강력한 끌림으로,
                  자기도 모르게 마음이 가는 사이예요. 운명적인 만남에 자주 등장하는 패턴이에요.
                </p>
              </IECard>
            )}
          </>
        )}
      </div>
    </div>
  );
}

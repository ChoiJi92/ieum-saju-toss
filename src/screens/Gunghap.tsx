import { CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  IEButton,
  IECard,
  IECopy,
  IEInput,
  IETopBar,
  MoodOrb,
  ScoreRow,
  Sparkle,
} from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { showInterstitialThen } from '../lib/ads';
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
  const { profile, myeongsik } = useSaju();
  const [step, setStep] = useState<'input' | 'ad' | 'result'>('input');

  // 상대 정보
  const [otherName, setOtherName] = useState('');
  const [otherYear, setOtherYear] = useState('');
  const [otherMonth, setOtherMonth] = useState('');
  const [otherDay, setOtherDay] = useState('');

  // 두 사람 일간 → 궁합 결과
  const result: GunghapResult | null = useMemo(() => {
    if (step !== 'result') return null;
    if (!myeongsik) return null;
    const other = ilganOf(parseInt(otherYear, 10), parseInt(otherMonth, 10), parseInt(otherDay, 10));
    if (!other) return null;
    const my = myeongsik.ilgan.c as Parameters<typeof calcGunghap>[0];
    return calcGunghap(my, other);
  }, [step, myeongsik, otherYear, otherMonth, otherDay]);

  const onlyDigits = (s: string) => s.replace(/\D/g, '');
  const canRun =
    !!profile &&
    otherName.trim().length > 0 &&
    otherYear.length === 4 &&
    otherMonth.length === 2 &&
    otherDay.length === 2;

  useEffect(() => {
    if (step !== 'ad') return;
    showInterstitialThen(() => setStep('result'));
  }, [step]);

  if (step === 'input') {
    return (
      <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 62, flexShrink: 0 }} />
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

          {/* 상대 — 입력 받기 */}
          <IECard style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>💞</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>상대</span>
            </div>
            <IEInput
              label="이름"
              value={otherName}
              onChange={setOtherName}
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
                <input
                  value={otherYear}
                  onChange={(e) => setOtherYear(onlyDigits(e.target.value).slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="YYYY"
                  style={inputStyle}
                />
                <input
                  value={otherMonth}
                  onChange={(e) => setOtherMonth(onlyDigits(e.target.value).slice(0, 2))}
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="MM"
                  style={inputStyle}
                />
                <input
                  value={otherDay}
                  onChange={(e) => setOtherDay(onlyDigits(e.target.value).slice(0, 2))}
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="DD"
                  style={inputStyle}
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
        <MoodOrb size={120} palette={['#9D7BFF', '#FF8B6C']} />
        <div style={{ fontSize: 14, color: 'var(--cp-text-mid)', fontWeight: 700 }}>
          두 분의 결을 맞춰보는 중이에요…
        </div>
      </div>
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
      <div style={{ height: 62, flexShrink: 0 }} />
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
          {(result?.axes ?? []).map((x) => (
            <ScoreRow key={x.lbl} icon={x.ic} label={x.lbl} score={x.score} color={x.color} />
          ))}
        </IECard>

        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>한줄 코멘트</div>
          <p style={{ fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.6, margin: 0 }}>
            {result
              ? `${result.myIlgan}(나)과 ${result.otherIlgan}(상대)의 만남. ${result.comment}`
              : '두 사람의 사주 정보를 입력해주세요.'}
          </p>
        </IECard>
      </div>
    </div>
  );
}

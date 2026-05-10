import { CSSProperties, useEffect, useState } from 'react';
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
import { showInterstitialThen } from '../lib/ads';

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
  const [step, setStep] = useState<'input' | 'ad' | 'result'>('input');

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
            두 사람의 정보를 입력해줘
          </p>

          {[
            { name: '나', emoji: '👤' },
            { name: '상대', emoji: '💞' },
          ].map((p, i) => (
            <IECard key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{p.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 800 }}>{p.name}</span>
              </div>
              <IEInput label="이름" value={i === 0 ? '김토스' : '박운세'} onChange={() => {}} />
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
                  <input value={i === 0 ? '1998' : '1996'} readOnly style={inputStyle} />
                  <input value={i === 0 ? '06' : '11'} readOnly style={inputStyle} />
                  <input value={i === 0 ? '14' : '02'} readOnly style={inputStyle} />
                </div>
              </div>
            </IECard>
          ))}
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
          <IEButton onClick={() => setStep('ad')}>궁합 보기</IEButton>
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

  return <GunghapResult onBack={() => setStep('input')} />;
}

function GunghapResult({ onBack }: { onBack: () => void }) {
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
            김토스 × 박운세
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
            87점
          </div>
          <div style={{ fontSize: 14, color: 'var(--cp-text-mid)', fontWeight: 700 }}>
            서로의 결을 잘 알아주는 사이
          </div>
        </div>

        <IECard>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>세부 궁합</div>
          {[
            { lbl: '성격 합', s: 92, c: '#9D7BFF', ic: '☁️' },
            { lbl: '대화 합', s: 88, c: '#3DC795', ic: '💬' },
            { lbl: '연애 합', s: 84, c: '#F495C9', ic: '💞' },
            { lbl: '돈 가치관', s: 70, c: '#FFC857', ic: '💰' },
          ].map((x) => (
            <ScoreRow key={x.lbl} icon={x.ic} label={x.lbl} score={x.s} color={x.c} />
          ))}
        </IECard>

        <IECard style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>한줄 코멘트</div>
          <p style={{ fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.6, margin: 0 }}>
            木(나)과 火(상대)의 만남. 너의 곧음을 상대가 따뜻하게 비춰주는 관계. 가끔 너무 직선적인
            너의 말이 상대에게 따갑게 들릴 수 있으니, 한 박자 쉬어가는 호흡이 도움이 돼.
          </p>
        </IECard>
      </div>
    </div>
  );
}

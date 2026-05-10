import { useState } from 'react';
import { IECopy, IETopBar, MoodOrb, Sparkle } from '../components/ie';
import { useRouter } from '../lib/router';

/**
 * 05 공유 — 프로토타입 ScreenShare 이식.
 * 1:1 정사각 / 9:16 세로 카드 + 카톡·인스타·링크·저장 4 버튼.
 * 카드는 토스 미니앱 환경에서 html2canvas / native share-link 로 추후 export 연동.
 */

type Format = 'square' | 'story';

export default function ScreenShare({ copy }: { copy: IECopy }) {
  const { back } = useRouter();
  const [fmt, setFmt] = useState<Format>('story');

  return (
    <div
      className="ie-screen"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(42,35,51,0.95)',
      }}
    >
      <div style={{ height: 62, flexShrink: 0 }} />
      <IETopBar onBack={back} title="결과 공유" dark />
      <div
        className="ie-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '0 24px 100px' }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
          {(
            [
              ['square', '정사각 (1:1)'],
              ['story', '세로 (9:16)'],
            ] as const
          ).map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => setFmt(k)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 'none',
                background: fmt === k ? '#fff' : 'rgba(255,255,255,0.12)',
                color: fmt === k ? 'var(--cp-text)' : 'rgba(255,255,255,0.7)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          {fmt === 'square' ? <ShareSquare copy={copy} /> : <ShareStory copy={copy} />}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {(
            [
              ['💬', '카톡'],
              ['📷', '인스타'],
              ['🔗', '링크'],
              ['📥', '저장'],
            ] as const
          ).map(([ic, lbl]) => (
            <button
              key={lbl}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: 22,
                }}
              >
                {ic}
              </div>
              <div style={{ fontSize: 11, marginTop: 6 }}>{lbl}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShareSquare({ copy }: { copy: IECopy }) {
  return (
    <div
      style={{
        width: 280,
        height: 280,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #FBF6FF 0%, #FFE7DE 100%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}
    >
      <Sparkle size={14} color="#FFC857" style={{ position: 'absolute', top: 22, right: 30 }} />
      <Sparkle size={10} color="#9D7BFF" style={{ position: 'absolute', bottom: 28, left: 30 }} />
      <div
        style={{
          padding: '24px 22px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: 'var(--cp-text-dim)',
            fontWeight: 800,
            letterSpacing: 1.2,
          }}
        >
          이음사주 · 오늘의 운세
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MoodOrb size={140} label={copy.todayMood} score="84" />
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            lineHeight: 1.4,
            color: 'var(--cp-text)',
          }}
        >
          {copy.todayLine.length > 50
            ? copy.todayLine.slice(0, 48) + '…'
            : copy.todayLine}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--cp-text-dim)',
            fontWeight: 700,
            marginTop: 8,
            letterSpacing: 0.5,
          }}
        >
          @ieumsaju
        </div>
      </div>
    </div>
  );
}

function ShareStory({ copy }: { copy: IECopy }) {
  return (
    <div
      style={{
        width: 220,
        height: 391,
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(180deg, #C9B6F0 0%, #FFB69E 100%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}
    >
      <Sparkle size={16} color="#FFC857" style={{ position: 'absolute', top: 50, left: 36 }} />
      <Sparkle size={11} color="#fff" style={{ position: 'absolute', top: 120, right: 30 }} />
      <Sparkle size={13} color="#FFC857" style={{ position: 'absolute', bottom: 120, left: 30 }} />
      <div
        style={{
          padding: '32px 22px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          textAlign: 'center',
          color: '#2A2333',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.2,
            color: 'rgba(42,35,51,0.7)',
          }}
        >
          이음사주 · 오늘의 운세
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <MoodOrb size={130} />
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: -0.6,
              lineHeight: 1.15,
            }}
          >
            {copy.todayMood}
          </div>
          <div
            style={{
              width: 50,
              height: 3,
              background: 'rgba(42,35,51,0.3)',
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.5,
              color: 'rgba(42,35,51,0.85)',
              maxWidth: 180,
            }}
          >
            {copy.todayLine}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.5,
            color: 'rgba(42,35,51,0.7)',
          }}
        >
          @ieumsaju
        </div>
      </div>
    </div>
  );
}

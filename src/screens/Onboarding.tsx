import { IEButton, IECopy, MoodOrb, Reveal, Sparkle } from '../components/ie';
import { useRouter } from '../lib/router';

/**
 * 01 온보딩 — 프로토타입 ScreenOnboarding 이식.
 * MoodOrb + 이음사주 + 시작하기 CTA.
 */
export default function ScreenOnboarding({ copy }: { copy: IECopy }) {
  const { go } = useRouter();
  return (
    <div
      className="ie-screen"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #FBF6FF 0%, #FFF0EE 100%)',
        paddingTop: 62,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 28px',
          position: 'relative',
        }}
      >
        <Sparkle size={20} color="#FFC857" style={{ position: 'absolute', top: 80, left: 50 }} />
        <Sparkle size={14} color="#9D7BFF" style={{ position: 'absolute', top: 130, right: 60 }} />
        <Sparkle size={16} color="#FF8B6C" style={{ position: 'absolute', bottom: 200, left: 40 }} />

        <Reveal>
          <MoodOrb size={200} />
        </Reveal>
        <Reveal delay={200}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              letterSpacing: -1,
              margin: '24px 0 12px',
              textAlign: 'center',
              lineHeight: 1.2,
            }}
          >
            이음사주
          </h1>
        </Reveal>
        <Reveal delay={350}>
          <p
            style={{
              fontSize: 16,
              color: 'var(--cp-text-dim)',
              textAlign: 'center',
              margin: 0,
              lineHeight: 1.5,
              maxWidth: 280,
              whiteSpace: 'pre-line',
            }}
          >
            {'어제와 내일을 이어주는\n오늘의 운세 풀이'}
          </p>
        </Reveal>
      </div>
      <Reveal delay={500} style={{ padding: '0 24px 110px' }}>
        <IEButton onClick={() => go('input')}>시작하기</IEButton>
        <div
          style={{
            textAlign: 'center',
            marginTop: 14,
            fontSize: 12,
            color: 'var(--cp-text-dim)',
          }}
        >
          이미 계정이 있어요 ·{' '}
          <span style={{ color: 'var(--cp-lavender)', fontWeight: 700 }}>로그인</span>
        </div>
      </Reveal>
    </div>
  );
}

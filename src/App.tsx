import { Component, type ReactNode } from 'react';
import AppShell from './screens/AppShell';
import { SajuProvider } from './lib/saju-state';
import { SpiritStateProvider } from './lib/spirit-state';

/** 앱 전체를 감싸는 크래시 가드 — 예상치 못한 에러가 화면을 완전히 지워버리지 않도록 */
class ErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError(): { crashed: boolean } {
    return { crashed: true };
  }
  componentDidCatch(err: unknown, info: unknown) {
    // 조용한 크래시 방지 — 콘솔에 남겨 디버깅 지원
    console.error('[이음사주] 앱 오류:', err, info);
  }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 28px',
          textAlign: 'center',
          background: 'var(--color-cp-bg, #FAF6FB)',
          fontFamily: 'var(--font-sans, sans-serif)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🌙</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-cp-text, #2A2333)', marginBottom: 8 }}>
            잠시 문제가 생겼어요
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-cp-text-dim, #75688A)', lineHeight: 1.6, marginBottom: 28 }}>
            정령이 잠시 당황한 것 같아요.<br />
            아래 버튼을 눌러 다시 시도해주세요.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '14px 32px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 800,
              background: 'linear-gradient(120deg, var(--color-cp-lavender, #9D7BFF), var(--color-cp-peach, #FF8B6C))',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(157,123,255,.35)',
            }}
          >
            다시 시도하기
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <SajuProvider>
        <SpiritStateProvider>
          <AppShell />
        </SpiritStateProvider>
      </SajuProvider>
    </ErrorBoundary>
  );
}

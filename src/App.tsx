import { useState } from 'react';
import { IEButton, IE_COPY, MoodOrb } from './components/ie';
import { RouterProvider, ScreenId, useRouter } from './lib/router';
import { SajuProvider, useSaju } from './lib/saju-state';
import ScreenOnboarding from './screens/Onboarding';
import ScreenHome from './screens/Home';
import ScreenInput from './screens/Input';
import ScreenToday from './screens/Today';
import ScreenShare from './screens/Share';
import ScreenSaju from './screens/Saju';
import ScreenYear from './screens/Year';
import ScreenGunghap from './screens/Gunghap';
import ScreenMoney from './screens/Money';
import ScreenHistory from './screens/History';
import ScreenSettings from './screens/Settings';

/**
 * 이음사주 토스 미니앱 — App shell.
 * Phase A: 폴더 구조 + 공용 컴포넌트 + 라우터 + Onboarding/Home 2 화면.
 * 다음 (Phase B): Input · Today · Share + 광고 SDK 통합.
 */

/** profile 이 있어야만 의미 있는 운세 결과 화면들 */
const NEEDS_PROFILE: ScreenId[] = ['today', 'saju', 'year', 'gunghap', 'money'];

function Shell() {
  const { current } = useRouter();
  const { profile } = useSaju();
  const [tone] = useState<keyof typeof IE_COPY>('witty'); // 추후 Settings 에서 토글
  const copy = IE_COPY[tone];

  // 글로벌 가드 — 운세 결과 화면은 profile 없이 진입 X
  if (NEEDS_PROFILE.includes(current) && !profile) {
    return <NoProfileGuard />;
  }

  // Phase A·B·C: 11 화면 전부. paywall 은 광고 모델로 제외.
  switch (current) {
    case 'onboarding':
      return <ScreenOnboarding copy={copy} />;
    case 'input':
      return <ScreenInput />;
    case 'home':
      return <ScreenHome copy={copy} />;
    case 'today':
      return <ScreenToday copy={copy} />;
    case 'share':
      return <ScreenShare copy={copy} />;
    case 'saju':
      return <ScreenSaju copy={copy} />;
    case 'year':
      return <ScreenYear copy={copy} />;
    case 'gunghap':
      return <ScreenGunghap copy={copy} />;
    case 'money':
      return <ScreenMoney />;
    case 'history':
      return <ScreenHistory />;
    case 'settings':
      return <ScreenSettings />;
    default:
      return <ComingSoon screen={current} />;
  }
}

function NoProfileGuard() {
  const { reset } = useRouter();
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 28,
        background: 'var(--cp-bg)',
      }}
    >
      <MoodOrb size={120} />
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, textAlign: 'center' }}>
        먼저 정보를 입력해주세요
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--cp-text-dim)',
          margin: 0,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        이름·생년월일·시·성별을 입력하면<br />
        나만의 명식과 운세를 풀어드려요
      </p>
      <div style={{ width: '100%', maxWidth: 320 }}>
        <IEButton onClick={() => reset('input')}>정보 입력하기</IEButton>
      </div>
    </div>
  );
}

function ComingSoon({ screen }: { screen: string }) {
  const { back, reset } = useRouter();
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        background: 'var(--cp-bg)',
      }}
    >
      <div style={{ fontSize: 48 }}>🛠️</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
        {screen} 화면 준비 중
      </h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--cp-text-dim)',
          margin: 0,
          textAlign: 'center',
        }}
      >
        Phase B/C 에서 구현 예정
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={back}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: '1px solid var(--cp-border)',
            background: 'var(--cp-bg-paper)',
            color: 'var(--cp-text)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ← 뒤로
        </button>
        <button
          onClick={() => reset('home')}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, #9D7BFF, #FF8B6C)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          홈으로
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SajuProvider>
      <RouterProvider initial="onboarding">
        <Shell />
      </RouterProvider>
    </SajuProvider>
  );
}

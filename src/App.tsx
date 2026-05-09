import { useState } from 'react';

/**
 * 이음사주 — 토스 미니앱 첫 랜딩 화면.
 * Cloud Pastel 디자인 시스템 위에서 헤로 + 서브 + CTA 만 노출.
 * 다음 단계: 온보딩(생년월일) 라우터, 명식 로딩, 결과 챕터.
 */
function App() {
  const [tappedAt, setTappedAt] = useState<string | null>(null);

  const handleStart = () => {
    setTappedAt(new Date().toLocaleTimeString('ko-KR'));
    // TODO: 라우터 붙으면 navigate('/onboarding/birth') 으로 교체
  };

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--cp-bg)',
        padding: '32px 24px 32px',
      }}
    >
      {/* 헤더 영역 */}
      <header style={{ paddingTop: 16 }}>
        <div
          className="cp-caption"
          style={{ color: 'var(--cp-lavender)', fontWeight: 700 }}
        >
          SAJU · TOSS
        </div>
        <h1
          className="cp-display"
          style={{ marginTop: 12, fontSize: 44, lineHeight: 1.05 }}
        >
          어제와 내일을<br />
          <span style={{ color: 'var(--cp-lavender)' }}>이어주는</span>
          <br />
          이음사주
        </h1>
        <p
          className="cp-body-l"
          style={{ marginTop: 16, color: 'var(--cp-text-mid)', maxWidth: 320 }}
        >
          당신의 결, 풀어드릴게요. ☁️
        </p>
      </header>

      {/* 중앙 — 일러스트 자리 (임시 그라디언트 원) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '32px 0',
        }}
      >
        <div
          aria-hidden
          style={{
            width: 220,
            height: 220,
            borderRadius: '50%',
            background:
              'conic-gradient(from 180deg, var(--cp-lavender-soft), var(--cp-peach-soft), var(--cp-mint-soft), var(--cp-lavender-soft))',
            filter: 'blur(0.5px)',
            boxShadow: 'var(--cp-shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cp-text)',
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -2,
            background:
              'linear-gradient(135deg, var(--cp-lavender) 0%, var(--cp-peach) 100%)',
          }}
        >
          <span style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
            결
          </span>
        </div>
      </div>

      {/* CTA 영역 */}
      <footer
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <button
          className="cp-btn cp-btn-primary"
          onClick={handleStart}
          style={{ width: '100%' }}
        >
          내 사주 풀어보기
        </button>
        <button
          className="cp-btn cp-btn-ghost"
          onClick={handleStart}
          style={{ width: '100%' }}
        >
          오늘의 운세 무료로 보기
        </button>
        {tappedAt && (
          <p
            className="cp-caption"
            style={{ textAlign: 'center', marginTop: 4 }}
          >
            tap @ {tappedAt} · 다음 화면 라우팅 연결 예정
          </p>
        )}
      </footer>
    </main>
  );
}

export default App;

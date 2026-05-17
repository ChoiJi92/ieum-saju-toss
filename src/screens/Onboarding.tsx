import { useState } from 'react';
import { IECopy, IEModal, MoodOrb, Reveal, Sparkle } from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import {
  getMockTossUser,
  isTossLoginEnabled,
  signInWithToss,
  tossInfoToSajuInput,
  type TossUserInfo,
} from '../lib/toss-auth';

/**
 * 01 온보딩 — 토스 로그인 + 직접 입력 2-CTA 디자인.
 *
 * 토스로 시작 → appLogin() → user info → TossConfirm 화면 (시간만 선택)
 * 직접 입력 → 기존 Input 화면 (5단계 직접 입력)
 *
 * Client ID 미발급 환경에서는 SDK 실패 → 안내 모달 후 직접 입력으로 fallback.
 */
export default function ScreenOnboarding({ copy }: { copy: IECopy }) {
  void copy;
  const { go } = useRouter();
  const { setTossPending } = useSaju();
  const [loading, setLoading] = useState(false);
  const [errOpen, setErrOpen] = useState<string | null>(null);

  const handleTossLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let info: TossUserInfo;
      if (isTossLoginEnabled()) {
        info = await signInWithToss();
      } else {
        // Client ID 발급 전 — mock 데이터로 UI 흐름 검증
        await new Promise((r) => setTimeout(r, 600));
        info = getMockTossUser();
      }
      setTossPending(tossInfoToSajuInput(info));
      go('tossConfirm');
    } catch (e) {
      console.warn('[toss-login] failed', e);
      setErrOpen(
        '토스 로그인 연결이 원활하지 않아요. 직접 입력으로 진행해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="ie-screen"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #FBF6FF 0%, #FFF0EE 100%)',
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

      <Reveal delay={500} style={{ padding: '32px 24px 110px' }}>
        {/* Primary — 우리 브랜드 그라데이션, 텍스트만 */}
        <button
          onClick={handleTossLogin}
          disabled={loading}
          style={{
            width: '100%',
            height: 56,
            padding: '0 24px',
            border: 'none',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #9D7BFF, #FF8B6C)',
            color: '#fff',
            fontFamily: 'var(--cp-font)',
            fontSize: 16,
            fontWeight: 800,
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: 'var(--cp-shadow-pop)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.7 : 1,
            transition: 'transform .12s, box-shadow .12s',
            letterSpacing: -0.2,
          }}
        >
          {loading ? '연결 중…' : '토스로 시작하기'}
        </button>
        <div
          style={{
            textAlign: 'center',
            marginTop: 10,
            fontSize: 12,
            color: 'var(--cp-text-dim)',
            fontWeight: 600,
          }}
        >
          이름·생년월일·성별 자동 입력 · 시간만 선택
        </div>

        {/* 직접 입력 — 작은 텍스트 링크 */}
        <button
          onClick={() => go('input')}
          style={{
            marginTop: 18,
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
          직접 입력하기 ›
        </button>

        {/* 이용 동의 안내 — 한국 서비스 표준 */}
        <div
          style={{
            marginTop: 6,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--cp-text-dim)',
            lineHeight: 1.6,
            fontWeight: 600,
            padding: '0 8px',
          }}
        >
          이용 시{' '}
          <span
            onClick={(e) => {
              e.stopPropagation();
              go('terms');
            }}
            style={{
              textDecoration: 'underline',
              color: 'var(--cp-text-mid)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            서비스 이용약관
          </span>
          {' '}및{' '}
          <span
            onClick={(e) => {
              e.stopPropagation();
              go('privacy');
            }}
            style={{
              textDecoration: 'underline',
              color: 'var(--cp-text-mid)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            개인정보 처리방침
          </span>
          에 동의합니다
        </div>
      </Reveal>

      <IEModal
        open={!!errOpen}
        title="토스 로그인을 사용할 수 없어요"
        body={errOpen ?? ''}
        confirmLabel="직접 입력하기"
        cancelLabel="닫기"
        onConfirm={() => {
          setErrOpen(null);
          go('input');
        }}
        onCancel={() => setErrOpen(null)}
      />

    </div>
  );
}

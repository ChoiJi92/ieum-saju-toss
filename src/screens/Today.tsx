import { useEffect, useMemo, useState } from 'react';
import {
  IECard,
  IEChip,
  IECopy,
  IETopBar,
  MoodOrb,
  OHAENG,
  Reveal,
} from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { showInterstitialThen } from '../lib/ads';
import { todayFortune } from '../lib/today';

/**
 * 04 오늘의 운세 — 프로토타입 ScreenToday 이식 + 광고 모델.
 *
 * 흐름:
 *   진입 → 광고(showInterstitialThen) → 결과 5섹션
 *   광고 로드 실패 / 데스크톱 dev → 즉시 결과
 *
 * 프리미엄 nudge 카드 제거 (광고 모델). density 변형도 단순화 (long 1개).
 */
export default function ScreenToday({ copy }: { copy: IECopy }) {
  const { back, go } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);

  useEffect(() => {
    // 진입 즉시 광고 호출. 결과는 광고 닫힘 후.
    showInterstitialThen(() => setAdDone(true));
  }, []);

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일 (${
    ['일', '월', '화', '수', '목', '금', '토'][today.getDay()]
  })`;

  /** 본인 일간 + 오늘 일진 → 5섹션 동적 운세 */
  const fortune = useMemo(
    () => (myeongsik ? todayFortune(myeongsik.ilgan.c, today) : null),
    [myeongsik, today.toDateString()]
  );

  // fortune 없으면 fallback (정보 미입력 케이스 — App.tsx 글로벌 가드로 잡혀야 함)
  const sections = fortune
    ? [
        { id: 'overall', icon: '☁️', label: '총운',  color: '#9D7BFF', score: fortune.sections.overall.score, body: fortune.sections.overall.body },
        { id: 'love',    icon: '💞', label: '연애운', color: '#F495C9', score: fortune.sections.love.score,    body: fortune.sections.love.body },
        { id: 'money',   icon: '💰', label: '재물운', color: '#3DC795', score: fortune.sections.money.score,   body: fortune.sections.money.body },
        { id: 'work',    icon: '🌱', label: '직장운', color: '#FFC857', score: fortune.sections.work.score,    body: fortune.sections.work.body },
        { id: 'health',  icon: '🍵', label: '건강운', color: '#5B8DEF', score: fortune.sections.health.score,  body: fortune.sections.health.body },
      ]
    : [];

  // 광고 노출 중 placeholder
  if (!adDone) {
    return (
      <div
        className="ie-screen"
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
        <MoodOrb size={120} />
        <div style={{ fontSize: 14, color: 'var(--cp-text-mid)', fontWeight: 700 }}>
          오늘의 흐름을 읽고 있어요…
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--cp-text-dim)',
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          잠시만 기다려주세요 (광고가 끝나면 결과를 보여드려요)
        </div>
      </div>
    );
  }

  return (
    <div
      className="ie-screen"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #FBF6FF 0%, var(--cp-bg) 50%)',
      }}
    >
      <div style={{ height: 62, flexShrink: 0 }} />
      <IETopBar
        onBack={back}
        title="오늘의 운세"
        right={
          <button
            onClick={() => go('share')}
            style={{
              background: 'transparent',
              border: 'none',
              width: 36,
              height: 36,
              cursor: 'pointer',
              color: 'var(--cp-text-mid)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
              <path d="M16 6l-4-4-4 4" />
              <path d="M12 2v13" />
            </svg>
          </button>
        }
      />
      <div
        className="ie-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}
      >
        {/* 본인 정보 칩 */}
        {profile && myeongsik && (
          <ProfileChip
            name={profile.name}
            ilganChar={myeongsik.ilgan.c}
            ilganOhaeng={OHAENG[myeongsik.ilgan.ohaeng]}
          />
        )}

        {/* 히어로 */}
        <div style={{ textAlign: 'center', padding: '4px 0 20px' }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--cp-text-dim)',
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {dateStr}
          </div>
          <div style={{ marginTop: 12 }}>
            <MoodOrb
              size={180}
              label={fortune?.mood ?? copy.todayMood}
              score={String(fortune?.sections.overall.score ?? 0)}
            />
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: -0.4,
              margin: '20px 0 6px',
            }}
          >
            {copy.todayTitle} {fortune?.mood ?? copy.todayMood}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--cp-text-dim)',
              margin: 0,
              lineHeight: 1.55,
              maxWidth: 320,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {fortune?.oneLine ?? copy.todayLine}
          </p>
          {fortune && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 6,
                marginTop: 14,
                flexWrap: 'wrap',
              }}
            >
              <IEChip color="#9D7BFF" soft>{fortune.hashtags[0]}</IEChip>
              <IEChip color="#FF8B6C" soft>{fortune.hashtags[1]}</IEChip>
              <IEChip color="#FFC857" soft>{fortune.hashtags[2]}</IEChip>
            </div>
          )}
        </div>

        {/* 5 섹션 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sections.map((s, i) => (
            <Reveal key={s.id} delay={i * 80}>
              <SectionCard s={s} />
            </Reveal>
          ))}
        </div>

        {/* ⚠️ 광고 모델: 프리미엄 nudge 카드 제거 */}
      </div>
    </div>
  );
}

/** 헤더 아래 작은 본인 정보 칩 — 사용자가 "내 사주 기반"임을 인지 */
function ProfileChip({
  name,
  ilganChar,
  ilganOhaeng,
}: {
  name: string;
  ilganChar: string;
  ilganOhaeng: { c: string; cn: string };
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 12px' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 999,
          background: 'var(--cp-bg-paper)',
          border: '1px solid var(--cp-border)',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--cp-text-mid)',
        }}
      >
        <span>{name}</span>
        <span style={{ color: 'var(--cp-text-mute)' }}>·</span>
        <span>일간</span>
        <strong style={{ color: ilganOhaeng.c, fontSize: 12 }}>
          {ilganChar}
          {ilganOhaeng.cn}
        </strong>
      </span>
    </div>
  );
}

function SectionCard({
  s,
}: {
  s: { icon: string; label: string; score: number; color: string; body: string };
}) {
  return (
    <IECard style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: s.color + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          {s.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--cp-text-dim)',
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            {s.label.toUpperCase()}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>
            {s.score}점 · {s.label}
          </div>
        </div>
      </div>
      <div
        style={{
          height: 8,
          background: 'var(--cp-bg)',
          borderRadius: 999,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: `${s.score}%`,
            height: '100%',
            background: s.color,
            borderRadius: 999,
          }}
        />
      </div>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--cp-text-mid)',
          margin: 0,
        }}
      >
        {s.body}
      </p>
    </IECard>
  );
}

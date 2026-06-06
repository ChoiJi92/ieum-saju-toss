import { useMemo, useState } from 'react';
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
import { RewardedAdGate } from '../components/RewardedAdGate';
import { todayFortune } from '../lib/today';
import { buildTodayActionGuide } from '../lib/fortune-guides';
import { pillarSeed } from '../lib/personalize';

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
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);


  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일 (${
    ['일', '월', '화', '수', '목', '금', '토'][today.getDay()]
  })`;

  /** 본인 명식 + 오늘 일진 → 5섹션 동적 운세 (명식 시드로 점수 ±3 변동) */
  const fortune = useMemo(
    () => (myeongsik ? todayFortune(myeongsik, today) : null),
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

  const actionGuide = useMemo(() => {
    if (!fortune || sections.length === 0) return null;
    return buildTodayActionGuide({
      sections,
      date: today,
      personalSeed: myeongsik ? pillarSeed(myeongsik) : 'anonymous',
    });
  }, [fortune, sections, myeongsik, today.toDateString()]);

  if (!adDone) return (
    <RewardedAdGate
      title="오늘의 운세 보기"
      description="오늘의 운세 결과를 보려면 리워드 광고를 시청해주세요."
      onCancel={back}
      onUnlocked={() => setAdDone(true)}
    />
  );

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
      <IETopBar
        onBack={back}
        title="오늘의 운세"
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

        {actionGuide && (
          <Reveal delay={220}>
            <IECard style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>오늘 행동 가이드</div>
              <GuideBlock title="하면 좋은 행동" emoji="✅" items={actionGuide.doList} />
              <GuideBlock title="피하면 좋은 행동" emoji="🛟" items={actionGuide.avoidList} />
            </IECard>
          </Reveal>
        )}

        {actionGuide && (
          <Reveal delay={260}>
            <IECard style={{ marginTop: 14, background: 'linear-gradient(135deg,#F1E9FF 0%, #EAF3FF 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
                <span>⏰</span>
                <span>오늘 행운 시간대</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>{actionGuide.luckyTime}</div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800 }}>
                <span>💬</span>
                <span>오늘의 대화 한마디</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.6 }}>
                {actionGuide.todayOneLine}
              </p>
            </IECard>
          </Reveal>
        )}

        {actionGuide && (
          <Reveal delay={300}>
            <IECard style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
                <span>🚫</span>
                <span>오늘 피해야 할 한 줄</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.6 }}>
                {actionGuide.todayNoNo}
              </p>
            </IECard>
          </Reveal>
        )}

        {actionGuide && (
          <Reveal delay={340}>
            <IECard style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
                <span>🧭</span>
                <span>오늘 3단계 미션</span>
              </div>
              <GuideBlock title="아침" emoji="🌅" items={[actionGuide.missions.morning]} />
              <GuideBlock title="낮" emoji="☀️" items={[actionGuide.missions.noon]} />
              <GuideBlock title="저녁" emoji="🌙" items={[actionGuide.missions.night]} />
            </IECard>
          </Reveal>
        )}

        {actionGuide && (
          <Reveal delay={380}>
            <IECard style={{ marginTop: 14, background: 'linear-gradient(135deg,#FFF3E3 0%, #F4F8FF 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
                <span>📝</span>
                <span>하루 마감 체크</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.6 }}>
                {actionGuide.closingQuestion}
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--cp-text-dim)', lineHeight: 1.55 }}>
                {actionGuide.tomorrowKickoff}
              </p>
            </IECard>
          </Reveal>
        )}

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
          {ilganChar}{ilganOhaeng.cn} 기운
        </strong>
      </span>
    </div>
  );
}

function GuideBlock({ title, emoji, items }: { title: string; emoji: string; items: string[] }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
        <span>{emoji}</span>
        <span>{title}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`} style={{ fontSize: 13, color: 'var(--cp-text-mid)', lineHeight: 1.55 }}>
            {item}
          </li>
        ))}
      </ul>
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

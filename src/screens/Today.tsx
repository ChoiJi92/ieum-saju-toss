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
    const topSection = sections.reduce((best, cur) => (cur.score > best.score ? cur : best), sections[0]);
    const lowSection = sections.reduce((worst, cur) => (cur.score < worst.score ? cur : worst), sections[0]);

    const doMap: Record<string, string[]> = {
      overall: ['오늘 가장 중요한 1가지를 아침에 먼저 끝내보세요.', '해야 할 일 3개만 남기고 나머지는 과감히 미뤄도 괜찮아요.'],
      love: ['고마운 사람에게 짧은 안부를 먼저 보내보세요.', '표현을 아끼기보다 짧게라도 진심을 말해보세요.'],
      money: ['오늘 결제 전 10초 멈춤 규칙을 써보세요.', '자동이체·구독 1개만 점검해도 흐름이 좋아져요.'],
      work: ['가장 어려운 업무를 오전에 먼저 처리해보세요.', '회의 전 핵심 2줄만 미리 정리해두면 훨씬 수월해져요.'],
      health: ['물을 조금 더 자주 마시고, 20분 정도 가볍게 걸어보세요.', '잠들기 1시간 전 화면 사용을 줄이면 컨디션이 달라져요.'],
    };

    const avoidMap: Record<string, string[]> = {
      overall: ['멀티태스킹으로 한 번에 여러 일을 벌리는 건 피해주세요.', '중요한 결정을 피곤한 시간대에 내리지 마세요.'],
      love: ['감정이 올라온 상태에서 긴 메시지를 보내지 마세요.', '상대의 의도를 단정 짓는 말투는 오늘 특히 피해주세요.'],
      money: ['충동구매 앱 결제는 오늘 하루만 미뤄보세요.', '체면 지출(괜히 쏘기)은 예산 안에서만 하세요.'],
      work: ['완벽주의로 마감 자체를 늦추는 건 피해주세요.', '즉흥적인 말로 팀 분위기를 흔들지 않게 주의하세요.'],
      health: ['카페인 과다·야식은 오늘 피로를 키울 수 있어요.', '통증 신호를 무시하고 무리 운동하는 건 피해주세요.'],
    };

    const topDo = doMap[topSection.id] ?? doMap.overall;
    const lowAvoid = avoidMap[lowSection.id] ?? avoidMap.overall;

    const doList = [
      ...topDo,
      `오늘의 강점은 ${topSection.label}이에요. 관련 행동을 하나 더 해보면 좋아요.`,
    ].slice(0, 3);

    const avoidList = [
      ...lowAvoid,
      `${lowSection.label} 쪽은 예민할 수 있으니, 서두르지 말고 한 박자 쉬어가세요.`,
    ].slice(0, 3);

    const luckyTimeMap: Record<string, string> = {
      overall: '09:00~11:00',
      love: '19:00~21:00',
      money: '11:00~13:00',
      work: '08:30~10:30',
      health: '21:00~22:00',
    };

    const talkMap: Record<string, string> = {
      overall: '오늘은 “이건 제가 먼저 해볼게요.” 한마디가 흐름을 살려줘요.',
      love: '오늘은 “네 마음 먼저 듣고 싶어.” 라는 말이 관계를 부드럽게 해줘요.',
      money: '오늘은 “이건 하루만 생각하고 결정할게요.” 라고 말해보세요.',
      work: '오늘은 “핵심은 이 두 가지예요.” 라고 요약하면 신뢰가 올라가요.',
      health: '오늘은 “잠깐 쉬고 다시 할게요.”라고 말하는 용기가 필요해요.',
    };

    const noNoMap: Record<string, string> = {
      overall: '오늘은 동시에 여러 결정을 한 번에 내리지 마세요.',
      love: '오늘은 답답함이 올라와도 단정적인 말투는 피해주세요.',
      money: '오늘은 할인 문구만 보고 바로 결제하지 마세요.',
      work: '오늘은 감정 섞인 즉답보다 메모 후 답변이 안전해요.',
      health: '오늘은 피곤한데도 무리한 운동 강행은 피해주세요.',
    };

    const missionMap: Record<string, { morning: string; noon: string; night: string }> = {
      overall: {
        morning: '아침에 오늘의 최우선 1가지를 25분만 먼저 시작해보세요.',
        noon: '점심 전 불필요한 일 1개를 과감히 미루세요.',
        night: '저녁에 오늘 한 일 3줄 요약으로 흐름을 정리해보세요.',
      },
      love: {
        morning: '아침에 고마운 사람 1명에게 짧은 안부를 보내보세요.',
        noon: '낮에는 상대 말 1가지를 끝까지 듣고 바로 공감해보세요.',
        night: '저녁에 마음 표현 한 문장을 직접 전해보세요.',
      },
      money: {
        morning: '아침에 오늘 지출 한도를 숫자로 먼저 정해보세요.',
        noon: '낮에는 결제 전 10초 멈춤 규칙을 꼭 지켜보세요.',
        night: '저녁에 결제내역 3개만 점검하고 내일 한도를 조정하세요.',
      },
      work: {
        morning: '아침에 가장 어려운 업무를 40분 먼저 처리해보세요.',
        noon: '낮에는 회의/대화 전 핵심 2줄을 메모해 전달하세요.',
        night: '저녁에 내일 첫 작업 1개를 캘린더에 고정해두세요.',
      },
      health: {
        morning: '아침에 물 한 컵 + 가벼운 스트레칭 5분을 해보세요.',
        noon: '낮에는 15분만 걸으며 호흡을 정리해보세요.',
        night: '저녁엔 취침 1시간 전 화면을 줄이고 회복 시간을 확보하세요.',
      },
    };

    const closingMap: Record<string, string> = {
      overall: '오늘 내가 가장 잘한 선택 1가지는 무엇이었나요?',
      love: '오늘 대화에서 내가 먼저 배려한 장면이 있었나요?',
      money: '오늘 지출 중 내 기준에 맞았던 소비는 무엇이었나요?',
      work: '오늘 업무에서 핵심을 잘 전달한 순간이 있었나요?',
      health: '오늘 내 몸이 보내준 신호를 잘 챙긴 순간이 있었나요?',
    };

    const luckyTime = luckyTimeMap[topSection.id] ?? luckyTimeMap.overall;
    const todayOneLine = talkMap[topSection.id] ?? talkMap.overall;
    const todayNoNo = noNoMap[lowSection.id] ?? noNoMap.overall;
    const missions = missionMap[topSection.id] ?? missionMap.overall;
    const closingQuestion = closingMap[lowSection.id] ?? closingMap.overall;

    return {
      doList,
      avoidList,
      luckyTime,
      todayOneLine,
      todayNoNo,
      missions,
      closingQuestion,
      tomorrowKickoff: `내일 시작 한 줄: ${topSection.label} 관련 가장 작은 행동 1개를 아침에 바로 시작해보세요.`,
    };
  }, [fortune, sections]);

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
          {ilganOhaeng.label} 기운
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

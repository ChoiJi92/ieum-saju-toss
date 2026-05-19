import { useMemo, useState } from 'react';
import { IECard, IETopBar, OHAENG, Reveal } from '../components/ie';
import { RewardedAdGate } from '../components/RewardedAdGate';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { personalityCard } from '../lib/personality';

export default function ScreenPersonality() {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [unlocked, setUnlocked] = useState(false);

  const card = useMemo(() => (myeongsik ? personalityCard(myeongsik) : null), [myeongsik]);
  const relationCaution = useMemo(() => {
    if (!card) return '';
    const difficult = card.difficultMatches[0] ?? '기준이 다른 사람';
    return `오늘은 ${difficult}과의 대화에서 기대치를 먼저 맞춰보세요. 말보다 실행 기준을 확인하면 불필요한 감정 소모를 줄일 수 있어요.`;
  }, [card]);

  if (!unlocked) {
    return (
      <RewardedAdGate
        title="나의 사주 성격 카드"
        description="광고를 보면 내 성향·매력·관계 패턴을 카드로 열어드릴게요."
        onCancel={back}
        onUnlocked={() => setUnlocked(true)}
      />
    );
  }

  if (!myeongsik || !card) return null;

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title="성격 카드" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        {profile && (
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
              <span>{profile.name}</span>
              <span style={{ color: 'var(--cp-text-mute)' }}>·</span>
              <span>일간</span>
              <strong style={{ color: OHAENG[myeongsik.ilgan.ohaeng].c, fontSize: 12 }}>
                {OHAENG[myeongsik.ilgan.ohaeng].label} 기운
              </strong>
            </span>
          </div>
        )}

        <IECard pop style={{ position: 'relative', overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 14,
              fontSize: 28,
              opacity: 0.28,
              pointerEvents: 'none',
            }}
          >
            ✨
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: 'rgba(42,35,51,0.7)', letterSpacing: 1 }}>
            <span>🪞</span>
            <span>성격 카드</span>
          </div>

          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, letterSpacing: -0.4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{card.title}</span>
            <span style={{ fontSize: 20 }}>💫</span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--cp-text-dim)', margin: '8px 0 0', lineHeight: 1.55, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12 }}>🧭</span>
            <span>{card.subtitle}</span>
          </p>

          <p style={{ fontSize: 14, color: 'var(--cp-text-mid)', margin: '14px 0 0', lineHeight: 1.7 }}>
            {card.identity}
          </p>
        </IECard>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          <Reveal delay={40}><ListCard emoji="✨" title="나의 매력 포인트" items={card.strengths} /></Reveal>
          <Reveal delay={80}><ListCard emoji="🫧" title="사람들이 오해하는 부분" items={card.misunderstood} /></Reveal>
          <Reveal delay={120}><ListCard emoji="🏡" title="내가 편해지는 환경" items={card.comfortZone} /></Reveal>
          <Reveal delay={160}><ListCard emoji="🔁" title="반복 패턴" items={card.patterns} /></Reveal>
          <Reveal delay={200}><ListCard emoji="🤝" title="잘 맞는 사람" items={card.goodMatches} /></Reveal>
          <Reveal delay={240}><ListCard emoji="⚠️" title="안 맞는 사람" items={card.difficultMatches} /></Reveal>
          <Reveal delay={280}><ListCard emoji="💬" title="관계 대화 팁" items={card.talkTips} /></Reveal>
          <Reveal delay={320}><ListCard emoji="🧩" title="오늘 실행 루틴" items={card.todayRoutines} /></Reveal>
        </div>

        <IECard style={{ marginTop: 14, background: 'linear-gradient(135deg,#EAF3FF 0%, #F2ECFF 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--cp-text-mid)', marginBottom: 6 }}>
            <span>🧠</span>
            <span>오늘의 관계 주의 포인트</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, fontWeight: 700, color: 'var(--cp-text)' }}>
            {relationCaution}
          </p>
        </IECard>

        <IECard style={{ marginTop: 14, background: 'linear-gradient(135deg,#F1E9FF 0%, #FFEADD 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--cp-text-mid)', marginBottom: 6 }}>
            <span>💡</span>
            <span>오늘 기억할 문장</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, fontWeight: 700, color: 'var(--cp-text)' }}>
            {card.mantra}
          </p>
        </IECard>
      </div>
    </div>
  );
}

function ListCard({ emoji, title, items }: { emoji: string; title: string; items: string[] }) {
  return (
    <IECard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`} style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--cp-text-mid)' }}>
            {item}
          </li>
        ))}
      </ul>
    </IECard>
  );
}

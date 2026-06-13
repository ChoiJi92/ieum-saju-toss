import { V2Screen, V2TopBar, V2Label, V2Glass, SpiritSlot, SectionCard, BulletList, DomainEmpty } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { personalityCard } from '../../lib/personality';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenPersonality({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const f = myeongsik ? personalityCard(myeongsik) : null;
  if (!f) return <DomainEmpty title="성격 분석" back={back} />;
  return (
    <V2Screen seed={38}>
      <V2TopBar onBack={back} title="성격 분석" />

      <V2Glass style={{ textAlign: 'center' }}>
        <SpiritSlot spirit={spirit} size={88} tag={false} />
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--v2-ink)', marginTop: 6 }}>{f.title}</div>
        <div style={{ fontSize: 13, color: 'var(--v2-ink-dim)', marginTop: 4 }}>{f.subtitle}</div>
      </V2Glass>

      <div style={{ marginTop: 14 }}>
        <SectionCard title="나는" body={f.identity} />
      </div>

      <V2Label>강점</V2Label>
      <BulletList items={f.strengths} />

      <V2Label>이런 오해를 받아요</V2Label>
      <BulletList items={f.misunderstood} />

      <V2Label>편한 환경</V2Label>
      <BulletList items={f.comfortZone} />

      <V2Label>반복되는 패턴</V2Label>
      <BulletList items={f.patterns} />

      <V2Label>잘 맞는 사람</V2Label>
      <BulletList items={f.goodMatches} />

      <V2Label>조심할 관계</V2Label>
      <BulletList items={f.difficultMatches} />

      <V2Label>대화 팁</V2Label>
      <BulletList items={f.talkTips} />

      <V2Label>나의 루틴</V2Label>
      <BulletList items={f.todayRoutines} />

      <V2Glass style={{ marginTop: 22, textAlign: 'center', background: 'linear-gradient(135deg, rgba(183,156,255,.16), rgba(255,158,130,.12))' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1.55 }}>🌙 {f.mantra}</div>
      </V2Glass>

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

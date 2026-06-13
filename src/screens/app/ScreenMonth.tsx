import { V2Screen, V2TopBar, V2Label, DomainHeader, AxisRow, Accordion, Chip, SectionCard, DomainEmpty, V2Glass } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { monthForecast } from '../../lib/month';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenMonth({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const f = myeongsik ? monthForecast(myeongsik) : null;
  if (!f) return <DomainEmpty title="이달의 운세" back={back} />;
  return (
    <V2Screen seed={31}>
      <V2TopBar onBack={back} title="이달의 운세" />

      <DomainHeader spirit={spirit} score={f.monthScore} mood={f.mood} tagline={f.tagline} />

      <V2Label>이달의 네 분야</V2Label>
      <AxisRow axes={f.fields} />

      <V2Label>좋은 날 · 주의할 날</V2Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <V2Glass glow="0 0 22px var(--v2-mint)33">
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-mint)', marginBottom: 6 }}>🍀 좋은 날</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1.1 }}>{f.bestDay.day}일</div>
          <div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', marginTop: 6, lineHeight: 1.5 }}>{f.bestDay.hint}</div>
        </V2Glass>
        <V2Glass glow="0 0 22px var(--v2-rose)33">
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-rose)', marginBottom: 6 }}>⚠️ 주의</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1.1 }}>{f.worstDay.day}일</div>
          <div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', marginTop: 6, lineHeight: 1.5 }}>{f.worstDay.hint}</div>
        </V2Glass>
      </div>

      <V2Label>이달의 키워드</V2Label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {f.keywords.map((k) => <Chip key={k}>{k}</Chip>)}
      </div>

      <V2Label>한 달 흐름</V2Label>
      <SectionCard title="흐름" body={f.monthBody} />

      <V2Label>이렇게 해보세요</V2Label>
      <Accordion items={f.actions} />

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

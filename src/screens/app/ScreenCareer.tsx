import { V2Screen, V2TopBar, V2Label, DomainHeader, AxisRow, Accordion, Chip, SectionCard, DomainEmpty, V2Glass } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { careerForecast } from '../../lib/career';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenCareer({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const f = myeongsik ? careerForecast(myeongsik) : null;
  if (!f) return <DomainEmpty title="직업운" back={back} />;
  return (
    <V2Screen seed={35}>
      <V2TopBar onBack={back} title="직업운" />

      <DomainHeader spirit={spirit} score={f.score} mood={f.mood} tagline={f.tagline} />

      <V2Label>네 가지 결</V2Label>
      <AxisRow axes={f.axes} />

      <V2Label>직업 결</V2Label>
      <SectionCard title="결" body={f.body} />

      <V2Label>어울리는 직업</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {f.jobs.map((j) => (
          <V2Glass key={j.name}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{j.name}</div>
            <div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', marginTop: 3, lineHeight: 1.5 }}>{j.sub}</div>
          </V2Glass>
        ))}
      </div>

      <V2Glass style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--v2-ink-mid)' }}>👍 어울리는 환경: {f.fit}</div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--v2-ink-mid)' }}>🚫 피할 환경: {f.avoid}</div>
      </V2Glass>

      <V2Label>강점 키워드</V2Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {f.keywords.map((k) => (
          <Chip key={k} color="var(--v2-butter)">{k}</Chip>
        ))}
      </div>

      <V2Label>이번 달 직장 흐름</V2Label>
      <SectionCard title="이번 달 직장 흐름" body={f.monthFlow} color="var(--v2-mint)" />

      <V2Label>커리어 팁</V2Label>
      <Accordion items={f.tips} />

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

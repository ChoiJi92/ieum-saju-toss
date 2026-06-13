import { V2Screen, V2TopBar, V2Label, DomainHeader, AxisRow, Accordion, Chip, SectionCard, DomainEmpty, V2Glass } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { healthForecast } from '../../lib/health';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenHealth({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const f = myeongsik ? healthForecast(myeongsik) : null;
  if (!f) return <DomainEmpty title="건강운" back={back} />;
  return (
    <V2Screen seed={36}>
      <V2TopBar onBack={back} title="건강운" />

      <DomainHeader spirit={spirit} score={f.score} mood={f.mood} tagline={f.tagline} />

      <V2Label>네 가지 결</V2Label>
      <AxisRow axes={f.axes} />

      <V2Label>건강 결</V2Label>
      <SectionCard title="결" body={f.body} color="var(--v2-mint)" />

      <V2Label>약한 오행 케어</V2Label>
      <V2Glass>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--v2-mint)', marginBottom: 8 }}>🌿 약한 기운: {f.weak.ohaengKr}</div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--v2-ink-mid)', marginBottom: 4 }}>부위: {f.weak.parts}</div>
        <div style={{ fontSize: 12.5, color: 'var(--v2-ink-dim)', lineHeight: 1.55, marginBottom: 10 }}>{f.weak.symptoms}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--v2-ink-mid)', marginBottom: 12 }}>{f.weak.body}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
          {f.weak.foods.map((x) => (
            <Chip key={x} color="var(--v2-mint)">{x}</Chip>
          ))}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--v2-ink-mid)' }}>추천 활동: {f.weak.activity}</div>
      </V2Glass>

      <V2Label>강점</V2Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {f.keywords.map((k) => (
          <Chip key={k}>{k}</Chip>
        ))}
      </div>

      <V2Label>이번 달 건강 흐름</V2Label>
      <SectionCard title="이번 달 건강 흐름" body={f.monthFlow} />

      <V2Label>건강 팁</V2Label>
      <Accordion items={f.tips} />

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

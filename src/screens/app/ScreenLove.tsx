import { V2Screen, V2TopBar, V2Label, DomainHeader, AxisRow, Accordion, Chip, SectionCard, DomainEmpty, V2Glass } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { loveForecast } from '../../lib/love';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenLove({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const f = myeongsik ? loveForecast(myeongsik) : null;
  if (!f) return <DomainEmpty title="연애운" back={back} />;
  return (
    <V2Screen seed={33}>
      <V2TopBar onBack={back} title="연애운" />

      <DomainHeader spirit={spirit} score={f.score} mood={f.mood} tagline={f.tagline} />

      <V2Label>네 가지 결</V2Label>
      <AxisRow axes={f.axes} />

      <V2Label>연애 톤</V2Label>
      <SectionCard title="결" body={f.body} color="var(--v2-rose)" />

      <V2Label>도화살</V2Label>
      <V2Glass>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-rose)', marginBottom: 6 }}>
          💗 도화살 {f.dohwa.count}개
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--v2-ink-mid)' }}>{f.dohwa.line}</div>
        {f.dohwa.positions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
            {f.dohwa.positions.map((p) => (
              <Chip key={p} color="var(--v2-rose)">{p}</Chip>
            ))}
          </div>
        )}
      </V2Glass>

      <V2Label>끌리는 타입</V2Label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {f.attractedTypes.map((t) => (
          <Chip key={t} color="var(--v2-rose)">{t}</Chip>
        ))}
      </div>

      <V2Label>인연 시기</V2Label>
      <V2Glass>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-peach)', marginBottom: 6 }}>
          ✨ 인연 시기 · {f.timing.month}월
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--v2-ink-mid)' }}>{f.timing.reason}</div>
      </V2Glass>

      <V2Label>연애 팁</V2Label>
      <Accordion items={f.tips} />

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

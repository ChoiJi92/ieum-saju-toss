import { V2Screen, V2TopBar, V2Label, DomainHeader, Accordion, SectionCard, DomainEmpty } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { moneyForecast } from '../../lib/money';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenMoney({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const f = myeongsik ? moneyForecast(myeongsik) : null;
  if (!f) return <DomainEmpty title="금전운" back={back} />;
  return (
    <V2Screen seed={34}>
      <V2TopBar onBack={back} title="금전운" />

      <DomainHeader spirit={spirit} score={f.monthScore} mood={f.mood} />

      <V2Label>이번 주 흐름</V2Label>
      <div style={{ display: 'flex', gap: 6 }}>
        {f.week.map((w, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: '100%', height: 64, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ width: '100%', height: `${w.score}%`, background: 'var(--v2-mint)', borderRadius: 6 }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--v2-ink-mid)' }}>{w.day}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--v2-ink-dim)', fontVariantNumeric: 'tabular-nums' }}>{w.score}</div>
          </div>
        ))}
      </div>

      <V2Label>이번 달 재물</V2Label>
      <SectionCard title="흐름" body={f.monthBody} color="var(--v2-mint)" />

      <V2Label>행운 행동</V2Label>
      <Accordion items={f.actions} />

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

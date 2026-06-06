import { V2Screen, V2TopBar, V2Label, DomainHeader, SectionCard, DomainEmpty } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { yearForecast } from '../../lib/year';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenYear({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const year = new Date().getFullYear();
  const f = myeongsik ? yearForecast(myeongsik, year) : null;
  if (!f) return <DomainEmpty title="올해의 운세" back={back} />;
  return (
    <V2Screen seed={32}>
      <V2TopBar onBack={back} title="올해의 운세" />
      <DomainHeader spirit={spirit} score={f.yearScore} mood={f.mood} tagline={f.tagline} />

      <V2Label>12개월 흐름</V2Label>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, padding: '4px 2px' }}>
        {f.months.map((m) => {
          const isBest = m.month === f.bestMonth;
          const isWorst = m.month === f.worstMonth;
          const bg = isBest ? 'var(--v2-lavender)' : isWorst ? 'var(--v2-ink-mute)' : 'var(--v2-glass-line2)';
          return (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: `${m.score}%`, borderRadius: 5, background: bg, boxShadow: isBest ? '0 0 12px var(--v2-lavender)' : 'none' }} />
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: isBest ? 'var(--v2-lavender)' : 'var(--v2-ink-mute)' }}>{m.month}</div>
            </div>
          );
        })}
      </div>

      <V2Label>{f.year + '년 흐름'}</V2Label>
      <SectionCard title={f.year + '년 흐름'} body={f.yearBody} />

      <V2Label>분야별</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <SectionCard title={'연애 ' + f.fields.love.score} body={f.fields.love.body} color="var(--v2-rose)" />
        <SectionCard title={'금전 ' + f.fields.money.score} body={f.fields.money.body} color="var(--v2-mint)" />
        <SectionCard title={'커리어 ' + f.fields.career.score} body={f.fields.career.body} color="var(--v2-lavender)" />
        <SectionCard title={'건강 ' + f.fields.health.score} body={f.fields.health.body} color="var(--v2-peach)" />
      </div>

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

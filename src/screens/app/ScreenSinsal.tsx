import { V2Screen, V2TopBar, V2Label, V2Glass, Chip, DomainEmpty } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { getSinsal } from '../../lib/sinsal';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenSinsal({ back }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const items = myeongsik ? getSinsal(myeongsik) : null;
  if (!items) return <DomainEmpty title="신살" back={back} />;
  const owned = items.filter((i) => i.has);
  const none = items.filter((i) => !i.has);
  return (
    <V2Screen seed={39}>
      <V2TopBar onBack={back} title="신살" />

      <V2Glass style={{ marginTop: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1.55 }}>
          🔮 8가지 기운 중 <span style={{ color: 'var(--v2-lavender)' }}>{owned.length}개</span>를 지녔어요
        </div>
      </V2Glass>

      <V2Label>지닌 기운</V2Label>
      {owned.length === 0 ? (
        <V2Glass>
          <div style={{ fontSize: 13.5, color: 'var(--v2-ink-dim)', lineHeight: 1.6 }}>특별히 도드라지는 신살은 없어요</div>
        </V2Glass>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {owned.map((s) => (
            <V2Glass key={s.name} style={{ border: `1px solid ${s.color}55` }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-ink)' }}>
                {s.emoji} {s.name}
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-ink-dim)', marginLeft: 6 }}>({s.hanja})</span>
              </div>
              <div style={{ fontSize: 12.5, color: s.color, fontWeight: 700, marginTop: 4 }}>{s.oneLine}</div>
              {s.positions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {s.positions.map((p) => (
                    <Chip key={p} color={s.color}>{p}</Chip>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--v2-ink-mid)', marginTop: 10, whiteSpace: 'pre-line' }}>{s.body}</div>
            </V2Glass>
          ))}
        </div>
      )}

      <V2Label>그 외</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {none.map((s) => (
          <V2Glass key={s.name} style={{ opacity: 0.55, padding: 14 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--v2-ink-mid)' }}>{s.emoji} {s.name} · 없음</div>
          </V2Glass>
        ))}
      </div>

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

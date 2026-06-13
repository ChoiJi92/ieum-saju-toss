import { V2Screen, V2TopBar, V2Glass, V2Button } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { spiritFromMyeongsik } from '../../lib/spirit';
import { computeMyeongsik } from '../../lib/saju';
import type { Route, Tab } from './nav';

export default function ScreenProfiles({ go, back, switchTab }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void }) {
  const { profiles, activeId, setActive, removeProfile } = useSaju();
  const pick = (id: string) => { setActive(id); switchTab('home'); };
  return (
    <V2Screen seed={23}>
      <V2TopBar onBack={back} title="사주 보기" />
      <p className="v2-body" style={{ color: 'var(--v2-ink-dim)', margin: '4px 2px 16px' }}>다른 사람의 사주를 추가해 전환하면, 그 정령이 도감에 담겨요 ✦</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {profiles.map((p) => {
          let emoji = '✦'; let spName = '';
          try { const sp = spiritFromMyeongsik(computeMyeongsik(p)); emoji = sp.zod.emoji; spName = sp.name; } catch { /* skip */ }
          const active = p.id === activeId;
          return (
            <V2Glass key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: active ? '1px solid var(--v2-lavender)' : '1px solid var(--v2-glass-line2)' }}>
              <button onClick={() => pick(p.id)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', fontFamily: 'var(--v2-font)', padding: 0 }}>
                <span style={{ fontSize: 26 }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-ink)' }}>{p.name} <span style={{ fontSize: 11, color: 'var(--v2-ink-dim)', fontWeight: 700 }}>· {p.relation}</span></div>
                  <div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', marginTop: 1 }}>{p.year}.{String(p.month).padStart(2, '0')}.{String(p.day).padStart(2, '0')}{spName ? ` · ${spName}` : ''}{active ? ' · 보는 중' : ''}</div>
                </div>
              </button>
              {!p.isSelf && <button onClick={() => removeProfile(p.id)} style={{ background: 'none', border: 'none', color: 'var(--v2-ink-mute)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: 'var(--v2-font)' }}>삭제</button>}
            </V2Glass>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}><V2Button onClick={() => go('addProfile')}>+ 다른 사주 추가</V2Button></div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

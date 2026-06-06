import { V2Screen, V2TopBar } from './_kit';
import type { Tab, Route } from './nav';
import type { Spirit } from '../../lib/spirit';

export default function ScreenStub({ title, back }: { title: string; go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  return (
    <V2Screen seed={21}>
      <V2TopBar onBack={back} title={title} />
      <div style={{ textAlign: 'center', marginTop: 100, color: 'var(--v2-ink-dim)' }}>
        <div style={{ fontSize: 40 }}>🔮</div>
        <div style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: 'var(--v2-ink-mid)' }}>{title}</div>
        <div style={{ marginTop: 6, fontSize: 13 }}>곧 만나요 ✦</div>
      </div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

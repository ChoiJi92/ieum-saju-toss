import { useMemo, useState } from 'react';
import { type Spirit, type Stage } from '../../lib/spirit';

export function V2Screen({ children, seed = 1, pad = true, style = {} }: { children: React.ReactNode; seed?: number; pad?: boolean; style?: React.CSSProperties }) {
  return (
    <div className="v2-cosmos-bg ie-scroll" style={{ position: 'relative', width: '100%', height: '100%', overflowY: 'auto', color: 'var(--v2-ink)', fontFamily: 'var(--v2-font)', ...style }}>
      <Starfield seed={seed} />
      <div style={{ position: 'relative', padding: pad ? '0 20px 44px' : 0, minHeight: '100%', zIndex: 1 }}>{children}</div>
    </div>
  );
}

function Starfield({ density = 38, seed = 1 }: { density?: number; seed?: number }) {
  const stars = useMemo(() => {
    let s = seed * 9301 + 49297;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    return Array.from({ length: density }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      r: rnd() * 1.6 + 0.6,
      d: rnd() * 4 + 2,
      delay: rnd() * 4,
      c: rnd() > 0.8 ? 'var(--v2-lavender)' : rnd() > 0.5 ? 'var(--v2-butter)' : '#fff',
    }));
  }, [density, seed]);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 45% at 70% 18%, rgba(183,156,255,.20), transparent 60%), radial-gradient(50% 40% at 20% 80%, rgba(255,158,130,.14), transparent 60%)' }} />
      {stars.map((st, i) => (
        <span key={i} style={{ position: 'absolute', left: `${st.x}%`, top: `${st.y}%`, width: st.r * 2, height: st.r * 2, borderRadius: '50%', background: st.c, boxShadow: `0 0 ${st.r * 3}px ${st.c}`, animation: `v2-twinkle ${st.d}s ease-in-out ${st.delay}s infinite` }} />
      ))}
    </div>
  );
}

export function Rise({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  return <div style={{ animation: `v2-rise-soft .55s cubic-bezier(.2,.9,.3,1) ${delay}ms both`, ...style }}>{children}</div>;
}

export function V2TopBar({ onBack, title = '', right = null }: { onBack?: () => void; title?: string; right?: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 52,
        paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
        paddingBottom: 10,
        background: 'linear-gradient(180deg, rgba(20,14,34,.96) 0%, rgba(20,14,34,.72) 70%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ width: 44 }}>
        {onBack && (
          <button onClick={onBack} className="v2-press" style={circleButtonStyle} aria-label="뒤로">
            ‹
          </button>
        )}
      </div>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 15.5, fontWeight: 800, color: 'var(--v2-ink)', letterSpacing: '-0.2px' }}>{title}</div>
      <div style={{ width: 44, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

export function V2Button({ children, onClick, kind = 'primary', style = {} }: { children: React.ReactNode; onClick?: () => void; kind?: 'primary' | 'glass' | 'ghost'; style?: React.CSSProperties }) {
  const kinds = {
    primary: { background: 'linear-gradient(120deg, var(--v2-lavender), var(--v2-peach))', color: '#1b1230', boxShadow: '0 10px 30px rgba(183,156,255,.45)' },
    glass: { background: 'var(--v2-glass-hi)', color: 'var(--v2-ink)', border: '1px solid var(--v2-glass-line)', backdropFilter: 'blur(10px)' },
    ghost: { background: 'transparent', color: 'var(--v2-ink-mid)', border: '1px solid var(--v2-glass-line2)' },
  } satisfies Record<string, React.CSSProperties>;
  return <button onClick={onClick} style={{ width: '100%', height: 56, border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--v2-font)', fontSize: 16, fontWeight: 800, letterSpacing: -0.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...kinds[kind], ...style }}>{children}</button>;
}

export function V2Glass({ children, style = {}, onClick, glow }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void; glow?: string }) {
  return (
    <div
      onClick={onClick}
      className={onClick ? 'v2-glass-card v2-press' : 'v2-glass-card'}
      style={{
        padding: '18px 20px',
        boxShadow: glow
          ? `${glow}, inset 0 1px 0 rgba(255,255,255,.07), 0 2px 16px rgba(0,0,0,.28)`
          : 'inset 0 1px 0 rgba(255,255,255,.07), 0 2px 16px rgba(0,0,0,.28)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function V2Label({ children, color = 'var(--v2-ink-dim)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="v2-cap"
      style={{ color, margin: '26px 0 10px', letterSpacing: '1.8px', opacity: 0.85 }}
    >
      {children}
    </div>
  );
}

export function SpiritSlot({ spirit, size = 200, tag = true, stage = 1, floating = true }: { spirit: Spirit; size?: number; tag?: boolean; stage?: Stage; floating?: boolean }) {
  const art = spirit.imageFor(stage);
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto', animation: floating ? 'v2-float 5s ease-in-out infinite' : 'none' }}>
      <div style={{ position: 'absolute', inset: '2%', borderRadius: '50%', background: `radial-gradient(circle at 50% 54%, ${spirit.elem.raw}55 0%, ${spirit.elem.raw}22 38%, transparent 68%)`, animation: 'v2-breathe 4.5s ease-in-out infinite' }} />
      {art ? (
        <img src={art} alt={spirit.name} draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 18px ${spirit.elem.raw}66)`, transformOrigin: '50% 88%' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, filter: `drop-shadow(0 0 18px ${spirit.elem.raw}66)` }}>{spirit.zod.emoji}</div>
      )}
      <Sparkles col={spirit.rarity.raw} />
      {tag && <div style={{ position: 'absolute', bottom: 6, right: 6, fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: 0.5, color: 'rgba(255,255,255,.55)', background: 'rgba(0,0,0,.28)', padding: '3px 7px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>{spirit.name}</div>}
    </div>
  );
}

export function Sparkles({ col = '#FFD27A' }: { col?: string }) {
  return [{ t: '8%', l: '14%', s: 13 }, { t: '18%', r: '10%', s: 9 }, { t: '70%', l: '6%', s: 10 }].map((p, i) => (
    <svg key={i} viewBox="-20 -20 40 40" width={p.s} height={p.s} style={{ position: 'absolute', top: p.t, left: p.l, right: p.r, animation: `v2-twinkle ${2 + i}s ease-in-out ${i * 0.5}s infinite` }}>
      <path d="M0 -16 C1.5 -5.5 5.5 -1.5 16 0 C5.5 1.5 1.5 5.5 0 16 C-1.5 5.5 -5.5 1.5 -16 0 C-5.5 -1.5 -1.5 -5.5 0 -16 Z" fill={col} />
    </svg>
  ));
}

export function RarityStars({ rarity, showLabel = true }: { rarity: Spirit['rarity']; showLabel?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
      <span style={{ display: 'inline-flex', gap: 1 }}>
        {Array.from({ length: 4 }).map((_, i) => <span key={i} style={{ color: i < rarity.stars ? rarity.raw : 'rgba(255,255,255,.18)', fontSize: 11 }}>★</span>)}
      </span>
      {showLabel && <span style={{ fontSize: 11, fontWeight: 800, color: rarity.raw, letterSpacing: 0.4 }}>{rarity.ko}</span>}
    </span>
  );
}

export function BondMeter({ value = 64, max = 100, label = '교감', color = 'var(--v2-lavender)', sub }: { value?: number; max?: number; label?: string; color?: string; sub?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--v2-ink-mid)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
          {value}
          <span style={{ color: 'var(--v2-ink-mute)', fontWeight: 600, fontSize: 11 }}>/{max}</span>
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${(value / max) * 100}%`,
            height: '100%',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${color}bb, ${color})`,
            boxShadow: `0 0 10px ${color}99`,
          }}
        />
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--v2-ink-dim)', marginTop: 6, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

export function StatPill({ label, value, color = 'var(--v2-lavender)' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 999, whiteSpace: 'nowrap', background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ fontSize: 11, color: 'var(--v2-ink-dim)' }}>{label}</span>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{value}</span>
    </div>
  );
}

export function ScoreRing({ score, color }: { score: number; color: string }) {
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        flexShrink: 0,
        background: `conic-gradient(${color} 0% ${score}%, rgba(255,255,255,.07) ${score}% 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 22px ${color}55, 0 0 8px ${color}33`,
        padding: 3,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'var(--v2-cosmos)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <span style={{ fontSize: 21, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1, letterSpacing: '-0.5px' }}>{score}</span>
        <span style={{ fontSize: 8.5, color: 'var(--v2-ink-dim)', letterSpacing: '0.5px' }}>점수</span>
      </div>
    </div>
  );
}

export function HeaderPill({ children }: { children: React.ReactNode }) {
  return <span style={{ padding: '7px 12px', borderRadius: 999, background: 'var(--v2-glass)', whiteSpace: 'nowrap', border: '1px solid var(--v2-glass-line2)', fontSize: 12, fontWeight: 800, color: 'var(--v2-ink-mid)' }}>{children}</span>;
}

export function ActionCard({ ic, title, sub, color, badge, onClick }: { ic: string; title: string; sub: string; color: string; badge?: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ position: 'relative', textAlign: 'left', cursor: 'pointer', padding: 16, borderRadius: 'var(--v2-r-md)', background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', fontFamily: 'var(--v2-font)' }}>{badge && <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 800, color: '#1b1230', background: 'var(--v2-butter)', padding: '2px 6px', borderRadius: 6 }}>{badge}</span>}<div style={{ width: 42, height: 42, borderRadius: 13, background: `${color}1f`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12, boxShadow: `0 0 16px ${color}33` }}>{ic}</div><div style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-ink)' }}>{title}</div><div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', marginTop: 2 }}>{sub}</div></button>;
}

export function CareAction({ ic, title, sub, amt, color, onClick }: { ic: string; title: string; sub: string; amt: string; color: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', borderRadius: 'var(--v2-r-md)', cursor: 'pointer', fontFamily: 'var(--v2-font)', textAlign: 'left', background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)' }}><span style={{ width: 42, height: 42, borderRadius: 13, background: `${color}1f`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>{ic}</span><div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{title}</div><div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)' }}>{sub}</div></div><span style={{ fontSize: 13, fontWeight: 800, color }}>{amt}</span></button>;
}

export function FilterChip({ label, color, active, onClick }: { label: string; color: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--v2-font)', fontSize: 12, fontWeight: 800, background: active ? color : 'var(--v2-glass)', color: active ? '#1b1230' : 'var(--v2-ink-mid)', border: active ? 'none' : '1px solid var(--v2-glass-line2)' }}>{label}</button>;
}

export const circleButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '1px solid var(--v2-glass-line)',
  background: 'rgba(255,255,255,.08)',
  color: 'var(--v2-ink)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
};

export const speechStyle: React.CSSProperties = {
  margin: '4px auto 0',
  maxWidth: 300,
  padding: '14px 18px',
  borderRadius: '20px 20px 20px 6px',
  background: 'var(--v2-glass-hi)',
  border: '1px solid var(--v2-glass-line)',
  backdropFilter: 'blur(10px)',
  textAlign: 'center',
  whiteSpace: 'pre-line',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--v2-ink)',
  lineHeight: 1.5,
};

/** 도메인 화면 공용 헤더: 영물 + 점수 + mood/tagline */
export function DomainHeader({ spirit, score, mood, tagline }: { spirit: Spirit; score: number; mood: string; tagline?: string }) {
  return (
    <Rise>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 4 }}>
        <SpiritSlot spirit={spirit} size={96} tag={false} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="v2-cap"
            style={{ color: 'var(--v2-lavender)', letterSpacing: '1.8px', marginBottom: 6 }}
          >
            {mood}
          </div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 4, fontFamily: 'var(--v2-font)', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }}>
            <span style={{ fontSize: 46, color: 'var(--v2-ink)' }}>{score}</span>
            <span style={{ fontSize: 17, color: 'var(--v2-ink-dim)', fontWeight: 700 }}>점</span>
          </h1>
          {tagline && (
            <div style={{ fontSize: 12.5, color: 'var(--v2-ink-dim)', marginTop: 7, lineHeight: 1.5 }}>
              {tagline}
            </div>
          )}
        </div>
      </div>
    </Rise>
  );
}

/** N축 점수 행: {ic,lbl,score,color,oneLine}[] */
export function AxisRow({ axes }: { axes: Array<{ ic: string; lbl: string; score: number; color: string; oneLine: string }> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {axes.map((a) => (
        <div
          key={a.lbl}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '13px 15px',
            borderRadius: 'var(--v2-r-md)',
            background: 'var(--v2-glass)',
            border: '1px solid var(--v2-glass-line2)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)',
          }}
        >
          <span style={{ width: 28, textAlign: 'center', color: a.color, fontSize: 17, flexShrink: 0 }}>{a.ic}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{a.lbl}</div>
            <div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', marginTop: 2, lineHeight: 1.4 }}>{a.oneLine}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: a.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{a.score}</span>
            <div style={{ width: 64, height: 5, borderRadius: 999, background: 'rgba(255,255,255,.09)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${a.score}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${a.color}cc, ${a.color})`,
                  boxShadow: `0 0 8px ${a.color}88`,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 펼치는 카드: {ic,lbl,sub,detail}[] (팁/액션 공용) */
export function Accordion({ items }: { items: Array<{ ic: string; lbl: string; sub: string; detail: string }> }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it, i) => (
        <div
          key={i}
          style={{
            borderRadius: 'var(--v2-r-md)',
            background: 'var(--v2-glass)',
            border: `1px solid ${open === i ? 'var(--v2-glass-line)' : 'var(--v2-glass-line2)'}`,
            boxShadow: open === i ? 'inset 0 1px 0 rgba(255,255,255,.07)' : 'none',
            overflow: 'hidden',
            transition: 'border-color .2s',
          }}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="v2-press"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--v2-font)', textAlign: 'left' }}
          >
            <span style={{ fontSize: 19, flexShrink: 0 }}>{it.ic}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--v2-ink)' }}>{it.lbl}</div>
              <div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', marginTop: 2 }}>{it.sub}</div>
            </div>
            <span
              style={{
                color: 'var(--v2-ink-mute)',
                fontSize: 12,
                transform: open === i ? 'rotate(180deg)' : 'none',
                transition: 'transform .22s cubic-bezier(.4,0,.2,1)',
                flexShrink: 0,
              }}
            >
              ▾
            </span>
          </button>
          {open === i && (
            <div style={{ padding: '2px 16px 16px', fontSize: 13.5, lineHeight: 1.65, color: 'var(--v2-ink-mid)', borderTop: '1px solid var(--v2-glass-line2)' }}>
              {it.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/** 키워드/태그 칩 */
export function Chip({ children, color = 'var(--v2-lavender)' }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        padding: '6px 13px',
        borderRadius: 999,
        background: `${color}22`,
        color,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: 'nowrap',
        border: `1px solid ${color}44`,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}

/** 본문 단락 카드 */
export function SectionCard({ title, body, color = 'var(--v2-lavender)' }: { title: string; body: string; color?: string }) {
  return (
    <V2Glass style={{ borderLeft: `2px solid ${color}66` }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color, marginBottom: 8, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)', whiteSpace: 'pre-line' }}>{body}</div>
    </V2Glass>
  );
}

/** 진입 행(내정보 등) */
export function ActionRow({ ic, label, sub, onClick }: { ic: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', borderRadius: 'var(--v2-r-md)', background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', cursor: 'pointer', fontFamily: 'var(--v2-font)', textAlign: 'left', width: '100%' }}>
      <span style={{ fontSize: 20 }}>{ic}</span>
      <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{label}</div><div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)' }}>{sub}</div></div>
      <span style={{ color: 'var(--v2-ink-dim)' }}>›</span>
    </button>
  );
}

export function DomainEmpty({ title, back }: { title: string; back: () => void }) {
  return (
    <V2Screen seed={20}>
      <V2TopBar onBack={back} title={title} />
      <div style={{ textAlign: 'center', marginTop: 90, color: 'var(--v2-ink-dim)' }}>
        <div style={{ fontSize: 38 }}>🔮</div>
        <div style={{ marginTop: 12, fontSize: 14 }}>사주 정보를 먼저 입력해 주세요</div>
      </div>
    </V2Screen>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {items.map((t, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.65, color: 'var(--v2-ink-mid)' }}>
          <span
            style={{
              flexShrink: 0,
              width: 5,
              height: 5,
              marginTop: 7,
              borderRadius: '50%',
              background: 'var(--v2-lavender)',
              boxShadow: '0 0 6px var(--v2-lavender)',
              opacity: 0.75,
            }}
          />
          <span style={{ flex: 1 }}>{t}</span>
        </div>
      ))}
    </div>
  );
}

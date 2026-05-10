import { CSSProperties, ReactNode, useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────
 * 이음사주 공용 UI — 프로토타입 ie-components.jsx 이식
 * (Babel UMD/window 의존성 → ES module + TypeScript)
 * 토큰: src/index.css 의 --cp-* (Tailwind v4 @theme에서 alias)
 * ─────────────────────────────────────────────────────────────*/

/** 톤별 카피 — Settings 의 토글로 전환 */
export const IE_COPY = {
  witty: {
    todayTitle: '오늘의 너는',
    todayMood: '럭키비키 모드',
    todayLine: '오늘은 마음 가는 대로 가도 되는 날이야. 별이 너 편임 ☁️',
    sajuTagline: '8자 안에 너 다 들었음',
    yearTagline: '올해는 좀 다를 예정',
    ghTitle: '우리, 결이 맞나?',
    moneyTitle: '통장 흐름 체크',
    primaryCta: '오늘 운세 보기',
  },
  warm: {
    todayTitle: '오늘의 운세',
    todayMood: '맑은 흐름',
    todayLine: '오늘은 마음을 열어두면 좋은 인연과 기회가 다가오는 날입니다.',
    sajuTagline: '여덟 글자가 보여주는 당신의 결',
    yearTagline: '한 해의 흐름을 미리 살펴봅니다',
    ghTitle: '두 사람의 인연',
    moneyTitle: '재물의 흐름',
    primaryCta: '오늘의 운세 시작하기',
  },
} as const;

export type IECopy = typeof IE_COPY[keyof typeof IE_COPY];

export const OHAENG = {
  wood:  { c: '#3DC795', label: '목', cn: '木' },
  fire:  { c: '#FF8B6C', label: '화', cn: '火' },
  earth: { c: '#FFC857', label: '토', cn: '土' },
  metal: { c: '#C9B6F0', label: '금', cn: '金' },
  water: { c: '#5B8DEF', label: '수', cn: '水' },
} as const;

export type OhaengKey = keyof typeof OHAENG;

/* ── primitives ───────────────────────────────────────────── */

export function IECard({
  children,
  style = {},
  pop = false,
  flat = false,
  ...rest
}: {
  children: ReactNode;
  style?: CSSProperties;
  pop?: boolean;
  flat?: boolean;
  onClick?: () => void;
}) {
  const base: CSSProperties = {
    background: pop ? 'linear-gradient(135deg, #C9B6F0, #FFB69E)' : 'var(--cp-bg-paper)',
    color: 'var(--cp-text)',
    borderRadius: 'var(--cp-radius-lg)',
    padding: 18,
    boxShadow: flat ? 'none' : 'var(--cp-shadow-md)',
    border: flat ? '1px solid var(--cp-border)' : 'none',
    ...style,
  };
  return <div style={base} {...rest}>{children}</div>;
}

export function IEButton({
  children,
  onClick,
  kind = 'primary',
  style = {},
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'soft' | 'ghost' | 'dark';
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    height: 56,
    padding: '0 24px',
    border: 'none',
    borderRadius: 999,
    fontFamily: 'var(--cp-font)',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform .12s, box-shadow .12s',
    width: '100%',
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: 'linear-gradient(135deg, #9D7BFF, #FF8B6C)', color: '#fff', boxShadow: 'var(--cp-shadow-pop)' },
    soft:    { background: 'rgba(201, 182, 240, 0.5)', color: 'var(--cp-lavender)' },
    ghost:   { background: 'var(--cp-bg-paper)', color: 'var(--cp-text)', border: '1px solid var(--cp-border)' },
    dark:    { background: 'var(--cp-text)', color: '#fff' },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[kind], ...style }} {...rest}>
      {children}
    </button>
  );
}

export function IEChip({
  children,
  color = '#9D7BFF',
  soft = false,
}: {
  children: ReactNode;
  color?: string;
  soft?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 11px',
        borderRadius: 999,
        background: soft ? `${color}1f` : 'var(--cp-bg-paper)',
        border: soft ? 'none' : '1px solid var(--cp-border)',
        color: soft ? color : 'var(--cp-text-mid)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
      }}
    >
      {children}
    </span>
  );
}

export function IEBack({ onClick, dark = false }: { onClick?: () => void; dark?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: dark ? '#fff' : 'var(--cp-text)',
      }}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

export function IETopBar({
  onBack,
  title = '',
  right = null,
  dark = false,
}: {
  onBack?: () => void;
  title?: string;
  right?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        padding: '0 8px',
        flexShrink: 0,
      }}
    >
      <div style={{ width: 40, display: 'flex' }}>
        {onBack ? <IEBack onClick={onBack} dark={dark} /> : <span />}
      </div>
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: 700,
          color: dark ? '#fff' : 'var(--cp-text)',
        }}
      >
        {title}
      </div>
      <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}

/* ── 사주 specific ────────────────────────────────────────── */

export type Pillar = {
  label: string;
  top: { c: string; ohaeng: OhaengKey };
  bot: { c: string; ohaeng: OhaengKey };
  isSelf?: boolean;
};

export function MyeongsikGrid({ data, compact = false }: { data: Pillar[]; compact?: boolean }) {
  const cellH = compact ? 50 : 64;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        background: 'var(--cp-bg-paper)',
        padding: 14,
        borderRadius: 'var(--cp-radius-lg)',
        border: '1px solid var(--cp-border)',
      }}
    >
      {data.map((p, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: p.isSelf ? 'var(--cp-lavender)' : 'var(--cp-text-dim)',
              marginBottom: 6,
              letterSpacing: 0.4,
            }}
          >
            {p.label}{p.isSelf ? ' · 일주' : ''}
          </div>
          <div
            style={{
              background: OHAENG[p.top.ohaeng].c + '22',
              color: OHAENG[p.top.ohaeng].c,
              height: cellH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px 12px 4px 4px',
              fontSize: compact ? 22 : 28,
              fontWeight: 800,
              marginBottom: 3,
            }}
          >
            {p.top.c}
          </div>
          <div
            style={{
              background: OHAENG[p.bot.ohaeng].c + '22',
              color: OHAENG[p.bot.ohaeng].c,
              height: cellH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px 4px 12px 12px',
              fontSize: compact ? 22 : 28,
              fontWeight: 800,
            }}
          >
            {p.bot.c}
          </div>
        </div>
      ))}
    </div>
  );
}

export type OhaengCounts = Partial<Record<OhaengKey, number>>;

export function OhaengBar({ counts }: { counts: OhaengCounts }) {
  const order: OhaengKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];
  return (
    <div>
      <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', background: 'var(--cp-bg)' }}>
        {order.map((k) =>
          counts[k] ? <div key={k} style={{ flex: counts[k], background: OHAENG[k].c }} /> : null
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        {order.map((k) => (
          <div key={k} style={{ textAlign: 'center', flex: 1 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                margin: '0 auto 4px',
                background: OHAENG[k].c + '26',
                color: OHAENG[k].c,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {OHAENG[k].cn}
            </div>
            <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', fontWeight: 700 }}>
              {counts[k] || 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 시그니처 — MoodOrb (큰 그라디언트 원) */
export function MoodOrb({
  size = 220,
  label,
  score,
  palette = ['#9D7BFF', '#FF8B6C'],
}: {
  size?: number;
  label?: string;
  score?: string | number;
  palette?: [string, string];
}) {
  const id = `mood-${size}-${palette.join('')}`.replace(/[^a-z0-9]/gi, '');
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <radialGradient id={`orb-${id}`} cx="0.35" cy="0.35" r="0.85">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="0.5" stopColor={palette[0]} stopOpacity="0.95" />
            <stop offset="1" stopColor={palette[1]} />
          </radialGradient>
          <radialGradient id={`halo-${id}`} cx="0.5" cy="0.5">
            <stop offset="0" stopColor="#FFC857" stopOpacity="0.35" />
            <stop offset="1" stopColor="#FFC857" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="95" fill={`url(#halo-${id})`} />
        <circle cx="100" cy="100" r="72" fill={`url(#orb-${id})`} />
        <ellipse cx="76" cy="78" rx="22" ry="14" fill="#fff" opacity="0.4" />
      </svg>
      {label && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#fff',
            textShadow: '0 2px 12px rgba(80,60,110,0.4)',
          }}
        >
          {score && (
            <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {score}
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, opacity: 0.95 }}>{label}</div>
        </div>
      )}
    </div>
  );
}

export function ScoreRow({
  icon,
  label,
  score,
  color = '#9D7BFF',
}: {
  icon: string;
  label: string;
  score: number;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: color + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{label}</div>
        <div style={{ height: 8, background: 'var(--cp-bg)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 999 }} />
        </div>
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color,
          minWidth: 32,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {score}
      </div>
    </div>
  );
}

export function Sparkle({
  size = 14,
  color = '#FFC857',
  style = {},
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="-20 -20 40 40" width={size} height={size} style={style}>
      <path
        d="M0 -16 C1.5 -5.5 5.5 -1.5 16 0 C5.5 1.5 1.5 5.5 0 16 C-1.5 5.5 -5.5 1.5 -16 0 C-5.5 -1.5 -1.5 -5.5 0 -16 Z"
        fill={color}
      />
    </svg>
  );
}

export function IEInput({
  label,
  value,
  onChange,
  placeholder,
  style = {},
}: {
  label?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 11,
            color: 'var(--cp-text-dim)',
            fontWeight: 700,
            letterSpacing: 0.4,
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 56,
          padding: '0 18px',
          background: 'var(--cp-bg-paper)',
          border: '2px solid var(--cp-border)',
          borderRadius: 'var(--cp-radius-md)',
          fontFamily: 'var(--cp-font)',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--cp-text)',
          outline: 'none',
          boxSizing: 'border-box',
          ...style,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--cp-lavender)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--cp-border)')}
      />
    </div>
  );
}

export function Reveal({
  delay = 0,
  children,
  style = {},
}: {
  delay?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      style={{
        transition: 'opacity .5s, transform .5s cubic-bezier(.2,.9,.3,1)',
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(14px)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function IELogo({ size = 28 }: { size?: number }) {
  const id = `il-${size}`;
  return (
    <svg viewBox="0 0 60 60" width={size} height={size}>
      <defs>
        <radialGradient id={`${id}-l`} cx="0.35" cy="0.35">
          <stop offset="0" stopColor="#E5D9FF" />
          <stop offset="1" stopColor="#9D7BFF" />
        </radialGradient>
        <radialGradient id={`${id}-p`} cx="0.35" cy="0.35">
          <stop offset="0" stopColor="#FFD9CC" />
          <stop offset="1" stopColor="#FF8B6C" />
        </radialGradient>
      </defs>
      <circle cx="22" cy="30" r="14" fill={`url(#${id}-l)`} />
      <circle cx="38" cy="30" r="14" fill={`url(#${id}-p)`} opacity="0.94" />
      <circle cx="30" cy="30" r="2" fill="#FFC857" />
    </svg>
  );
}

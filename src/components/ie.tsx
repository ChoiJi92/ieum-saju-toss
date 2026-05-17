import { CSSProperties, ReactNode, useEffect, useState } from 'react';

/* ─────────────────────────────────────────────────────────────
 * 이음사주 공용 UI — 프로토타입 ie-components.jsx 이식
 * (Babel UMD/window 의존성 → ES module + TypeScript)
 * 토큰: src/index.css 의 --cp-* (Tailwind v4 @theme에서 alias)
 * ─────────────────────────────────────────────────────────────*/

/** 톤별 카피 — 둘 다 친근 존댓말 (반말 X). 본업 토스 미니앱 톤 결정. */
export const IE_COPY = {
  witty: {
    todayTitle: '오늘의 당신은',
    todayMood: '럭키비키 모드',
    todayLine: '오늘은 마음 가는 대로 가도 되는 날이에요. 별이 당신 편이에요 ☁️',
    sajuTagline: '여덟 글자에 당신이 다 담겨있어요',
    yearTagline: '올해는 좀 다른 흐름이에요',
    ghTitle: '우리, 결이 맞을까요?',
    moneyTitle: '통장 흐름 체크',
    primaryCta: '오늘 운세 보기',
  },
  warm: {
    todayTitle: '오늘의 운세',
    todayMood: '맑은 흐름',
    todayLine: '오늘은 마음을 열어두면 좋은 인연과 기회가 다가오는 날이에요.',
    sajuTagline: '여덟 글자가 보여주는 당신의 결',
    yearTagline: '한 해의 흐름을 미리 살펴봐요',
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

/** 천간·지지 한글 독음 매핑 (한자와 함께 표시용) */
const TG_HANGUL: Record<string, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
};
const DZ_HANGUL: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진', 巳: '사',
  午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
};

export function MyeongsikGrid({ data, compact = false }: { data: Pillar[]; compact?: boolean }) {
  const cellH = compact ? 56 : 72;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${data.length}, 1fr)`,
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
              fontSize: 11,
              fontWeight: 800,
              color: p.isSelf ? 'var(--cp-lavender)' : 'var(--cp-text-dim)',
              marginBottom: 6,
              letterSpacing: 0.3,
            }}
          >
            {p.label}
          </div>
          {/* 천간 */}
          <div
            style={{
              background: OHAENG[p.top.ohaeng].c + '22',
              color: OHAENG[p.top.ohaeng].c,
              height: cellH,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px 12px 4px 4px',
              fontWeight: 800,
              marginBottom: 3,
              gap: 2,
            }}
          >
            <div style={{ fontSize: compact ? 22 : 28, lineHeight: 1 }}>{p.top.c}</div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>
              {TG_HANGUL[p.top.c] ?? ''}
            </div>
          </div>
          {/* 지지 */}
          <div
            style={{
              background: OHAENG[p.bot.ohaeng].c + '22',
              color: OHAENG[p.bot.ohaeng].c,
              height: cellH,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px 4px 12px 12px',
              fontWeight: 800,
              gap: 2,
            }}
          >
            <div style={{ fontSize: compact ? 22 : 28, lineHeight: 1 }}>{p.bot.c}</div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.85 }}>
              {DZ_HANGUL[p.bot.c] ?? ''}
            </div>
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

/* ── CalendarToggle — 양력/음력 컴팩트 pill 토글 ─────────────── */
export function IECalendarToggle({
  value,
  onChange,
}: {
  value: 'solar' | 'lunar';
  onChange: (next: 'solar' | 'lunar') => void;
}) {
  return (
    <div style={{ display: 'flex', background: 'var(--cp-bg)', borderRadius: 999, padding: 3 }}>
      {(['solar', 'lunar'] as const).map((k) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          style={{
            padding: '5px 12px',
            borderRadius: 999,
            border: 'none',
            background: value === k ? 'var(--cp-text)' : 'transparent',
            color: value === k ? '#fff' : 'var(--cp-text-dim)',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--cp-font)',
          }}
        >
          {k === 'solar' ? '양력' : '음력'}
        </button>
      ))}
    </div>
  );
}

/* ── DateSelect — 년·월·일 각각의 select 박스 ──────────────────
 * 모바일 네이티브 select 활용 (iOS: 휠 / Android: 드롭다운).
 * Input·AddProfile에서 동일 사용.
 */
export function IEDateSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: 56,
          padding: '0 32px 0 14px',
          background: 'var(--cp-bg-paper)',
          border: '2px solid var(--cp-border)',
          borderRadius: 'var(--cp-radius-md)',
          fontFamily: 'var(--cp-font)',
          fontSize: 16,
          fontWeight: 700,
          color: value ? 'var(--cp-text)' : 'var(--cp-text-dim)',
          textAlign: 'center',
          textAlignLast: 'center',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--cp-text-dim)',
          pointerEvents: 'none',
        }}
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}

/* ── SijinSheet — 12지 시진 선택 바텀시트 ─────────────────────
 * 두 화면(Input·AddProfile)에서 동일하게 사용.
 * "모름" 옵션이 리스트 첫 항목.
 */
export function IESijinSheet({
  open,
  sijin,
  unknown,
  onClose,
  onSelect,
  onSelectUnknown,
}: {
  open: boolean;
  /** 현재 선택된 시진 (모름이면 무관) */
  sijin: string;
  /** 모름 상태 */
  unknown: boolean;
  onClose: () => void;
  onSelect: (sijin: string) => void;
  onSelectUnknown: () => void;
}) {
  if (!open) return null;
  // SIJIN_LIST import 안 하고 inline으로 — 사용처에서 props로 받기 X
  // (sijin 라이브러리는 별도 lib/sijin.ts에 있지만 ie.tsx는 components 디렉토리라
  //  의존 방향 깔끔하게 import 한 번만)
  const list: [string, string, string][] = [
    ['子', '자시', '23:30~01:30'],
    ['丑', '축시', '01:30~03:30'],
    ['寅', '인시', '03:30~05:30'],
    ['卯', '묘시', '05:30~07:30'],
    ['辰', '진시', '07:30~09:30'],
    ['巳', '사시', '09:30~11:30'],
    ['午', '오시', '11:30~13:30'],
    ['未', '미시', '13:30~15:30'],
    ['申', '신시', '15:30~17:30'],
    ['酉', '유시', '17:30~19:30'],
    ['戌', '술시', '19:30~21:30'],
    ['亥', '해시', '21:30~23:30'],
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(42,35,51,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ie-scroll"
        style={{
          width: '100%',
          maxHeight: '80%',
          overflowY: 'auto',
          background: 'var(--cp-bg-paper)',
          borderRadius: '20px 20px 0 0',
          padding: '12px 0 28px',
          animation: 'ie-modal-pop .22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: 'var(--cp-border)',
            borderRadius: 2,
            margin: '4px auto 12px',
          }}
        />
        <div
          style={{
            padding: '0 20px 8px',
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--cp-text)',
          }}
        >
          태어난 시간 선택
        </div>
        {[['unknown', '모름', '시간을 정확히 모를 때 선택'] as [string, string, string], ...list].map(
          ([k, lbl, range]) => {
            const selected =
              (k === 'unknown' && unknown) || (k !== 'unknown' && !unknown && sijin === k);
            return (
              <div
                key={k}
                onClick={() => {
                  if (k === 'unknown') onSelectUnknown();
                  else onSelect(k);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 22px',
                  cursor: 'pointer',
                  background: selected ? 'rgba(157,123,255,0.08)' : 'transparent',
                }}
              >
                <span
                  style={{
                    width: 22,
                    color: 'var(--cp-lavender)',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  {selected ? '✓' : ''}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cp-text)' }}>
                    {k === 'unknown' ? lbl : `${lbl} (${range})`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', marginTop: 2 }}>
                    {range}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

/* ── Checkbox — 토스 TDS 미제공 → Cloud Pastel 톤 자체 컴포넌트 ───
 * 24×24 둥근 사각형 + 라벤더 체크. 라벨 전체 영역 클릭 가능.
 */
export function IECheckbox({
  checked,
  onChange,
  children,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 4px',
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--cp-font)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          border: checked ? '2px solid var(--cp-lavender)' : '2px solid var(--cp-border)',
          background: checked ? 'var(--cp-lavender)' : 'var(--cp-bg-paper)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all .14s',
          flexShrink: 0,
        }}
      >
        {checked && (
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="#fff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="5 12 10 17 19 7" />
          </svg>
        )}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: checked ? 'var(--cp-text)' : 'var(--cp-text-mid)',
          letterSpacing: -0.1,
        }}
      >
        {children}
      </span>
    </button>
  );
}

/* ── Modal — 시스템 alert/confirm 대체용 ───────────────────────
 * 토스 SDK 모달 미제공 → 자체 구현.
 * 배경 dim·blur + 중앙 카드 + 좌(취소) 우(확인) 2버튼.
 */
export function IEModal({
  open,
  title,
  body,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 확인 버튼이 위험 액션이면 빨강 그라데이션 */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42, 35, 51, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 1000,
        animation: 'ie-modal-fade .18s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 340,
          background: 'var(--cp-bg-paper)',
          borderRadius: 24,
          padding: '24px 22px 20px',
          boxShadow: '0 20px 60px rgba(80, 60, 110, 0.25)',
          animation: 'ie-modal-pop .22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--cp-text)',
            letterSpacing: -0.4,
            marginBottom: 10,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: 'var(--cp-text-mid)',
            lineHeight: 1.6,
            marginBottom: 22,
          }}
        >
          {body}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              border: '1px solid var(--cp-border)',
              background: 'var(--cp-bg)',
              color: 'var(--cp-text-mid)',
              fontFamily: 'var(--cp-font)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              border: 'none',
              background: danger ? 'linear-gradient(135deg, #FF6B6B, #D94848)' : 'linear-gradient(135deg, #9D7BFF, #FF8B6C)',
              color: '#fff',
              fontFamily: 'var(--cp-font)',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: danger ? '0 6px 20px rgba(217, 72, 72, 0.28)' : '0 6px 20px rgba(157, 123, 255, 0.30)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

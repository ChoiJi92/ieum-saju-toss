/**
 * 리포트 본문 사이에 끼우는 시각 요소.
 *
 * 3,000자를 글로만 흘리면 화면에서 벽처럼 읽힌다. 각 장이 그림으로 시작하면
 * 스크롤이 끊기고, 바로 뒤에 오는 설명이 무엇에 대한 건지도 먼저 눈에 들어온다.
 *
 * 전부 앱이 이미 계산해둔 값이라 서버도 AI도 거치지 않는다.
 */
import { OHAENG_PULIE, TG_KR, DZ_KR, type Myeongsik } from '../../lib/saju';
import type { OhaengKey } from '../../components/ie';
import { getDaewoon } from '../../lib/daewoon';
import { getSinsal } from '../../lib/sinsal';
import { withAlpha } from './_kit';

const GOLD = '#FFD27A';
const ORDER: OhaengKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];
const OHAENG_COLOR: Record<OhaengKey, string> = {
  wood: '#7EE0A0', fire: '#FF9E82', earth: '#FFD27A', metal: '#D6D9E0', water: '#7BA8FF',
};

/** 1장 앞 — 여덟 글자와 오행 분포. 리포트가 무엇을 근거로 쓰였는지 먼저 보여준다. */
export function MyeongsikPanel({ ms }: { ms: Myeongsik }) {
  const total = ORDER.reduce((s, k) => s + ms.ohaeng[k], 0);
  const yong = ms.shinkang.yongshin.ohaeng;

  return (
    <div style={{
      marginTop: 14, marginBottom: 6, padding: '18px 16px 16px', borderRadius: 18,
      background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.1)',
    }}>
      {/* 4기둥 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {ms.pillars.map((p) => (
          <div key={p.label} style={{ textAlign: 'center', flex: 1, maxWidth: 66 }}>
            <div style={{ fontSize: 10, color: 'var(--v2-ink-dim)', marginBottom: 5 }}>{p.label}</div>
            <div style={{
              borderRadius: 12, padding: '8px 0',
              background: p.isSelf ? withAlpha(GOLD, .16) : 'rgba(255,255,255,.05)',
              border: `1px solid ${p.isSelf ? withAlpha(GOLD, .4) : 'rgba(255,255,255,.09)'}`,
            }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: p.isSelf ? GOLD : 'var(--v2-ink)' }}>{p.top.c}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: p.isSelf ? GOLD : 'var(--v2-ink)' }}>{p.bot.c}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--v2-ink-dim)', marginTop: 5 }}>
              {TG_KR[p.top.c] ?? ''}{DZ_KR[p.bot.c] ?? ''}
            </div>
          </div>
        ))}
      </div>

      {/* 보유 신살 — 이 사람에게만 붙은 것들이라 배지로 세워둔다 */}
      <SinsalChips ms={ms} />

      {/* 오행 막대 — 0 개도 자리를 남겨 '없다'가 보이게 한다 */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {ORDER.map((k) => {
          const n = ms.ohaeng[k];
          const pct = total > 0 ? (n / total) * 100 : 0;
          const isYong = k === yong;
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: 11.5, width: 26, color: n === 0 ? 'var(--v2-ink-dim)' : 'var(--v2-ink-mid)' }}>
                {OHAENG_PULIE[k]}
              </span>
              <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 4,
                  background: OHAENG_COLOR[k], opacity: n === 0 ? 0 : 0.85,
                }} />
              </div>
              <span style={{
                fontSize: 11.5, width: 34, textAlign: 'right',
                color: n === 0 ? '#FF9E82' : 'var(--v2-ink-mid)', fontWeight: n === 0 ? 800 : 600,
              }}>
                {n === 0 ? '없음' : n}
              </span>
              <span style={{ width: 30, fontSize: 9.5, color: isYong ? GOLD : 'transparent', fontWeight: 800 }}>
                필요
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 명식에 실제로 있는 신살만 칩으로. 없는 건 안 보여준다(있는 것만 특별해야 한다). */
function SinsalChips({ ms }: { ms: Myeongsik }) {
  const owned = getSinsal(ms).filter((s) => s.has);
  if (owned.length === 0) return null;
  return (
    <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
      {owned.map((s) => (
        <span key={s.name} style={{
          padding: '5px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
          color: s.color ?? GOLD,
          background: withAlpha(s.color ?? GOLD, 0.12),
          border: `1px solid ${withAlpha(s.color ?? GOLD, 0.32)}`,
        }}>
          {s.emoji ? `${s.emoji} ` : ''}{s.name}
        </span>
      ))}
    </div>
  );
}

/**
 * 연도별 정리 — 원래는 글머리 목록으로 오는데, 연도가 세로로 줄맞춤되면
 * "언제 뭐가 있는지"를 훑기가 훨씬 쉽다. 올해는 금색으로 표시한다.
 */
export function YearTable({ rows, thisYear }: {
  rows: { head: string; body: string }[]; thisYear: number;
}) {
  return (
    <div style={{
      marginTop: 12, borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,.1)',
    }}>
      {rows.map((r, i) => {
        const mine = r.head.includes(String(thisYear));
        return (
          <div key={i} style={{
            display: 'flex', gap: 10, padding: '12px 13px',
            background: mine ? withAlpha(GOLD, .1) : (i % 2 ? 'rgba(255,255,255,.025)' : 'transparent'),
            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,.06)',
          }}>
            <div style={{
              flex: '0 0 84px', fontSize: 12.5, fontWeight: 800,
              color: mine ? GOLD : 'var(--v2-ink)', lineHeight: 1.5,
            }}>{r.head}</div>
            <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.65, color: 'var(--v2-ink-mid)' }}>
              {r.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 장마다 한 문장을 크게 세워 눈이 쉬어가게 한다. 프롬프트가 `> ` 인용으로 표시해준다. */
export function PullQuote({ text }: { text: string }) {
  return (
    <div style={{
      margin: '22px 0 6px', padding: '20px 18px', borderRadius: 18,
      background: `linear-gradient(140deg, ${withAlpha(GOLD, .13)}, rgba(183,156,255,.07))`,
      border: `1px solid ${withAlpha(GOLD, .28)}`,
    }}>
      <div style={{ fontSize: 16.5, fontWeight: 800, lineHeight: 1.6, color: 'var(--v2-ink)' }}>
        {text}
      </div>
    </div>
  );
}

/** 2장 앞 — 대운 흐름. "지금 어디쯤인지"가 글보다 막대로 훨씬 빨리 읽힌다. */
export function DaewoonPanel({ ms, profile }: {
  ms: Myeongsik; profile: { year: number; gender: 'male' | 'female' };
}) {
  const all = getDaewoon(ms, profile);
  const curIdx = all.findIndex((d) => d.isCurrent);
  if (curIdx < 0) return null;
  // 지금을 가운데 두고 앞뒤로만 — 100살까지 다 보여줄 필요는 없다
  const list = all.slice(Math.max(0, curIdx - 1), curIdx + 4);

  return (
    <div style={{
      marginTop: 14, marginBottom: 6, padding: '16px 14px', borderRadius: 18,
      background: 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.1)',
    }}>
      <div style={{ fontSize: 10.5, color: 'var(--v2-ink-dim)', marginBottom: 11, letterSpacing: 1 }}>
        10년마다 바뀌는 큰 흐름
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {list.map((d) => (
          <div key={d.age} style={{
            flex: 1, textAlign: 'center', padding: '10px 2px', borderRadius: 12,
            background: d.isCurrent ? withAlpha(GOLD, .16) : 'rgba(255,255,255,.04)',
            border: `1px solid ${d.isCurrent ? withAlpha(GOLD, .42) : 'rgba(255,255,255,.08)'}`,
          }}>
            <div style={{ fontSize: 10, color: d.isCurrent ? GOLD : 'var(--v2-ink-dim)', fontWeight: 700 }}>
              {d.age}세
            </div>
            <div style={{
              fontSize: 14.5, fontWeight: 800, marginTop: 4,
              color: d.isCurrent ? GOLD : 'var(--v2-ink)',
            }}>{d.label}</div>
            <div style={{ fontSize: 9.5, color: 'var(--v2-ink-dim)', marginTop: 3 }}>{d.sipsung ?? ''}</div>
          </div>
        ))}
      </div>
      {/* 화살표는 칸과 같은 격자로 깔아야 현재 칸 아래에 정확히 붙는다.
          가운데 정렬로 두면 현재 대운이 2번째 칸일 때 3번째를 가리키게 된다. */}
      <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
        {list.map((d) => (
          <div key={d.age} style={{
            flex: 1, textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: GOLD,
          }}>
            {d.isCurrent ? '▲ 지금 여기' : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

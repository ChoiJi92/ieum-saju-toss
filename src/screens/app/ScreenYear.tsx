import { V2Screen, V2TopBar, V2Label, V2Glass, DomainHeader, SectionCard, DomainEmpty, Chip, BulletList } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { yearForecast, type MonthNote, type FieldDetail } from '../../lib/year';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

const FIELD_META: Array<{ key: 'love' | 'money' | 'career' | 'health'; label: string; emoji: string; color: string }> = [
  { key: 'love',   label: '연애',   emoji: '💗', color: 'var(--v2-rose)' },
  { key: 'money',  label: '금전',   emoji: '💰', color: 'var(--v2-mint)' },
  { key: 'career', label: '커리어', emoji: '🚀', color: 'var(--v2-lavender)' },
  { key: 'health', label: '건강',   emoji: '🌿', color: 'var(--v2-peach)' },
];

/** 행운의 달 / 주의할 달 한 줄 행 */
function MonthRow({ note, color, sign }: { note: MonthNote; color: string; sign: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 'var(--v2-r-md)', background: `${color}14`, border: `1px solid ${color}33` }}>
      <div style={{ flexShrink: 0, minWidth: 42, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color }}>{note.month}월</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--v2-ink-mute)' }}>{note.score}점</div>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: `${color}33` }} />
      <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.55, color: 'var(--v2-ink-mid)' }}>
        <span style={{ color, fontWeight: 800, marginRight: 5 }}>{sign}</span>{note.reason}
      </div>
    </div>
  );
}

/** 분야별 카드 — 점수 배지 + 본문 + 추천 행동 */
function FieldCard({ meta, detail }: { meta: typeof FIELD_META[number]; detail: FieldDetail }) {
  return (
    <V2Glass style={{ borderLeft: `2px solid ${meta.color}66` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{meta.emoji}</span>
        <span style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--v2-ink)' }}>{meta.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 900, color: meta.color, background: `${meta.color}1f`, padding: '3px 10px', borderRadius: 999 }}>{detail.score}점</span>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)' }}>{detail.body}</div>
      <div style={{ marginTop: 9, display: 'flex', gap: 7, alignItems: 'flex-start', padding: '9px 11px', borderRadius: 11, background: `${meta.color}12` }}>
        <span style={{ flexShrink: 0 }}>👉</span>
        <span style={{ fontSize: 12.5, lineHeight: 1.55, fontWeight: 700, color: 'var(--v2-ink)' }}>{detail.action}</span>
      </div>
    </V2Glass>
  );
}

export default function ScreenYear({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const today = new Date();
  const year = today.getFullYear();
  const f = myeongsik ? yearForecast(myeongsik, year, today) : null;
  if (!f) return <DomainEmpty title="올해의 운세" back={back} />;
  return (
    <V2Screen seed={32}>
      <V2TopBar onBack={back} title="올해의 운세" />
      <DomainHeader spirit={spirit} score={f.yearScore} mood={f.mood} tagline={f.tagline} />

      <V2Label>올해의 키워드</V2Label>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {f.keywords.map((k, i) => (
          <Chip key={i} color={['var(--v2-lavender)', 'var(--v2-mint)', 'var(--v2-peach)'][i % 3]}>#{k}</Chip>
        ))}
      </div>

      <V2Label>올해 총평</V2Label>
      <SectionCard title={f.headline} body={f.yearBody} />

      <V2Label>이번 달 포커스</V2Label>
      <SectionCard title={`${f.monthFocus.month}월`} body={f.monthFocus.body} color="var(--v2-peach)" />

      <V2Label>상반기 · 하반기 흐름</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <SectionCard title={`상반기 (1~6월) · 평균 ${f.half.first.score}점`} body={f.half.first.body} color="var(--v2-mint)" />
        <SectionCard title={`하반기 (7~12월) · 평균 ${f.half.second.score}점`} body={f.half.second.body} color="var(--v2-lavender)" />
      </div>

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

      <V2Label>행운의 달 TOP 3</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {f.luckyMonths.map((n) => <MonthRow key={n.month} note={n} color="var(--v2-mint)" sign="✦" />)}
      </div>

      <V2Label>조금 더 신경 쓸 달</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {f.cautionMonths.map((n) => <MonthRow key={n.month} note={n} color="var(--v2-peach)" sign="⚠" />)}
      </div>

      <V2Label>분야별 풀이</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {FIELD_META.map((meta) => <FieldCard key={meta.key} meta={meta} detail={f.fields[meta.key]} />)}
      </div>

      <V2Label>올해의 행운 가이드</V2Label>
      <V2Glass style={{ borderLeft: '2px solid var(--v2-butter)' }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 11 }}>
          <Chip color="var(--v2-butter)">🌟 올해의 기운 · {f.luck.elementPulie}({f.luck.elementKr})</Chip>
          <Chip color="var(--v2-rose)">🎨 행운 색 · {f.luck.color}</Chip>
          <Chip color="var(--v2-mint)">🧭 방향 · {f.luck.direction}</Chip>
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)', marginBottom: 12 }}>{f.luck.body}</div>
        <BulletList items={f.luck.advice} />
      </V2Glass>

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

import { V2Screen, V2TopBar, V2Label, V2Glass, DomainHeader, Accordion, Chip, SectionCard, BulletList, DomainEmpty, withAlpha } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { monthForecast, type DayNote, type MonthField } from '../../lib/month';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

/** 좋은 날 / 주의할 날 한 줄 행 */
function DayRow({ note, color, sign }: { note: DayNote; color: string; sign: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 'var(--v2-r-md)', background: withAlpha(color, .08), border: `1px solid ${withAlpha(color, .2)}` }}>
      <div style={{ flexShrink: 0, minWidth: 42, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color }}>{note.day}일</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--v2-ink-mute)' }}>{note.score}점</div>
      </div>
      <div style={{ width: 1, alignSelf: 'stretch', background: withAlpha(color, .2) }} />
      <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.55, color: 'var(--v2-ink-mid)' }}>
        <span style={{ color, fontWeight: 800, marginRight: 5 }}>{sign}</span>{note.reason}
      </div>
    </div>
  );
}

/** 분야별 카드 — 점수 배지 + 본문 + 추천 행동 */
function FieldCard({ field }: { field: MonthField }) {
  return (
    <V2Glass style={{ borderLeft: `2px solid ${field.color}66` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{field.ic}</span>
        <span style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--v2-ink)' }}>{field.lbl}</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 900, color: field.color, background: `${field.color}1f`, padding: '3px 10px', borderRadius: 999 }}>{field.score}점</span>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)' }}>{field.body}</div>
      <div style={{ marginTop: 9, display: 'flex', gap: 7, alignItems: 'flex-start', padding: '9px 11px', borderRadius: 11, background: `${field.color}12` }}>
        <span style={{ flexShrink: 0 }}>👉</span>
        <span style={{ fontSize: 12.5, lineHeight: 1.55, fontWeight: 700, color: 'var(--v2-ink)' }}>{field.action}</span>
      </div>
    </V2Glass>
  );
}

export default function ScreenMonth({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const f = myeongsik ? monthForecast(myeongsik) : null;
  if (!f) return <DomainEmpty title="이달의 운세" back={back} />;
  const maxDay = f.daily.length;
  return (
    <V2Screen seed={31}>
      <V2TopBar onBack={back} title="이달의 운세" />

      <DomainHeader spirit={spirit} score={f.monthScore} mood={f.mood} tagline={f.tagline} />

      <V2Label>이달의 키워드</V2Label>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {f.keywords.map((k, i) => (
          <Chip key={k} color={['var(--v2-lavender)', 'var(--v2-mint)', 'var(--v2-peach)'][i % 3]}>{k}</Chip>
        ))}
      </div>

      <V2Label>이달 총평</V2Label>
      <SectionCard title={f.headline} body={f.monthBody} />

      <V2Label>주차별 흐름</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {f.weeks.map((w) => (
          <SectionCard key={w.label} title={`${w.label} · 평균 ${w.score}점`} body={w.body} color="var(--v2-mint)" />
        ))}
      </div>

      <V2Label>이달 일별 흐름</V2Label>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, padding: '4px 2px' }}>
        {f.daily.map((d) => {
          const isBest = d.day === f.bestDay.day;
          const isWorst = d.day === f.worstDay.day;
          const bg = isBest ? 'var(--v2-lavender)' : isWorst ? 'var(--v2-ink-mute)' : 'var(--v2-glass-line2)';
          const showLabel = d.day === 1 || d.day % 5 === 0 || d.day === maxDay;
          return (
            <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: 70, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: `${d.score}%`, borderRadius: 3, background: bg, boxShadow: isBest ? '0 0 10px var(--v2-lavender)' : 'none' }} />
              </div>
              <div style={{ fontSize: 8, fontWeight: 700, color: isBest ? 'var(--v2-lavender)' : 'var(--v2-ink-mute)', height: 10 }}>{showLabel ? d.day : ''}</div>
            </div>
          );
        })}
      </div>

      <V2Label>좋은 날 TOP 3</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {f.luckyDays.map((n) => <DayRow key={n.day} note={n} color="var(--v2-mint)" sign="✦" />)}
      </div>

      <V2Label>조금 더 신경 쓸 날</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {f.cautionDays.map((n) => <DayRow key={n.day} note={n} color="var(--v2-peach)" sign="⚠" />)}
      </div>

      <V2Label>분야별 풀이</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {f.fields.map((field) => <FieldCard key={field.lbl} field={field} />)}
      </div>

      <V2Label>이달의 행운 가이드</V2Label>
      <V2Glass style={{ borderLeft: '2px solid var(--v2-butter)' }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 11 }}>
          <Chip color="var(--v2-butter)">🌟 이달의 기운 · {f.luck.elementPulie}({f.luck.elementKr})</Chip>
          <Chip color="var(--v2-rose)">🎨 행운 색 · {f.luck.color}</Chip>
          <Chip color="var(--v2-mint)">🧭 방향 · {f.luck.direction}</Chip>
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)', marginBottom: 12 }}>{f.luck.body}</div>
        <BulletList items={f.luck.advice} />
      </V2Glass>

      <V2Label>이렇게 해보세요</V2Label>
      <Accordion items={f.actions} />

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

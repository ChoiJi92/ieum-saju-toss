import { useMemo, useState } from 'react';
import { useSaju } from '../../lib/saju-state';
import { iljinMonth, type IljinDay } from '../../lib/iljin';
import { V2Screen, V2TopBar, V2Glass, DomainEmpty } from './_kit';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

/** 일진 캘린더 — 한 달 전체 날짜별 길흉. 약속·시험·계약 날 잡을 때 여는 화면. */
export default function ScreenCalendar({ back }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const now = new Date();
  const [ym, setYm] = useState<{ y: number; mo: number }>({ y: now.getFullYear(), mo: now.getMonth() + 1 });
  const [sel, setSel] = useState<number | null>(null);

  const cal = useMemo(
    () => (myeongsik ? iljinMonth(myeongsik, ym.y, ym.mo) : null),
    [myeongsik, ym.y, ym.mo],
  );
  if (!myeongsik || !cal) return <DomainEmpty title="일진 달력" back={back} />;

  const isCurMonth = ym.y === now.getFullYear() && ym.mo === now.getMonth() + 1;
  const todayDay = isCurMonth ? now.getDate() : -1;
  const selDay: IljinDay | null = sel ? cal.days[sel - 1] ?? null : null;

  const move = (d: number) => {
    setSel(null);
    setYm((p) => {
      let y = p.y, mo = p.mo + d;
      if (mo < 1) { mo = 12; y -= 1; }
      if (mo > 12) { mo = 1; y += 1; }
      return { y, mo };
    });
  };

  const cellColor = (d: IljinDay) => {
    if (d.score >= 85) return { bg: 'rgba(91,217,172,.16)', bd: 'rgba(91,217,172,.45)', tx: 'var(--v2-mint)' };
    if (d.score < 65) return { bg: 'rgba(255,158,130,.13)', bd: 'rgba(255,158,130,.4)', tx: 'var(--v2-peach)' };
    return { bg: 'var(--v2-glass)', bd: 'transparent', tx: 'var(--v2-ink-mid)' };
  };

  return (
    <V2Screen seed={41}>
      <V2TopBar onBack={back} title="일진 달력" />

      {/* 월 네비 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, margin: '6px 0 14px' }}>
        <button onClick={() => move(-1)} style={{ background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', color: 'var(--v2-ink-mid)', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}>‹</button>
        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--v2-ink)', minWidth: 120, textAlign: 'center' }}>{cal.y}년 {cal.mo}월</span>
        <button onClick={() => move(1)} style={{ background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', color: 'var(--v2-ink-mid)', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 15 }}>›</button>
      </div>

      {/* 범례 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
        {([['var(--v2-mint)', '좋은 날'], ['var(--v2-ink-mute)', '보통'], ['var(--v2-peach)', '조심']] as const).map(([c, t]) => (
          <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--v2-ink-dim)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{t}
          </span>
        ))}
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginBottom: 5 }}>
        {['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 800, color: i === 0 ? 'var(--v2-peach)' : 'var(--v2-ink-dim)' }}>{w}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
        {Array.from({ length: cal.firstWeekday }, (_, i) => <div key={`e${i}`} />)}
        {cal.days.map((d) => {
          const c = cellColor(d);
          const isToday = d.day === todayDay;
          const isSel = d.day === sel;
          return (
            <button
              key={d.day}
              onClick={() => setSel(d.day === sel ? null : d.day)}
              style={{
                aspectRatio: '1', minHeight: 44, borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                background: c.bg,
                border: isSel ? '1.5px solid var(--v2-lavender)' : isToday ? '1.5px solid var(--v2-butter)' : `1px solid ${c.bd}`,
                boxShadow: isSel ? '0 0 12px rgba(183,156,255,.4)' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, padding: 0,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: isToday ? 'var(--v2-butter)' : 'var(--v2-ink)' }}>{d.day}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: c.tx }}>{d.score}</span>
            </button>
          );
        })}
      </div>

      {/* 선택한 날 상세 */}
      {selDay && (
        <V2Glass style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{cal.mo}월 {selDay.day}일 ({['일', '월', '화', '수', '목', '금', '토'][selDay.weekday]})</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: cellColor(selDay).tx }}>{selDay.score}점</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', marginBottom: 6 }}>
            일진 <span className="v2-serif" style={{ color: 'var(--v2-lavender)', fontWeight: 800 }}>{selDay.ganji}</span>
            {selDay.sipsung && <> · {selDay.sipsung}의 날</>}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--v2-ink-mid)' }}>{selDay.hint}</div>
        </V2Glass>
      )}

      {/* 이달의 베스트/주의 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 14 }}>
        <V2Glass style={{ padding: '13px 15px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--v2-mint)', marginBottom: 4 }}>🍀 가장 좋은 날</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--v2-ink)' }}>{cal.mo}월 {cal.bestDay}일</div>
        </V2Glass>
        <V2Glass style={{ padding: '13px 15px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--v2-peach)', marginBottom: 4 }}>⚠️ 조심할 날</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--v2-ink)' }}>{cal.mo}월 {cal.worstDay}일</div>
        </V2Glass>
      </div>
      <div style={{ height: 44 }} />
    </V2Screen>
  );
}

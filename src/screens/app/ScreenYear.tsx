import { useRef, useState } from 'react';
import { V2Screen, V2TopBar, V2Label, V2Glass, DomainHeader, SectionCard, DomainEmpty, Chip, BulletList, withAlpha } from './_kit';
import { useSaju } from '../../lib/saju-state';
import { yearForecast, type MonthNote, type FieldDetail } from '../../lib/year';
import { getDaewoon, getSeun, DAEWOON_TEXT, SEUN_TEXT } from '../../lib/daewoon';
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 'var(--v2-r-md)', background: withAlpha(color, .08), border: `1px solid ${withAlpha(color, .2)}` }}>
      <div style={{ flexShrink: 0, minWidth: 42, textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 900, color }}>{note.month}월</div>
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
function FieldCard({ meta, detail }: { meta: typeof FIELD_META[number]; detail: FieldDetail }) {
  return (
    <V2Glass style={{ borderLeft: `2px solid ${withAlpha(meta.color, .4)}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{meta.emoji}</span>
        <span style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--v2-ink)' }}>{meta.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 900, color: meta.color, background: withAlpha(meta.color, .12), padding: '3px 10px', borderRadius: 999 }}>{detail.score}점</span>
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)' }}>{detail.body}</div>
      <div style={{ marginTop: 9, display: 'flex', gap: 7, alignItems: 'flex-start', padding: '9px 11px', borderRadius: 11, background: withAlpha(meta.color, .07) }}>
        <span style={{ flexShrink: 0 }}>👉</span>
        <span style={{ fontSize: 12.5, lineHeight: 1.55, fontWeight: 700, color: 'var(--v2-ink)' }}>{detail.action}</span>
      </div>
    </V2Glass>
  );
}

export default function ScreenYear({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik, profile } = useSaju();
  // 대운 타임라인에서 선택한 시기 (null = 현재 대운)
  const [selDaewoonAge, setSelDaewoonAge] = useState<number | null>(null);
  // 세운 타임라인에서 선택한 해 (null = 올해)
  const [selSeunYear, setSelSeunYear] = useState<number | null>(null);
  // 첫 렌더에 현재 대운/올해 칩이 화면에 들어오도록 1회 스크롤 (callback ref — 훅은 조건부 블록 안에서 못 쓰므로)
  const daewoonScrolled = useRef(false);
  const seunScrolled = useRef(false);
  const scrollOnceIntoView = (flag: React.MutableRefObject<boolean>) => (el: HTMLButtonElement | null) => {
    if (el && !flag.current) { flag.current = true; el.scrollIntoView({ inline: 'center', block: 'nearest' }); }
  };
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

      {profile && myeongsik && (() => {
        const daewoonList = getDaewoon(myeongsik, { year: profile.year, gender: profile.gender });
        // 매칭 없으면(첫 대운 시작 전 나이 등) 엉뚱한 대운 대신 안내 문구로 폴백
        const currentDaewoon = daewoonList.find((d) => d.isCurrent) ?? null;
        // 칩에서 고른 시기 우선, 없으면 현재 대운
        const shownDaewoon = daewoonList.find((d) => d.age === selDaewoonAge) ?? currentDaewoon;
        const seunList = getSeun(myeongsik, { year: profile.year });
        // 칩에서 고른 해 우선, 없으면 올해
        const shownSeun = seunList.find((s) => s.year === selSeunYear) ?? seunList.find((s) => s.isCurrent) ?? null;
        return (
          <>
            <V2Label>인생의 큰 흐름 · 대운</V2Label>
            {/* 가로 스크롤 칩 타임라인 — 탭하면 해당 시기 해석으로 전환 */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ie-scroll">
              {daewoonList.map((d) => {
                const isSel = shownDaewoon?.age === d.age;
                return (
                  <button
                    key={d.age}
                    ref={d.isCurrent ? scrollOnceIntoView(daewoonScrolled) : undefined}
                    onClick={() => setSelDaewoonAge(d.age)}
                    style={{
                      flexShrink: 0, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                      padding: '8px 13px',
                      borderRadius: 'var(--v2-r-md)',
                      background: isSel ? withAlpha('var(--v2-lavender)', .12) : 'var(--v2-glass-line2)',
                      border: isSel ? '1.5px solid var(--v2-lavender)' : '1px solid var(--v2-glass-line)',
                      textAlign: 'center',
                      minWidth: 62,
                    }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: isSel ? 'var(--v2-lavender)' : d.isCurrent ? 'var(--v2-butter)' : 'var(--v2-ink-mute)', marginBottom: 3 }}>{d.isCurrent ? '지금 · ' : ''}{d.age}살~</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: isSel ? 'var(--v2-lavender)' : 'var(--v2-ink)' }}>{d.label}</div>
                    {d.sipsung && (
                      <div style={{ fontSize: 10, color: 'var(--v2-ink-mute)', marginTop: 2 }}>{d.sipsung}</div>
                    )}
                  </button>
                );
              })}
            </div>
            {/* 선택한 대운 해석 카드 — 매칭 없으면(첫 대운 전) 안내 문구 */}
            {shownDaewoon ? (
              <V2Glass style={{ borderLeft: `2px solid ${withAlpha('var(--v2-lavender)', .4)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--v2-ink)' }}>{shownDaewoon.label} 대운</span>
                  <span style={{ fontSize: 12.5, color: 'var(--v2-ink-mute)' }}>({shownDaewoon.age}세 ~ {shownDaewoon.age + 9}세)</span>
                  {shownDaewoon.isCurrent && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--v2-butter)' }}>지금 여기</span>
                  )}
                  {shownDaewoon.sipsung && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: 'var(--v2-lavender)', background: withAlpha('var(--v2-lavender)', .12), padding: '3px 10px', borderRadius: 999 }}>{shownDaewoon.sipsung}</span>
                  )}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--v2-ink-mid)' }}>
                  {shownDaewoon.sipsung ? DAEWOON_TEXT[shownDaewoon.sipsung] : '이 대운의 흐름이 곧 펼쳐질 거예요. 명식 계산이 완료되면 더 자세한 해석을 볼 수 있어요.'}
                </div>
                <div style={{ marginTop: 10, fontSize: 10.5, color: 'var(--v2-ink-mute)', lineHeight: 1.55 }}>
                  다른 시기를 눌러 그때의 흐름도 볼 수 있어요 · 대운 시작 나이는 절기 기준 간이 계산으로 ±2살 오차가 있을 수 있어요
                </div>
              </V2Glass>
            ) : (
              <V2Glass style={{ borderLeft: `2px solid ${withAlpha('var(--v2-lavender)', .4)}` }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--v2-ink-mid)' }}>
                  아직 첫 대운이 시작되기 전이에요. {daewoonList[0]?.age}살부터 {daewoonList[0]?.label} 대운의 흐름이 펼쳐질 거예요 ✦
                </div>
                <div style={{ marginTop: 10, fontSize: 10.5, color: 'var(--v2-ink-mute)', lineHeight: 1.55 }}>
                  대운 시작 나이는 절기 기준 간이 계산으로 ±2살 오차가 있을 수 있어요
                </div>
              </V2Glass>
            )}

            <V2Label>해마다의 흐름 · 세운</V2Label>
            {/* 가로 스크롤 연도 칩 — 탭하면 그 해 해석으로 전환 (대운과 동일 패턴) */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="ie-scroll">
              {seunList.map((s) => {
                const isSel = shownSeun?.year === s.year;
                return (
                  <button
                    key={s.year}
                    ref={s.isCurrent ? scrollOnceIntoView(seunScrolled) : undefined}
                    onClick={() => setSelSeunYear(s.year)}
                    style={{
                      flexShrink: 0, cursor: 'pointer', fontFamily: 'var(--v2-font)',
                      padding: '8px 13px',
                      borderRadius: 'var(--v2-r-md)',
                      background: isSel ? withAlpha('var(--v2-lavender)', .12) : 'var(--v2-glass-line2)',
                      border: isSel ? '1.5px solid var(--v2-lavender)' : '1px solid var(--v2-glass-line)',
                      textAlign: 'center',
                      minWidth: 62,
                    }}
                  >
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: isSel ? 'var(--v2-lavender)' : s.isCurrent ? 'var(--v2-butter)' : 'var(--v2-ink-mute)', marginBottom: 3 }}>{s.isCurrent ? '올해 · ' : ''}{s.year}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: isSel ? 'var(--v2-lavender)' : 'var(--v2-ink)' }}>{s.label}</div>
                    {s.sipsung && (
                      <div style={{ fontSize: 10, color: 'var(--v2-ink-mute)', marginTop: 2 }}>{s.sipsung}</div>
                    )}
                  </button>
                );
              })}
            </div>
            {/* 선택한 해 해석 카드 */}
            {shownSeun && (
              <V2Glass style={{ borderLeft: `2px solid ${withAlpha('var(--v2-lavender)', .4)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 900, color: 'var(--v2-ink)' }}>{shownSeun.year}년 · {shownSeun.label}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--v2-ink-mute)' }}>{shownSeun.age}살</span>
                  {shownSeun.isCurrent && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--v2-butter)' }}>올해</span>
                  )}
                  {shownSeun.sipsung && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: 'var(--v2-lavender)', background: withAlpha('var(--v2-lavender)', .12), padding: '3px 10px', borderRadius: 999 }}>{shownSeun.sipsung}</span>
                  )}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--v2-ink-mid)' }}>
                  {shownSeun.sipsung ? SEUN_TEXT[shownSeun.sipsung] : '이 해의 세운 해석을 준비 중이에요.'}
                </div>
                <div style={{ marginTop: 10, fontSize: 10.5, color: 'var(--v2-ink-mute)', lineHeight: 1.55 }}>
                  다른 해를 눌러 그해의 흐름도 볼 수 있어요
                </div>
              </V2Glass>
            )}
          </>
        );
      })()}

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

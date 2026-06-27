import { useState } from 'react';
import { V2Screen, V2TopBar, V2Label, V2Glass, Chip, DomainEmpty, SectionCard, ScoreRing, BulletList } from './_kit';
import { useSaju } from '../../lib/saju-state';
import {
  getSinsal,
  sinsalSynthesis,
  sinsalInfluenceScore,
  sinsalTotalScore,
  getCurrentYearBranch,
  getSinsalTip,
} from '../../lib/sinsal';
import type { SinsalItem } from '../../lib/sinsal';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

/** 인라인 Accordion: 한 카드 안에서 팁 섹션을 펼칠 수 있어요 */
function TipAccordion({ item }: { item: SinsalItem }) {
  const [open, setOpen] = useState(false);
  const tip = getSinsalTip(item.name);
  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 12px',
          borderRadius: 10,
          background: `${item.color}18`,
          border: `1px solid ${item.color}33`,
          cursor: 'pointer',
          fontFamily: 'var(--v2-font)',
          width: '100%',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 800, color: item.color, flex: 1, textAlign: 'left' }}>
          💡 실생활 활용 팁
        </span>
        <span
          style={{
            color: item.color,
            fontSize: 11,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s',
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            padding: '12px 14px',
            borderRadius: 10,
            background: `${item.color}10`,
            border: `1px solid ${item.color}22`,
          }}
        >
          <BulletList
            items={[
              `살려야 할 점: ${tip.lean}`,
              `주의할 점: ${tip.watch}`,
            ]}
          />
        </div>
      )}
    </div>
  );
}

/** 영향도 미니 바 */
function InfluenceBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10 }}>
      <span style={{ fontSize: 11, color: 'var(--v2-ink-dim)', whiteSpace: 'nowrap' }}>영향도</span>
      <div
        style={{
          flex: 1,
          height: 5,
          borderRadius: 999,
          background: 'rgba(255,255,255,.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 8px ${color}88`,
            transition: 'width .5s cubic-bezier(.3,.9,.3,1)',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          color,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}

/** "그 외" 신살 카드 — 한 줄 + Accordion 으로 본문 펼치기 */
function NoneCard({ item }: { item: SinsalItem }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((v) => !v)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 'var(--v2-r-md)',
        background: 'var(--v2-glass)',
        border: '1px solid var(--v2-glass-line2)',
        cursor: 'pointer',
        fontFamily: 'var(--v2-font)',
        opacity: 0.75,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--v2-ink-mid)' }}>
            {item.emoji} {item.name}
            <span style={{ fontSize: 11, color: 'var(--v2-ink-mute)', marginLeft: 6 }}>({item.hanja})</span>
          </span>
          <div style={{ fontSize: 12, color: 'var(--v2-ink-mute)', marginTop: 3 }}>{item.oneLine}</div>
        </div>
        <span
          style={{
            color: 'var(--v2-ink-mute)',
            fontSize: 11,
            marginLeft: 10,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s',
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </div>
      {open && (
        <div
          style={{
            marginTop: 11,
            paddingTop: 11,
            borderTop: '1px solid var(--v2-glass-line2)',
            fontSize: 13,
            lineHeight: 1.65,
            color: 'var(--v2-ink-mid)',
            whiteSpace: 'pre-line',
          }}
        >
          {item.body}
        </div>
      )}
    </button>
  );
}

export default function ScreenSinsal({ back }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const items = myeongsik ? getSinsal(myeongsik) : null;
  if (!items) return <DomainEmpty title="신살" back={back} />;

  const owned = items.filter((i) => i.has);
  const none = items.filter((i) => !i.has);
  const totalScore = sinsalTotalScore(items);
  const synthesis = sinsalSynthesis(items);
  const yearBranch = getCurrentYearBranch();

  return (
    <V2Screen seed={39}>
      <V2TopBar onBack={back} title="신살" />

      {/* 헤더 — 종합 점수 + 요약 */}
      <V2Glass style={{ marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <ScoreRing score={totalScore} color="var(--v2-lavender)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--v2-lavender)', letterSpacing: '1.2px', marginBottom: 5 }}>
              신살 종합 영향도
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1.45 }}>
              🔮 8가지 기운 중{' '}
              <span style={{ color: 'var(--v2-lavender)' }}>{owned.length}개</span>를 지녔어요
            </div>
            <div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', marginTop: 4, lineHeight: 1.5 }}>
              {owned.length === 0
                ? '신살 없음 · 균형 잡힌 결'
                : owned.map((o) => o.emoji + ' ' + o.name).join('  ')}
            </div>
          </div>
        </div>
      </V2Glass>

      {/* 신살 종합 해석 */}
      <V2Label>신살 종합</V2Label>
      <SectionCard title="종합 해석" body={synthesis} color="var(--v2-lavender)" />

      {/* 지닌 기운 */}
      <V2Label>지닌 기운</V2Label>
      {owned.length === 0 ? (
        <V2Glass>
          <div style={{ fontSize: 13.5, color: 'var(--v2-ink-dim)', lineHeight: 1.6 }}>
            특별히 도드라지는 신살은 없어요. 환경과 노력이 운을 만드는 타입이에요.
          </div>
        </V2Glass>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {owned.map((s) => {
            const influence = sinsalInfluenceScore(s);
            const activeThisYear = s.targetBranch != null && s.targetBranch === yearBranch;
            return (
              <V2Glass key={s.name} style={{ border: `1px solid ${s.color}55` }}>
                {/* 이름 행 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-ink)' }}>
                    {s.emoji} {s.name}
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--v2-ink-dim)', marginLeft: 6 }}>
                      ({s.hanja})
                    </span>
                  </span>
                  {activeThisYear && (
                    <Chip color="#FFD700">올해 활성 ✦</Chip>
                  )}
                </div>

                {/* 한 줄 요약 */}
                <div style={{ fontSize: 12.5, color: s.color, fontWeight: 700, marginTop: 4 }}>
                  {s.oneLine}
                </div>

                {/* 기둥 위치 칩 */}
                {s.positions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {s.positions.map((p) => (
                      <Chip key={p} color={s.color}>{p}</Chip>
                    ))}
                  </div>
                )}

                {/* 영향도 바 */}
                <InfluenceBar score={influence} color={s.color} />

                {/* 본문 */}
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--v2-ink-mid)',
                    marginTop: 10,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {s.body}
                </div>

                {/* 실생활 팁 Accordion */}
                <TipAccordion item={s} />
              </V2Glass>
            );
          })}
        </div>
      )}

      {/* 그 외 — 본문 펼치기 가능 */}
      <V2Label>그 외</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {none.map((s) => (
          <NoneCard key={s.name} item={s} />
        ))}
      </div>

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

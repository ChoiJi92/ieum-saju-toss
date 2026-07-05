// src/screens/app/JamiChartGrid.tsx — 풀 12궁 명반 그리드 + 궁 탭 바텀시트 (Phase 3)
import { useState } from 'react';
import type { JamiChart, MainStar, PalaceName } from '../../lib/jamidusu';
import { JIJI_HANJA, starsWithBorrow } from '../../lib/jamidusu';
import { LUCKY_MINOR, UNLUCKY_MINOR } from '../../lib/jamidusu-stars';
import { PALACE_READINGS, BRIGHTNESS_NOTES, MUTAGEN_NOTES, MINOR_STAR_NOTES } from '../../lib/jamidusu-content-palace';
import { BottomSheet } from './_kit';

// 고전 명반 배열: 4×4, 바깥 12칸 = 지지, 가운데 2×2 = 요약
// branch 0=子 1=丑 2=寅 3=卯 4=辰 5=巳 6=午 7=未 8=申 9=酉 10=戌 11=亥
// 전통 명반 좌표: 상행 巳午未申 / 우열 酉戌 / 하행(좌→우) 寅丑子亥 / 좌열 辰卯
const GRID_AREAS = `"b5 b6 b7 b8" "b4 c c b9" "b3 c c b10" "b2 b1 b0 b11"`;

const MUTAGEN_COLOR: Record<string, string> = {
  록: 'var(--v2-mint)',
  권: 'var(--v2-peach)',
  과: 'var(--v2-butter)',
  기: 'var(--v2-lavender)',
};

// 밝기 중 모디파이어를 표시할 등급
const BRIGHT_GRADES = new Set(['묘', '왕', '득']);
const DARK_GRADES = new Set(['불', '함']);

/** 셀 스타일: 명궁 하이라이트(lavender), 기본 */
function cellStyle(isLife: boolean): React.CSSProperties {
  return {
    background: isLife
      ? 'rgba(183,156,255,.18)'
      : 'var(--v2-glass)',
    border: isLife
      ? '1px solid rgba(183,156,255,.55)'
      : '1px solid var(--v2-glass-line2)',
    borderRadius: 10,
    padding: '6px 5px',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'var(--v2-font)',
    minHeight: 70,
    minWidth: 0,
    overflow: 'hidden',
  };
}

export function JamiChartGrid({
  chart,
  center,
}: {
  chart: JamiChart;
  center?: React.ReactNode;
}) {
  const [openBranch, setOpenBranch] = useState<number | null>(null);
  const open = openBranch !== null ? chart.palaces[openBranch] : null;
  const borrowResult = open ? starsWithBorrow(chart, open.name as PalaceName) : null;
  // 차성 별의 밝기·사화는 실제 앉은 궁(대궁) 기준 — 재계산 금지
  const srcPalace =
    open && borrowResult
      ? borrowResult.borrowed
        ? chart.palaces[(open.branch + 6) % 12]
        : open
      : null;

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateAreas: GRID_AREAS,
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
        }}
      >
        {/* 중앙 2×2 요약 */}
        <div
          style={{
            gridArea: 'c',
            background: 'var(--v2-glass)',
            border: '1px solid var(--v2-glass-line)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {center}
        </div>

        {/* 12궁 셀 */}
        {chart.palaces.map((p) => {
          const isLife = p.name === '명궁';
          return (
            <button
              key={p.branch}
              className="v2-press"
              onClick={() => setOpenBranch(p.branch)}
              style={{ gridArea: `b${p.branch}`, ...cellStyle(isLife) }}
            >
              {/* 궁명 + 지지 + 신궁 뱃지 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  marginBottom: 2,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: isLife ? 'var(--v2-lavender)' : 'var(--v2-ink-mid)',
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name.replace('궁', '')}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: 'var(--v2-ink-dim)',
                    lineHeight: 1.3,
                  }}
                >
                  {JIJI_HANJA[p.branch]}
                </span>
                {p.isBody && (
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 800,
                      color: '#1b1230',
                      background: 'var(--v2-butter)',
                      padding: '1px 3px',
                      borderRadius: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    身
                  </span>
                )}
              </div>

              {/* 주성 목록 */}
              {p.stars.length > 0 ? (
                p.stars.map((s) => (
                  <div
                    key={s}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 1,
                      lineHeight: 1.3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: 'var(--v2-ink)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s}
                    </span>
                    {p.brightness[s] && (
                      <sub
                        style={{
                          fontSize: 9,
                          color: 'var(--v2-ink-dim)',
                        }}
                      >
                        {p.brightness[s]}
                      </sub>
                    )}
                    {p.mutagens[s] && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: MUTAGEN_COLOR[p.mutagens[s]!] ?? 'var(--v2-ink)',
                        }}
                      >
                        {p.mutagens[s]}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--v2-ink-mute)',
                    lineHeight: 1.4,
                  }}
                >
                  공궁
                </div>
              )}

              {/* 보조성 */}
              {p.minorStars.length > 0 && (
                <div
                  style={{
                    fontSize: 9,
                    color: 'var(--v2-ink-dim)',
                    marginTop: 2,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {p.minorStars.join(' ')}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 궁 바텀시트 */}
      {open && borrowResult && srcPalace && (
        <BottomSheet onClose={() => setOpenBranch(null)}>
          {/* 제목 (BottomSheet에 title prop 없음 — 내부 렌더링) */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--v2-ink)',
              marginBottom: 16,
              letterSpacing: '-0.2px',
            }}
          >
            {open.name}
            <span style={{ color: 'var(--v2-ink-dim)', fontWeight: 600, marginLeft: 6 }}>
              {JIJI_HANJA[open.branch]}
            </span>
            {open.isBody && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#1b1230',
                  background: 'var(--v2-butter)',
                  padding: '2px 6px',
                  borderRadius: 6,
                  marginLeft: 8,
                }}
              >
                身궁
              </span>
            )}
          </div>

          {/* 차성 배너 */}
          {borrowResult.borrowed && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(183,156,255,.12)',
                border: '1px solid rgba(183,156,255,.3)',
                fontSize: 12,
                color: 'var(--v2-lavender)',
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              {open.name}이 비어 있어 맞은편 별을 빌려 읽어요
            </div>
          )}

          {/* 주성 풀이 */}
          {borrowResult.stars.map((s: MainStar) => {
            const br = srcPalace.brightness[s];
            const mu = srcPalace.mutagens[s];

            return (
              <div key={s} style={{ marginBottom: 18 }}>
                {/* 별 이름 + 밝기 + 사화 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-ink)' }}>
                    {s}
                  </span>
                  {br && (
                    <sub style={{ fontSize: 11, color: 'var(--v2-ink-dim)' }}>{br}</sub>
                  )}
                  {mu && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: MUTAGEN_COLOR[mu] ?? 'var(--v2-ink)',
                      }}
                    >
                      {mu}
                    </span>
                  )}
                </div>

                {/* 궁×별 풀이 */}
                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    color: 'var(--v2-ink-mid)',
                  }}
                >
                  {PALACE_READINGS[s][open.name as PalaceName]}
                </p>

                {/* 밝기 모디파이어 — 묘·왕·득 → bright, 불·함 → dark, 리·평은 생략 */}
                {br && BRIGHT_GRADES.has(br) && (
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: 'var(--v2-mint)',
                    }}
                  >
                    {BRIGHTNESS_NOTES[s].bright}
                  </p>
                )}
                {br && DARK_GRADES.has(br) && (
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: 'var(--v2-peach)',
                    }}
                  >
                    {BRIGHTNESS_NOTES[s].dark}
                  </p>
                )}

                {/* 사화 모디파이어 */}
                {mu && MUTAGEN_NOTES[s as keyof typeof MUTAGEN_NOTES]?.[mu] && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: MUTAGEN_COLOR[mu] ?? 'var(--v2-ink-dim)',
                    }}
                  >
                    {MUTAGEN_NOTES[s as keyof typeof MUTAGEN_NOTES]![mu]}
                  </p>
                )}
              </div>
            );
          })}

          {/* 보조성 목록 */}
          {open.minorStars.length > 0 && (
            <div
              style={{
                marginTop: 4,
                paddingTop: 14,
                borderTop: '1px solid var(--v2-glass-line2)',
              }}
            >
              {open.minorStars.map((m) => (
                <p
                  key={m}
                  style={{
                    margin: '0 0 8px',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--v2-ink-mid)',
                  }}
                >
                  <b
                    style={{
                      // 육길=mint, 육살=peach, 록존·천마(중성/길)=butter
                      color: LUCKY_MINOR.includes(m)
                        ? 'var(--v2-mint)'
                        : UNLUCKY_MINOR.includes(m)
                          ? 'var(--v2-peach)'
                          : 'var(--v2-butter)',
                    }}
                  >
                    {m}
                  </b>{' '}
                  {MINOR_STAR_NOTES[m]}
                </p>
              ))}
            </div>
          )}

          {/* 공궁 + 보조성도 없는 경우 */}
          {borrowResult.stars.length === 0 && (
            <p
              style={{
                fontSize: 13.5,
                lineHeight: 1.7,
                color: 'var(--v2-ink-dim)',
              }}
            >
              별이 고요한 궁이에요. 이 영역은 흐름이 담백하게 흘러가요.
            </p>
          )}
        </BottomSheet>
      )}
    </>
  );
}

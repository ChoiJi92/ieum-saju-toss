import { useEffect, useMemo, useRef, useState } from 'react';
import { useSaju } from '../../lib/saju-state';
import {
  chartFromSajuInput,
  palaceOf,
  starsWithBorrow,
  STAR_HANJA,
  JIJI_HANJA,
  type JamiChart,
  type MainStar,
} from '../../lib/jamidusu';
import { STAR_CONTENT, aliasOf } from '../../lib/jamidusu-content';
import { MUTAGEN_TABLE, LUCKY_MINOR, UNLUCKY_MINOR } from '../../lib/jamidusu-stars';
import { BRIGHTNESS_NOTES, MUTAGEN_NOTES, MINOR_STAR_NOTES } from '../../lib/jamidusu-content-palace';
import { computeDaehan, computeYunyeon, currentLunarYearNow, type MutagenHit } from '../../lib/jamidusu-horoscope';
import { MUTAGEN_PALACE_NOTES, DAEHAN_PALACE_NOTES, YUNYEON_PALACE_NOTES, HOROSCOPE_LEAD, DAEHAN_BEFORE_FIRST, YUNYEON_SAME_AS_DAEHAN } from '../../lib/jamidusu-content-horoscope';
import { preloadRewardedAdForResult, showRewardedAdForResult } from '../../lib/ads';
import { JamiChartGrid } from './JamiChartGrid';
import { MUTAGEN_COLOR, BRIGHT_GRADES, DARK_GRADES } from './jami-tokens';
import {
  V2Screen,
  V2TopBar,
  V2Label,
  V2Button,
  V2Glass,
  SelfSpiritSlot,
  Rise,
  Chip,
  DomainEmpty,
  SijinSheet,
  SIJIN_HOUR,
  withAlpha,
} from './_kit';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** 별 이름 — 한글+한자 병기 */
function StarName({ star }: { star: MainStar }) {
  return (
    <span style={{ fontWeight: 800, color: 'var(--v2-ink)' }}>
      {star}{' '}
      <span style={{ color: 'var(--v2-ink-dim)', fontWeight: 600, fontSize: '0.9em' }}>
        {STAR_HANJA[star]}
      </span>
    </span>
  );
}

// ─────────────────────────────────────────────
// 결과 화면
// ─────────────────────────────────────────────

const MUTAGEN_BG: Record<string, string> = {
  록: 'rgba(91,217,172,.13)',
  권: 'rgba(255,158,130,.13)',
  과: 'rgba(255,210,122,.13)',
  기: 'rgba(183,156,255,.13)',
};
const MUTAGEN_LINE: Record<string, string> = {
  록: 'rgba(91,217,172,.27)',
  권: 'rgba(255,158,130,.27)',
  과: 'rgba(255,210,122,.27)',
  기: 'rgba(183,156,255,.27)',
};

/** 사화 1줄: `화록 태양 — 관록궁` 뱃지 + 시제 중립 노트. 화기는 emphasize(peach 박스). */
function MutagenHitRow({ hit, lead, emphasize }: { hit: MutagenHit; lead: string; emphasize?: boolean }) {
  return (
    <div
      style={{
        padding: emphasize ? '10px 12px' : '4px 0',
        borderRadius: emphasize ? 10 : 0,
        // 알파 변형은 rgba 리터럴 (CSS var에 알파 접미 불가)
        background: emphasize ? 'rgba(255,158,130,.13)' : 'transparent',
        border: emphasize ? '1px solid rgba(255,158,130,.27)' : 'none',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: MUTAGEN_COLOR[hit.mutagen] ?? 'var(--v2-ink)' }}>
          화{hit.mutagen} {hit.star}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)' }}>— {hit.palaceName}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: 'var(--v2-ink-mid)' }}>
        {lead} {MUTAGEN_PALACE_NOTES[hit.mutagen][hit.palaceName]}
      </p>
    </div>
  );
}

function ResultView({
  chart,
  spirit,
  back,
  gender,
}: {
  chart: JamiChart;
  spirit: Spirit;
  back: () => void;
  gender: 'male' | 'female';
}) {
  const lifePalace = palaceOf(chart, '명궁');
  const { stars: lifeStars, borrowed: lifeBorrowed } = starsWithBorrow(chart, '명궁');

  // 차성 명궁이면 밝기·사화는 대궁(실제 앉은 궁) 기준
  const srcPalace = lifeBorrowed
    ? chart.palaces[(lifePalace.branch + 6) % 12]
    : lifePalace;

  // 방어: 명궁 공궁 + 대궁도 공궁(이론상 불가능)
  const hasAnyStar = lifeStars.length > 0;

  // 지금 나의 운 — 계산 실패 시 섹션만 숨김 (명반은 정상 렌더). 거짓 폴백 금지.
  const horoscope = useMemo(() => {
    try {
      const year = currentLunarYearNow();
      return { daehan: computeDaehan(chart, gender, year), yunyeon: computeYunyeon(chart, year) };
    } catch (e) {
      console.error('[jamidusu] 오버레이 계산 실패:', e instanceof Error ? e.message : e);
      return null;
    }
  }, [chart, gender]);

  const alias = aliasOf(lifeStars);
  // catchline: 별이 있으면 첫 별 기준
  const catchline = hasAnyStar ? STAR_CONTENT[lifeStars[0]].catchline : '';

  // 오행국 뱃지 톤 — 알파 변형은 rgba 리터럴 (CSS var에 알파 접미 불가)
  const bureauTone = (() => {
    const el = chart.bureau.element;
    if (el === '목') return { color: 'var(--v2-mint)', bg: 'rgba(91,217,172,.13)', line: 'rgba(91,217,172,.27)' };
    if (el === '화') return { color: 'var(--v2-peach)', bg: 'rgba(255,158,130,.13)', line: 'rgba(255,158,130,.27)' };
    if (el === '토') return { color: 'var(--v2-butter)', bg: 'rgba(255,210,122,.13)', line: 'rgba(255,210,122,.27)' };
    if (el === '수') return { color: '#74bcd6', bg: 'rgba(116,188,214,.13)', line: 'rgba(116,188,214,.27)' };
    // 금 + 폴백
    return { color: 'var(--v2-lavender)', bg: 'rgba(183,156,255,.13)', line: 'rgba(183,156,255,.27)' };
  })();

  // 생년사화 4줄: MUTAGEN_TABLE[yearStemIndex] → [록성, 권성, 과성, 기성]
  const yearMutagenStars = MUTAGEN_TABLE[chart.yearStemIndex];
  const mutagenLabels: [string, string][] = [
    [`화록 ${yearMutagenStars[0]}`, '록'],
    [`화권 ${yearMutagenStars[1]}`, '권'],
    [`화과 ${yearMutagenStars[2]}`, '과'],
    [`화기 ${yearMutagenStars[3]}`, '기'],
  ];

  // JamiChartGrid center 블록
  const gridCenter = (
    <div
      style={{
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        width: '100%',
      }}
    >
      {alias && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: 'var(--v2-lavender)',
            lineHeight: 1.3,
            textAlign: 'center',
          }}
        >
          {alias}
        </div>
      )}
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: bureauTone.color,
          padding: '1px 5px',
          borderRadius: 999,
          background: bureauTone.bg,
          border: `1px solid ${bureauTone.line}`,
          whiteSpace: 'nowrap',
        }}
      >
        {chart.bureau.label}
      </div>
      <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
        {mutagenLabels.map(([label, key]) => (
          <div
            key={key}
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: MUTAGEN_COLOR[key] ?? 'var(--v2-ink-dim)',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <V2Screen seed={53}>
      <V2TopBar onBack={back} title="자미두수" />

      {/* 1. 히어로: 정령 + 별칭호 + 뱃지 + catchline */}
      <Rise>
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <SelfSpiritSlot spirit={spirit} size={160} tag={false} />
          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: 'var(--v2-ink)',
              marginTop: 12,
              lineHeight: 1.3,
              letterSpacing: '-0.3px',
            }}
          >
            {alias ? `${alias}을 품은` : '별이 고요한'} {spirit.name}
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <Chip color={bureauTone.color}>{chart.bureau.label}</Chip>
            {lifeBorrowed && (
              <Chip color="var(--v2-ink-dim)">차성</Chip>
            )}
          </div>
          {catchline && (
            <div
              style={{
                fontSize: 13.5,
                lineHeight: 1.6,
                color: 'var(--v2-ink-mid)',
                marginTop: 12,
                maxWidth: 300,
                margin: '12px auto 0',
              }}
            >
              {catchline}
            </div>
          )}
        </div>
      </Rise>

      {/* 2. 명궁 카드 */}
      <V2Label>명궁 — 내 삶의 중심별</V2Label>
      <V2Glass style={{ borderLeft: `2px solid ${withAlpha('var(--v2-lavender)', .4)}` }}>
        {lifeBorrowed && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--v2-lavender)',
              marginBottom: 12,
              padding: '8px 12px',
              borderRadius: 'var(--v2-r-md)',
              background: withAlpha('var(--v2-lavender)', .09),
              border: `1px solid ${withAlpha('var(--v2-lavender)', .2)}`,
            }}
          >
            명궁이 비어 맞은편 천이궁의 별을 빌려 봐요
          </div>
        )}

        {!hasAnyStar ? (
          <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--v2-ink-mid)' }}>
            별이 고요한 명궁이에요. 조용히 깊어지는 힘이 있어요.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {lifeStars.map((star, idx) => {
              const br = srcPalace.brightness[star];
              const mu = srcPalace.mutagens[star];
              return (
                <div key={star}>
                  {/* 별 이름 + 밝기 첨자 + 사화 뱃지 */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    {lifeStars.length > 1 && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--v2-ink-dim)' }}>
                        {idx + 1}
                      </span>
                    )}
                    <StarName star={star} />
                    {br && (
                      <span data-brightness style={{ fontSize: 11, color: 'var(--v2-ink-dim)' }}>{br}</span>
                    )}
                    {mu && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: MUTAGEN_COLOR[mu] ?? 'var(--v2-ink)',
                          padding: '1px 5px',
                          borderRadius: 999,
                          background: MUTAGEN_BG[mu] ?? 'transparent',
                          border: `1px solid ${MUTAGEN_LINE[mu] ?? 'var(--v2-glass-line2)'}`,
                        }}
                      >
                        화{mu}
                      </span>
                    )}
                  </div>

                  {/* 명궁 풀이 */}
                  <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)' }}>
                    {STAR_CONTENT[star].life}
                  </div>

                  {/* 밝기 모디파이어 — 묘·왕·득 → bright(mint), 불·함 → dark(peach), 리·평은 생략 */}
                  {br && BRIGHT_GRADES.has(br) && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        color: 'var(--v2-mint)',
                      }}
                    >
                      {BRIGHTNESS_NOTES[star].bright}
                    </div>
                  )}
                  {br && DARK_GRADES.has(br) && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        color: 'var(--v2-peach)',
                      }}
                    >
                      {BRIGHTNESS_NOTES[star].dark}
                    </div>
                  )}

                  {/* 사화 노트 */}
                  {mu && MUTAGEN_NOTES[star as keyof typeof MUTAGEN_NOTES]?.[mu] && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12.5,
                        lineHeight: 1.6,
                        color: MUTAGEN_COLOR[mu] ?? 'var(--v2-ink-dim)',
                      }}
                    >
                      {MUTAGEN_NOTES[star as keyof typeof MUTAGEN_NOTES]![mu]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 보조성 칩 */}
        {lifePalace.minorStars.length > 0 && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--v2-glass-line2)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {lifePalace.minorStars.map((m) => {
              // 육길=mint, 육살=peach, 록존·천마(중성/길)=butter — 알파 변형은 rgba 리터럴 (CSS var에 알파 접미 불가)
              const tone = LUCKY_MINOR.includes(m)
                ? { color: 'var(--v2-mint)', bg: 'rgba(91,217,172,.13)', line: 'rgba(91,217,172,.27)' }
                : UNLUCKY_MINOR.includes(m)
                  ? { color: 'var(--v2-peach)', bg: 'rgba(255,158,130,.13)', line: 'rgba(255,158,130,.27)' }
                  : { color: 'var(--v2-butter)', bg: 'rgba(255,210,122,.13)', line: 'rgba(255,210,122,.27)' };
              return (
                <span
                  key={m}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 999,
                    color: tone.color,
                    background: tone.bg,
                    border: `1px solid ${tone.line}`,
                    whiteSpace: 'nowrap',
                    cursor: 'default',
                  }}
                  title={MINOR_STAR_NOTES[m]}
                >
                  {m}
                </span>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--v2-glass-line2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--v2-ink-dim)' }}>명궁 지지</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--v2-lavender)',
            }}
          >
            {JIJI_HANJA[lifePalace.branch]}
          </span>
        </div>
      </V2Glass>

      {/* 2.5 지금 나의 운 — 대한 + 올해 (Phase 4) */}
      {horoscope && (
        <>
          <V2Label>지금 나의 운</V2Label>
          <p className="v2-body" style={{ color: 'var(--v2-ink-dim)', margin: '0 2px 10px', fontSize: 12.5 }}>{HOROSCOPE_LEAD}</p>

          {/* 대한 카드 */}
          <V2Glass style={{ padding: '18px 18px 14px', marginBottom: 12 }}>
            {horoscope.daehan ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-lavender)' }}>
                    {horoscope.daehan.ageStart}-{horoscope.daehan.ageEnd}세
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{horoscope.daehan.palaceName} 대한</span>
                  <span style={{ fontSize: 11, color: 'var(--v2-ink-dim)' }}>10년의 흐름</span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)' }}>
                  {DAEHAN_PALACE_NOTES[horoscope.daehan.palaceName]}
                </p>
                {horoscope.daehan.hits.map((h) => (
                  <MutagenHitRow key={h.mutagen} hit={h} lead="이 10년은" />
                ))}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--v2-ink-dim)' }}>{DAEHAN_BEFORE_FIRST}</p>
            )}
          </V2Glass>

          {/* 올해 카드 */}
          <V2Glass style={{ padding: '18px 18px 14px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--v2-butter)' }}>
                {horoscope.yunyeon.lunarYear} {horoscope.yunyeon.yearLabel}
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--v2-ink)' }}>올해는 {horoscope.yunyeon.palaceName} 위</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)' }}>
              {YUNYEON_PALACE_NOTES[horoscope.yunyeon.palaceName]}
            </p>
            {/* 대한·유년 천간이 같으면 사화 4행이 문장까지 동일 — 반복 대신 이어짐 한 줄 (P5-A) */}
            {horoscope.daehan && horoscope.daehan.stemIndex === horoscope.yunyeon.stemIndex ? (
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: 'var(--v2-ink-dim)' }}>
                {YUNYEON_SAME_AS_DAEHAN}
              </p>
            ) : (
              // 화기 강조는 올해 카드만: 올해는 지금 행동을 조절할 수 있는 신호라 강조가 유용하지만,
              // 10년 대한에 같은 강조를 두면 긴 기간 내내 불안만 키워 의도적으로 뺐다 (P5-C 의사결정)
              horoscope.yunyeon.hits.map((h) => (
                <MutagenHitRow key={h.mutagen} hit={h} lead="올해는" emphasize={h.mutagen === '기'} />
              ))
            )}
          </V2Glass>
        </>
      )}

      {/* 3. 풀 12궁 명반 그리드 */}
      <V2Label>전체 명반</V2Label>
      <JamiChartGrid chart={chart} center={gridCenter} />

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

// ─────────────────────────────────────────────
// 메인 화면
// ─────────────────────────────────────────────

export default function ScreenJamidusu({
  go,
  back,
  spirit,
}: {
  go: (r: Route) => void;
  back: () => void;
  switchTab: (t: Tab) => void;
  spirit: Spirit;
  tab: Tab;
}) {
  const { profile, selfProfile, activeId, updateProfile } = useSaju();
  const base = profile ?? selfProfile;

  const [revealed, setRevealed] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adMsg, setAdMsg] = useState<string | null>(null);
  const failRef = useRef(0);
  const [sijinSheetOpen, setSijinSheetOpen] = useState(false);
  const [selectedSijin, setSelectedSijin] = useState('未');

  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const canBypass =
    import.meta.env.DEV &&
    import.meta.env.VITE_AD_DEV_BYPASS !== 'false' &&
    isLocalhost;

  // 명반 계산 — 생시(hour) 없으면 null (렌더마다 재계산 방지)
  // 프로필 데이터가 손상된 극단 케이스도 크래시 대신 잠금 화면으로 (라이브 앱 방어)
  const chart = useMemo(() => {
    if (!base) return null;
    try {
      return chartFromSajuInput(base);
    } catch {
      return null;
    }
  }, [base]);

  // 광고 미리 준비 — 생시가 있어 결과를 보여줄 수 있을 때만 (잠금 분기에선 광고 로직 자체가 안 돎)
  useEffect(() => {
    if (chart && !canBypass) void preloadRewardedAdForResult();
  }, [chart, canBypass]);

  // ── 1) 프로필 자체가 없음 — 기존 도메인 공통 빈 화면 (궁합과 동일 관행) ──
  if (!base) {
    return <DomainEmpty title="자미두수" back={back} />;
  }

  // ── 2) 생시 없음 (프로필은 있지만 hour 미입력) ──
  if (chart === null) {
    return (
      <V2Screen seed={53}>
        <V2TopBar onBack={back} title="자미두수" />
        <div style={{ textAlign: 'center', marginTop: 80, padding: '0 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>🔒</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--v2-ink)',
              marginBottom: 10,
              lineHeight: 1.4,
            }}
          >
            자미두수는 태어난 시간이 필요해요
          </div>
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: 'var(--v2-ink-mid)',
              marginBottom: 32,
            }}
          >
            정확하지 않은 계산은 보여드리지 않아요.
          </div>
          {activeId ? (
            <V2Button onClick={() => setSijinSheetOpen(true)}>태어난 시간 입력하기</V2Button>
          ) : (
            <V2Button onClick={() => go('profiles')}>생시 입력하러 가기</V2Button>
          )}
        </div>
        {sijinSheetOpen && (
          <SijinSheet
            selected={selectedSijin}
            onClose={() => setSijinSheetOpen(false)}
            onPick={(k) => {
              setSelectedSijin(k);
              if (activeId) updateProfile(activeId, { hour: SIJIN_HOUR[k] });
            }}
          />
        )}
      </V2Screen>
    );
  }

  // ── 3) 결과 공개 ──
  if (revealed) {
    return <ResultView chart={chart} spirit={spirit} back={back} gender={base.gender} />;
  }

  // ── 4) 티저 (광고 게이트) ──
  const submit = async () => {
    if (adLoading) return;
    if (canBypass) { setRevealed(true); return; }
    setAdLoading(true);
    setAdMsg(null);
    let res = await showRewardedAdForResult();
    if (res === 'failed') {
      setAdMsg('광고 준비 중… 잠시만요');
      res = await showRewardedAdForResult();
    }
    setAdLoading(false);
    if (
      res === 'rewarded' ||
      res === 'watched' ||
      res === 'unsupported' ||
      res === 'not_configured'
    ) {
      setRevealed(true);
      return;
    }
    if (res === 'dismissed') {
      setAdMsg('광고를 끝까지 보면 내 별이 열려요.');
      return;
    }
    // failed 반복 폴백
    failRef.current += 1;
    if (failRef.current >= 2) {
      setAdMsg('광고가 원활하지 않아 이번엔 바로 열어드릴게요.');
      setRevealed(true);
      return;
    }
    setAdMsg('광고를 불러오지 못했어요. 다시 시도해주세요.');
  };

  // 명궁 주성 미리보기 (티저)
  const { stars: lifeStars } = starsWithBorrow(chart, '명궁');
  const teaserAlias = aliasOf(lifeStars);

  return (
    <V2Screen seed={53}>
      <V2TopBar onBack={back} title="자미두수" />

      <Rise>
        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <SelfSpiritSlot spirit={spirit} size={180} tag={false} />
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--v2-ink)',
              marginTop: 16,
              lineHeight: 1.4,
            }}
          >
            내 명궁에 어떤 별이 떠 있을까?
          </div>
          <div
            style={{
              fontSize: 13.5,
              lineHeight: 1.6,
              color: 'var(--v2-ink-mid)',
              marginTop: 10,
              maxWidth: 300,
              margin: '10px auto 0',
            }}
          >
            {teaserAlias
              ? `${teaserAlias}이 기다리고 있어요`
              : '명궁·부처·재백·관록궁 풀이를 볼 수 있어요'}
          </div>
          <div
            style={{
              marginTop: 14,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Chip color="var(--v2-lavender)">{chart.bureau.label}</Chip>
          </div>
        </div>
      </Rise>

      <div style={{ marginTop: 36 }}>
        {adMsg && (
          <V2Glass style={{ marginBottom: 12, textAlign: 'center' }}>
            <span
              style={{
                color: canBypass ? 'var(--v2-mint)' : 'var(--v2-peach)',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {adMsg}
            </span>
          </V2Glass>
        )}
        <V2Button
          onClick={submit}
          style={adLoading ? { opacity: 0.6, pointerEvents: 'none' } : {}}
        >
          {adLoading ? '광고 여는 중…' : '광고 보고 내 별 보기 ✦'}
        </V2Button>
        <div
          style={{
            textAlign: 'center',
            fontSize: 11.5,
            color: 'var(--v2-ink-dim)',
            marginTop: 8,
          }}
        >
          {canBypass
            ? '로컬 개발모드: 광고 없이 바로 결과'
            : '짧은 광고 후 내 자미두수 명반이 열려요'}
        </div>
      </div>

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

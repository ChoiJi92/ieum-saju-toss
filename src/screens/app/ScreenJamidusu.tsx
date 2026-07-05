import { useEffect, useMemo, useRef, useState } from 'react';
import { useSaju } from '../../lib/saju-state';
import {
  chartFromSajuInput,
  palaceOf,
  starsWithBorrow,
  STAR_HANJA,
  JIJI_HANJA,
  type JamiChart,
  type PalaceName,
  type MainStar,
} from '../../lib/jamidusu';
import { STAR_CONTENT, aliasOf } from '../../lib/jamidusu-content';
import { preloadRewardedAdForResult, showRewardedAdForResult } from '../../lib/ads';
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
// 부분 컴포넌트: 아코디언 (궁 풀이)
// ─────────────────────────────────────────────

function PalaceAccordion({
  chart,
  palaceName,
  field,
  icon,
}: {
  chart: JamiChart;
  palaceName: PalaceName;
  field: 'spouse' | 'wealth' | 'career';
  icon: string;
}) {
  const [open, setOpen] = useState(false);
  const { stars, borrowed } = starsWithBorrow(chart, palaceName);

  const fieldLabel: Record<typeof field, string> = {
    spouse: '부처궁 — 인연',
    wealth: '재백궁 — 재물',
    career: '관록궁 — 직업',
  };

  // 방어: 쌍성이면 첫 별 내용 사용; stars 없으면 안내 문구
  const content =
    stars.length === 0
      ? '별이 고요한 궁이에요.'
      : STAR_CONTENT[stars[0]][field];

  return (
    <div
      style={{
        borderRadius: 'var(--v2-r-md)',
        background: 'var(--v2-glass)',
        border: `1px solid ${open ? 'var(--v2-glass-line)' : 'var(--v2-glass-line2)'}`,
        overflow: 'hidden',
        transition: 'border-color .2s',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="v2-press"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--v2-font)',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 19, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--v2-ink)' }}>
            {fieldLabel[field]}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', marginTop: 2 }}>
            {stars.length > 0
              ? stars.join(' · ')
              : '공궁'}
          </div>
        </div>
        <span
          style={{
            color: 'var(--v2-ink-mute)',
            fontSize: 12,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .22s cubic-bezier(.4,0,.2,1)',
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: '2px 16px 16px',
            fontSize: 13.5,
            lineHeight: 1.65,
            color: 'var(--v2-ink-mid)',
            borderTop: '1px solid var(--v2-glass-line2)',
          }}
        >
          {borrowed && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--v2-lavender)',
                marginBottom: 8,
                marginTop: 8,
                fontWeight: 700,
              }}
            >
              {palaceName}이 비어 맞은편 별을 빌려 봐요
            </div>
          )}
          {content}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 부분 컴포넌트: 미니 명반 2×2 그리드 카드
// ─────────────────────────────────────────────

function MiniPalaceCard({
  chart,
  palaceName,
  accentColor,
}: {
  chart: JamiChart;
  palaceName: PalaceName;
  accentColor: string;
}) {
  const palace = palaceOf(chart, palaceName);
  const { stars, borrowed } = starsWithBorrow(chart, palaceName);

  return (
    <div
      style={{
        padding: '14px 14px 12px',
        borderRadius: 'var(--v2-r-md)',
        background: 'var(--v2-glass)',
        border: `1px solid ${accentColor}33`,
        boxShadow: `0 0 12px ${accentColor}18`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: accentColor, letterSpacing: '0.5px' }}>
          {palaceName}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--v2-ink-dim)',
          }}
        >
          {JIJI_HANJA[palace.branch]}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {stars.length > 0 ? (
          stars.map((s) => (
            <span
              key={s}
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 7px',
                borderRadius: 999,
                background: `${accentColor}22`,
                color: accentColor,
                border: `1px solid ${accentColor}44`,
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </span>
          ))
        ) : (
          <span style={{ fontSize: 11, color: 'var(--v2-ink-mute)' }}>공궁</span>
        )}
        {borrowed && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--v2-ink-dim)',
              padding: '3px 6px',
              borderRadius: 999,
              background: 'rgba(255,255,255,.06)',
              border: '1px solid var(--v2-glass-line2)',
              whiteSpace: 'nowrap',
            }}
          >
            차성
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 결과 화면
// ─────────────────────────────────────────────

function ResultView({
  chart,
  spirit,
  back,
}: {
  chart: JamiChart;
  spirit: Spirit;
  back: () => void;
}) {
  const lifePalace = palaceOf(chart, '명궁');
  const { stars: lifeStars, borrowed: lifeBorrowed } = starsWithBorrow(chart, '명궁');

  // 방어: 명궁 공궁 + 대궁도 공궁(이론상 불가능)
  const hasAnyStar = lifeStars.length > 0;

  const alias = aliasOf(lifeStars);
  // catchline: 별이 있으면 첫 별 기준
  const catchline = hasAnyStar ? STAR_CONTENT[lifeStars[0]].catchline : '';

  const bureauColor = (() => {
    const el = chart.bureau.element;
    if (el === '목') return 'var(--v2-mint)';
    if (el === '화') return 'var(--v2-peach)';
    if (el === '토') return 'var(--v2-butter)';
    if (el === '금') return 'var(--v2-lavender)';
    if (el === '수') return '#74bcd6';
    return 'var(--v2-lavender)';
  })();

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
            <Chip color={bureauColor}>{chart.bureau.label}</Chip>
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
      <V2Glass style={{ borderLeft: '2px solid var(--v2-lavender)66' }}>
        {lifeBorrowed && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--v2-lavender)',
              marginBottom: 12,
              padding: '8px 12px',
              borderRadius: 'var(--v2-r-md)',
              background: 'var(--v2-lavender)18',
              border: '1px solid var(--v2-lavender)33',
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
            {lifeStars.map((star, idx) => (
              <div key={star}>
                {lifeStars.length > 1 && (
                  <div style={{ marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: 'var(--v2-ink-dim)',
                        marginRight: 6,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <StarName star={star} />
                  </div>
                )}
                {lifeStars.length === 1 && (
                  <div style={{ marginBottom: 10 }}>
                    <StarName star={star} />
                  </div>
                )}
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--v2-ink-mid)' }}>
                  {STAR_CONTENT[star].life}
                </div>
              </div>
            ))}
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

      {/* 3. 미니 명반 2×2 그리드 */}
      <V2Label>핵심 4궁</V2Label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <MiniPalaceCard chart={chart} palaceName="명궁" accentColor="var(--v2-lavender)" />
        <MiniPalaceCard chart={chart} palaceName="부처궁" accentColor="var(--v2-rose)" />
        <MiniPalaceCard chart={chart} palaceName="재백궁" accentColor="var(--v2-butter)" />
        <MiniPalaceCard chart={chart} palaceName="관록궁" accentColor="var(--v2-mint)" />
      </div>

      {/* 4. 궁별 풀이 아코디언 */}
      <V2Label>궁별 풀이</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PalaceAccordion chart={chart} palaceName="부처궁" field="spouse" icon="💑" />
        <PalaceAccordion chart={chart} palaceName="재백궁" field="wealth" icon="💰" />
        <PalaceAccordion chart={chart} palaceName="관록궁" field="career" icon="🏢" />
      </div>

      {/* 5. 하단 안내 */}
      <div
        style={{
          marginTop: 32,
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--v2-ink-mute)',
          lineHeight: 1.5,
        }}
      >
        전체 12궁 명반은 준비 중이에요
      </div>

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
  const { profile, selfProfile } = useSaju();
  const base = profile ?? selfProfile;

  const [revealed, setRevealed] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adMsg, setAdMsg] = useState<string | null>(null);
  const failRef = useRef(0);

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
          <V2Button onClick={() => go('profiles')}>생시 입력하러 가기</V2Button>
        </div>
      </V2Screen>
    );
  }

  // ── 3) 결과 공개 ──
  if (revealed) {
    return <ResultView chart={chart} spirit={spirit} back={back} />;
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

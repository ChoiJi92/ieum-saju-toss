import { useEffect, useState } from 'react';
import { V2Screen, V2TopBar, V2Label, V2Glass, Chip, DomainEmpty, SectionCard, V2Button } from './_kit';
import { prepareThaiCard, shareThaiCard, type PreparedThaiCard } from '../../lib/thai-card';
import { useSaju } from '../../lib/saju-state';
import { useSpiritState } from '../../lib/spirit-state';
import { thaiBirthDay, thaiLuckComment, thaiCharacterImg, THAI_DAYS, type ThaiDayKey } from '../../lib/thai-astrology';
import { buildThaiToday, buildThaiMatchRows, THAI_DEEP, THAI_LUCKY, THAI_WORK, THAI_WORST } from '../../lib/thai-astrology-content';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';
import type { SajuInput, Myeongsik } from '../../lib/saju';

/**
 * 태국 점성술 — "세계의 운세" 1탄.
 * 태어난 요일 → 수호신·수호색·성격. 수요일 밤 출생자는 라후(희소 등급).
 */

/** 수호 캐릭터 오브 — 캐릭터 이미지 + 수호색 후광 */
function CharacterOrb({ dayKey, hex }: { dayKey: ThaiDayKey; hex: string }) {
  return (
    <div
      style={{
        width: 92,
        height: 92,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `radial-gradient(circle, ${hex}33 0%, ${hex}14 60%, transparent 80%)`,
        boxShadow: `0 0 24px ${hex}44`,
      }}
    >
      <img src={thaiCharacterImg(dayKey)} alt="" style={{ width: 86, height: 86, objectFit: 'contain' }} />
    </div>
  );
}

/** 8일 도감 — 캐릭터 썸네일 + 탭하면 미니 프로필 */
function DayDex({ mine }: { mine: ThaiDayKey }) {
  const [open, setOpen] = useState(false);
  const [openKey, setOpenKey] = useState<ThaiDayKey | null>(null);
  const entries = Object.entries(THAI_DAYS) as [ThaiDayKey, (typeof THAI_DAYS)[ThaiDayKey]][];
  return (
    <V2Glass>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'var(--v2-font)',
        }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--v2-ink)', flex: 1, textAlign: 'left' }}>
          🗓️ 여덟 수호신 한눈에 보기
        </span>
        <span
          style={{
            color: 'var(--v2-ink-mute)',
            fontSize: 11,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s',
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
          {entries.map(([key, d]) => {
            const toneRow = d.accent ?? d.color.hex;
            const expanded = openKey === key;
            return (
              <button
                key={key}
                onClick={() => setOpenKey(expanded ? null : key)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: key === mine ? `${toneRow}1c` : 'rgba(255,255,255,.03)',
                  border: key === mine ? `1px solid ${toneRow}66` : '1px solid transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--v2-font)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={thaiCharacterImg(key)} alt="" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
                  <div style={{ minWidth: 92 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{d.animal}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--v2-ink-mute)', marginTop: 1 }}>{d.weekdayKr}</div>
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', flex: 1 }}>
                    {d.deity.plain} · {d.keywords.join('·')}
                  </span>
                  {key === mine && <Chip color={toneRow}>나 ✦</Chip>}
                  <span
                    style={{
                      color: 'var(--v2-ink-mute)',
                      fontSize: 10,
                      transform: expanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform .2s',
                      flexShrink: 0,
                    }}
                  >
                    ▾
                  </span>
                </div>
                {expanded && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid var(--v2-glass-line2)',
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: 'var(--v2-ink-mid)',
                    }}
                  >
                    {d.personality}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      <Chip color={toneRow}>행운색 {d.color.name}</Chip>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </V2Glass>
  );
}

export default function ScreenThai({ back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { profile, myeongsik } = useSaju();
  if (!profile || !myeongsik) return <DomainEmpty title="태국 점성술" back={back} />;
  return <ThaiBody profile={profile} myeongsik={myeongsik} back={back} spirit={spirit} />;
}

/** 본문 — 훅 사용을 위해 profile 확보 후 분리 (조기 return 아래 훅 금지) */
function ThaiBody({ profile, myeongsik, back, spirit }: { profile: SajuInput; myeongsik: Myeongsik; back: () => void; spirit: Spirit }) {
  const day = thaiBirthDay(profile);
  const tone = day.accent ?? day.color.hex;
  const luck = thaiLuckComment(day, myeongsik.shinkang.yongshin.ohaeng);
  const isRahu = day.key === 'wedNight';
  const today = buildThaiToday(day.key, new Date(), `${profile.name}${profile.year}${profile.month}${profile.day}`);
  const deep = THAI_DEEP[day.key];
  const lucky = THAI_LUCKY[day.key];
  const matchRows = buildThaiMatchRows(day.key);
  const work = THAI_WORK[day.key];
  const worst = THAI_WORST[day.key];
  const worstDay = THAI_DAYS[worst.day];

  // 공유 카드 — 화면 열릴 때 미리 생성 (클릭 활성 상태 보존, fortune 카드와 동일 패턴)
  const { progressOf } = useSpiritState();
  const stage = progressOf(spirit.key).stage;
  const [preparedCard, setPreparedCard] = useState<PreparedThaiCard | null>(null);
  useEffect(() => {
    let alive = true;
    void prepareThaiCard(day, profile.name, spirit, stage).then((c) => { if (alive) setPreparedCard(c); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.key, profile.name, spirit.key, stage]);

  return (
    <V2Screen seed={41}>
      <V2TopBar onBack={back} title="태국 점성술" />

      {/* 헤더 — 내 요일 + 수호신 */}
      <V2Glass style={{ marginTop: 6, border: `1px solid ${tone}55` }} glow={tone}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CharacterOrb dayKey={day.key} hex={day.color.hex} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tone, letterSpacing: '1.2px', marginBottom: 5 }}>
              🇹🇭 세계의 운세 · 태국편
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--v2-ink)', lineHeight: 1.35 }}>
              {profile.name}님의 수호신은 <span style={{ color: tone }}>{day.animal}</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--v2-ink-dim)', marginTop: 4, lineHeight: 1.5 }}>
              {day.weekdayKr}에 태어난 사람 · {day.deity.plain} {day.deity.name} — {day.deity.desc}
            </div>
          </div>
        </div>
        {isRahu && (
          <div
            style={{
              marginTop: 12,
              padding: '9px 12px',
              borderRadius: 10,
              background: `${tone}22`,
              border: `1px solid ${tone}55`,
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--v2-ink)',
              lineHeight: 1.55,
            }}
          >
            ✦ 라후의 사람은 여덟 중 가장 드물어요 — 태국에서도 특별하게 여기는 밤의 수호자예요.
          </div>
        )}
      </V2Glass>

      {/* 공유 — 내 요일 카드 */}
      <V2Button
        kind="glass"
        onClick={() => { void shareThaiCard(day, profile.name, spirit, stage, preparedCard); }}
        style={{ marginTop: 10, opacity: preparedCard ? 1 : 0.55 }}
      >
        내 요일 카드 공유하기 ✦
      </V2Button>

      {/* 오늘의 요일운 — 매일 바뀌는 섹션 */}
      <V2Label>오늘의 요일운</V2Label>
      <V2Glass style={{ border: `1px solid ${today.grade.color}44` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-ink)' }}>
            오늘은 {today.todayLabel} — {today.rulerLabel}의 날
          </span>
          <Chip color={today.grade.color}>{today.grade.label}</Chip>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--v2-ink-mid)', marginTop: 10 }}>
          {today.line}
        </div>
        <div
          style={{
            marginTop: 10,
            padding: '9px 12px',
            borderRadius: 10,
            background: `${today.grade.color}14`,
            border: `1px solid ${today.grade.color}33`,
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--v2-ink-mid)',
          }}
        >
          💡 {today.tip}
        </div>
      </V2Glass>

      {/* 성격 풀이 */}
      <V2Label>타고난 결</V2Label>
      <SectionCard title="요일이 알려주는 성격" body={day.personality} color={tone} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {day.keywords.map((k) => (
          <Chip key={k} color={tone}>{k}</Chip>
        ))}
      </div>
      <div style={{ height: 10 }} />
      <SectionCard title="겉모습과 속마음" body={`${deep.look}\n\n${deep.inside}`} color={tone} />
      <div style={{ height: 10 }} />
      <SectionCard title="강점과 조심할 점" body={`${deep.strength}\n\n${deep.care}`} color={tone} />

      {/* 요일 궁합 — 나와 잘 맞는 사람 / 제일 조심할 조합 */}
      <V2Label>나와 잘 맞는 사람은?</V2Label>
      <V2Glass>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {matchRows.map((r) => (
            <div
              key={r.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 13px',
                borderRadius: 12,
                background: 'rgba(255,255,255,.04)',
                border: `1px solid ${r.hex}33`,
              }}
            >
              <img src={thaiCharacterImg(r.key)} alt="" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }} />
              <div style={{ minWidth: 88 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: r.hex }}>{r.animal}</div>
                <div style={{ fontSize: 10.5, color: 'var(--v2-ink-mute)', marginTop: 1 }}>{r.weekdayKr}의 사람</div>
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--v2-ink-mid)', flex: 1 }}>{r.gives}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 12,
            padding: '11px 13px',
            borderRadius: 12,
            background: '#E8A15D14',
            border: '1px solid #E8A15D44',
          }}
        >
          <div style={{ fontSize: 12.5, fontWeight: 800, color: '#E8A15D' }}>
            ⚠️ 제일 조심할 조합 — {worstDay.animal} ({worstDay.weekdayKr}의 사람)
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--v2-ink-mid)', marginTop: 5 }}>
            {worst.reason}
          </div>
        </div>
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--v2-glass-line2)',
            fontSize: 12,
            lineHeight: 1.6,
            color: 'var(--v2-ink-dim)',
          }}
        >
          수호 행성끼리의 사이를 본 거예요. 조심할 조합이라고 나쁜 인연이라는 뜻은 아니고, 서로
          속도가 달라서 맞춰가는 재미가 있는 사이예요.
        </div>
      </V2Glass>

      {/* 행운색 — 사주 용신과 교차 */}
      <V2Label>수호색</V2Label>
      <V2Glass>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              flexShrink: 0,
              background: day.color.hex,
              boxShadow: `0 0 10px ${day.color.hex}77`,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-ink)' }}>
              행운색 {day.color.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', marginTop: 2 }}>
              피하면 좋은 색 — {day.avoidColor}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <Chip color={tone}>행운 숫자 {lucky.number}</Chip>
          <Chip color={tone}>행운 방위 {lucky.direction}</Chip>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: tone, marginTop: 14 }}>잘 맞는 일</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {work.map((w) => (
            <Chip key={w} color={tone}>{w}</Chip>
          ))}
        </div>
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--v2-glass-line2)',
            fontSize: 13,
            lineHeight: 1.65,
            color: 'var(--v2-ink-mid)',
          }}
        >
          {luck}
        </div>
      </V2Glass>

      {/* 수호 불상 — 텍스트 소개만 */}
      <V2Label>나의 수호 부처님</V2Label>
      <V2Glass>
        <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--v2-ink-mid)' }}>
          🙏 {day.buddha}. 태국 사람들은 자기 요일의 부처님을 찾아 행운을 빌어요.
        </div>
      </V2Glass>

      {/* 8일 도감 */}
      <V2Label>더 보기</V2Label>
      <DayDex mine={day.key} />

      {/* 시간 모름 안내 — 새벽·밤 규칙 미적용 */}
      {!day.usedDawnRule && (
        <div
          style={{
            marginTop: 10,
            fontSize: 11.5,
            color: 'var(--v2-ink-mute)',
            lineHeight: 1.55,
            padding: '0 4px',
          }}
        >
          ℹ️ 태국 점성술은 새벽 6시에 날이 바뀌고, 수요일 밤 출생은 라후로 봐요. 태어난 시간을
          등록하면 이 규칙까지 반영해 드려요.
        </div>
      )}

      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

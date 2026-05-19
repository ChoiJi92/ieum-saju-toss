import { useState } from 'react';
import {
  IECard,
  IECopy,
  IETopBar,
  MyeongsikGrid,
  OHAENG,
  OhaengBar,
  Reveal,
} from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { RewardedAdGate } from '../components/RewardedAdGate';
import { TG_KR, DZ_KR, OHAENG_KR, sijinLabel } from '../lib/saju';
import { getDaewoon, getSeun, type DaewoonItem, type SeunItem } from '../lib/daewoon';
import { getSinsal, type SinsalItem } from '../lib/sinsal';
import { getIljuPulie } from '../lib/ilju-pulie';

export default function ScreenSaju({ copy }: { copy: IECopy }) {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);

  if (!adDone) return (
    <RewardedAdGate
      title="내 사주 명식 보기"
      description="사주 명식 상세 풀이를 보려면 리워드 광고를 시청해주세요."
      onCancel={back}
      onUnlocked={() => setAdDone(true)}
    />
  );
  // App.tsx 글로벌 가드(NoProfileGuard)에서 profile 미입력 시 redirect 됨.
  // 여기 도달하면 profile/myeongsik 보장됨.
  if (!profile || !myeongsik) return null;

  const ilgan = myeongsik.ilgan;
  const ilganOhaeng = OHAENG[ilgan.ohaeng];
  const ilganKr = TG_KR[ilgan.c] ?? '';
  const ilganOhaengKr = OHAENG_KR[ilgan.ohaeng];

  // 입력 표시: YYYY.MM.DD + 시진(시간 범위) 또는 "시 모름"
  const dateStr = `${profile.year}.${String(profile.month).padStart(2, '0')}.${String(profile.day).padStart(2, '0')}`;
  const timeStr = myeongsik.unknownTime ? '시 모름' : sijinLabel(profile.hour) ?? '';

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title="내 사주 명식" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        <div style={{ padding: '8px 0 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--cp-text-dim)', fontWeight: 700, letterSpacing: 1 }}>
            {profile.name} · {profile.calendar === 'lunar' ? '음력' : '양력'} {dateStr}
            {timeStr && ` ${timeStr}`}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, margin: '8px 0 4px' }}>
            {copy.sajuTagline}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--cp-text-dim)', margin: 0 }}>
            일간{' '}
            <strong style={{ color: ilganOhaeng.c }}>
              {ilganKr}
              {ilganOhaengKr}({ilgan.c}
              {ilganOhaeng.cn})
            </strong>
            {' · '}
            {profile.calendar === 'lunar' ? '음력' : '양력'}{' '}
            {TG_KR[myeongsik.pillars[2].top.c]}
            {DZ_KR[myeongsik.pillars[2].bot.c]}({myeongsik.pillars[2].top.c}
            {myeongsik.pillars[2].bot.c})일주
          </p>
        </div>

        <Reveal>
          <MyeongsikGrid data={myeongsik.pillars} />
        </Reveal>

        <Reveal delay={120}>
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>오행 분포</div>
            <OhaengBar counts={myeongsik.ohaeng} />
            <p style={{ fontSize: 12, color: 'var(--cp-text-dim)', margin: '14px 0 0', lineHeight: 1.55 }}>
              {ohaengSummary(myeongsik.ohaeng)}
            </p>
          </IECard>
        </Reveal>

        <Reveal delay={200}>
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
              일간 풀이 · {ilganKr}
              {ilganOhaengKr}({ilgan.c}
              {ilganOhaeng.cn})
            </div>
            <p style={{ fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
              {ilganLong(ilgan.c)}
            </p>
          </IECard>
        </Reveal>

        {/* 60갑자 일주 풀이 — 일간 + 일지 조합별 */}
        {(() => {
          const iljiHanja = myeongsik.pillars[2].bot.c;
          const ilju = getIljuPulie(ilgan.c, iljiHanja);
          if (!ilju) return null;
          return (
            <Reveal delay={240}>
              <IECard style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{ilju.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--cp-text-dim)',
                      fontWeight: 700,
                      letterSpacing: 0.3,
                    }}
                  >
                    {ilju.hanja}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--cp-lavender)',
                    fontWeight: 700,
                    marginBottom: 10,
                    letterSpacing: -0.1,
                  }}
                >
                  {ilju.symbol}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--cp-text-mid)',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {ilju.body}
                </p>
              </IECard>
            </Reveal>
          );
        })()}

        {/* 신강신약 + 용신 카드 */}
        <Reveal delay={260}>
          <IECard style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>일주 강약</div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--cp-text-dim)',
                  fontWeight: 600,
                }}
              >
                일간 기운이 얼마나 단단한지
              </div>
            </div>
            {/* 게이지 */}
            <div
              style={{
                height: 10,
                background: 'var(--cp-bg)',
                borderRadius: 999,
                overflow: 'hidden',
                marginBottom: 8,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: `${myeongsik.shinkang.gauge}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #5B8DEF, #9D7BFF, #FF8B6C)',
                  borderRadius: 999,
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: 'var(--cp-text-dim)',
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              <span>신약</span>
              <span style={{ color: 'var(--cp-text)', fontWeight: 800 }}>
                {myeongsik.shinkang.label}
              </span>
              <span>신강</span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--cp-text-mid)',
                lineHeight: 1.6,
                margin: '0 0 14px',
              }}
            >
              {myeongsik.shinkang.body}
            </p>

            {/* 용신·희신 */}
            <div
              style={{
                padding: 14,
                background: 'var(--cp-bg)',
                borderRadius: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--cp-text-dim)',
                  letterSpacing: 0.4,
                  marginBottom: 6,
                }}
              >
                추천 용신
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: OHAENG[myeongsik.shinkang.yongshin.ohaeng].c,
                  marginBottom: 6,
                }}
              >
                {myeongsik.shinkang.yongshin.kr}({OHAENG[myeongsik.shinkang.yongshin.ohaeng].cn}) ·{' '}
                {myeongsik.shinkang.yongshin.pulie}의 기운
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--cp-text-mid)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {myeongsik.shinkang.yongshinReason}
              </p>
            </div>
          </IECard>
        </Reveal>

        <Reveal delay={300}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            {[
              { lbl: '성격', v: '주도적·정직', c: '#9D7BFF' },
              { lbl: '강점', v: '리더십·성장', c: '#3DC795' },
              { lbl: '주의', v: '독단·번아웃', c: '#FF8B6C' },
              {
                lbl: '띠',
                v: `${zodiacName(myeongsik.pillars[0].bot.c)}(${
                  myeongsik.pillars[0].bot.c
                }·${DZ_KR[myeongsik.pillars[0].bot.c] ?? ''})`,
                c: '#FFC857',
              },
            ].map((x) => (
              <div
                key={x.lbl}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: 'var(--cp-bg-paper)',
                  border: '1px solid var(--cp-border)',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--cp-text-dim)', fontWeight: 800, letterSpacing: 0.5 }}>
                  {x.lbl.toUpperCase()}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: x.c, marginTop: 4 }}>{x.v}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 신살 — 천을귀인·도화·역마·화개 */}
        <Reveal delay={360}>
          <SinsalCard items={getSinsal(myeongsik)} />
        </Reveal>

        {/* 대운 — 10년 단위 인생 흐름 */}
        <Reveal delay={420}>
          <DaewoonCard items={getDaewoon(myeongsik, { year: profile.year, gender: profile.gender })} />
        </Reveal>

        {/* 세운 — 매년 흐름 */}
        <Reveal delay={480}>
          <SeunCard items={getSeun(myeongsik, { year: profile.year })} />
        </Reveal>
      </div>
    </div>
  );
}

function SinsalCard({ items }: { items: SinsalItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <IECard style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>✨</span>
        <div style={{ fontSize: 13, fontWeight: 800 }}>나의 신살 (神煞)</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {items.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              padding: '12px 12px',
              borderRadius: 'var(--cp-radius-md)',
              background: s.has ? s.color + '18' : 'var(--cp-bg)',
              border: `1.5px solid ${s.has ? s.color + '55' : 'var(--cp-border)'}`,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 6,
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
              <span style={{ fontSize: 18 }}>{s.emoji}</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: s.has ? s.color : 'var(--cp-text-dim)',
                  flex: 1,
                }}
              >
                {s.name}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: s.has ? s.color : 'var(--cp-text-mute)',
                  color: '#fff',
                  letterSpacing: 0.3,
                }}
              >
                {s.has ? '있음' : '없음'}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--cp-text-mid)',
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {s.oneLine}
            </div>
          </button>
        ))}
      </div>
      {open !== null && (
        <div
          style={{
            padding: 14,
            borderRadius: 'var(--cp-radius-md)',
            background: 'var(--cp-bg)',
            border: '1px solid var(--cp-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{items[open].emoji}</span>
            <div style={{ fontSize: 13, fontWeight: 800, color: items[open].color }}>
              {items[open].name}
            </div>
          </div>
          {items[open].positions.length > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {items[open].positions.map((p) => (
                <span
                  key={p}
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: items[open].color + '20',
                    color: items[open].color,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          )}
          <p
            style={{
              fontSize: 13,
              color: 'var(--cp-text-mid)',
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {items[open].body}
          </p>
        </div>
      )}
    </IECard>
  );
}

function DaewoonCard({ items }: { items: DaewoonItem[] }) {
  return (
    <IECard style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>대운</div>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', fontWeight: 600 }}>
          10년 단위 인생 흐름
        </div>
      </div>
      <div
        className="ie-scroll"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}
      >
        {items.map((d, i) => (
          <div
            key={i}
            style={{
              flex: '0 0 auto',
              minWidth: 78,
              padding: '10px 8px',
              borderRadius: 12,
              background: d.isCurrent
                ? 'linear-gradient(135deg, rgba(157,123,255,0.15), rgba(255,139,108,0.15))'
                : 'var(--cp-bg)',
              border: d.isCurrent ? '2px solid var(--cp-lavender)' : '1px solid var(--cp-border)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: d.isCurrent ? 'var(--cp-lavender)' : 'var(--cp-text-dim)',
                fontWeight: 800,
                marginBottom: 4,
              }}
            >
              {d.age}~{d.age + 9}세{d.isCurrent ? ' · 지금' : ''}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cp-text)' }}>
              {d.stem}
              {d.branch}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--cp-text-mid)',
                marginTop: 2,
              }}
            >
              {d.label}
            </div>
            {d.sipsung && (
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'var(--cp-text-dim)',
                  marginTop: 4,
                }}
              >
                {d.sipsung}
              </div>
            )}
          </div>
        ))}
      </div>
      <p
        style={{
          fontSize: 12,
          color: 'var(--cp-text-dim)',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        대운은 사주에서 가장 큰 인생 흐름이에요. 10년마다 바뀌고, 보라색이 지금 내 대운.
        대운 천간이 일간과 만나는 십성에 따라 그 시기 운세 색깔이 달라져요.
      </p>
    </IECard>
  );
}

function SeunCard({ items }: { items: SeunItem[] }) {
  return (
    <IECard style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800 }}>세운</div>
        <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', fontWeight: 600 }}>
          매년 흐름 (날씨)
        </div>
      </div>
      <div
        className="ie-scroll"
        style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }}
      >
        {items.map((s, i) => (
          <div
            key={i}
            style={{
              flex: '0 0 auto',
              minWidth: 70,
              padding: '10px 6px',
              borderRadius: 12,
              background: s.isCurrent
                ? 'linear-gradient(135deg, rgba(255,200,87,0.2), rgba(255,139,108,0.2))'
                : 'var(--cp-bg)',
              border: s.isCurrent ? '2px solid #FFC857' : '1px solid var(--cp-border)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: s.isCurrent ? '#FF8B6C' : 'var(--cp-text-dim)',
                fontWeight: 800,
                marginBottom: 4,
              }}
            >
              {s.year}
              {s.isCurrent ? ' · 올해' : ''}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--cp-text)' }}>
              {s.stem}
              {s.branch}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--cp-text-mid)',
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'var(--cp-text-dim)',
                marginTop: 4,
              }}
            >
              {s.age}세
            </div>
          </div>
        ))}
      </div>
      <p
        style={{
          fontSize: 12,
          color: 'var(--cp-text-dim)',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        대운이 큰 계절이라면, 세운은 그 안의 해마다 날씨예요. 올해는 노란색.
        세운 천간이 일간과 만나면, 그해의 핵심 흐름이 정해져요.
      </p>
    </IECard>
  );
}

/** 일간 풀이 — 10 천간, 4~5줄 풍부하게 (PDF 본업 톤 참고) */
function ilganLong(stem: string): string {
  const m: Record<string, string> = {
    甲: `크게 자라나는 큰 나무의 기운이에요.
곧고 정직한 본성, 리더십과 성장 욕구가 강한 성향.
한 번 결정하면 끝까지 밀고 나가는 힘이 있어요.
단점은 너무 자기 방향만 보다 주변과 부딪힐 수 있다는 거예요.
유연한 사람 곁에 두면 균형이 잡혀요.`,
    乙: `바람에 흔들리지 않는 풀과 꽃의 기운이에요.
유연하고 세심하며, 함께 일하고 관계 맺는 자리에서 빛나는 성향.
힘으로 밀기보다 상황에 맞춰 부드럽게 휘어가요.
단 너무 맞춰주다 본인이 지칠 수 있으니 자기 시간을 꼭 챙겨주세요.
강한 사람 옆에서 조력자로 빛나는 자리도 좋아요.`,
    丙: `한낮의 태양 같은 기운이에요.
밝고 외향적이며, 사람을 따뜻하게 비춰주는 성향.
표현력·열정이 강해서 무대·발표·영업에서 빛나요.
단 감정 기복이 클 수 있고 빨리 식기도 해요.
꾸준함을 챙기는 루틴이 있으면 더 강해져요.`,
    丁: `촛불·별의 빛 같은 기운이에요.
안에서 조용히 빛나는 사람. 깊은 정과 섬세한 감각이 강점.
한 사람에게 깊게 마음 쓰는 성향이라 인연이 오래 가요.
단 감정 소진이 빠르니 정신 케어·휴식은 꼭 챙겨주세요.
내 감각을 믿고 내린 결정이 의외로 잘 맞아요.`,
    戊: `큰 산처럼 묵직한 흙의 기운이에요.
신뢰와 안정, 듬직한 중심을 지닌 성향.
주변이 흔들려도 본인은 흔들리지 않는 단단함이 있어요.
단 너무 무거우면 변화에 둔할 수 있어요.
가끔 산을 내려와 흐르는 사람들과 섞여 보세요.`,
    己: `비옥한 들판의 기운이에요.
포용·실용·꾸준함. 사람을 키우고 모이게 하는 자질이 있어요.
따뜻하게 주변을 챙기는 성향.
단 너무 다 받아주다 본인이 흐트러질 수 있어요.
경계를 명확히 그으면 진짜 베푸는 사람이 돼요.`,
    庚: `강철·도끼의 기운이에요.
결단력과 정직함이 무기. 옳고 그름이 분명한 성향.
한 번 결정하면 단호하게 실행하는 힘이 있어요.
단 너무 직선적이면 사람을 다치게 할 수 있어요.
한 박자 쉬어가는 호흡이 도움이 돼요.`,
    辛: `하얀 보석·잘 닦인 칼 같은 기운이에요.
섬세하고 꼼꼼하며, 자기 기준이 또렷한 성향.
세부를 보는 눈이 좋아 전문성으로 빛나요.
단 자기 검열·완벽 추구로 시작이 늦을 수 있어요.
"완벽보다 완료"를 먼저 챙기면 더 잘 풀려요.`,
    壬: `큰 강·바다의 기운이에요.
흐름을 읽는 지혜와 자유로움, 깊이 있는 사람.
유연하게 흐르며 다양한 사람과 잘 어울려요.
단 너무 흐르다 자기 자리를 놓칠 수 있어요.
방향을 잡아주는 사람과 함께하면 힘이 크게 살아나요.`,
    癸: `이슬비·맑은 샘의 기운이에요.
차분하고 꾸준해요. 조용히 스며드는 영향력이 있어요.
드러내지 않아도 곁에 있으면 마음이 차분해지는 성향.
단 너무 조용하면 존재감이 약해 보일 수 있어요.
가끔 자기 목소리를 내는 자리를 만들어 보세요.`,
  };
  return m[stem] ?? '일간 풀이 준비 중이에요.';
}

/** 지지(띠) 한자 → 동물 이름 */
function zodiacName(branch: string): string {
  const m: Record<string, string> = {
    子: '쥐띠', 丑: '소띠', 寅: '범띠', 卯: '토끼띠',
    辰: '용띠', 巳: '뱀띠', 午: '말띠', 未: '양띠',
    申: '원숭이띠', 酉: '닭띠', 戌: '개띠', 亥: '돼지띠',
  };
  return m[branch] ?? '';
}

/** 오행 분포 요약 한 줄 (가장 많은·없는 오행 짚기) */
function ohaengSummary(counts: { wood: number; fire: number; earth: number; metal: number; water: number }) {
  const NAMES: Record<keyof typeof counts, string> = {
    wood: '목', fire: '화', earth: '토', metal: '금', water: '수',
  };
  const entries = (Object.entries(counts) as Array<[keyof typeof counts, number]>).sort(
    (a, b) => b[1] - a[1]
  );
  const max = entries[0];
  const zero = entries.find((e) => e[1] === 0);
  if (zero) {
    return `${NAMES[max[0]]}가 ${max[1]}개로 가장 많고 ${NAMES[zero[0]]}가 없어. 부족한 기운은 의식적으로 채워주는 게 좋아.`;
  }
  return `${NAMES[max[0]]}가 ${max[1]}개로 가장 많아. 본인 기운을 살리되 균형을 잃지 않게.`;
}

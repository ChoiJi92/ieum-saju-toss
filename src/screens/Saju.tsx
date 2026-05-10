import { useEffect, useState } from 'react';
import {
  IECard,
  IECopy,
  IETopBar,
  MoodOrb,
  MyeongsikGrid,
  OHAENG,
  OhaengBar,
  Reveal,
} from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { showInterstitialThen } from '../lib/ads';

export default function ScreenSaju({ copy }: { copy: IECopy }) {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [adDone, setAdDone] = useState(false);

  useEffect(() => {
    showInterstitialThen(() => setAdDone(true));
  }, []);

  if (!adDone) return <AdLoading />;
  // App.tsx 글로벌 가드(NoProfileGuard)에서 profile 미입력 시 redirect 됨.
  // 여기 도달하면 profile/myeongsik 보장됨.
  if (!profile || !myeongsik) return null;

  const ilgan = myeongsik.ilgan;
  const ilganOhaeng = OHAENG[ilgan.ohaeng];

  // 입력 표시: YYYY.MM.DD HH:00 또는 시 모름
  const dateStr = `${profile.year}.${String(profile.month).padStart(2, '0')}.${String(profile.day).padStart(2, '0')}`;
  const timeStr = myeongsik.unknownTime
    ? '시 모름'
    : profile.hour !== undefined
    ? `${String(profile.hour).padStart(2, '0')}:${String(profile.minute ?? 0).padStart(2, '0')}`
    : '';

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 62, flexShrink: 0 }} />
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
              {ilgan.c}
              {ilganOhaeng.cn}
            </strong>
            {' · '}
            {profile.calendar === 'lunar' ? '음력' : '양력'} {myeongsik.pillars[2].top.c}
            {myeongsik.pillars[2].bot.c}일주
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
              일간 풀이 · {ilgan.c}
              {ilganOhaeng.cn}
            </div>
            <p style={{ fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.6, margin: 0 }}>
              {ilganShort(ilgan.c)}
            </p>
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
                v: `${zodiacName(myeongsik.pillars[0].bot.c)} ${myeongsik.pillars[0].bot.c}`,
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
      </div>
    </div>
  );
}

/** 일간 한 줄 풀이 (10 천간) — 추후 LLM 합성으로 교체 */
function ilganShort(stem: string): string {
  const m: Record<string, string> = {
    甲: '크게 자라나는 큰 나무의 기운. 곧고 정직한 본성, 리더십과 성장 욕구가 강해.',
    乙: '바람에 흔들리지 않는 풀과 꽃의 기운. 유연하고 세심하며, 협업·관계에서 빛나.',
    丙: '한낮의 태양 같은 기운. 밝고 외향적이며, 사람을 따뜻하게 비춰주는 타입이야.',
    丁: '촛불과 별의 빛. 안에서 빛나는 사람. 깊은 정과 섬세한 직관이 강점이야.',
    戊: '큰 산처럼 묵직한 흙의 기운. 신뢰와 안정, 듬직한 중심을 지닌 타입이야.',
    己: '비옥한 들판의 기운. 포용·실용·꾸준함. 사람을 키우고 모이게 하는 자질이 있어.',
    庚: '강철·도끼의 기운. 결단력과 정직함이 무기. 옳고 그름이 분명해.',
    辛: '하얀 보석·잘 닦인 칼의 기운. 섬세하고 완벽주의, 자기 기준이 또렷해.',
    壬: '큰 강·바다의 기운. 흐름을 읽는 지혜와 자유로움, 깊이 있는 사람이야.',
    癸: '이슬비·맑은 샘의 기운. 차분하고 꾸준해. 조용히 스며드는 영향력이 있어.',
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
    wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
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

function AdLoading() {
  return (
    <div
      className="ie-screen"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: 24,
        background: 'var(--cp-bg)',
      }}
    >
      <MoodOrb size={120} />
      <div style={{ fontSize: 14, color: 'var(--cp-text-mid)', fontWeight: 700 }}>
        사주를 풀어내는 중이에요…
      </div>
      <div style={{ fontSize: 11, color: 'var(--cp-text-dim)', textAlign: 'center', marginTop: 4 }}>
        잠시만 기다려주세요
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  IECard,
  IECopy,
  IETopBar,
  MoodOrb,
  MyeongsikGrid,
  OhaengBar,
  Pillar,
  Reveal,
} from '../components/ie';
import { useRouter } from '../lib/router';
import { showInterstitialThen } from '../lib/ads';

const SAJU_DATA: Pillar[] = [
  { label: '年柱', top: { c: '戊', ohaeng: 'earth' }, bot: { c: '寅', ohaeng: 'wood' } },
  { label: '月柱', top: { c: '戊', ohaeng: 'earth' }, bot: { c: '午', ohaeng: 'fire' } },
  { label: '日柱', top: { c: '甲', ohaeng: 'wood' }, bot: { c: '辰', ohaeng: 'earth' }, isSelf: true },
  { label: '時柱', top: { c: '辛', ohaeng: 'metal' }, bot: { c: '未', ohaeng: 'earth' } },
];
const SAJU_COUNTS = { wood: 2, fire: 1, earth: 4, metal: 1, water: 0 };

export default function ScreenSaju({ copy }: { copy: IECopy }) {
  const { back } = useRouter();
  const [adDone, setAdDone] = useState(false);

  useEffect(() => {
    showInterstitialThen(() => setAdDone(true));
  }, []);

  if (!adDone) return <AdLoading />;

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 62, flexShrink: 0 }} />
      <IETopBar onBack={back} title="내 사주 명식" />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
        <div style={{ padding: '8px 0 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--cp-text-dim)', fontWeight: 700, letterSpacing: 1 }}>
            김토스 · 1998.06.14 14:30
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6, margin: '8px 0 4px' }}>
            {copy.sajuTagline}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--cp-text-dim)', margin: 0 }}>
            일간 <strong style={{ color: 'var(--cp-wood)' }}>甲木</strong> · 양력 갑진일주
          </p>
        </div>

        <Reveal>
          <MyeongsikGrid data={SAJU_DATA} />
        </Reveal>

        <Reveal delay={120}>
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>오행 분포</div>
            <OhaengBar counts={SAJU_COUNTS} />
            <p style={{ fontSize: 12, color: 'var(--cp-text-dim)', margin: '14px 0 0', lineHeight: 1.55 }}>
              土가 4개로 가장 많고 水가 0개로 부족해. 물 좀 자주 마시고, 가끔은 진짜 멍 때려 봐.
              너한테 필요한 거임.
            </p>
          </IECard>
        </Reveal>

        <Reveal delay={200}>
          <IECard style={{ marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>일간 풀이 · 甲木</div>
            <p style={{ fontSize: 14, color: 'var(--cp-text-mid)', lineHeight: 1.6, margin: 0 }}>
              크게 자라나는 큰 나무의 기운. 곧고 정직한 본성, 리더십과 성장 욕구가 강해.
              사주에 土가 많아 안정적이지만, 때로 물이 부족해 마음이 메마를 수 있어.
            </p>
          </IECard>
        </Reveal>

        <Reveal delay={300}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            {[
              { lbl: '성격', v: '주도적·정직', c: '#9D7BFF' },
              { lbl: '강점', v: '리더십·성장', c: '#3DC795' },
              { lbl: '주의', v: '독단·번아웃', c: '#FF8B6C' },
              { lbl: '띠', v: '범띠 寅', c: '#FFC857' },
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

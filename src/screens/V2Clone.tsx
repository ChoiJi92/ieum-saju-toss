import { useEffect, useMemo, useRef, useState } from 'react';
import { useSaju } from '../lib/saju-state';
import { useSpiritState } from '../lib/spirit-state';
import { computeMyeongsik, TG_KR, DZ_KR } from '../lib/saju';
import { todayFortune } from '../lib/today';
import {
  ELEMENTS, ELEM_ORDER, ZOD_ORDER,
  makeSpirit, spiritFromMyeongsik,
  type ElementKey, type Spirit, type Stage,
} from '../lib/spirit';
import {
  V2Screen, Rise, V2TopBar, V2Button, V2Glass, V2Label,
  SpiritSlot, Sparkles, RarityStars, BondMeter, StatPill, ScoreRing,
  HeaderPill, ActionCard, CareAction, FilterChip, ActionRow,
  circleButtonStyle, speechStyle,
} from './v2/_kit';
import { type Tab, type Route, type FlowScreen, FORTUNE_MENU, REWARDED_ROUTES, INTERSTITIAL_ROUTES, ROUTE_TITLE } from './v2/nav';
import { personalityCard } from '../lib/personality';
import { AppChrome } from './v2/_kit_tabbar';
import RewardedGate from './v2/RewardedGate';
import InterstitialView from './v2/InterstitialView';
import ScreenMonth from './v2/ScreenMonth';
import ScreenYear from './v2/ScreenYear';
import ScreenLove from './v2/ScreenLove';
import ScreenMoney from './v2/ScreenMoney';
import ScreenCareer from './v2/ScreenCareer';
import ScreenHealth from './v2/ScreenHealth';
import ScreenGunghap from './v2/ScreenGunghap';
import ScreenPersonality from './v2/ScreenPersonality';
import ScreenSinsal from './v2/ScreenSinsal';
import ScreenProfiles from './v2/ScreenProfiles';
import ScreenAddProfile from './v2/ScreenAddProfile';
import ScreenLegal from './v2/ScreenLegal';


export default function V2Clone() {
  const { myeongsik, reset } = useSaju();
  const spirit = useMemo(() => spiritFromMyeongsik(myeongsik), [myeongsik]);

  const [flow, setFlow] = useState<FlowScreen[] | null>(myeongsik ? null : ['onboarding']);
  const [tab, setTab] = useState<Tab>('home');
  const [stacks, setStacks] = useState<Record<Tab, Route[]>>({
    home: ['home'], grow: ['grow'], collection: ['collection'], profile: ['profile'],
  });
  const [adUnlocked, setAdUnlocked] = useState<Set<Route>>(() => new Set());
  const unlock = (r: Route) => setAdUnlocked((s) => new Set(s).add(r));

  const resetApp = () => {
    reset();
    try { localStorage.removeItem('ieum-saju.spirit.v2'); } catch { /* ignore */ }
    setAdUnlocked(new Set());
    setStacks({ home: ['home'], grow: ['grow'], collection: ['collection'], profile: ['profile'] });
    setTab('home');
    setFlow(['onboarding']);
  };

  const goFlow = (s: FlowScreen) => setFlow((f) => (f ? [...f, s] : [s]));
  const enterApp = () => { setFlow(null); setTab('home'); };
  const go = (r: Route) => setStacks((s) => ({ ...s, [tab]: [...s[tab], r] }));
  const switchTab = (t: Tab) => setTab(t);
  const back = () => {
    if (flow) { setFlow((f) => (f && f.length > 1 ? f.slice(0, -1) : f)); return; }
    setStacks((s) => (s[tab].length > 1 ? { ...s, [tab]: s[tab].slice(0, -1) } : s));
  };

  // 1) 온보딩 플로우 (탭 바깥)
  if (flow) {
    const cur = flow[flow.length - 1];
    const fp = { goFlow, back, enterApp, spirit };
    if (cur === 'input') return <ScreenInput {...fp} />;
    if (cur === 'reveal') return <ScreenReveal {...fp} />;
    return <ScreenOnboard {...fp} />;
  }

  // 2) 탭 앱 — 활성 탭 스택 top 라우트를 AppChrome(고정 탭바)로 감싸 렌더
  const route = stacks[tab][stacks[tab].length - 1];
  const sp = { go, back, switchTab, spirit, tab, resetApp };
  let screenEl: React.ReactNode;
  switch (route) {
    case 'today': screenEl = <ScreenToday {...sp} />; break;
    case 'month': screenEl = <ScreenMonth {...sp} />; break;
    case 'year': screenEl = <ScreenYear {...sp} />; break;
    case 'love': screenEl = <ScreenLove {...sp} />; break;
    case 'money': screenEl = <ScreenMoney {...sp} />; break;
    case 'career': screenEl = <ScreenCareer {...sp} />; break;
    case 'health': screenEl = <ScreenHealth {...sp} />; break;
    case 'gunghap': screenEl = <ScreenGunghap {...sp} />; break;
    case 'sinsal': screenEl = <ScreenSinsal {...sp} />; break;
    case 'personality': screenEl = <ScreenPersonality {...sp} />; break;
    case 'grow': screenEl = <ScreenGrow {...sp} />; break;
    case 'collection': screenEl = <ScreenCollection {...sp} />; break;
    case 'profile': screenEl = <ScreenProfile {...sp} />; break;
    case 'profiles': screenEl = <ScreenProfiles {...sp} />; break;
    case 'addProfile': screenEl = <ScreenAddProfile {...sp} />; break;
    case 'terms': screenEl = <ScreenLegal kind="terms" {...sp} />; break;
    case 'privacy': screenEl = <ScreenLegal kind="privacy" {...sp} />; break;
    default: screenEl = <ScreenHome {...sp} />;
  }
  if (REWARDED_ROUTES.includes(route)) {
    screenEl = <RewardedGate title={ROUTE_TITLE[route]} back={back} spirit={spirit} unlocked={adUnlocked.has(route)} onUnlock={() => unlock(route)}>{screenEl}</RewardedGate>;
  } else if (INTERSTITIAL_ROUTES.includes(route)) {
    screenEl = <InterstitialView routeKey={route}>{screenEl}</InterstitialView>;
  }
  return <AppChrome routeKey={route} tab={tab} switchTab={switchTab}>{screenEl}</AppChrome>;
}

function ScreenOnboard({ goFlow }: { goFlow: (s: FlowScreen) => void; back: () => void; enterApp: () => void; spirit: Spirit }) {
  return (
    <V2Screen seed={3}>
      <div style={{ minHeight: 732, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 60 }} />
        <Rise delay={80}><div className="v2-cap" style={{ textAlign: 'center', color: 'var(--v2-lavender)' }}>이음사주 · SPIRIT</div></Rise>
        <div style={{ height: 228, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 206, height: 206 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, rgba(214,198,255,.92), rgba(183,156,255,.4) 46%, transparent 72%)', animation: 'v2-breathe 5s ease-in-out infinite', filter: 'blur(2px)' }} />
            <div style={{ position: 'absolute', inset: '18%', borderRadius: '50%', border: '1.5px dashed rgba(183,156,255,.5)', animation: 'v2-spin-slow 30s linear infinite' }} />
            <div style={{ position: 'absolute', inset: '30%', borderRadius: '50%', border: '1px dashed rgba(255,158,130,.45)', animation: 'v2-spin-slow 22s linear infinite reverse' }} />
            <Sparkles col="#FFD27A" />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: 'var(--v2-serif)', fontSize: 46, color: '#fff', textShadow: '0 0 24px rgba(183,156,255,.9)' }}>命</div>
          </div>
        </div>
        <Rise delay={220}>
          <h1 className="v2-display" style={{ textAlign: 'center', margin: '0 0 14px', color: 'var(--v2-ink)' }}>당신의 사주엔<br /><span style={{ color: 'var(--v2-lavender)' }}>정령</span>이 깃들어 있어요</h1>
          <p className="v2-body" style={{ textAlign: 'center', color: 'var(--v2-ink-dim)', margin: '0 24px 28px' }}>태어난 순간의 오행과 12지를 풀어 오직 당신만의 정령을 깨워드려요. 매일 함께 운을 살피며 키워보세요.</p>
        </Rise>
        <Rise delay={340}>
          <V2Button onClick={() => goFlow('input')}>정령 깨우러 가기 ✦</V2Button>
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5, color: 'var(--v2-ink-mute)' }}>이미 정령이 있어요? <span style={{ color: 'var(--v2-ink-mid)', fontWeight: 700 }}>불러오기</span></div>
        </Rise>
      </div>
    </V2Screen>
  );
}

const SIJIN_LIST_V2: [string, string][] = [
  ['子', '자시 (23:30~01:30)'], ['丑', '축시 (01:30~03:30)'], ['寅', '인시 (03:30~05:30)'],
  ['卯', '묘시 (05:30~07:30)'], ['辰', '진시 (07:30~09:30)'], ['巳', '사시 (09:30~11:30)'],
  ['午', '오시 (11:30~13:30)'], ['未', '미시 (13:30~15:30)'], ['申', '신시 (15:30~17:30)'],
  ['酉', '유시 (17:30~19:30)'], ['戌', '술시 (19:30~21:30)'], ['亥', '해시 (21:30~23:30)'],
];
const SIJIN_HOUR_V2: Record<string, number> = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };

function ScreenInput({ goFlow, back }: { goFlow: (s: FlowScreen) => void; back: () => void; enterApp: () => void; spirit: Spirit }) {
  const { setSelf } = useSaju();
  const [cal, setCal] = useState<'solar' | 'lunar'>('solar');
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [leap, setLeap] = useState(false);
  const [sijin, setSijin] = useState('未');
  const [unknownTime, setUnknownTime] = useState(true);
  const [sijinOpen, setSijinOpen] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  const yNum = parseInt(year, 10), mNum = parseInt(month, 10), dNum = parseInt(day, 10);
  const canNext = name.trim().length > 0 && year.length === 4 && month !== '' && day !== '' && gender !== null;

  const submit = () => {
    if (!canNext || gender === null) return;
    setSelf({
      name: name.trim(), year: yNum, month: mNum, day: dNum,
      calendar: cal, leapMonth: cal === 'lunar' ? leap : false,
      hour: unknownTime ? undefined : SIJIN_HOUR_V2[sijin], minute: 0, gender,
    });
    goFlow('reveal');
  };

  const field: React.CSSProperties = { width: '100%', padding: '13px 16px', borderRadius: 'var(--v2-r-md)', background: 'var(--v2-glass)', border: '1.5px solid var(--v2-glass-line2)', color: 'var(--v2-ink)', fontFamily: 'var(--v2-font)', fontSize: 16, fontWeight: 700, outline: 'none' };

  return (
    <V2Screen seed={5}>
      <V2TopBar onBack={back} />
      <div style={{ display: 'flex', gap: 5, marginTop: 20, marginBottom: 26 }}>{[1, 2, 3].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= 2 ? 'var(--v2-lavender)' : 'rgba(255,255,255,.12)', boxShadow: i <= 2 ? '0 0 10px var(--v2-lavender)' : 'none' }} />)}</div>
      <Rise>
        <div className="v2-cap" style={{ color: 'var(--v2-peach)' }}>STEP 2 / 3 · 사주 정보</div>
        <h2 className="v2-hero" style={{ margin: '10px 0 6px' }}>언제, 이 세상에<br />오셨나요?</h2>
        <p className="v2-body" style={{ color: 'var(--v2-ink-dim)', margin: '0 0 24px' }}>태어난 시각이 정확할수록 정령이 또렷해져요 ✦</p>
      </Rise>
      <Rise delay={120}>
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 999, background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', marginBottom: 16 }}>
          {([['solar', '양력'], ['lunar', '음력']] as const).map(([k, t]) => <button key={k} onClick={() => { setCal(k); if (k === 'solar') setLeap(false); }} style={{ flex: 1, padding: '11px 0', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--v2-font)', fontSize: 13.5, fontWeight: 800, background: cal === k ? 'linear-gradient(120deg,var(--v2-lavender),var(--v2-peach))' : 'transparent', color: cal === k ? '#1b1230' : 'var(--v2-ink-dim)' }}>{t}</button>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" />
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 8 }}>
            <input style={field} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="년(4자리)" />
            <select style={field} value={month} onChange={(e) => setMonth(e.target.value)}><option value="">월</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}월</option>)}</select>
            <select style={field} value={day} onChange={(e) => setDay(e.target.value)}><option value="">일</option>{Array.from({ length: 31 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}일</option>)}</select>
          </div>
          {cal === 'lunar' && <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--v2-ink-dim)' }}><input type="checkbox" checked={leap} onChange={(e) => setLeap(e.target.checked)} />윤달</label>}
          <button onClick={() => setSijinOpen(true)} style={{ ...field, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{unknownTime ? '태어난 시간 — 모름' : SIJIN_LIST_V2.find(([k]) => k === sijin)?.[1]}</span><span style={{ color: 'var(--v2-ink-dim)' }}>▾</span></button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([['male', '남자'], ['female', '여자']] as const).map(([k, t]) => <button key={k} onClick={() => setGender(k)} style={{ ...field, textAlign: 'center', cursor: 'pointer', background: gender === k ? 'linear-gradient(120deg,var(--v2-lavender),var(--v2-peach))' : 'var(--v2-glass)', color: gender === k ? '#1b1230' : 'var(--v2-ink)' }}>{t}</button>)}
          </div>
        </div>
      </Rise>
      <Rise delay={240}><div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '14px 16px', marginTop: 16, borderRadius: 'var(--v2-r-md)', background: 'rgba(183,156,255,.08)', border: '1px solid var(--v2-glass-line)' }}><span style={{ fontSize: 18 }}>🔒</span><span style={{ fontSize: 12, color: 'var(--v2-ink-dim)', lineHeight: 1.5 }}>입력 정보는 정령을 빚는 데만 쓰이고 안전하게 보관돼요.</span></div></Rise>
      <div style={{ marginTop: 24 }}><V2Button onClick={submit} style={{ opacity: canNext ? 1 : 0.4, cursor: canNext ? 'pointer' : 'not-allowed' }}>정령 깨우기 ✦</V2Button></div>

      {sijinOpen && (
        <div onClick={() => setSijinOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(10,7,20,.6)', display: 'flex', alignItems: 'flex-end', zIndex: 60 }}>
          <div onClick={(e) => e.stopPropagation()} className="v2-scroll" style={{ width: '100%', maxHeight: '76%', overflowY: 'auto', background: 'var(--v2-cosmos)', borderRadius: '20px 20px 0 0', padding: '14px 0 28px', border: '1px solid var(--v2-glass-line)' }}>
            <div style={{ width: 36, height: 4, background: 'var(--v2-glass-line)', borderRadius: 2, margin: '0 auto 12px' }} />
            {[['__unknown', '모름 (시간을 몰라요)'] as [string, string], ...SIJIN_LIST_V2].map(([k, lbl]) => {
              const sel = (k === '__unknown' && unknownTime) || (k !== '__unknown' && !unknownTime && sijin === k);
              return <div key={k} onClick={() => { if (k === '__unknown') setUnknownTime(true); else { setUnknownTime(false); setSijin(k); } setSijinOpen(false); }} style={{ padding: '13px 22px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: sel ? 'rgba(183,156,255,.12)' : 'transparent', color: sel ? 'var(--v2-ink)' : 'var(--v2-ink-mid)', fontSize: 15, fontWeight: 700 }}><span style={{ width: 16, color: 'var(--v2-lavender)' }}>{sel ? '✓' : ''}</span>{lbl}</div>;
            })}
          </div>
        </div>
      )}
    </V2Screen>
  );
}

function ScreenReveal({ enterApp, spirit }: { goFlow: (s: FlowScreen) => void; back: () => void; enterApp: () => void; spirit: Spirit }) {
  const { myeongsik } = useSaju();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const seq = [1700, 1600, 1600];
    const timers: number[] = [];
    let acc = 0;
    seq.forEach((ms, i) => { acc += ms; timers.push(window.setTimeout(() => setPhase(i + 1), acc)); });
    return () => timers.forEach(window.clearTimeout);
  }, []);

  const elems = ELEM_ORDER.map((k) => ELEMENTS[k]);
  const glyphs = myeongsik
    ? myeongsik.pillars.flatMap((p) => [
        { c: p.top.c, col: ELEMENTS[p.top.ohaeng].raw },
        { c: p.bot.c, col: ELEMENTS[p.bot.ohaeng].raw },
      ])
    : [
        { c: '丙', col: ELEMENTS.fire.raw }, { c: '子', col: ELEMENTS.water.raw },
        { c: '庚', col: ELEMENTS.metal.raw }, { c: '寅', col: ELEMENTS.wood.raw },
        { c: '乙', col: ELEMENTS.wood.raw }, { c: '卯', col: ELEMENTS.wood.raw },
        { c: '戊', col: ELEMENTS.earth.raw }, { c: '辰', col: ELEMENTS.earth.raw },
      ];
  const core = [
    { size: 64, bg: 'radial-gradient(circle at 40% 36%, #fff, rgba(214,198,255,.5))', glow: 'rgba(183,156,255,.6)' },
    { size: 92, bg: 'radial-gradient(circle at 40% 36%, #fff, var(--v2-lavender))', glow: 'rgba(183,156,255,.9)' },
    { size: 140, bg: `radial-gradient(circle at 38% 34%, #fff, ${spirit.elem.raw} 56%, ${spirit.rarity.raw})`, glow: spirit.elem.raw },
    { size: 140, bg: 'transparent', glow: 'transparent' },
  ][phase];
  const layer = (show: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity .7s ease',
    opacity: show ? 1 : 0,
    pointerEvents: 'none',
  });

  return (
    <V2Screen seed={7} pad={false}>
      <div style={{ minHeight: 780, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', position: 'relative' }}>
        {phase < 3 && (
          <button onClick={() => setPhase(3)} style={{ position: 'absolute', top: 54, right: 18, background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', color: 'var(--v2-ink-dim)', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--v2-font)' }}>건너뛰기</button>
        )}

        <div style={{ position: 'relative', width: 300, height: 300, marginBottom: 24 }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: core.size, height: core.size, borderRadius: '50%', background: core.bg, boxShadow: core.glow === 'transparent' ? 'none' : `0 0 60px ${core.glow}`, transition: 'width .8s cubic-bezier(.3,.8,.3,1), height .8s cubic-bezier(.3,.8,.3,1), box-shadow .8s ease', animation: 'v2-breathe 2.6s ease-in-out infinite', opacity: phase === 3 ? 0 : 1 }} />
          </div>

          <div style={layer(phase === 0)}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 240, height: 240, marginLeft: -120, marginTop: -120, animation: 'v2-spin-slow 22s linear infinite' }}>
              {glyphs.map((g, i) => {
                const a = (i / glyphs.length) * Math.PI * 2 - Math.PI / 2;
                return <div key={`${g.c}-${i}`} style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) translate(${Math.cos(a) * 118}px, ${Math.sin(a) * 118}px)`, fontFamily: 'var(--v2-serif)', fontSize: 28, fontWeight: 700, color: g.col, textShadow: `0 0 16px ${g.col}` }}>{g.c}</div>;
              })}
            </div>
          </div>

          <div style={layer(phase === 1)}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 200, height: 200, marginLeft: -100, marginTop: -100, animation: 'v2-spin-slow 16s linear infinite reverse' }}>
              {elems.map((e, i) => {
                const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
                return <div key={e.key} style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) translate(${Math.cos(a) * 82}px, ${Math.sin(a) * 82}px)`, width: 50, height: 50, borderRadius: '50%', background: `${e.raw}33`, border: `2px solid ${e.raw}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: e.raw, fontSize: 21, fontWeight: 800, boxShadow: `0 0 20px ${e.raw}` }}>{e.cn}</div>;
              })}
            </div>
          </div>

          <div style={layer(phase === 2)}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: 210, height: 210, marginLeft: -105, marginTop: -105, borderRadius: '50%', border: '1.5px dashed var(--v2-glass-line)', animation: 'v2-spin-slow 10s linear infinite' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 52, filter: `drop-shadow(0 0 18px ${spirit.elem.raw})` }}>{spirit.zod.emoji}</div>
          </div>

          <div style={layer(phase === 3)}>
            <div style={{ animation: 'v2-pop-tf .8s cubic-bezier(.2,1.3,.4,1) both' }}>
              <SpiritSlot spirit={spirit} size={250} tag={false} />
            </div>
          </div>
        </div>

        <div style={{ minHeight: 150, maxWidth: 340, position: 'relative' }}>
          {phase === 0 && <RevealCaption cap="여덟 글자를 읽는 중" title="당신의 사주를 펼쳐요" />}
          {phase === 1 && <RevealCaption cap="오행을 응축하는 중" title={<>木·火·土·金·水<br />기운이 모여요</>} color="var(--v2-mint)" />}
          {phase === 2 && <RevealCaption cap="12지를 불어넣는 중" title={<>{spirit.zod.ko}({spirit.zod.cn})의<br />기운이 깃들어요</>} color="var(--v2-peach)" />}
          {phase === 3 && (
            <div style={{ animation: 'v2-rise-tf .6s ease .25s both' }}>
              <div style={{ display: 'inline-flex', marginBottom: 10 }}><RarityStars rarity={spirit.rarity} /></div>
              <h1 className="v2-display" style={{ margin: '0 0 8px' }}>{spirit.name}</h1>
              <div className="v2-cap" style={{ color: spirit.elem.raw, marginBottom: 12 }}>{spirit.formula}</div>
              <p className="v2-body" style={{ color: 'var(--v2-ink-dim)', margin: 0 }}>{spirit.persona}</p>
            </div>
          )}
        </div>

        {phase === 3 && <div style={{ width: '100%', maxWidth: 340, marginTop: 26, animation: 'v2-rise-tf .6s ease .5s both' }}><V2Button onClick={() => enterApp()}>{spirit.name} 만나러 가기 →</V2Button></div>}
      </div>
    </V2Screen>
  );
}

function RevealCaption({ cap, title, color = 'var(--v2-lavender)' }: { cap: string; title: React.ReactNode; color?: string }) {
  return (
    <div key={cap} style={{ animation: 'v2-rise-tf .55s ease both' }}>
      <div className="v2-cap" style={{ color }}>{cap}</div>
      <div className="v2-hero" style={{ marginTop: 10, color: 'var(--v2-ink)' }}>{title}</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 18 }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--v2-ink-mute)', animation: `v2-twinkle 1s ease-in-out ${i * 0.2}s infinite` }} />)}
      </div>
    </div>
  );
}

function ScreenProfile({ go, spirit, resetApp }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab; resetApp: () => void }) {
  const { myeongsik, profile, profiles } = useSaju();
  const [confirmReset, setConfirmReset] = useState(false);
  const LABEL: Record<string, string> = { 연주: '年', 월주: '月', 일주: '日', 시주: '時' };
  const cols = (myeongsik?.pillars ?? []).map((p) => ({
    l: LABEL[p.label] ?? p.label.slice(0, 1),
    top: p.top.c, bot: p.bot.c, topKr: TG_KR[p.top.c] ?? '', botKr: DZ_KR[p.bot.c] ?? '', color: ELEMENTS[p.top.ohaeng].raw, isSelf: p.isSelf,
  }));
  const oh = myeongsik?.ohaeng;
  const ohMax = oh ? Math.max(1, ...ELEM_ORDER.map((k) => oh[k] ?? 0)) : 1;
  const ohStrong = oh ? [...ELEM_ORDER].sort((a, b) => (oh[b] ?? 0) - (oh[a] ?? 0)) : [];
  const shin = myeongsik?.shinkang;
  const shinFriendly = shin ? (shin.type === 'shinkang' ? '기운이 강한 편 (신강)' : shin.type === 'shinyak' ? '기운이 여린 편 (신약)' : '균형 잡힌 편 (중화)') : '';
  const card = myeongsik ? personalityCard(myeongsik) : null;
  const ilganKr = myeongsik ? TG_KR[myeongsik.ilgan.c] ?? '' : '';
  const ilganElem = myeongsik ? ELEMENTS[myeongsik.ilgan.ohaeng] : null;
  const rowBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', borderRadius: 'var(--v2-r-md)', background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', cursor: 'pointer', fontFamily: 'var(--v2-font)', textAlign: 'left', width: '100%' };
  return (
    <V2Screen seed={9}>
      <V2TopBar title="내 정보" />
      <Rise><SpiritSlot spirit={spirit} size={210} stage={1} /></Rise>
      <Rise delay={120}>
        <V2Glass glow="0 0 28px rgba(183,156,255,.2)" style={{ textAlign: 'center' }}>
          <div className="v2-cap" style={{ color: spirit.elem.raw }}>{spirit.formula}</div>
          <h1 className="v2-hero" style={{ margin: '8px 0 4px' }}>{spirit.name}</h1>
          <RarityStars rarity={spirit.rarity} />
          <p className="v2-body" style={{ color: 'var(--v2-ink-dim)', marginTop: 14 }}>{spirit.persona}</p>
        </V2Glass>
      </Rise>
      <V2Label>명식의 결</V2Label>
      <V2Glass>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(cols.length, 1)},1fr)`, gap: 8 }}>
          {cols.map((c, i) => <div key={i} style={{ textAlign: 'center' }}><div style={{ fontSize: 10, color: c.isSelf ? 'var(--v2-lavender)' : 'var(--v2-ink-dim)', fontWeight: 800 }}>{c.l}</div><div className="v2-serif" style={{ padding: '9px 0 5px', borderRadius: '14px 14px 6px 6px', background: `${c.color}22`, color: c.color, fontSize: 23, fontWeight: 800, lineHeight: 1.05 }}>{c.top}<div style={{ fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--v2-font)', color: 'var(--v2-ink-dim)', marginTop: 2 }}>{c.topKr}</div></div><div className="v2-serif" style={{ padding: '9px 0 5px', marginTop: 3, borderRadius: '6px 6px 14px 14px', background: `${c.color}15`, color: c.color, fontSize: 23, fontWeight: 800, lineHeight: 1.05 }}>{c.bot}<div style={{ fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--v2-font)', color: 'var(--v2-ink-dim)', marginTop: 2 }}>{c.botKr}</div></div></div>)}
          {cols.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--v2-ink-dim)', fontSize: 13, padding: 12 }}>사주 정보를 입력하면 명식이 나타나요</div>}
        </div>
      </V2Glass>
      {oh && (
        <>
          <V2Label>오행 분포</V2Label>
          <V2Glass>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {ELEM_ORDER.map((k) => {
                const n = oh[k] ?? 0; const E = ELEMENTS[k];
                return (
                  <div key={k} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 64, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{ width: '64%', height: `${Math.max(8, ((n) / ohMax) * 100)}%`, background: E.raw, borderRadius: 6, boxShadow: `0 0 10px ${E.raw}55` }} />
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: E.raw, marginTop: 6 }}>{E.ko}</div>
                    <div style={{ fontSize: 10, color: 'var(--v2-ink-dim)' }}>{n}</div>
                  </div>
                );
              })}
            </div>
            {ohStrong.length >= 2 && (
              <div style={{ fontSize: 12.5, color: 'var(--v2-ink-mid)', marginTop: 12, lineHeight: 1.5 }}>
                <b style={{ color: ELEMENTS[ohStrong[0]].raw }}>{ELEMENTS[ohStrong[0]].ko}</b> 기운이 가장 강하고, <b style={{ color: ELEMENTS[ohStrong[ohStrong.length - 1]].raw }}>{ELEMENTS[ohStrong[ohStrong.length - 1]].ko}</b> 기운이 약한 편이에요.
              </div>
            )}
          </V2Glass>
        </>
      )}
      {shin && (
        <>
          <V2Label>기운의 균형</V2Label>
          <V2Glass>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--v2-lavender)', whiteSpace: 'nowrap' }}>{shinFriendly}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,.08)' }}><div style={{ width: `${shin.gauge}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--v2-lavender), var(--v2-peach))' }} /></div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--v2-ink-mid)' }}>{shin.body}</div>
            <div style={{ marginTop: 12, padding: '11px 13px', borderRadius: 'var(--v2-r-md)', background: 'rgba(183,156,255,.1)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--v2-lavender)' }}>나에게 도움이 되는 기운 · 용신</div>
              <div style={{ fontSize: 12.5, color: 'var(--v2-ink-mid)', marginTop: 4, lineHeight: 1.5 }}>{shin.yongshin.pulie}({shin.yongshin.kr}) — {shin.yongshinReason}</div>
            </div>
          </V2Glass>
        </>
      )}
      {card && ilganElem && (
        <>
          <V2Label>일간 — 나의 중심</V2Label>
          <V2Glass onClick={() => go('personality')}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{myeongsik?.ilgan.c}({ilganKr}) · {ilganElem.cn}{ilganElem.ko} 일간</div>
            <div style={{ fontSize: 12.5, color: 'var(--v2-ink-mid)', marginTop: 5, lineHeight: 1.55 }}>{card.identity}</div>
            <div style={{ fontSize: 11, color: 'var(--v2-lavender)', marginTop: 9, fontWeight: 700 }}>성격 분석 자세히 ›</div>
          </V2Glass>
        </>
      )}
      <V2Label>사주</V2Label>
      <ActionRow ic="🔮" label="다른 사주 보기" sub={`현재: ${profile?.name ?? '나'} · 총 ${profiles.length}명`} onClick={() => go('profiles')} />
      <V2Label>더 알아보기</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <ActionRow ic="🪞" label="성격 분석" sub="일간으로 보는 나" onClick={() => go('personality')} />
        <ActionRow ic="🔮" label="신살" sub="8가지 특별한 기운" onClick={() => go('sinsal')} />
      </div>
      <V2Label>설정</V2Label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <ActionRow ic="📋" label="서비스 이용약관" sub="" onClick={() => go('terms')} />
        <ActionRow ic="🔒" label="개인정보 처리방침" sub="" onClick={() => go('privacy')} />
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} style={rowBtn}>
            <span style={{ fontSize: 20 }}>🚪</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--v2-rose)' }}>회원 탈퇴 · 정보 초기화</div><div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)' }}>입력한 모든 사주·정령 데이터 삭제</div></div>
            <span style={{ color: 'var(--v2-ink-dim)' }}>›</span>
          </button>
        ) : (
          <V2Glass style={{ border: '1px solid var(--v2-rose)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--v2-ink)', marginBottom: 4 }}>정말 초기화할까요?</div>
            <div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', lineHeight: 1.5, marginBottom: 12 }}>입력한 사주와 정령·도감 데이터가 모두 삭제되고 처음 화면으로 돌아가요.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><V2Button kind="glass" onClick={() => setConfirmReset(false)}>취소</V2Button></div>
              <div style={{ flex: 1 }}><V2Button onClick={resetApp} style={{ background: 'var(--v2-rose)', color: '#1b1230' }}>탈퇴하기</V2Button></div>
            </div>
          </V2Glass>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 11, color: 'var(--v2-ink-mute)' }}>이음사주 v2</div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

function ScreenHome({ go, switchTab, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik, profile } = useSaju();
  const fortune = myeongsik ? todayFortune(myeongsik) : null;
  const { progressOf } = useSpiritState();
  const prog = progressOf(spirit.key);
  const now = new Date();
  const dateLabel = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const name = profile?.name ?? '나';
  return (
    <V2Screen seed={11} style={{ paddingBottom: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 58 }}>
        <div><div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', whiteSpace: 'nowrap' }}>{dateLabel}</div><div style={{ fontSize: 17, fontWeight: 800, color: 'var(--v2-ink)' }}>{name}님의 정령</div></div>
        <div style={{ display: 'flex', gap: 8 }}><HeaderPill>{spirit.rarity.ko}</HeaderPill></div>
      </div>
      <Rise delay={80}><div style={{ position: 'relative', marginTop: 8 }}><SpiritSlot spirit={spirit} size={250} stage={1} /><div style={speechStyle}>{fortune ? fortune.oneLine : '사주를 입력하면 오늘의 기운을 전해드릴게요 ✦'}</div></div></Rise>
      <Rise delay={160}><V2Glass style={{ marginTop: 18 }} onClick={() => switchTab('grow')}><BondMeter value={prog.bond} label={`${spirit.name} 교감`} sub={prog.stage >= 4 ? '최종 진화 완료 ✦' : `${100 - prog.bond} 더 채우면 진화해요`} /></V2Glass></Rise>
      <Rise delay={240}>
        <V2Label>오늘 함께 할 수 있는 것</V2Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ActionCard onClick={() => go('today')} ic="☾" title="오늘의 운세" sub={fortune ? `총운 ${fortune.sections.overall.score}점` : '정령이 전해요'} color="var(--v2-lavender)" badge="NEW" />
          <ActionCard onClick={() => switchTab('collection')} ic="◈" title="정령 도감" sub="모아보기" color="var(--v2-butter)" />
        </div>
      </Rise>
      <Rise delay={300}>
        <V2Label>운세 더보기</V2Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
          {FORTUNE_MENU.map((m) => (
            <button key={m.route} onClick={() => go(m.route)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 6px', borderRadius: 'var(--v2-r-md)', background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', cursor: 'pointer', fontFamily: 'var(--v2-font)' }}>
              {REWARDED_ROUTES.includes(m.route) && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 10 }}>🔒</span>}
              <span style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: `${m.color}1f` }}>{m.ic}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-ink)' }}>{m.label}</span>
              <span style={{ fontSize: 9.5, color: 'var(--v2-ink-dim)' }}>{m.sub}</span>
            </button>
          ))}
        </div>
      </Rise>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

function ScreenToday({ back, switchTab, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const fortune = myeongsik ? todayFortune(myeongsik) : null;
  const now = new Date();
  const dateLabel = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  const ring = fortune?.sections.overall.score ?? 0;
  const dims = fortune
    ? ([
        ['애정', fortune.sections.love.score, 'var(--v2-rose)', '♡'],
        ['금전', fortune.sections.money.score, 'var(--v2-mint)', '₩'],
        ['일·직업', fortune.sections.work.score, 'var(--v2-butter)', '✦'],
        ['건강', fortune.sections.health.score, 'var(--v2-peach)', '✚'],
      ] as const)
    : [];
  const bodies = fortune
    ? ([
        ['총운', fortune.sections.overall.body], ['애정', fortune.sections.love.body],
        ['금전', fortune.sections.money.body], ['일·직업', fortune.sections.work.body],
        ['건강', fortune.sections.health.body],
      ] as const)
    : [];

  if (!fortune) {
    return (
      <V2Screen seed={13} style={{ paddingBottom: 0 }}>
        <V2TopBar onBack={back} title="오늘의 운세" />
        <div style={{ textAlign: 'center', marginTop: 80, color: 'var(--v2-ink-dim)' }}>사주를 입력하면 오늘의 운세를 풀어드려요</div>
        <div style={{ marginTop: 20 }}><V2Button onClick={() => switchTab('home')}>사주 입력하기</V2Button></div>
        <div style={{ height: 96 }} />
      </V2Screen>
    );
  }

  return (
    <V2Screen seed={13} style={{ paddingBottom: 0 }}>
      <V2TopBar onBack={back} title="오늘의 운세" right={<button style={circleButtonStyle}>↗</button>} />
      <Rise><div style={{ textAlign: 'center' }}><div className="v2-cap" style={{ color: 'var(--v2-lavender)' }}>{dateLabel} · {myeongsik?.ilgan.c}{myeongsik ? `(${TG_KR[myeongsik.ilgan.c]})` : ''}일</div><SpiritSlot spirit={spirit} size={172} tag={false} /><h1 className="v2-hero" style={{ margin: '2px 0 0' }}>{fortune.mood}</h1></div></Rise>
      <Rise delay={120}><div style={speechStyle}><div style={{ fontSize: 11, color: 'var(--v2-lavender)', fontWeight: 800, marginBottom: 6 }}>{spirit.name}의 한 마디</div><div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.55 }}>{fortune.oneLine}</div></div></Rise>
      <Rise delay={200}><div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}><ScoreRing score={ring} color="var(--v2-lavender)" /><div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{dims.map(([l, v, c, ic]) => <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 14, background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)' }}><span style={{ color: c, fontSize: 14, fontWeight: 800, width: 16 }}>{ic}</span><span style={{ fontSize: 11, color: 'var(--v2-ink-dim)', flex: 1 }}>{l}</span><span style={{ fontSize: 14, fontWeight: 800 }}>{v}</span></div>)}</div></div></Rise>
      <Rise delay={280}><V2Label>오늘의 풀이</V2Label><div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{bodies.map(([l, body]) => <V2Glass key={l}><div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-lavender)', marginBottom: 6 }}>{l}</div><div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--v2-ink-mid)' }}>{body}</div></V2Glass>)}</div></Rise>
      <Rise delay={360}><V2Label>오늘의 럭키</V2Label><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{fortune.hashtags.map((h, i) => <StatPill key={i} label={`#${i + 1}`} value={h.replace(/^#/, '')} color={['var(--v2-lavender)', 'var(--v2-peach)', 'var(--v2-mint)'][i]} />)}</div></Rise>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

function ScreenGrow({ spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { progressOf, bondUp, evolve } = useSpiritState();
  const prog = progressOf(spirit.key);
  const stage = prog.stage;
  const bond = prog.bond;
  const canEvolve = bond >= 100 && stage < 4;
  const STAGE_KO = ['', '아기 정령', '어린 정령', '성체 정령', '영험한 정령'];
  const nextKo = stage < 4 ? STAGE_KO[stage + 1] : '';
  const nextStage = Math.min(4, stage + 1) as Stage;
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [gain, setGain] = useState<number | null>(null);
  const [evolving, setEvolving] = useState(false);
  const scrollTop = () => { (anchorRef.current?.closest('.ie-scroll') as HTMLElement | null)?.scrollTo({ top: 0, behavior: 'smooth' }); };
  const care = (amt: number) => { scrollTop(); bondUp(spirit.key, amt); setGain(amt); setPulseKey((k) => k + 1); window.setTimeout(() => setGain(null), 950); };
  const doEvolve = () => { scrollTop(); setEvolving(true); window.setTimeout(() => { evolve(spirit.key); setEvolving(false); }, 1500); };
  return (
    <V2Screen seed={15} style={{ paddingBottom: 0 }}>
      <V2TopBar title="키우기" />
      <Rise><div ref={anchorRef} style={{ textAlign: 'center', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-lavender)' }}>Lv.{4 + stage}</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--v2-ink-mute)' }} />
          <span style={{ fontSize: 12, color: 'var(--v2-ink-mid)' }}>{STAGE_KO[stage]}</span>
        </div>
        <div style={{ height: 248, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div key={pulseKey} style={{ animation: pulseKey ? 'v2-bond-pop .5s ease' : 'none' }}>
            <SpiritSlot spirit={spirit} size={198 + (stage - 1) * 14} tag={false} stage={stage} />
          </div>
          {gain !== null && <div key={`g${pulseKey}`} style={{ position: 'absolute', top: 36, left: '50%', fontSize: 22, fontWeight: 900, color: 'var(--v2-mint)', textShadow: '0 0 12px var(--v2-mint)', animation: 'v2-float-up .95s ease forwards', pointerEvents: 'none' }}>+{gain}</div>}
        </div>
      </div></Rise>
      <Rise delay={100}>{canEvolve
        ? <button onClick={doEvolve} style={{ width: '100%', marginTop: 6, padding: 16, borderRadius: 'var(--v2-r-md)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'linear-gradient(100deg, #FFD27A, #5BD9AC)', color: '#1b1230', fontSize: 16, fontWeight: 900, boxShadow: '0 8px 28px #FFD27A66' }}>✦ {nextKo}(으)로 진화하기 ✦</button>
        : <V2Glass style={{ marginTop: 6 }}><BondMeter value={bond} label={stage >= 4 ? '기운' : '다음 진화까지'} sub={stage >= 4 ? '최종 진화 완료 — 가장 영험한 모습이에요 ✦' : `${100 - bond} 더 채우면 ${nextKo}로 진화해요`} /></V2Glass>}</Rise>
      <Rise delay={180}><V2Label>진화의 결</V2Label><div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>{([1, 2, 3, 4] as Stage[]).map((st) => {
        const reached = st <= stage;
        const url = spirit.imageFor(st);
        return (
          <div key={st} style={{ flex: 1, textAlign: 'center', opacity: reached ? 1 : 0.9 }}>
            <div style={{ width: 58, height: 58, margin: '0 auto', borderRadius: '50%', position: 'relative', overflow: 'hidden', background: reached ? `radial-gradient(circle,${spirit.elem.raw}55,${spirit.rarity.raw}33)` : 'var(--v2-glass)', border: `1.5px solid ${st === stage ? spirit.elem.raw : 'var(--v2-glass-line2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {reached
                ? (url ? <img src={url} alt={STAGE_KO[st]} style={{ width: '128%', height: '128%', objectFit: 'contain' }} /> : <span style={{ fontSize: 26 }}>{spirit.zod.emoji}</span>)
                : <span style={{ fontSize: 22, color: 'var(--v2-ink-mute)' }}>?</span>}
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 5, color: st === stage ? 'var(--v2-ink)' : 'var(--v2-ink-mute)' }}>{reached ? STAGE_KO[st] : '???'}</div>
          </div>
        );
      })}</div></Rise>
      <Rise delay={260}><V2Label>오늘의 교감</V2Label><div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <CareAction onClick={() => care(25)} ic="🍃" title="기운 먹이주기" sub="오행의 기운을 나눠줘요" amt="+25" color="var(--v2-mint)" />
        <CareAction onClick={() => care(20)} ic="✨" title="쓰다듬기" sub="정령과 눈을 맞춰요" amt="+20" color="var(--v2-peach)" />
        <CareAction onClick={() => care(30)} ic="☾" title="함께 명상하기" sub="고요히 기운을 모아요" amt="+30" color="var(--v2-lavender)" />
      </div></Rise>
      <div style={{ height: 96 }} />
      {evolving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,11,28,.82)' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 42%, ${spirit.elem.raw}66, transparent 60%)`, animation: 'v2-flash 1.5s ease forwards', pointerEvents: 'none' }} />
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ animation: 'v2-evolve-in 1.2s cubic-bezier(.2,.9,.3,1)' }}>
              <SpiritSlot spirit={spirit} size={230} tag={false} stage={nextStage} floating={false} />
            </div>
            <div className="v2-display" style={{ marginTop: 10, color: 'var(--v2-ink)', textShadow: '0 0 18px rgba(183,156,255,.8)' }}>✦ 진화! ✦</div>
            <div className="v2-cap" style={{ color: 'var(--v2-lavender)', marginTop: 4 }}>{STAGE_KO[nextStage]}</div>
          </div>
        </div>
      )}
    </V2Screen>
  );
}

function ScreenCollection({ switchTab, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { profiles } = useSaju();
  const [filter, setFilter] = useState<ElementKey | 'all'>('all');
  const unlocked = useMemo(() => {
    const s = new Set<string>();
    for (const p of profiles) {
      try { s.add(spiritFromMyeongsik(computeMyeongsik(p)).key); } catch { /* skip */ }
    }
    return s;
  }, [profiles]);
  const cells = ELEM_ORDER.flatMap((ek) => ZOD_ORDER.map((zk) => {
    const sp = makeSpirit(ek, zk);
    return { ek, key: sp.key, sp, got: unlocked.has(sp.key), ready: sp.available };
  })).filter((c) => filter === 'all' || c.ek === filter);
  const ownedCount = unlocked.size;
  return (
    <V2Screen seed={17} style={{ paddingBottom: 0 }}>
      <V2TopBar title="정령 도감" />
      <Rise><V2Glass style={{ display: 'flex', alignItems: 'center', gap: 14 }} glow="0 0 24px rgba(255,210,122,.16)"><ScoreRing score={Math.round((ownedCount / 60) * 100)} color="var(--v2-butter)" /><div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800 }}>{ownedCount}종의 정령을 만났어요</div><div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', marginTop: 3, lineHeight: 1.5 }}>궁합으로 다른 사람의 사주를 풀면 그 정령이 도감에 담겨요 ✦</div></div></V2Glass></Rise>
      <Rise delay={80}><div style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '18px 0 14px' }} className="ie-scroll"><FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="전체" color="var(--v2-lavender)" />{ELEM_ORDER.map((ek) => <FilterChip key={ek} active={filter === ek} onClick={() => setFilter(ek)} label={`${ELEMENTS[ek].cn} ${ELEMENTS[ek].ko}`} color={ELEMENTS[ek].raw} />)}</div></Rise>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>{cells.map((c, i) => <Rise key={c.key} delay={Math.min(i * 12, 300)}><div onClick={() => c.got && switchTab('profile')} style={{ position: 'relative', padding: '14px 6px 11px', borderRadius: 'var(--v2-r-md)', textAlign: 'center', cursor: c.got ? 'pointer' : 'default', background: c.got ? `linear-gradient(160deg, ${c.sp.elem.raw}1c, var(--v2-glass))` : 'var(--v2-glass)', border: `1px solid ${c.got ? c.sp.elem.raw + '44' : 'var(--v2-glass-line2)'}`, opacity: c.got ? 1 : (c.ready ? 0.85 : 0.5) }}>
        <div style={{ width: 52, height: 52, margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden', background: c.got ? `radial-gradient(circle at 38% 34%, #fff8, ${c.sp.elem.raw}, ${c.sp.rarity.raw})` : 'rgba(255,255,255,.05)', boxShadow: c.got ? `0 0 16px ${c.sp.elem.raw}88` : 'none', border: c.got ? 'none' : '1px dashed var(--v2-glass-line2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--v2-ink-mute)' }}>
          {c.got ? (c.sp.imageFor(1) ? <img src={c.sp.imageFor(1) as string} alt={c.sp.name} style={{ width: '118%', height: '118%', objectFit: 'contain' }} /> : c.sp.zod.emoji) : '?'}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: c.got ? 'var(--v2-ink)' : 'var(--v2-ink-mute)' }}>{c.got ? c.sp.name : '???'}</div>
        <div style={{ fontSize: 9, color: 'var(--v2-ink-dim)', marginTop: 2 }}>{c.got ? c.sp.formula : (c.ready ? '미발견' : '준비중')}</div>
        {c.got && <div style={{ marginTop: 4 }}><RarityStars rarity={c.sp.rarity} showLabel={false} /></div>}
        {c.key === spirit.key && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 800, color: '#1b1230', background: 'var(--v2-lavender)', padding: '2px 5px', borderRadius: 5 }}>내 정령</span>}
      </div></Rise>)}</div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}



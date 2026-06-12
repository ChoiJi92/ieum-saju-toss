import { useEffect, useMemo, useRef, useState } from 'react';
import { useSaju } from '../lib/saju-state';
import { useSpiritState } from '../lib/spirit-state';
import { showRewardedAdForResult } from '../lib/ads';
import { ACTION_GAIN, AD_GAIN, DAILY_CAP, TIME_BONUS, ACTION_WINDOW, inActionWindow } from '../lib/spirit-economy';
import { computeMyeongsik, TG_KR, DZ_KR } from '../lib/saju';
import { todayFortune, todayDayStem } from '../lib/today';
import { buildTodayActionGuide } from '../lib/fortune-guides';
import { pillarSeed } from '../lib/personalize';
import { shareSpiritCard } from '../lib/spirit-card';
import {
  ELEMENTS, ELEM_ORDER, ZOD_ORDER,
  makeSpirit, spiritFromMyeongsik,
  type ElementKey, type Spirit, type Stage,
} from '../lib/spirit';
import {
  V2Screen, Rise, V2TopBar, V2Button, V2Glass, V2Label,
  SpiritSlot, Sparkles, RarityStars, BondMeter, StatPill, ScoreRing,
  HeaderPill, FilterChip, ActionRow, BIRTH_YEARS, selectChevron, BottomSheet,
  circleButtonStyle, speechStyle,
} from './v2/_kit';
import { type Tab, type Route, type FlowScreen, FORTUNE_MENU, REWARDED_ROUTES, INTERSTITIAL_ROUTES, ROUTE_TITLE } from './v2/nav';
import { personalityCard } from '../lib/personality';
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
import ScreenCalendar from './v2/ScreenCalendar';
import ScreenProfiles from './v2/ScreenProfiles';
import ScreenAddProfile from './v2/ScreenAddProfile';
import ScreenLegal from './v2/ScreenLegal';


export default function V2Clone() {
  const { myeongsik, reset } = useSaju();
  const spirit = useMemo(() => spiritFromMyeongsik(myeongsik), [myeongsik]);

  const [flow, setFlow] = useState<FlowScreen[] | null>(myeongsik ? null : ['onboarding']);
  // 단일 네비게이션 스택 — 펫 화면(home)이 루트. 탭바 없음, 상단 아이콘으로 이동.
  const [stack, setStack] = useState<Route[]>(['home']);
  const [adUnlocked, setAdUnlocked] = useState<Set<Route>>(() => new Set());
  const { adBoost } = useSpiritState();
  const [adToast, setAdToast] = useState<string | null>(null);
  // 보상형 광고로 운세를 열면 정령 기운도 함께 적립 (하루 광고 한도/상한 내) — 광고=보상 루프
  const unlock = (r: Route) => {
    setAdUnlocked((s) => new Set(s).add(r));
    const res = adBoost(spirit.key);
    if (res.ok && res.gained > 0) {
      setAdToast(`정령 기운 +${res.gained} ✦`);
      window.setTimeout(() => setAdToast(null), 2400);
    }
  };

  const resetApp = () => {
    reset();
    try { localStorage.removeItem('ieum-saju.spirit.v2'); localStorage.removeItem('ieum-saju.streak.v1'); } catch { /* ignore */ }
    setAdUnlocked(new Set());
    setStack(['home']);
    setFlow(['onboarding']);
  };

  const goFlow = (s: FlowScreen) => setFlow((f) => (f ? [...f, s] : [s]));
  const enterApp = () => { setFlow(null); setStack(['home']); };
  const go = (r: Route) => setStack((s) => [...s, r]);
  const goHome = () => setStack(['home']);
  // 구 화면 호환 shim — 탭 개념 제거. home/grow→루트, 그 외→push.
  const switchTab = (t: Tab) => { if (t === 'home' || t === 'grow') goHome(); else go(t as Route); };
  const back = () => {
    if (flow) { setFlow((f) => (f && f.length > 1 ? f.slice(0, -1) : f)); return; }
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };

  // 1) 온보딩 플로우 (탭 바깥)
  if (flow) {
    const cur = flow[flow.length - 1];
    const fp = { goFlow, back, enterApp, spirit };
    if (cur === 'input') return <ScreenInput {...fp} />;
    if (cur === 'reveal') return <ScreenReveal {...fp} />;
    return <ScreenOnboard {...fp} />;
  }

  // 2) 단일 스택 top 라우트 렌더 (탭바 없음 — 펫 메인 + 상단 아이콘 네비)
  const route = stack[stack.length - 1];
  const sp = { go, back, switchTab, spirit, tab: 'home' as Tab, resetApp };
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
    case 'fortunes': screenEl = <ScreenFortunes {...sp} />; break;
    case 'calendar': screenEl = <ScreenCalendar {...sp} />; break;
    case 'collection': screenEl = <ScreenCollection {...sp} />; break;
    case 'profile': screenEl = <ScreenProfile {...sp} />; break;
    case 'profiles': screenEl = <ScreenProfiles {...sp} />; break;
    case 'addProfile': screenEl = <ScreenAddProfile {...sp} />; break;
    case 'terms': screenEl = <ScreenLegal kind="terms" {...sp} />; break;
    case 'privacy': screenEl = <ScreenLegal kind="privacy" {...sp} />; break;
    default: screenEl = <ScreenPetHome {...sp} />;
  }
  if (REWARDED_ROUTES.includes(route)) {
    screenEl = <RewardedGate title={ROUTE_TITLE[route]} back={back} spirit={spirit} unlocked={adUnlocked.has(route)} onUnlock={() => unlock(route)}>{screenEl}</RewardedGate>;
  } else if (INTERSTITIAL_ROUTES.includes(route)) {
    screenEl = <InterstitialView routeKey={route}>{screenEl}</InterstitialView>;
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div key={route} style={{ position: 'absolute', inset: 0 }}>{screenEl}</div>
      {adToast && <div style={{ position: 'absolute', top: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 95, background: 'rgba(255,210,122,.16)', border: '1px solid var(--v2-butter)', color: 'var(--v2-butter)', fontSize: 12.5, fontWeight: 800, padding: '8px 16px', borderRadius: 999, animation: 'v2-rise-soft .4s ease', pointerEvents: 'none', whiteSpace: 'nowrap' }}>🎬 {adToast}</div>}
    </div>
  );
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
      <div style={{ display: 'flex', gap: 5, marginTop: 20, marginBottom: 26 }}>{[1, 2].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= 1 ? 'var(--v2-lavender)' : 'rgba(255,255,255,.12)', boxShadow: i <= 1 ? '0 0 10px var(--v2-lavender)' : 'none' }} />)}</div>
      <Rise>
        <div className="v2-cap" style={{ color: 'var(--v2-peach)' }}>STEP 1 / 2 · 사주 정보</div>
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
            <select style={{ ...field, ...selectChevron }} value={year} onChange={(e) => setYear(e.target.value)}><option value="">년</option>{BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}</select>
            <select style={{ ...field, ...selectChevron }} value={month} onChange={(e) => setMonth(e.target.value)}><option value="">월</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}월</option>)}</select>
            <select style={{ ...field, ...selectChevron }} value={day} onChange={(e) => setDay(e.target.value)}><option value="">일</option>{Array.from({ length: 31 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}일</option>)}</select>
          </div>
          {cal === 'lunar' && <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--v2-ink-dim)' }}><input type="checkbox" checked={leap} onChange={(e) => setLeap(e.target.checked)} />윤달</label>}
          <button onClick={() => setSijinOpen(true)} style={{ ...field, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{unknownTime ? '태어난 시간 — 모름' : SIJIN_LIST_V2.find(([k]) => k === sijin)?.[1]}</span><span style={{ color: 'var(--v2-ink-dim)' }}>▾</span></button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([['male', '남자'], ['female', '여자']] as const).map(([k, t]) => <button key={k} onClick={() => setGender(k)} style={{ ...field, textAlign: 'center', cursor: 'pointer', background: gender === k ? 'linear-gradient(120deg,var(--v2-lavender),var(--v2-peach))' : 'var(--v2-glass)', color: gender === k ? '#1b1230' : 'var(--v2-ink)' }}>{t}</button>)}
          </div>
        </div>
      </Rise>
      <div style={{ marginTop: 24 }}><V2Button onClick={submit} style={{ opacity: canNext ? 1 : 0.4, cursor: canNext ? 'pointer' : 'not-allowed' }}>정령 깨우기 ✦</V2Button></div>

      {sijinOpen && (
        <BottomSheet onClose={() => setSijinOpen(false)} maxHeight="76dvh">
            {[['__unknown', '모름 (시간을 몰라요)'] as [string, string], ...SIJIN_LIST_V2].map(([k, lbl]) => {
              const sel = (k === '__unknown' && unknownTime) || (k !== '__unknown' && !unknownTime && sijin === k);
              return <div key={k} onClick={() => { if (k === '__unknown') setUnknownTime(true); else { setUnknownTime(false); setSijin(k); } setSijinOpen(false); }} style={{ padding: '13px 22px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: sel ? 'rgba(183,156,255,.12)' : 'transparent', color: sel ? 'var(--v2-ink)' : 'var(--v2-ink-mid)', fontSize: 15, fontWeight: 700 }}><span style={{ width: 16, color: 'var(--v2-lavender)' }}>{sel ? '✓' : ''}</span>{lbl}</div>;
            })}
        </BottomSheet>
      )}
    </V2Screen>
  );
}

function ScreenReveal({ enterApp, spirit }: { goFlow: (s: FlowScreen) => void; back: () => void; enterApp: () => void; spirit: Spirit }) {
  const { myeongsik } = useSaju();
  const [phase, setPhase] = useState(0);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    setPhase(0);
    const seq = [1100, 950, 950]; // 총 ~3초 — 길면 이탈, 마지막 정령 등장에 무게
    let acc = 0;
    timersRef.current = [];
    seq.forEach((ms, i) => { acc += ms; timersRef.current.push(window.setTimeout(() => setPhase(i + 1), acc)); });
    return () => timersRef.current.forEach(window.clearTimeout);
  }, []);

  // 건너뛰기: 대기 중인 타이머를 모두 취소해야 phase 3 가 다시 되돌아가지 않음
  const skip = () => { timersRef.current.forEach(window.clearTimeout); timersRef.current = []; setPhase(3); };

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
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', position: 'relative' }}>
        {phase < 3 && (
          <button onClick={skip} style={{ position: 'absolute', top: 54, right: 18, background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', color: 'var(--v2-ink-dim)', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--v2-font)' }}>건너뛰기</button>
        )}

        <div style={{ position: 'relative', width: 280, height: 280, marginBottom: 16 }}>
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
              <SpiritSlot spirit={spirit} size={228} tag={false} />
            </div>
          </div>
        </div>

        <div style={{ minHeight: 128, maxWidth: 340, position: 'relative' }}>
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

        {phase === 3 && <div style={{ width: '100%', maxWidth: 340, marginTop: 20, animation: 'v2-rise-tf .6s ease .5s both' }}><V2Button onClick={() => enterApp()}>{spirit.name} 만나러 가기 →</V2Button></div>}
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

function ScreenProfile({ go, back, spirit, resetApp }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab; resetApp: () => void }) {
  const { myeongsik, profile, profiles } = useSaju();
  const { progressOf } = useSpiritState();
  const stage = progressOf(spirit.key).stage;
  const STAGE_KO = ['', '아기 정령', '어린 정령', '성체 정령', '영험한 정령'];
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
      <V2TopBar onBack={back} title="내 정보" />
      <Rise><SpiritSlot spirit={spirit} size={210} stage={1} /></Rise>
      <Rise delay={120}>
        <V2Glass glow="0 0 28px rgba(183,156,255,.2)" style={{ textAlign: 'center' }}>
          <div className="v2-cap" style={{ color: spirit.elem.raw }}>{spirit.formula}</div>
          <h1 className="v2-hero" style={{ margin: '8px 0 4px' }}>{spirit.name}</h1>
          <RarityStars rarity={spirit.rarity} />
          <p className="v2-body" style={{ color: 'var(--v2-ink-dim)', marginTop: 14 }}>{spirit.persona}</p>
        </V2Glass>
      </Rise>
      <V2Label>진화의 결</V2Label>
      <V2Glass>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>{([1, 2, 3, 4] as Stage[]).map((st) => {
          const reached = st <= stage;
          const url = spirit.imageFor(st);
          return (
            <div key={st} style={{ flex: 1, textAlign: 'center', opacity: reached ? 1 : 0.9 }}>
              <div style={{ width: 54, height: 54, margin: '0 auto', borderRadius: '50%', position: 'relative', overflow: 'hidden', background: reached ? `radial-gradient(circle,${spirit.elem.raw}55,${spirit.rarity.raw}33)` : 'var(--v2-glass)', border: `1.5px solid ${st === stage ? spirit.elem.raw : 'var(--v2-glass-line2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {reached ? (url ? <img src={url} alt={STAGE_KO[st]} style={{ width: '128%', height: '128%', objectFit: 'contain' }} /> : <span style={{ fontSize: 24 }}>{spirit.zod.emoji}</span>) : <span style={{ fontSize: 20, color: 'var(--v2-ink-mute)' }}>?</span>}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 5, color: st === stage ? 'var(--v2-ink)' : 'var(--v2-ink-mute)' }}>{reached ? STAGE_KO[st] : '???'}</div>
            </div>
          );
        })}</div>
      </V2Glass>
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
            <div style={{ fontSize: 11, color: 'var(--v2-ink-dim)', marginTop: 9, lineHeight: 1.5, background: 'rgba(183,156,255,.08)', borderRadius: 10, padding: '8px 10px' }}>✦ 정령은 태어난 해의 ‘띠’가 아니라, ‘나’를 뜻하는 <b style={{ color: 'var(--v2-lavender)' }}>일주(태어난 날)</b> 기준이에요. 계열 <b style={{ color: spirit.elem.raw }}>{spirit.line}</b>은(는) 일간({ilganElem.ko}), 동물은 일지로 정해져 띠와 다를 수 있어요.</div>
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

function ScreenFortunes({ go, back }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  return (
    <V2Screen seed={11}>
      <V2TopBar onBack={back} title="운세 더보기" />
      <Rise>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginTop: 6 }}>
          {FORTUNE_MENU.map((m) => (
            <button key={m.route} onClick={() => go(m.route)} className="v2-press" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 6px', borderRadius: 'var(--v2-r-md)', background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)', cursor: 'pointer', fontFamily: 'var(--v2-font)' }}>
              {REWARDED_ROUTES.includes(m.route) && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 10 }}>🔒</span>}
              <span style={{ width: 40, height: 40, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, background: 'rgba(255,255,255,.06)' }}>{m.ic}</span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--v2-ink)' }}>{m.label}</span>
              <span style={{ fontSize: 10, color: 'var(--v2-ink-dim)' }}>{m.sub}</span>
            </button>
          ))}
        </div>
      </Rise>
      <div style={{ height: 44 }} />
    </V2Screen>
  );
}

function ScreenToday({ go, back, switchTab, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik } = useSaju();
  const { claimBonus, progressOf } = useSpiritState();
  const stage = progressOf(spirit.key).stage;
  const [bonusMsg, setBonusMsg] = useState<string | null>(null);
  const fortune = myeongsik ? todayFortune(myeongsik) : null;
  // 정령의 풀이 — 정령이 자랄수록 깊어지는 해석 (do/avoid → 행운시간·미션 → 금기·내일예고)
  const guide = useMemo(() => {
    if (!fortune || !myeongsik) return null;
    const d = new Date();
    return buildTodayActionGuide({
      sections: [
        { id: 'overall', label: '총운', score: fortune.sections.overall.score },
        { id: 'love', label: '연애운', score: fortune.sections.love.score },
        { id: 'money', label: '재물운', score: fortune.sections.money.score },
        { id: 'work', label: '직장운', score: fortune.sections.work.score },
        { id: 'health', label: '건강운', score: fortune.sections.health.score },
      ],
      date: d,
      personalSeed: pillarSeed(myeongsik),
      dayStem: todayDayStem(d),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myeongsik, fortune?.mood]);
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

  // 앱활동 보너스 — 오늘의 운세 확인 1회(멱등)
  useEffect(() => {
    if (!fortune) return;
    const r = claimBonus(spirit.key, 'fortune');
    if (r.ok && r.gained > 0) { setBonusMsg(`+${r.gained} 교감 ✦`); const t = window.setTimeout(() => setBonusMsg(null), 2200); return () => window.clearTimeout(t); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spirit.key]);

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
      {bonusMsg && <div style={{ position: 'fixed', top: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 80, background: 'rgba(91,217,172,.16)', border: '1px solid var(--v2-mint)', color: 'var(--v2-mint)', fontSize: 12.5, fontWeight: 800, padding: '8px 16px', borderRadius: 999, animation: 'v2-rise-soft .4s ease', pointerEvents: 'none', whiteSpace: 'nowrap' }}>🎁 {bonusMsg}</div>}
      <Rise><div style={{ textAlign: 'center' }}><div className="v2-cap" style={{ color: 'var(--v2-lavender)' }}>{dateLabel} · {myeongsik?.ilgan.c}{myeongsik ? `(${TG_KR[myeongsik.ilgan.c]})` : ''}일</div><SpiritSlot spirit={spirit} size={172} tag={false} /><h1 className="v2-hero" style={{ margin: '2px 0 0' }}>{fortune.mood}</h1></div></Rise>
      <Rise delay={120}><div style={speechStyle}><div style={{ fontSize: 11, color: 'var(--v2-lavender)', fontWeight: 800, marginBottom: 6 }}>{spirit.name}의 한 마디</div><div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.55 }}>{fortune.oneLine}</div></div></Rise>
      <Rise delay={200}><div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}><ScoreRing score={ring} color="var(--v2-lavender)" /><div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{dims.map(([l, v, c, ic]) => <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 14, background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)' }}><span style={{ color: c, fontSize: 14, fontWeight: 800, width: 16 }}>{ic}</span><span style={{ fontSize: 11, color: 'var(--v2-ink-dim)', flex: 1 }}>{l}</span><span style={{ fontSize: 14, fontWeight: 800 }}>{v}</span></div>)}</div></div></Rise>
      <Rise delay={280}><V2Label>오늘의 풀이</V2Label><div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{bodies.map(([l, body]) => <V2Glass key={l}><div style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-lavender)', marginBottom: 6 }}>{l}</div><div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--v2-ink-mid)' }}>{body}</div></V2Glass>)}</div></Rise>
      {/* 정령의 풀이 — 단계별로 깊어지는 해석 (키울 이유) */}
      {guide && (
        <Rise delay={320}>
          <V2Label>{spirit.name}의 풀이 · {(['', '아기', '어린', '성체', '영험'])[stage]} 정령의 눈</V2Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stage >= 2 ? (
              <V2Glass>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--v2-mint)', marginBottom: 7 }}>✅ 오늘 이건 해요</div>
                    {guide.doList.slice(0, 2).map((t, i) => <div key={i} style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--v2-ink-mid)', marginBottom: 5 }}>{t}</div>)}
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--v2-peach)', marginBottom: 7 }}>🚫 오늘은 피해요</div>
                    {guide.avoidList.slice(0, 2).map((t, i) => <div key={i} style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--v2-ink-mid)', marginBottom: 5 }}>{t}</div>)}
                  </div>
                </div>
              </V2Glass>
            ) : (
              <V2Glass onClick={back} style={{ border: '1px dashed var(--v2-glass-line2)', textAlign: 'center', padding: '15px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--v2-ink-mid)' }}>🔒 어린 정령이 되면 ‘오늘의 행동 가이드’가 열려요</div>
                <div style={{ fontSize: 11.5, color: 'var(--v2-lavender)', marginTop: 5, fontWeight: 700 }}>정령 키우러 가기 ›</div>
              </V2Glass>
            )}
            {stage >= 3 ? (
              <V2Glass>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--v2-butter)' }}>⏰ 행운 시간</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--v2-ink)' }}>{guide.luckyTime}</span>
                </div>
                {([['🌅 아침', guide.missions.morning], ['☀️ 점심', guide.missions.noon], ['🌙 밤', guide.missions.night]] as const).map(([l, t]) => (
                  <div key={l} style={{ display: 'flex', gap: 9, marginBottom: 5 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--v2-ink-dim)', whiteSpace: 'nowrap' }}>{l}</span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--v2-ink-mid)' }}>{t}</span>
                  </div>
                ))}
              </V2Glass>
            ) : stage === 2 ? (
              <V2Glass onClick={back} style={{ border: '1px dashed var(--v2-glass-line2)', textAlign: 'center', padding: '13px 16px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--v2-ink-dim)' }}>🔒 성체 정령이 되면 ‘행운 시간·하루 미션’이 열려요</div>
              </V2Glass>
            ) : null}
            {stage >= 4 ? (
              <V2Glass glow="0 0 20px rgba(255,210,122,.14)">
                <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--v2-peach)', marginBottom: 6 }}>⚠️ 오늘의 금기</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--v2-ink-mid)' }}>{guide.todayNoNo}</div>
                <div style={{ height: 1, background: 'var(--v2-glass-line2)', margin: '11px 0' }} />
                <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--v2-butter)', marginBottom: 6 }}>🌅 내일 예고</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--v2-ink-mid)' }}>{guide.tomorrowKickoff}</div>
              </V2Glass>
            ) : stage === 3 ? (
              <V2Glass onClick={back} style={{ border: '1px dashed var(--v2-glass-line2)', textAlign: 'center', padding: '13px 16px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--v2-ink-dim)' }}>🔒 영험한 정령이 되면 ‘금기·내일 예고’까지 보여요</div>
              </V2Glass>
            ) : null}
          </div>
        </Rise>
      )}
      <Rise delay={360}><V2Label>오늘의 럭키</V2Label><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{fortune.hashtags.map((h, i) => <StatPill key={i} label={`#${i + 1}`} value={h.replace(/^#/, '')} color={['var(--v2-lavender)', 'var(--v2-peach)', 'var(--v2-mint)'][i]} />)}</div></Rise>
      {/* 무료→프리미엄 퍼널 — 이달의 운세 티저 CTA */}
      <Rise delay={420}>
        <V2Glass onClick={() => go('month')} style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 13, background: 'linear-gradient(120deg, rgba(255,158,130,.10), rgba(183,156,255,.08))' }} glow="0 0 20px rgba(255,158,130,.12)">
          <span style={{ fontSize: 26 }}>🌙</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--v2-ink)' }}>이번 달 흐름이 궁금하다면</div>
            <div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', marginTop: 3 }}>좋은 날·주의할 날까지 — 이달의 운세 보기</div>
          </div>
          <span style={{ color: 'var(--v2-peach)', fontSize: 16, fontWeight: 800 }}>›</span>
        </V2Glass>
      </Rise>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

function ScreenPetHome({ go, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { profile, myeongsik, profiles } = useSaju();
  const name = profile?.name ?? '나';
  const { progressOf, percent, thresholdOf, care: careAct, claimBonus, adBoost, evolve, remaining, streak, tickStreak } = useSpiritState();
  const prog = progressOf(spirit.key);
  const stage = prog.stage;
  const pct = percent(spirit.key);
  const rem = remaining(spirit.key);
  const canEvolve = stage < 4 && prog.bond >= thresholdOf(stage);
  const STAGE_KO = ['', '아기 정령', '어린 정령', '성체 정령', '영험한 정령'];
  const nextKo = stage < 4 ? STAGE_KO[stage + 1] : '';
  const nextStage = Math.min(4, stage + 1) as Stage;
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [gain, setGain] = useState<number | null>(null);
  const [evolving, setEvolving] = useState(false);
  const [burstIcon, setBurstIcon] = useState('✦');
  const [adLoading, setAdLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // 첫 교감 가이드 — 최초 1회 코치마크 (교감하면 영구 해제)
  const [careGuide, setCareGuide] = useState(() => { try { return !localStorage.getItem('ieum-saju.guide.care.v1'); } catch { return false; } });
  const dismissCareGuide = () => { setCareGuide(false); try { localStorage.setItem('ieum-saju.guide.care.v1', '1'); } catch { /* ignore */ } };
  const showNotice = (msg: string) => { setNotice(msg); window.setTimeout(() => setNotice(null), 2200); };
  // 진화 ETA — 자연 페이스(~50/일) 기준 예상일. "내일 또 와야지" 동기 한 줄.
  const remainBond = Math.max(0, thresholdOf(stage) - prog.bond);
  const etaDays = Math.max(1, Math.ceil(remainBond / 50));
  // 영험 엔드게임: 멘토 모드 — 다 키운 정령이 도감의 다음 정령에게 기운을 나눠줌
  const menteeCands = useMemo(() => {
    if (stage < 4) return [] as { key: string; sp: Spirit }[];
    const seen = new Set<string>([spirit.key]);
    const out: { key: string; sp: Spirit }[] = [];
    for (const pr of profiles) {
      try {
        const sp = spiritFromMyeongsik(computeMyeongsik(pr));
        if (seen.has(sp.key)) continue;
        seen.add(sp.key);
        if (progressOf(sp.key).stage < 4) out.push({ key: sp.key, sp });
      } catch { /* skip */ }
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, profiles, spirit.key]);
  const [menteeKey, setMenteeKey] = useState<string | null>(() => { try { return localStorage.getItem('ieum-saju.mentor.v1'); } catch { return null; } });
  const mentee = menteeCands.find((c) => c.key === menteeKey) ?? menteeCands[0] ?? null;
  const pickMentee = (k: string) => { setMenteeKey(k); try { localStorage.setItem('ieum-saju.mentor.v1', k); } catch { /* ignore */ } };
  // 교감/광고가 향하는 대상 — 영험+멘티 있으면 멘티, 아니면 본인
  const targetKey = stage >= 4 && mentee ? mentee.key : spirit.key;
  const tgtProg = progressOf(targetKey);
  const tgtRem = remaining(targetKey);
  const tgtPct = percent(targetKey);
  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const canBypass = import.meta.env.DEV && import.meta.env.VITE_AD_DEV_BYPASS !== 'false' && isLocalhost;
  const scrollTop = () => { (anchorRef.current?.closest('.ie-scroll') as HTMLElement | null)?.scrollTo({ top: 0, behavior: 'smooth' }); };
  const playFx = (gained: number, icon: string) => { setGain(gained); setBurstIcon(icon); setPulseKey((k) => k + 1); window.setTimeout(() => setGain(null), 1800); };
  // 무료 교감 — 하루 1회씩, 하루 상한 내에서 (영험이면 멘티에게)
  const doCare = (kind: 'feed' | 'pet' | 'meditate', icon: string) => { const r = careAct(targetKey, kind); if (r.ok && r.gained > 0) { playFx(r.gained, icon); dismissCareGuide(); } };
  // 광고 가속 — 보상형 광고 성공 후 adBoost (하루 상한·횟수 내, 영험이면 멘티에게)
  const doAd = async () => {
    if (adLoading) return;
    if (canBypass) { const r = adBoost(targetKey); if (r.ok && r.gained > 0) playFx(r.gained, '✨'); return; }
    setAdLoading(true);
    const res = await showRewardedAdForResult();
    setAdLoading(false);
    if (res === 'rewarded') { const r = adBoost(targetKey); if (r.ok && r.gained > 0) playFx(r.gained, '✨'); }
  };
  const doEvolve = () => { scrollTop(); setEvolving(true); window.setTimeout(() => { evolve(spirit.key); setEvolving(false); }, 2000); };
  // 출석 보너스 — 그날 첫 진입 1회 (멱등). 첫 적립이면 +N 연출.
  useEffect(() => {
    const r = claimBonus(spirit.key, 'attend');
    if (r.ok && r.gained > 0) { const t = window.setTimeout(() => playFx(r.gained, '🎁'), 500); return () => window.clearTimeout(t); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spirit.key]);
  // 연속 출석 스트릭 틱 — 마일스톤(3/7/14/30일) 도달 시 특별 보상 연출
  useEffect(() => {
    const r = tickStreak(spirit.key);
    if (r.milestone) {
      const t = window.setTimeout(() => { playFx(r.gained, '🔥'); showNotice(`🔥 ${r.milestone}일 연속 출석! 특별 보상 +${r.gained} 교감`); }, 1100);
      return () => window.clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <V2Screen seed={15} style={{ paddingBottom: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 48px)', paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}>
      {/* 상단: 인사 + 기능 아이콘 (탭바 대체) */}
      <Rise style={{ paddingTop: 38 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--v2-ink-dim)' }}>오늘도 함께해요 ✦</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--v2-ink)' }}>{name}님의 정령</div>
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {streak.streak >= 2 && <span style={{ padding: '7px 11px', borderRadius: 999, background: 'rgba(255,158,130,.14)', border: '1px solid rgba(255,158,130,.3)', fontSize: 12, fontWeight: 800, color: 'var(--v2-peach)', whiteSpace: 'nowrap' }}>🔥 {streak.streak}일</span>}
            <HeaderPill>{spirit.rarity.ko}</HeaderPill>
            <button
              onClick={async () => {
                const ol = myeongsik ? todayFortune(myeongsik)?.oneLine : undefined;
                const r = await shareSpiritCard(spirit, stage, ol);
                if (r === 'downloaded') showNotice('정령 카드를 저장했어요 🖼️');
                else if (r === 'failed') showNotice('카드를 만들지 못했어요 — 다시 시도해주세요');
              }}
              aria-label="내 정령 카드 공유"
              style={{ ...circleButtonStyle, width: 38, height: 38, fontSize: 15 }}
            >↗</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { r: 'today' as Route, ic: '☀️', label: '오늘 운세' },
            { r: 'fortunes' as Route, ic: '🔮', label: '운세 더보기' },
            { r: 'collection' as Route, ic: '📖', label: '도감' },
            { r: 'profile' as Route, ic: '👤', label: '내정보' },
          ].map((n) => (
            <button key={n.r} onClick={() => go(n.r)} className="v2-press" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '9px 4px', borderRadius: 16, cursor: 'pointer', fontFamily: 'var(--v2-font)', background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)' }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{n.ic}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--v2-ink-mid)', whiteSpace: 'nowrap' }}>{n.label}</span>
            </button>
          ))}
        </div>
      </Rise>
      <Rise style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><div ref={anchorRef} style={{ textAlign: 'center', position: 'relative' }}>
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 10 }}>

          {/* LAYER 0: 원소 글로우 플래시 — spirit.elem.raw는 실제 hex('#5BD9AC')이므로 alpha concat 유효 */}
          {pulseKey > 0 && (
            <div
              key={`flash${pulseKey}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 260,
                height: 260,
                borderRadius: '50%',
                background: `radial-gradient(circle at 50% 50%, ${spirit.elem.raw}55 0%, ${spirit.elem.raw}22 44%, transparent 70%)`,
                animation: 'v2-bond-flash 0.55s cubic-bezier(.2,.8,.3,1) forwards',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}

          {/* LAYER 1: 교감 탭 링 펄스 — 진화 링(130px)보다 작은 160px 기준 */}
          {pulseKey > 0 && (
            <div
              key={`tapring${pulseKey}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 160,
                height: 160,
                borderRadius: '50%',
                border: `2px solid ${spirit.elem.raw}`,
                boxShadow: `0 0 12px ${spirit.elem.raw}66`,
                animation: 'v2-tap-ring 0.9s cubic-bezier(.2,.8,.4,1) forwards',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          )}

          {/* LAYER 2: 스쿼시 래퍼 — elastic spring cubic-bezier, 850ms */}
          <div
            key={pulseKey}
            style={{
              transformOrigin: '50% 85%',
              animation: pulseKey ? 'v2-bond-squash 0.85s cubic-bezier(.34,1.56,.64,1)' : 'none',
              position: 'relative',
              zIndex: 3,
            }}
          >
            <SpiritSlot spirit={spirit} size={178 + (stage - 1) * 8} tag={false} stage={stage} />
          </div>

          {/* LAYER 3: +N 히어로 숫자 — 38px, 1750ms HOLD arc, 위로 드리프트 */}
          {gain !== null && (
            <div
              key={`g${pulseKey}`}
              style={{
                position: 'absolute',
                top: 56,
                left: '50%',
                fontSize: 38,
                fontWeight: 900,
                color: 'var(--v2-mint)',
                textShadow: `0 0 18px var(--v2-mint), 0 0 36px rgba(61,199,149,.6), 0 0 52px ${spirit.elem.raw}88, 0 2px 0 rgba(0,0,0,.25)`,
                letterSpacing: '-0.5px',
                animation: 'v2-bond-gain 1.75s cubic-bezier(.2,.8,.4,1) forwards',
                pointerEvents: 'none',
                zIndex: 6,
                whiteSpace: 'nowrap',
              }}
            >
              +{gain}
            </div>
          )}

          {/* LAYER 4: 13-particle 방사형 버스트 */}
          {pulseKey > 0 && (
            <div
              key={`burst${pulseKey}`}
              style={{
                position: 'absolute',
                top: '46%',
                left: '50%',
                width: 0,
                height: 0,
                pointerEvents: 'none',
                zIndex: 4,
              }}
            >
              {Array.from({ length: 13 }, (_, i) => {
                // i=0,6  → contextual emoji (burstIcon)
                // i=3,7,10 → tiny white sparkle dots
                // i=1,4,8,11 → elem-colored orbs (larger)
                // i=2,5,9,12 → rarity-colored orbs (smaller)
                const isEmoji   = i === 0 || i === 6;
                const isSparkle = i === 3 || i === 7 || i === 10;
                const isElemOrb = i === 1 || i === 4 || i === 8 || i === 11;
                const angle = (360 / 13) * i;
                const delayMs = isEmoji ? i * 18 : isSparkle ? 60 + i * 20 : i * 28;
                const orbSize = isElemOrb ? 10 : isSparkle ? 3 : 6;
                const dur = isEmoji ? '1.3s' : isSparkle ? '1.05s' : '1.2s';
                const easing = 'cubic-bezier(.25,.46,.45,.94)';
                const orbColor = isElemOrb ? spirit.elem.raw : spirit.rarity.raw;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '0 0',
                    }}
                  >
                    {isEmoji ? (
                      <span
                        style={{
                          position: 'absolute',
                          fontSize: 20,
                          transform: 'translateX(-50%)',
                          animation: `v2-particle-fly ${dur} ${easing} ${delayMs}ms forwards`,
                          filter: 'drop-shadow(0 0 6px rgba(255,255,255,.65))',
                        }}
                      >
                        {burstIcon}
                      </span>
                    ) : isSparkle ? (
                      <div
                        style={{
                          position: 'absolute',
                          width: orbSize,
                          height: orbSize,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          boxShadow: '0 0 6px #FFFFFF, 0 0 12px rgba(255,255,255,.55)',
                          transform: 'translateX(-50%)',
                          animation: `v2-particle-fly ${dur} ${easing} ${delayMs}ms forwards`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          width: orbSize,
                          height: orbSize,
                          borderRadius: '50%',
                          background: orbColor,
                          boxShadow: isElemOrb
                            ? `0 0 10px ${orbColor}, 0 0 20px ${orbColor}88`
                            : `0 0 8px ${orbColor}, 0 0 16px ${orbColor}66`,
                          transform: 'translateX(-50%)',
                          animation: `v2-particle-fly ${dur} ${easing} ${delayMs}ms forwards`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
        <div className="v2-display" style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-ink)', marginTop: 8 }}>{spirit.name}</div>
      </div></Rise>

      {/* 진화의 결은 메인에서 제외 (내정보에서 확인) — 한 화면 우선 */}
      {/* 첫 교감 코치마크 — 최초 1회, 교감하면 해제 */}
      {careGuide && stage < 4 && !rem.actions.feed && (
        <div style={{ textAlign: 'center', marginTop: 8, animation: 'v2-float 2.2s ease-in-out infinite' }}>
          <span style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 999, background: 'rgba(91,217,172,.14)', border: '1px solid var(--v2-mint)', color: 'var(--v2-mint)', fontSize: 12, fontWeight: 800 }}>👇 아래 버튼으로 첫 교감을 해보세요 — 매일 교감하면 자라요</span>
        </div>
      )}
      {/* 하단 카드 — 기운 게이지 + 교감 (펫과 한 화면) */}
      <Rise delay={180} style={{ marginTop: 12 }}>{canEvolve
        ? <button onClick={doEvolve} className="v2-press" style={{ width: '100%', padding: 16, borderRadius: 'var(--v2-r-md)', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: 'linear-gradient(100deg, #FFD27A, #5BD9AC)', color: '#1b1230', fontSize: 16, fontWeight: 900, boxShadow: '0 8px 28px #FFD27A66' }}>✦ {nextKo}(으)로 진화하기 ✦</button>
        : <V2Glass style={{ padding: '12px 16px' }}>
            <BondMeter
              percent={stage >= 4 ? (mentee ? tgtPct : 100) : pct}
              label={stage >= 4 ? (mentee ? `🧙 멘토 모드 — ${mentee.sp.name}` : '기운') : '다음 진화까지'}
              sub={stage >= 4
                ? (mentee ? `제자 정령에게 기운을 나눠요 · 오늘 +${tgtProg.gainedToday}/${DAILY_CAP}` : '최종 진화 완료 — 새 정령을 만나면 기운을 나눠줄 수 있어요 ✦')
                : `오늘 +${prog.gainedToday}/${DAILY_CAP} · 이 속도면 ${etaDays <= 1 ? '내일' : `약 ${etaDays}일 뒤`} ${nextKo}(으)로 진화해요`}
            />
            {/* 멘티 선택 (영험 + 후보 2명 이상) */}
            {stage >= 4 && menteeCands.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 9, overflowX: 'auto' }} className="ie-scroll">
                {menteeCands.map((c) => (
                  <button key={c.key} onClick={() => pickMentee(c.key)} style={{ flexShrink: 0, padding: '6px 11px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--v2-font)', fontSize: 11.5, fontWeight: 800, background: mentee?.key === c.key ? 'var(--v2-lavender)' : 'var(--v2-glass)', color: mentee?.key === c.key ? '#1b1230' : 'var(--v2-ink-mid)', border: '1px solid var(--v2-glass-line2)' }}>{c.sp.name}</button>
                ))}
              </div>
            )}
            {/* 멘티 진화 준비 완료 힌트 */}
            {stage >= 4 && mentee && tgtProg.bond >= thresholdOf(tgtProg.stage) && tgtProg.stage < 4 && (
              <button onClick={() => go('profiles')} className="v2-press" style={{ marginTop: 9, width: '100%', padding: '9px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'var(--v2-font)', background: 'linear-gradient(100deg, rgba(255,210,122,.2), rgba(91,217,172,.2))', color: 'var(--v2-butter)', fontSize: 12, fontWeight: 800 }}>✨ {mentee.sp.name} 진화 준비 완료 — 사주 전환해서 진화시키기 ›</button>
            )}
            <div style={{ height: 1, background: 'var(--v2-glass-line2)', margin: '10px -16px' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { kind: 'feed', ic: '🍃', t: '먹이주기', amt: ACTION_GAIN.feed, c: '#5BD9AC' },
                { kind: 'pet', ic: '💗', t: '쓰다듬기', amt: ACTION_GAIN.pet, c: '#FF9E82' },
                { kind: 'meditate', ic: '🌙', t: '명상하기', amt: ACTION_GAIN.meditate, c: '#B79CFF' },
              ] as const).map((a) => {
                const used = tgtRem.actions[a.kind];
                const noTarget = stage >= 4 && !mentee;
                const off = used || tgtRem.capLeft === 0 || noTarget;
                // 시간대 보너스 — 아침 먹이/낮 쓰다듬기/밤 명상이면 +6
                const inWin = inActionWindow(a.kind);
                const win = ACTION_WINDOW[a.kind];
                // disabled 대신 탭 피드백 — 무반응(버그 체감) 제거
                const onTap = () => {
                  if (noTarget) { showNotice('가장 영험한 모습이에요 — 새 정령을 만나 기운을 나눠보세요 ✦'); return; }
                  if (used) { showNotice(mentee ? `${mentee.sp.name}는 오늘 이 교감을 받았어요 🌙` : '오늘은 이미 교감했어요 · 내일 또 만나요 🌙'); return; }
                  if (tgtRem.capLeft === 0) { showNotice(mentee ? `${mentee.sp.name}는 오늘 충분히 자랐어요 🌙` : '오늘은 다 컸어요 🌙 내일 또 만나요'); return; }
                  doCare(a.kind, a.ic);
                };
                return (
                  <button key={a.kind} onClick={onTap} className="v2-press" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '2px 2px', minHeight: 44, borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--v2-font)', background: 'transparent', border: 'none', opacity: off ? 0.4 : 1, position: 'relative' }}>
                    {inWin && !off && <span style={{ position: 'absolute', top: -7, right: '50%', transform: 'translateX(34px)', fontSize: 8.5, fontWeight: 900, color: '#1b1230', background: 'var(--v2-butter)', padding: '2px 6px', borderRadius: 7, whiteSpace: 'nowrap', boxShadow: '0 0 10px rgba(255,210,122,.5)' }}>{win.emoji} 지금</span>}
                    <span style={{ width: 44, height: 44, borderRadius: 15, background: `${a.c}1f`, color: a.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, boxShadow: off ? 'none' : inWin ? `0 0 18px ${a.c}55, 0 0 8px rgba(255,210,122,.35)` : `0 0 16px ${a.c}26`, border: inWin && !off ? '1.5px solid rgba(255,210,122,.55)' : '1.5px solid transparent' }}>{a.ic}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--v2-ink)' }}>{a.t}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: used ? 'var(--v2-ink-mute)' : inWin ? 'var(--v2-butter)' : a.c }}>{used ? '완료' : `+${a.amt + (inWin ? TIME_BONUS : 0)}${inWin ? ' ✨' : ''}`}</span>
                  </button>
                );
              })}
            </div>
            {/* 시간대 안내 — 제철 교감에 보너스 */}
            {(stage < 4 || mentee) && (() => {
              const nowKind = (['feed', 'pet', 'meditate'] as const).find((k) => inActionWindow(k));
              if (!nowKind || tgtRem.actions[nowKind]) return null;
              const w = ACTION_WINDOW[nowKind];
              const nm = { feed: '먹이주기', pet: '쓰다듬기', meditate: '명상하기' }[nowKind];
              return <div style={{ marginTop: 8, textAlign: 'center', fontSize: 10.5, color: 'var(--v2-ink-dim)' }}>{w.emoji} 지금은 {w.label} — <b style={{ color: 'var(--v2-butter)' }}>{nm}</b>에 +{TIME_BONUS} 보너스가 붙어요</div>;
            })()}
            {notice && <div style={{ marginTop: 9, textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: 'var(--v2-lavender)', animation: 'v2-rise-soft .3s ease' }}>{notice}</div>}
            {/* 영험인데 나눠줄 정령이 없음 → 새 정령 만나기 CTA */}
            {stage >= 4 && !mentee && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 11 }}>
                <button onClick={() => go('addProfile')} className="v2-press" style={{ padding: '11px 8px', borderRadius: 12, border: '1px solid var(--v2-glass-line2)', background: 'var(--v2-glass)', color: 'var(--v2-ink)', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--v2-font)' }}>🔮 다른 사주 추가</button>
                <button onClick={() => go('gunghap')} className="v2-press" style={{ padding: '11px 8px', borderRadius: 12, border: '1px solid var(--v2-glass-line2)', background: 'var(--v2-glass)', color: 'var(--v2-ink)', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--v2-font)' }}>💑 궁합으로 만나기</button>
              </div>
            )}
            {(stage < 4 || mentee) && tgtRem.capLeft > 0 && tgtRem.adsLeft > 0 && (
              <button onClick={doAd} disabled={adLoading} className="v2-press" style={{ marginTop: 11, width: '100%', padding: '10px', borderRadius: 12, border: '1px dashed var(--v2-glass-line2)', background: 'rgba(255,210,122,.08)', color: 'var(--v2-butter)', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--v2-font)' }}>{adLoading ? '광고 여는 중…' : `🎬 광고 보고 +${AD_GAIN} 교감 (오늘 ${tgtRem.adsLeft}회 가능)`}</button>
            )}
            {(stage < 4 || mentee) && tgtRem.capLeft === 0 && (
              <div style={{ marginTop: 11, textAlign: 'center', fontSize: 11.5, color: 'var(--v2-ink-dim)' }}>오늘은 충분히 자랐어요 🌙 내일 또 만나요</div>
            )}
          </V2Glass>}
      </Rise>
      </div>
      {evolving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,11,28,.86)' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 44%, ${spirit.elem.raw}55, transparent 60%)`, animation: 'v2-flash 1.8s ease forwards', pointerEvents: 'none' }} />
          <div style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* 360° 광선 (conic sunburst) */}
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: 360, height: 360, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 0,
                background: 'conic-gradient(from 0deg, #FFE3A0 0deg 8deg, transparent 8deg 30deg, #FFE3A0 30deg 38deg, transparent 38deg 60deg, #FFE3A0 60deg 68deg, transparent 68deg 90deg, #FFE3A0 90deg 98deg, transparent 98deg 120deg, #FFE3A0 120deg 128deg, transparent 128deg 150deg, #FFE3A0 150deg 158deg, transparent 158deg 180deg, #FFE3A0 180deg 188deg, transparent 188deg 210deg, #FFE3A0 210deg 218deg, transparent 218deg 240deg, #FFE3A0 240deg 248deg, transparent 248deg 270deg, #FFE3A0 270deg 278deg, transparent 278deg 300deg, #FFE3A0 300deg 308deg, transparent 308deg 330deg, #FFE3A0 330deg 338deg, transparent 338deg 360deg)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 30%, #000 55%, transparent 78%)',
                maskImage: 'radial-gradient(circle, transparent 30%, #000 55%, transparent 78%)',
                animation: 'v2-evo-rays 1.4s ease-out forwards' }} />
              {/* 코어 플래시 */}
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: 240, height: 240, transform: 'translate(-50%,-50%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
                background: 'radial-gradient(circle, #fff 0%, #FFE9A8 35%, transparent 70%)',
                animation: 'v2-evo-flash 1.1s ease-out forwards' }} />
              {/* 원소색 충격파 링 */}
              {[0, 320, 640].map((d, i) => (
                <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: 150, height: 150, borderRadius: '50%', border: `2px solid ${spirit.elem.raw}`, transform: 'translate(-50%,-50%)', animation: `v2-bond-ring 1.1s cubic-bezier(.2,.8,.4,1) ${d}ms forwards`, pointerEvents: 'none', zIndex: 0 }} />
              ))}
              {/* 정령 */}
              <div style={{ position: 'relative', zIndex: 1, animation: 'v2-evolve-in 1.2s cubic-bezier(.2,.9,.3,1)' }}>
                <SpiritSlot spirit={spirit} size={230} tag={false} stage={nextStage} floating={false} />
              </div>
            </div>
            <div className="v2-display" style={{ marginTop: 10, color: 'var(--v2-ink)', textShadow: '0 0 18px rgba(255,227,160,.85)', position: 'relative', zIndex: 2 }}>✦ 진화! ✦</div>
            <div className="v2-cap" style={{ color: '#FFD27A', marginTop: 4, position: 'relative', zIndex: 2 }}>{STAGE_KO[nextStage]}</div>
          </div>
        </div>
      )}
    </V2Screen>
  );
}

function ScreenCollection({ go, switchTab, back, spirit }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { profiles, activeId, setActive } = useSaju();
  const { progressOf, percent } = useSpiritState();
  const [filter, setFilter] = useState<ElementKey | 'all'>('all');
  const [wish, setWish] = useState<ReturnType<typeof makeSpirit> | null>(null); // 미수집 셀 탭 → 획득 CTA
  // 획득 정령 탭 → 상세 시트 (그 정령의 진짜 모습 + 주인 + 전환 버튼)
  const [view, setView] = useState<{ sp: Spirit; ownerId: string; ownerName: string } | null>(null);
  const owners = useMemo(() => {
    const m = new Map<string, { sp: Spirit; ownerId: string; ownerName: string }>();
    for (const p of profiles) {
      try {
        const sp = spiritFromMyeongsik(computeMyeongsik(p)); // 일주 기반 진짜 등급 포함
        if (!m.has(sp.key)) m.set(sp.key, { sp, ownerId: p.id, ownerName: p.name });
      } catch { /* skip */ }
    }
    return m;
  }, [profiles]);
  const unlocked = useMemo(() => new Set(owners.keys()), [owners]); // 배경 잠금은 BottomSheet가 처리
  const cells = ELEM_ORDER.flatMap((ek) => ZOD_ORDER.map((zk) => {
    const sp = makeSpirit(ek, zk);
    return { ek, key: sp.key, sp, got: unlocked.has(sp.key), ready: sp.available };
  })).filter((c) => filter === 'all' || c.ek === filter);
  const ownedCount = unlocked.size;
  const nextGoal = [3, 5, 10, 20, 40, 60].find((n) => n > ownedCount) ?? 60;
  return (
    <V2Screen seed={17} style={{ paddingBottom: 0 }}>
      <V2TopBar onBack={back} title="정령 도감" />
      <Rise><V2Glass style={{ display: 'flex', alignItems: 'center', gap: 14 }} glow="0 0 24px rgba(255,210,122,.16)"><ScoreRing score={Math.round((ownedCount / 60) * 100)} color="var(--v2-butter)" /><div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{ownedCount} / 60 정령을 만났어요</div>
        <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,.08)', margin: '8px 0 6px', overflow: 'hidden' }}><div style={{ width: `${(ownedCount / 60) * 100}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, var(--v2-butter), var(--v2-peach))', transition: 'width .5s ease' }} /></div>
        <div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', lineHeight: 1.5 }}>{ownedCount >= 60 ? '도감 완성! 모든 정령을 만났어요 🎉' : `다음 목표 ${nextGoal}마리 — ${nextGoal - ownedCount}마리 남았어요. 못 만난 정령을 눌러보세요 ✦`}</div>
      </div></V2Glass></Rise>
      <Rise delay={80}><div style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '18px 0 14px' }} className="ie-scroll"><FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="전체" color="var(--v2-lavender)" />{ELEM_ORDER.map((ek) => <FilterChip key={ek} active={filter === ek} onClick={() => setFilter(ek)} label={`${ELEMENTS[ek].cn} ${ELEMENTS[ek].ko}`} color={ELEMENTS[ek].raw} />)}</div></Rise>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>{cells.map((c, i) => <Rise key={c.key} delay={Math.min(i * 12, 300)}><div onClick={() => c.got ? setView(owners.get(c.key) ?? null) : setWish(c.sp)} style={{ position: 'relative', padding: '14px 6px 11px', borderRadius: 'var(--v2-r-md)', textAlign: 'center', cursor: 'pointer', background: c.got ? `linear-gradient(160deg, ${c.sp.elem.raw}1c, var(--v2-glass))` : 'var(--v2-glass)', border: `1px solid ${c.got ? c.sp.elem.raw + '44' : 'var(--v2-glass-line2)'}`, opacity: c.got ? 1 : (c.ready ? 0.85 : 0.5) }}>
        <div style={{ width: 52, height: 52, margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden', background: c.got ? `radial-gradient(circle at 38% 34%, #fff8, ${c.sp.elem.raw}, ${c.sp.rarity.raw})` : 'rgba(255,255,255,.05)', boxShadow: c.got ? `0 0 16px ${c.sp.elem.raw}88` : 'none', border: c.got ? 'none' : '1px dashed var(--v2-glass-line2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'var(--v2-ink-mute)' }}>
          {c.got ? (c.sp.imageFor(1) ? <img src={c.sp.imageFor(1) as string} alt={c.sp.name} style={{ width: '118%', height: '118%', objectFit: 'contain' }} /> : c.sp.zod.emoji) : '?'}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: c.got ? 'var(--v2-ink)' : 'var(--v2-ink-mute)' }}>{c.got ? c.sp.name : '???'}</div>
        <div style={{ fontSize: 9, color: 'var(--v2-ink-dim)', marginTop: 2 }}>{c.got ? c.sp.formula : (c.ready ? '미발견' : '준비중')}</div>
        {c.got && <div style={{ marginTop: 4 }}><RarityStars rarity={c.sp.rarity} showLabel={false} /></div>}
        {c.key === spirit.key && <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 800, color: '#1b1230', background: 'var(--v2-lavender)', padding: '2px 5px', borderRadius: 5 }}>내 정령</span>}
      </div></Rise>)}</div>
      <div style={{ height: 96 }} />
      {/* 획득 정령 상세 — 진짜 모습·주인·진행도 + 그 사주로 전환 */}
      {view && (() => {
        const vp = progressOf(view.sp.key);
        const vpct = percent(view.sp.key);
        const STG = ['', '아기 정령', '어린 정령', '성체 정령', '영험한 정령'];
        const isActive = view.ownerId === activeId;
        return (
          <BottomSheet onClose={() => setView(null)}>
              <div style={{ textAlign: 'center' }}>
                <SpiritSlot spirit={view.sp} size={150} tag={false} stage={vp.stage} floating={false} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--v2-ink)' }}>{view.sp.name}</span>
                  <RarityStars rarity={view.sp.rarity} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--v2-ink-dim)', marginTop: 4 }}>{view.sp.formula} · <b style={{ color: 'var(--v2-lavender)' }}>{view.ownerName}</b>님의 정령 · {STG[vp.stage]}</div>
                <div style={{ margin: '12px 2px 0' }}>
                  <BondMeter percent={vp.stage >= 4 ? 100 : vpct} label={vp.stage >= 4 ? '기운' : '다음 진화까지'} sub={vp.stage >= 4 ? '최종 진화 완료 ✦' : undefined} />
                </div>
              </div>
              <button
                onClick={() => { if (!isActive) setActive(view.ownerId); setView(null); switchTab('home'); }}
                className="v2-press"
                style={{ marginTop: 14, width: '100%', padding: '13px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--v2-font)', background: 'linear-gradient(120deg, var(--v2-lavender), var(--v2-peach))', color: '#1b1230', fontSize: 13.5, fontWeight: 900 }}
              >{isActive ? '✦ 내 정령 키우러 가기' : `✦ ${view.ownerName}님 사주로 전환해 키우기`}</button>
          </BottomSheet>
        );
      })()}
      {/* 미수집 정령 — 어떻게 만나는지 + 획득 경로 CTA */}
      {wish && (
        <BottomSheet onClose={() => setWish(null)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: `radial-gradient(circle, ${wish.elem.raw}33, var(--v2-glass))`, border: `1.5px dashed ${wish.elem.raw}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>❔</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--v2-ink)' }}>{wish.name} <span style={{ fontSize: 11, color: wish.rarity.raw, fontWeight: 800 }}>· 아직 못 만남</span></div>
                <div style={{ fontSize: 12, color: 'var(--v2-ink-dim)', marginTop: 4, lineHeight: 1.55 }}>일간 <b style={{ color: wish.elem.raw }}>{wish.elem.cn}{wish.elem.ko}</b> · 일지 <b style={{ color: 'var(--v2-lavender)' }}>{wish.zod.ko}({wish.zod.cn})</b>인 사주에서 태어나요</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 16 }}>
              <button onClick={() => { setWish(null); go('gunghap'); }} className="v2-press" style={{ padding: '13px 8px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'var(--v2-font)', background: 'linear-gradient(120deg, var(--v2-lavender), var(--v2-peach))', color: '#1b1230', fontSize: 13, fontWeight: 900 }}>💑 궁합으로 찾기</button>
              <button onClick={() => { setWish(null); go('addProfile'); }} className="v2-press" style={{ padding: '13px 8px', borderRadius: 13, border: '1px solid var(--v2-glass-line2)', cursor: 'pointer', fontFamily: 'var(--v2-font)', background: 'var(--v2-glass)', color: 'var(--v2-ink)', fontSize: 13, fontWeight: 800 }}>🔮 다른 사주 추가</button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--v2-ink-dim)', marginTop: 11 }}>가족·친구 사주를 풀어보면 그 정령이 도감에 담겨요 ✦</div>
        </BottomSheet>
      )}
    </V2Screen>
  );
}



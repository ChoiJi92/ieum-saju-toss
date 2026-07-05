import { useEffect, useMemo, useRef, useState } from 'react';
import { useSaju } from '../../lib/saju-state';
import { ilganOf, calcGunghap, type GunghapResult } from '../../lib/gunghap';
import { preloadRewardedAdForResult, showRewardedAdForResult } from '../../lib/ads';
import { consumePendingShare, shareGunghapResult, type SharePayload } from '../../lib/invite';
import { V2Screen, V2TopBar, V2Label, V2Button, V2Glass, AxisRow, Chip, SectionCard, ScoreRing, BulletList, DomainEmpty, BIRTH_YEARS, selectChevron } from './_kit';
import type { Route, Tab } from './nav';
import type { Spirit } from '../../lib/spirit';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 50,
  padding: '0 16px',
  borderRadius: 'var(--v2-r-md)',
  background: 'var(--v2-glass)',
  border: '1px solid var(--v2-glass-line2)',
  color: 'var(--v2-ink)',
  fontFamily: 'var(--v2-font)',
  fontSize: 15,
  fontWeight: 700,
  outline: 'none',
  boxSizing: 'border-box',
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 800,
  color: 'var(--v2-ink-dim)',
  marginBottom: 6,
};

/** 한 사람 입력 폼 (이름·연·월·일) */
function PersonForm(props: {
  name: string; setName: (v: string) => void;
  year: string; setYear: (v: string) => void;
  month: string; setMonth: (v: string) => void;
  day: string; setDay: (v: string) => void;
  namePlaceholder: string;
  accent: string;
  gender?: 'male' | 'female' | null;
  setGender?: (g: 'male' | 'female') => void;
}) {
  const { name, setName, year, setYear, month, setMonth, day, setDay, namePlaceholder, accent, gender, setGender } = props;
  return (
    <V2Glass style={{ display: 'flex', flexDirection: 'column', gap: 14, borderLeft: `3px solid ${accent}` }}>
      <div>
        <div style={fieldLabelStyle}>이름</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={namePlaceholder} style={inputStyle} />
      </div>
      <div>
        <div style={fieldLabelStyle}>태어난 해</div>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={{ ...inputStyle, ...selectChevron }}>
          <option value="">태어난 해</option>
          {BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={fieldLabelStyle}>월</div>
          <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ ...inputStyle, ...selectChevron }}>
            <option value="">월</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={fieldLabelStyle}>일</div>
          <select value={day} onChange={(e) => setDay(e.target.value)} style={{ ...inputStyle, ...selectChevron }}>
            <option value="">일</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}일</option>)}
          </select>
        </div>
      </div>
      {setGender && (
        <div>
          <div style={fieldLabelStyle}>성별 <span style={{ color: 'var(--v2-ink-dim)', fontWeight: 600 }}>(선택)</span></div>
          <div style={{ display: 'flex', gap: 10 }}>
            {([['male', '남자'], ['female', '여자']] as const).map(([g, lbl]) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                style={{ flex: 1, height: 46, borderRadius: 'var(--v2-r-md)', cursor: 'pointer', fontFamily: 'var(--v2-font)', fontSize: 14, fontWeight: 800, background: gender === g ? accent : 'var(--v2-glass)', color: gender === g ? '#1b1230' : 'var(--v2-ink-mid)', border: `1px solid ${gender === g ? accent : 'var(--v2-glass-line2)'}` }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}
    </V2Glass>
  );
}

export default function ScreenGunghap({ back, switchTab, guestOnboard }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab; guestOnboard?: () => void }) {
  const { profile, selfProfile, addProfile } = useSaju();
  const base = profile ?? selfProfile; // 지금 선택된(보고 있는) 사람

  // 공유 링크로 진입한 경우 — 두 사람 정보 담긴 페이로드 (1회 소비)
  const shared = useMemo(() => consumePendingShare(), []);

  // 공유 진입이면 바로 결과 계산 (광고 우회)
  const initResult = useMemo<GunghapResult | null>(() => {
    if (!shared) return null;
    const a = ilganOf(shared.a.y, shared.a.m, shared.a.d);
    const b = ilganOf(shared.b.y, shared.b.m, shared.b.d);
    if (a && b) return calcGunghap(a, b, shared.b.n);
    return null;
  }, [shared]);

  // 첫 번째 사람 — 선택된 사람 정보로 기본 입력 (수정 가능)
  const [p1name, setP1name] = useState(shared?.a.n ?? base?.name ?? '나');
  const [p1year, setP1year] = useState(shared ? String(shared.a.y) : (base ? String(base.year) : ''));
  const [p1month, setP1month] = useState(shared ? String(shared.a.m) : (base ? String(base.month) : ''));
  const [p1day, setP1day] = useState(shared ? String(shared.a.d) : (base ? String(base.day) : ''));
  // 두 번째 사람
  const [p2name, setP2name] = useState(shared?.b.n ?? '');
  const [p2gender, setP2gender] = useState<'male' | 'female' | null>(shared?.b.g ?? null);
  const [p2year, setP2year] = useState(shared ? String(shared.b.y) : '');
  const [p2month, setP2month] = useState(shared ? String(shared.b.m) : '');
  const [p2day, setP2day] = useState(shared ? String(shared.b.d) : '');

  const [result, setResult] = useState<GunghapResult | null>(initResult);
  // 공유 진입 여부 — 결과 화면에서 CTA 표시 / 공유 버튼 동작 판단용
  const [isSharedView, setIsSharedView] = useState(shared !== null);
  const [saved, setSaved] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adMsg, setAdMsg] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  // 로드/표시 반복 실패 시 결과가 영영 안 열리는 일이 없도록 폴백 카운터
  const failRef = useRef(0);
  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const canBypass = import.meta.env.DEV && import.meta.env.VITE_AD_DEV_BYPASS !== 'false' && isLocalhost;
  // 입력하는 동안 광고 미리 준비 (버튼 누르면 바로 뜨도록) — 공유 진입이면 불필요
  useEffect(() => { if (!canBypass && !shared) void preloadRewardedAdForResult(); }, [canBypass, shared]);

  if (!base && !shared) return <DomainEmpty title="궁합" back={back} />;

  const filled = (n: string, y: string, m: string, d: string) => n.trim().length > 0 && y.length === 4 && m !== '' && d !== '';
  const ready = filled(p1name, p1year, p1month, p1day) && filled(p2name, p2year, p2month, p2day);

  const calc = () => {
    const a = ilganOf(Number(p1year), Number(p1month), Number(p1day));
    const b = ilganOf(Number(p2year), Number(p2month), Number(p2day));
    if (a && b) { setResult(calcGunghap(a, b, p2name)); setIsSharedView(false); }
  };

  // 공유 결과를 본 사람이 "내 궁합도 보기" — 남의 정보 지우고 본인 기준 빈 폼으로 시작
  const startOwnGunghap = () => {
    setP1name(base?.name ?? '나');
    setP1year(base ? String(base.year) : '');
    setP1month(base ? String(base.month) : '');
    setP1day(base ? String(base.day) : '');
    setP2name(''); setP2gender(null); setP2year(''); setP2month(''); setP2day('');
    setResult(null); setSaved(false); setIsSharedView(false);
  };

  // 결과 공유 — 두 사람 정보를 SharePayload로 만들어 공유
  const doShare = async () => {
    const payload: SharePayload = {
      v: 1,
      a: { n: p1name.trim(), y: Number(p1year), m: Number(p1month), d: Number(p1day), g: base?.gender },
      b: { n: p2name.trim(), y: Number(p2year), m: Number(p2month), d: Number(p2day), g: p2gender ?? undefined },
    };
    const res = await shareGunghapResult(payload);
    if (res === 'shared') setShareMsg('결과 공유 링크를 보냈어요 💌');
    else if (res === 'copied') setShareMsg('결과 링크를 복사했어요 — 붙여넣어 보내세요 💌');
    else setShareMsg('공유가 잘 안 됐어요. 잠시 후 다시 시도해주세요.');
    window.setTimeout(() => setShareMsg(null), 3000);
  };

  // 광고 본 뒤 결과 공개 (두 사람 입력 완료 후) — 공유 진입은 이 함수를 거치지 않음
  const submit = async () => {
    if (!ready || adLoading) return;
    if (canBypass) { calc(); return; }
    setAdLoading(true); setAdMsg(null);
    let res = await showRewardedAdForResult();
    // 콜드 스타트로 첫 로드가 실패하면 데워진 상태로 1회 조용히 재시도
    if (res === 'failed') { setAdMsg('광고 준비 중… 잠시만요'); res = await showRewardedAdForResult(); }
    setAdLoading(false);
    // 광고를 끝까지(또는 실제 노출 후) 봤거나, 광고를 띄울 수 없는 환경이면 결과 공개
    if (res === 'rewarded' || res === 'watched' || res === 'unsupported' || res === 'not_configured') { calc(); return; }
    if (res === 'dismissed') { setAdMsg('광고를 끝까지 보면 궁합 결과가 열려요.'); return; }
    // 'failed' — 반복 실패 시 사용자를 가두지 않도록 폴백 공개
    failRef.current += 1;
    if (failRef.current >= 2) { setAdMsg('광고가 원활하지 않아 이번엔 바로 열어드릴게요.'); calc(); return; }
    setAdMsg('광고를 불러오지 못했어요. 다시 시도해주세요.');
  };

  // ── 결과 화면 ──
  const r = result;
  if (r) {
    return (
      <V2Screen seed={37}>
        <V2TopBar onBack={guestOnboard ?? (isSharedView ? () => switchTab('home') : () => { setResult(null); setSaved(false); setIsSharedView(false); })} title="궁합" />
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--v2-ink-mid)', marginTop: 6 }}>
          {p1name || '나'} <span style={{ color: 'var(--v2-rose)' }}>♥</span> {p2name || '상대'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 10 }}>
          <ScoreRing score={r.totalScore} color="var(--v2-rose)" />
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--v2-ink)', marginTop: 14 }}>{r.tagline}</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--v2-ink-mid)', marginTop: 10, maxWidth: 320 }}>{r.comment}</div>
        </div>

        <V2Label>네 가지 합</V2Label>
        <AxisRow axes={r.axes.map((a) => ({ ic: a.ic, lbl: a.lbl, score: a.score, color: a.color, oneLine: a.body }))} />

        <V2Label>잘 맞는 점</V2Label>
        <BulletList items={r.strengths} />

        <V2Label>조심할 점</V2Label>
        <BulletList items={r.cautions} />

        <V2Label>데이트 아이디어</V2Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {r.dates.map((d, i) => <Chip key={i} color="var(--v2-rose)">{d}</Chip>)}
        </div>

        <V2Label>오래 보려면</V2Label>
        <SectionCard title="장기 전망" body={r.longTerm} color="var(--v2-rose)" />

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 결과 공유 — 항상 노출 (자기가 계산한 결과도 공유 가능) */}
          <V2Button onClick={doShare}>결과 공유하기 💌</V2Button>
          {shareMsg && <div style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: 'var(--v2-rose)' }}>{shareMsg}</div>}

          {/* 공유 결과 열람 시 — 내 궁합 보러 가기 CTA */}
          {isSharedView ? (
            <V2Button
              kind="ghost"
              onClick={guestOnboard ?? startOwnGunghap}
            >
              {guestOnboard ? '나만의 정령 만들기 ✦' : '너도 궁금한 사람 있어? 궁합 보러 가기'}
            </V2Button>
          ) : (
            <>
              <V2Button
                onClick={() => {
                  addProfile({ name: p2name || '상대', year: Number(p2year), month: Number(p2month), day: Number(p2day), calendar: 'solar', gender: p2gender ?? 'female' }, '연인');
                  setSaved(true);
                }}
              >
                상대 정령 도감에 담기
              </V2Button>
              {saved && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--v2-rose)' }}>도감에 담았어요 ✦</div>}
              <V2Button kind="ghost" onClick={() => { setResult(null); setSaved(false); }}>다시 보기</V2Button>
            </>
          )}
        </div>
        <div style={{ height: 96 }} />
      </V2Screen>
    );
  }

  // ── 입력 화면 (두 사람) ──
  return (
    <V2Screen seed={37}>
      <V2TopBar onBack={back} title="궁합" />
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--v2-ink-mid)', margin: '8px 0 4px' }}>
        두 사람의 생년월일로 궁합을 봐요. 첫 번째는 지금 보고 있는 사주로 채워뒀어요 — 바꿔도 돼요.
      </div>

      <V2Label>첫 번째 — {p1name || '나'}</V2Label>
      <PersonForm
        name={p1name} setName={setP1name}
        year={p1year} setYear={setP1year}
        month={p1month} setMonth={setP1month}
        day={p1day} setDay={setP1day}
        namePlaceholder="내 이름"
        accent="var(--v2-lavender)"
      />

      <V2Label>두 번째 — 상대</V2Label>
      <PersonForm
        name={p2name} setName={setP2name}
        year={p2year} setYear={setP2year}
        month={p2month} setMonth={setP2month}
        day={p2day} setDay={setP2day}
        namePlaceholder="상대 이름"
        accent="var(--v2-rose)"
        gender={p2gender} setGender={setP2gender}
      />

      <div style={{ marginTop: 20 }}>
        {adMsg && <V2Glass style={{ marginBottom: 12, textAlign: 'center' }}><span style={{ color: canBypass ? 'var(--v2-mint)' : 'var(--v2-peach)', fontSize: 13, fontWeight: 700 }}>{adMsg}</span></V2Glass>}
        <V2Button onClick={submit} style={ready ? {} : { opacity: 0.4, pointerEvents: 'none' }}>{adLoading ? '광고 여는 중…' : '광고 보고 궁합 보기 ✦'}</V2Button>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--v2-ink-dim)', marginTop: 8 }}>{canBypass ? '로컬 개발모드: 광고 없이 바로 결과' : '짧은 광고 후 두 사람의 궁합이 열려요'}</div>
      </div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

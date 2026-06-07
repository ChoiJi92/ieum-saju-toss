import { useEffect, useState } from 'react';
import { useSaju } from '../../lib/saju-state';
import { ilganOf, calcGunghap, type GunghapResult } from '../../lib/gunghap';
import { preloadRewardedAdForResult, showRewardedAdForResult } from '../../lib/ads';
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
}) {
  const { name, setName, year, setYear, month, setMonth, day, setDay, namePlaceholder, accent } = props;
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
    </V2Glass>
  );
}

export default function ScreenGunghap({ back }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { profile, selfProfile, addProfile } = useSaju();
  const base = profile ?? selfProfile; // 지금 선택된(보고 있는) 사람

  // 첫 번째 사람 — 선택된 사람 정보로 기본 입력 (수정 가능)
  const [p1name, setP1name] = useState(base?.name ?? '나');
  const [p1year, setP1year] = useState(base ? String(base.year) : '');
  const [p1month, setP1month] = useState(base ? String(base.month) : '');
  const [p1day, setP1day] = useState(base ? String(base.day) : '');
  // 두 번째 사람 — 상대
  const [p2name, setP2name] = useState('');
  const [p2year, setP2year] = useState('');
  const [p2month, setP2month] = useState('');
  const [p2day, setP2day] = useState('');

  const [result, setResult] = useState<GunghapResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [adMsg, setAdMsg] = useState<string | null>(null);
  const isLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const canBypass = import.meta.env.DEV && import.meta.env.VITE_AD_DEV_BYPASS !== 'false' && isLocalhost;
  // 입력하는 동안 광고 미리 준비 (버튼 누르면 바로 뜨도록)
  useEffect(() => { if (!canBypass) void preloadRewardedAdForResult(); }, [canBypass]);

  if (!base) return <DomainEmpty title="궁합" back={back} />;

  const filled = (n: string, y: string, m: string, d: string) => n.trim().length > 0 && y.length === 4 && m !== '' && d !== '';
  const ready = filled(p1name, p1year, p1month, p1day) && filled(p2name, p2year, p2month, p2day);

  const calc = () => {
    const a = ilganOf(Number(p1year), Number(p1month), Number(p1day));
    const b = ilganOf(Number(p2year), Number(p2month), Number(p2day));
    if (a && b) setResult(calcGunghap(a, b, p2name));
  };

  // 광고 본 뒤 결과 공개 (두 사람 입력 완료 후)
  const submit = async () => {
    if (!ready || adLoading) return;
    if (canBypass) { calc(); return; }
    setAdLoading(true); setAdMsg(null);
    const res = await showRewardedAdForResult();
    setAdLoading(false);
    if (res === 'rewarded') { calc(); return; }
    if (res === 'dismissed') setAdMsg('광고를 끝까지 보면 궁합 결과가 열려요.');
    else if (res === 'not_configured') setAdMsg('아직 광고가 설정되지 않았어요.');
    else if (res === 'unsupported') setAdMsg('지금 환경에선 광고를 볼 수 없어요. 토스 앱에서 확인해주세요.');
    else setAdMsg('광고를 불러오지 못했어요. 다시 시도해주세요.');
  };

  // ── 결과 화면 ──
  const r = result;
  if (r) {
    return (
      <V2Screen seed={37}>
        <V2TopBar onBack={() => setResult(null)} title="궁합" />
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
          <V2Button
            onClick={() => {
              addProfile({ name: p2name || '상대', year: Number(p2year), month: Number(p2month), day: Number(p2day), calendar: 'solar', gender: 'female' }, '연인');
              setSaved(true);
            }}
          >
            상대 정령 도감에 담기
          </V2Button>
          {saved && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, color: 'var(--v2-rose)' }}>도감에 담았어요 ✦</div>}
          <V2Button kind="ghost" onClick={() => { setResult(null); setSaved(false); }}>다시 보기</V2Button>
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

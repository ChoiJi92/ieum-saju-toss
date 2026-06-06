import { useState } from 'react';
import { useSaju } from '../../lib/saju-state';
import { ilganOf, calcGunghap, type GunghapResult } from '../../lib/gunghap';
import { V2Screen, V2TopBar, V2Label, V2Button, V2Glass, AxisRow, Chip, SectionCard, ScoreRing, BulletList, DomainEmpty } from './_kit';
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

export default function ScreenGunghap({ back }: { go: (r: Route) => void; back: () => void; switchTab: (t: Tab) => void; spirit: Spirit; tab: Tab }) {
  const { myeongsik, selfProfile, addProfile } = useSaju();
  void myeongsik;
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [result, setResult] = useState<GunghapResult | null>(null);
  const [saved, setSaved] = useState(false);

  if (!selfProfile) return <DomainEmpty title="궁합" back={back} />;

  const ready = name.trim().length > 0 && year.length === 4 && month !== '' && day !== '';

  const calc = () => {
    const my = ilganOf(selfProfile.year, selfProfile.month, selfProfile.day);
    const other = ilganOf(Number(year), Number(month), Number(day));
    if (my && other) setResult(calcGunghap(my, other, name));
  };

  // ── 결과 화면 ──
  const r = result;
  if (r) {
    return (
      <V2Screen seed={37}>
        <V2TopBar onBack={() => setResult(null)} title="궁합" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: 8 }}>
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
              addProfile({ name: name || '상대', year: Number(year), month: Number(month), day: Number(day), calendar: 'solar', gender: 'female' }, '연인');
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

  // ── 입력 화면 ──
  return (
    <V2Screen seed={37}>
      <V2TopBar onBack={back} title="궁합" />
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--v2-ink-mid)', margin: '8px 0 4px' }}>
        궁금한 상대의 생년월일을 입력하면, 두 사람의 결이 얼마나 맞는지 풀어드려요.
      </div>

      <V2Glass style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={fieldLabelStyle}>이름</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="상대 이름"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={fieldLabelStyle}>태어난 해</div>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="예: 1995"
            inputMode="numeric"
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={fieldLabelStyle}>월</div>
            <select value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle}>
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={fieldLabelStyle}>일</div>
            <select value={day} onChange={(e) => setDay(e.target.value)} style={inputStyle}>
              <option value="">일</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}일</option>
              ))}
            </select>
          </div>
        </div>
      </V2Glass>

      <div style={{ marginTop: 20 }}>
        <V2Button onClick={calc} style={ready ? {} : { opacity: 0.4, pointerEvents: 'none' }}>궁합 보기</V2Button>
      </div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

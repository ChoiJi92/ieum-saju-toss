import { useState } from 'react';
import { V2Screen, V2TopBar, V2Button } from './_kit';
import { useSaju, type ProfileRelation } from '../../lib/saju-state';
import type { Tab } from './nav';

export default function ScreenAddProfile({ back, switchTab }: { back: () => void; switchTab: (t: Tab) => void }) {
  const { addProfile, setActive } = useSaju();
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [cal, setCal] = useState<'solar' | 'lunar'>('solar');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [relation, setRelation] = useState<ProfileRelation>('친구');
  const canSave = name.trim().length > 0 && year.length === 4 && month !== '' && day !== '' && gender !== null;
  const field: React.CSSProperties = { width: '100%', padding: '13px 16px', borderRadius: 'var(--v2-r-md)', background: 'var(--v2-glass)', border: '1.5px solid var(--v2-glass-line2)', color: 'var(--v2-ink)', fontFamily: 'var(--v2-font)', fontSize: 16, fontWeight: 700, outline: 'none' };
  const save = () => {
    if (!canSave || gender === null) return;
    const id = addProfile({ name: name.trim(), year: +year, month: +month, day: +day, calendar: cal, leapMonth: false, hour: undefined, minute: 0, gender }, relation);
    setActive(id);
    switchTab('home');
  };
  return (
    <V2Screen seed={24}>
      <V2TopBar onBack={back} title="다른 사주 추가" />
      <p className="v2-body" style={{ color: 'var(--v2-ink-dim)', margin: '4px 2px 18px' }}>추가하면 그 사람 사주로 바로 전환되고, 정령이 도감에 담겨요 ✦</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" />
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 999, background: 'var(--v2-glass)', border: '1px solid var(--v2-glass-line2)' }}>
          {([['solar', '양력'], ['lunar', '음력']] as const).map(([k, t]) => <button key={k} onClick={() => setCal(k)} style={{ flex: 1, padding: '10px 0', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--v2-font)', fontSize: 13.5, fontWeight: 800, background: cal === k ? 'linear-gradient(120deg,var(--v2-lavender),var(--v2-peach))' : 'transparent', color: cal === k ? '#1b1230' : 'var(--v2-ink-dim)' }}>{t}</button>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 8 }}>
          <input style={field} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="년(4자리)" />
          <select style={field} value={month} onChange={(e) => setMonth(e.target.value)}><option value="">월</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}월</option>)}</select>
          <select style={field} value={day} onChange={(e) => setDay(e.target.value)}><option value="">일</option>{Array.from({ length: 31 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}일</option>)}</select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([['male', '남자'], ['female', '여자']] as const).map(([k, t]) => <button key={k} onClick={() => setGender(k)} style={{ ...field, textAlign: 'center', cursor: 'pointer', background: gender === k ? 'linear-gradient(120deg,var(--v2-lavender),var(--v2-peach))' : 'var(--v2-glass)', color: gender === k ? '#1b1230' : 'var(--v2-ink)' }}>{t}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['가족', '친구', '연인', '기타'] as ProfileRelation[]).map((r) => <button key={r} onClick={() => setRelation(r)} style={{ padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--v2-font)', fontSize: 13, fontWeight: 800, background: relation === r ? 'var(--v2-lavender)' : 'var(--v2-glass)', color: relation === r ? '#1b1230' : 'var(--v2-ink-mid)', border: '1px solid var(--v2-glass-line2)' }}>{r}</button>)}
        </div>
      </div>
      <div style={{ marginTop: 22 }}><V2Button onClick={save} style={{ opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}>이 사주로 보기 ✦</V2Button></div>
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

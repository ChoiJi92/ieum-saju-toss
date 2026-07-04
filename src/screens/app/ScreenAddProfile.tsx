import { useState } from 'react';
import { V2Screen, V2TopBar, V2Button, BIRTH_YEARS, selectChevron, BottomSheet } from './_kit';
import { useSaju, type ProfileRelation } from '../../lib/saju-state';
import { computeMyeongsik } from '../../lib/saju';
import type { Tab } from './nav';

// 시진(時辰) 목록 — 자·축·인·묘·진·사·오·미·신·유·술·해
const SIJIN_LIST: [string, string][] = [
  ['子', '자시 (23:30~01:30)'], ['丑', '축시 (01:30~03:30)'], ['寅', '인시 (03:30~05:30)'],
  ['卯', '묘시 (05:30~07:30)'], ['辰', '진시 (07:30~09:30)'], ['巳', '사시 (09:30~11:30)'],
  ['午', '오시 (11:30~13:30)'], ['未', '미시 (13:30~15:30)'], ['申', '신시 (15:30~17:30)'],
  ['酉', '유시 (17:30~19:30)'], ['戌', '술시 (19:30~21:30)'], ['亥', '해시 (21:30~23:30)'],
];
// 시진 → 대표 시각(hour) 매핑
const SIJIN_HOUR: Record<string, number> = { 子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10, 午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22 };

/** 시진 선택 필드 + 바텀시트 */
function SijinField({ sijin, unknownTime, onPick, field }: {
  sijin: string; unknownTime: boolean;
  onPick: (next: { sijin: string; unknownTime: boolean }) => void;
  field: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ ...field, textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{unknownTime ? '태어난 시간 — 모름' : SIJIN_LIST.find(([k]) => k === sijin)?.[1]}</span>
        <span style={{ color: 'var(--v2-ink-dim)' }}>▾</span>
      </button>
      {open && (
        <BottomSheet onClose={() => setOpen(false)} maxHeight="76dvh">
          {[['__unknown', '모름 (시간을 몰라요)'] as [string, string], ...SIJIN_LIST].map(([k, lbl]) => {
            const sel = (k === '__unknown' && unknownTime) || (k !== '__unknown' && !unknownTime && sijin === k);
            return (
              <div
                key={k}
                onClick={() => { onPick(k === '__unknown' ? { sijin, unknownTime: true } : { sijin: k, unknownTime: false }); setOpen(false); }}
                style={{ padding: '13px 22px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center', background: sel ? 'rgba(183,156,255,.12)' : 'transparent', color: sel ? 'var(--v2-ink)' : 'var(--v2-ink-mid)', fontSize: 15, fontWeight: 700 }}
              >
                <span style={{ width: 16, color: 'var(--v2-lavender)' }}>{sel ? '✓' : ''}</span>{lbl}
              </div>
            );
          })}
        </BottomSheet>
      )}
    </>
  );
}

export default function ScreenAddProfile({ back, switchTab }: { back: () => void; switchTab: (t: Tab) => void }) {
  const { addProfile, setActive } = useSaju();
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [cal, setCal] = useState<'solar' | 'lunar'>('solar');
  const [leap, setLeap] = useState(false); // 윤달 여부 (음력만)
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [relation, setRelation] = useState<ProfileRelation>('친구');
  // 시진(태어난 시간) — 기본 미시(未), 초기값은 "모름" 상태
  const [sijin, setSijin] = useState('未');
  const [unknownTime, setUnknownTime] = useState(true);
  const [calErr, setCalErr] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && year.length === 4 && month !== '' && day !== '' && gender !== null;
  const field: React.CSSProperties = { width: '100%', padding: '13px 16px', borderRadius: 'var(--v2-r-md)', background: 'var(--v2-glass)', border: '1.5px solid var(--v2-glass-line2)', color: 'var(--v2-ink)', fontFamily: 'var(--v2-font)', fontSize: 16, fontWeight: 700, outline: 'none' };

  const save = () => {
    if (!canSave || gender === null) return;
    setCalErr(null);
    // 시간 모름이면 hour: undefined — 기존 hour 없는 프로필과 동일하게 처리됨
    const input = {
      name: name.trim(), year: +year, month: +month, day: +day,
      calendar: cal, leapMonth: cal === 'lunar' ? leap : false,
      hour: unknownTime ? undefined : SIJIN_HOUR[sijin],
      minute: 0,
      gender,
    };
    // 음력 날짜는 저장 전 변환 가능 여부 미리 검증
    if (cal === 'lunar') {
      try { computeMyeongsik(input); } catch {
        setCalErr('이 음력 날짜는 변환이 어려워요. 양력 날짜로 입력해 주시겠어요?');
        return;
      }
    }
    const id = addProfile(input, relation);
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
        {/* 윤달 체크 — 온보딩(AppShell)과 동일 패턴 */}
        {cal === 'lunar' && <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--v2-ink-dim)' }}><input type="checkbox" checked={leap} onChange={(e) => setLeap(e.target.checked)} />윤달</label>}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 8 }}>
          <select style={{ ...field, ...selectChevron }} value={year} onChange={(e) => setYear(e.target.value)}><option value="">년</option>{BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}년</option>)}</select>
          <select style={{ ...field, ...selectChevron }} value={month} onChange={(e) => setMonth(e.target.value)}><option value="">월</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}월</option>)}</select>
          <select style={{ ...field, ...selectChevron }} value={day} onChange={(e) => setDay(e.target.value)}><option value="">일</option>{Array.from({ length: 31 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{i + 1}일</option>)}</select>
        </div>
        {/* 태어난 시진 선택 — 시간 모름 포함 */}
        <SijinField
          sijin={sijin}
          unknownTime={unknownTime}
          field={field}
          onPick={({ sijin: s, unknownTime: u }) => { setSijin(s); setUnknownTime(u); }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {([['male', '남자'], ['female', '여자']] as const).map(([k, t]) => <button key={k} onClick={() => setGender(k)} style={{ ...field, textAlign: 'center', cursor: 'pointer', background: gender === k ? 'linear-gradient(120deg,var(--v2-lavender),var(--v2-peach))' : 'var(--v2-glass)', color: gender === k ? '#1b1230' : 'var(--v2-ink)' }}>{t}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['가족', '친구', '연인', '기타'] as ProfileRelation[]).map((r) => <button key={r} onClick={() => setRelation(r)} style={{ padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--v2-font)', fontSize: 13, fontWeight: 800, background: relation === r ? 'var(--v2-lavender)' : 'var(--v2-glass)', color: relation === r ? '#1b1230' : 'var(--v2-ink-mid)', border: '1px solid var(--v2-glass-line2)' }}>{r}</button>)}
        </div>
      </div>
      <div style={{ marginTop: 22 }}><V2Button onClick={save} style={{ opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}>이 사주로 보기 ✦</V2Button></div>
      {calErr && <p style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: 'var(--v2-peach)', textAlign: 'center', lineHeight: 1.5 }}>{calErr}</p>}
      <div style={{ height: 96 }} />
    </V2Screen>
  );
}

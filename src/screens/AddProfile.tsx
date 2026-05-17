import { CSSProperties, useEffect, useState } from 'react';
import {
  IEButton,
  IECalendarToggle,
  IECheckbox,
  IEDateSelect,
  IEInput,
  IESijinSheet,
  IETopBar,
} from '../components/ie';
import { useRouter } from '../lib/router';
import { useSaju, type ProfileRelation } from '../lib/saju-state';
import { SIJIN_HOUR, SIJIN_LABEL, hourToSijin } from '../lib/sijin';

/**
 * 본인 외 사주 추가 화면 (가족·친구·연인·기타).
 * Input 화면과 동일 UI 패턴 — 양력/음력 pill toggle + 시진 bottom sheet.
 */

type Calendar = 'solar' | 'lunar';
type Gender = 'male' | 'female';

const RELATIONS: { value: ProfileRelation; emoji: string; color: string }[] = [
  { value: '가족', emoji: '👨‍👩‍👧', color: '#3DC795' },
  { value: '친구', emoji: '🤝', color: '#5B8DEF' },
  { value: '연인', emoji: '💞', color: '#F495C9' },
  { value: '기타', emoji: '✨', color: '#FFC857' },
];

const inputStyle: CSSProperties = {
  width: '100%',
  height: 56,
  padding: '0 14px',
  background: 'var(--cp-bg-paper)',
  border: '2px solid var(--cp-border)',
  borderRadius: 'var(--cp-radius-md)',
  fontFamily: 'var(--cp-font)',
  fontSize: 17,
  fontWeight: 700,
  color: 'var(--cp-text)',
  textAlign: 'center',
  outline: 'none',
  boxSizing: 'border-box',
  fontVariantNumeric: 'tabular-nums',
};

export default function ScreenAddProfile() {
  const { back } = useRouter();
  const {
    addProfile,
    updateProfile,
    editingProfileId,
    stopEditingProfile,
    profiles,
  } = useSaju();
  const editingProfile = editingProfileId
    ? profiles.find((p) => p.id === editingProfileId) ?? null
    : null;
  const isEdit = !!editingProfile;

  const [relation, setRelation] = useState<ProfileRelation>('가족');
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [calendar, setCalendar] = useState<Calendar>('solar');
  const [leapMonth, setLeapMonth] = useState(false);
  const [sijin, setSijin] = useState('未');
  const [unknownTime, setUnknownTime] = useState(true); // 디폴트 모름
  const [sijinOpen, setSijinOpen] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);

  // 편집 모드 — 기존 정보로 prefill
  useEffect(() => {
    if (!editingProfile) return;
    setRelation(editingProfile.relation === '본인' ? '가족' : editingProfile.relation);
    setName(editingProfile.name);
    setYear(String(editingProfile.year));
    setMonth(String(editingProfile.month).padStart(2, '0'));
    setDay(String(editingProfile.day).padStart(2, '0'));
    setCalendar(editingProfile.calendar);
    setLeapMonth(editingProfile.leapMonth ?? false);
    if (editingProfile.hour !== undefined) {
      setUnknownTime(false);
      setSijin(hourToSijin(editingProfile.hour));
    } else {
      setUnknownTime(true);
    }
    setGender(editingProfile.gender);
  }, [editingProfile]);

  // 화면 이탈 시 편집 상태 클리어
  useEffect(() => {
    return () => {
      stopEditingProfile();
    };
  }, [stopEditingProfile]);

  const canSave =
    name.trim().length > 0 &&
    year.length === 4 &&
    month.length === 2 &&
    day.length === 2 &&
    gender !== null;

  const handleSave = () => {
    if (!canSave || gender === null) return;
    const input = {
      name: name.trim(),
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      day: parseInt(day, 10),
      calendar,
      leapMonth: calendar === 'lunar' ? leapMonth : false,
      hour: unknownTime ? undefined : SIJIN_HOUR[sijin],
      minute: 0,
      gender,
    };
    if (isEdit && editingProfileId) {
      updateProfile(editingProfileId, { ...input, relation });
    } else {
      addProfile(input, relation);
    }
    back(); // Profiles 화면으로
  };

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <IETopBar onBack={back} title={isEdit ? '사주 수정' : '새 사주 등록'} />
      <div className="ie-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 120px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, margin: '12px 0 6px' }}>
          {isEdit ? `${editingProfile?.name ?? ''} 사주 수정` : '누구의 사주인가요?'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--cp-text-dim)', margin: '0 0 22px', lineHeight: 1.5 }}>
          {isEdit ? '관계와 정보를 수정해주세요' : '관계를 선택하고 정보를 입력해주세요'}
        </p>

        {/* 관계 선택 */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--cp-text-dim)',
              fontWeight: 700,
              letterSpacing: 0.4,
              marginBottom: 8,
            }}
          >
            관계
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {RELATIONS.map((r) => {
              const active = relation === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => setRelation(r.value)}
                  style={{
                    height: 64,
                    borderRadius: 'var(--cp-radius-md)',
                    background: active ? r.color + '20' : 'var(--cp-bg-paper)',
                    border: active ? `2px solid ${r.color}` : '2px solid var(--cp-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    fontFamily: 'var(--cp-font)',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{r.emoji}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: active ? r.color : 'var(--cp-text-mid)',
                    }}
                  >
                    {r.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <IEInput label="이름" value={name} onChange={setName} placeholder="이름" />

        {/* 생년월일 + 양력/음력 pill toggle (라벨 옆 컴팩트) */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <label
              style={{
                fontSize: 11,
                color: 'var(--cp-text-dim)',
                fontWeight: 700,
                letterSpacing: 0.4,
              }}
            >
              생년월일
            </label>
            <IECalendarToggle
              value={calendar}
              onChange={(v) => {
                setCalendar(v);
                if (v === 'solar') setLeapMonth(false);
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 8 }}>
            <IEDateSelect
              value={year}
              onChange={(v) => {
                setYear(v);
                if (v && month && day) {
                  const last = new Date(parseInt(v, 10), parseInt(month, 10), 0).getDate();
                  if (parseInt(day, 10) > last) setDay(String(last).padStart(2, '0'));
                }
              }}
              placeholder="년"
              options={Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => {
                const y = 1900 + i;
                return { value: String(y), label: `${y}년` };
              }).reverse()}
            />
            <IEDateSelect
              value={month}
              onChange={(v) => {
                setMonth(v);
                if (year && v && day) {
                  const last = new Date(parseInt(year, 10), parseInt(v, 10), 0).getDate();
                  if (parseInt(day, 10) > last) setDay(String(last).padStart(2, '0'));
                }
              }}
              placeholder="월"
              options={Array.from({ length: 12 }, (_, i) => ({
                value: String(i + 1).padStart(2, '0'),
                label: `${i + 1}월`,
              }))}
            />
            <IEDateSelect
              value={day}
              onChange={setDay}
              placeholder="일"
              options={Array.from(
                {
                  length:
                    year && month
                      ? new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate()
                      : 31,
                },
                (_, i) => ({
                  value: String(i + 1).padStart(2, '0'),
                  label: `${i + 1}일`,
                })
              )}
            />
          </div>
          {calendar === 'lunar' && (
            <div style={{ marginTop: 10 }}>
              <IECheckbox checked={leapMonth} onChange={setLeapMonth}>
                윤달
              </IECheckbox>
            </div>
          )}
        </div>

        {/* 시진 — Input.tsx 동일 패턴 (모름이 옵션 첫 항목) */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--cp-text-dim)',
              fontWeight: 700,
              letterSpacing: 0.4,
              marginBottom: 6,
            }}
          >
            태어난 시간
          </label>
          <button
            onClick={() => setSijinOpen(true)}
            style={{
              ...inputStyle,
              textAlign: 'left',
              padding: '0 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{unknownTime ? '모름' : SIJIN_LABEL[sijin as keyof typeof SIJIN_LABEL]}</span>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="var(--cp-text-dim)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* 성별 */}
        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--cp-text-dim)',
              fontWeight: 700,
              letterSpacing: 0.4,
              marginBottom: 6,
            }}
          >
            성별
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(['male', 'female'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setGender(k)}
                style={{
                  height: 56,
                  borderRadius: 'var(--cp-radius-md)',
                  background: gender === k ? 'var(--cp-text)' : 'var(--cp-bg-paper)',
                  color: gender === k ? '#fff' : 'var(--cp-text)',
                  border: gender === k ? 'none' : '2px solid var(--cp-border)',
                  fontFamily: 'var(--cp-font)',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {k === 'male' ? '남자' : '여자'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 24px 32px',
          background: 'linear-gradient(180deg, transparent, var(--cp-bg) 30%)',
        }}
      >
        <IEButton
          onClick={handleSave}
          style={{ opacity: canSave ? 1 : 0.4, cursor: canSave ? 'pointer' : 'not-allowed' }}
        >
          {isEdit ? '수정 완료' : '저장하기'}
        </IEButton>
      </div>

      <IESijinSheet
        open={sijinOpen}
        sijin={sijin}
        unknown={unknownTime}
        onClose={() => setSijinOpen(false)}
        onSelect={(s) => {
          setUnknownTime(false);
          setSijin(s);
        }}
        onSelectUnknown={() => setUnknownTime(true)}
      />
    </div>
  );
}

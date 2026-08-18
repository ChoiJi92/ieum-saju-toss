/**
 * 태국 점성술 요일 계산 검증.
 *
 *   npx tsx scripts/verify-thai.ts
 *
 * 검증 축:
 *  1. 달력 요일 정확성 (역사적으로 알려진 요일 고정값 대조)
 *  2. 새벽 6시 경계 (새벽 출생 → 전날 소속)
 *  3. 라후(수요일 밤) 판정 — 수 18시 이후 / 목 새벽
 *  4. 시간 모름 → 달력 요일 그대로 (라후 판정 없음)
 *  5. 음력 입력 → 양력 변환 후 요일 (1995 추석 = 1995-09-09 토요일)
 */
import { thaiBirthDay, type ThaiBirthInput } from '../src/lib/thai-astrology';
import { buildThaiToday, buildThaiMatch, buildThaiMatchRows, THAI_DEEP, THAI_LUCKY, THAI_WORK, THAI_WORST } from '../src/lib/thai-astrology-content';

type Case = { name: string; input: ThaiBirthInput; expect: string };

const solar = (
  year: number, month: number, day: number, hour?: number
): ThaiBirthInput => ({ year, month, day, calendar: 'solar', hour });

const cases: Case[] = [
  // 1. 달력 요일 고정값 (정오 출생 — 경계 영향 없음)
  { name: '2000-01-01 정오 = 토요일', input: solar(2000, 1, 1, 12), expect: 'sat' },
  { name: '1990-06-15 정오 = 금요일', input: solar(1990, 6, 15, 12), expect: 'fri' },
  { name: '2026-08-17 정오 = 월요일', input: solar(2026, 8, 17, 12), expect: 'mon' },

  // 2. 새벽 6시 경계
  { name: '2000-01-01(토) 새벽 3시 → 금요일 소속', input: solar(2000, 1, 1, 3), expect: 'fri' },
  { name: '2000-01-01(토) 아침 6시 → 토요일 유지', input: solar(2000, 1, 1, 6), expect: 'sat' },

  // 3. 라후 (2024-05-15 = 수요일)
  { name: '수요일 낮 12시 → 수요일 낮', input: solar(2024, 5, 15, 12), expect: 'wedDay' },
  { name: '수요일 저녁 19시 → 라후', input: solar(2024, 5, 15, 19), expect: 'wedNight' },
  { name: '목요일 새벽 3시 → 라후', input: solar(2024, 5, 16, 3), expect: 'wedNight' },
  { name: '수요일 새벽 3시 → 화요일 소속 (라후 아님)', input: solar(2024, 5, 15, 3), expect: 'tue' },
  { name: '목요일 아침 7시 → 목요일', input: solar(2024, 5, 16, 7), expect: 'thu' },

  // 4. 시간 모름 — 달력 요일 그대로
  { name: '수요일 시간모름 → 수요일 낮', input: solar(2024, 5, 15), expect: 'wedDay' },

  // 5. 음력 입력 (음력 1995-08-15 = 양력 1995-09-09 토요일)
  {
    name: '음력 1995-08-15 정오 → 토요일',
    input: { year: 1995, month: 8, day: 15, calendar: 'lunar', hour: 12 },
    expect: 'sat',
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const r = thaiBirthDay(c.input);
  const ok = r.key === c.expect;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? '✅' : '❌'} ${c.name} → ${r.key}${ok ? '' : ` (기대: ${c.expect})`}`);
}

console.log(`\n${pass}/${cases.length} 통과${fail ? ` — ${fail}건 실패` : ''}`);
if (fail) process.exit(1);

// ─── 심화 콘텐츠 검증 ───
let pass2 = 0;
let fail2 = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) pass2++;
  else fail2++;
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` → ${detail}` : ''}`);
};

// 오늘의 요일운 — 관계 판정 (2026-08-21 = 금요일 슈크라의 날)
const friday = new Date(2026, 7, 21, 12);
check('라후에게 금요일 = 순풍(friend)', buildThaiToday('wedNight', friday, 's').tier === 'friend');
check('일요일생에게 금요일 = 긴장', buildThaiToday('sun', friday, 's').tier === 'tension');
check('금요일생에게 금요일 = 나의 날', buildThaiToday('fri', friday, 's').tier === 'mine');
// 라후의 날 = 수요일
const wednesday = new Date(2026, 7, 19, 12);
check('라후에게 수요일 = 나의 날', buildThaiToday('wedNight', wednesday, 's').tier === 'mine');
// 시드 결정성 — 같은 시드·날짜는 항상 같은 문장
check(
  '시드 결정성 (같은 입력 = 같은 문장)',
  buildThaiToday('sun', friday, 'abc').line === buildThaiToday('sun', friday, 'abc').line
);
// 템플릿 치환 누락 없음
const allDays = ['sun', 'mon', 'tue', 'wedDay', 'wedNight', 'thu', 'fri', 'sat'] as const;
check(
  '모든 조합 문장에 미치환 플레이스홀더 없음',
  allDays.every((d) => {
    for (let dow = 0; dow < 7; dow++) {
      const t = buildThaiToday(d, new Date(2026, 7, 16 + dow, 12), 'x');
      if (t.line.includes('{') || t.tip.includes('{')) return false;
    }
    return true;
  })
);
// 궁합 — 목록 존재·중복 없음
check(
  '궁합: 8일 전부 잘 맞는 요일 1개 이상',
  allDays.every((d) => buildThaiMatch(d).good.length >= 1)
);
check(
  '궁합: good/hard 겹치는 요일 없음',
  allDays.every((d) => {
    const m = buildThaiMatch(d);
    return m.good.every((g) => !m.hard.includes(g));
  })
);
// 심화·행운 테이블 완결성
check('심화 성격 8일 × 4항목 전부 채워짐', allDays.every((d) => {
  const x = THAI_DEEP[d];
  return [x.look, x.inside, x.strength, x.care].every((s) => s.length > 20);
}));
check('행운 숫자·방위 8일 전부 존재', allDays.every((d) => THAI_LUCKY[d].number > 0 && THAI_LUCKY[d].direction.length > 0));
check('잘 맞는 일 8일 × 3개 전부 존재', allDays.every((d) => THAI_WORK[d].length === 3 && THAI_WORK[d].every((w) => w.length > 1)));
check('조심 조합: 상대가 실제 긴장 관계에 속함', allDays.every((d) => buildThaiMatch(d).hard.length === 0 || buildThaiMatch(d).hard.some(() => true)) && allDays.every((d) => {
  const worstKey = THAI_WORST[d].day;
  return buildThaiMatch(d).hard.length === 0 || buildThaiMatch(d).hard.includes(
    ({ sun: '일요일', mon: '월요일', tue: '화요일', wedDay: '수요일 낮', wedNight: '수요일 밤', thu: '목요일', fri: '금요일', sat: '토요일' } as const)[worstKey]
  );
}));
check('궁합 행: 잘 맞는 요일마다 주는 것 문구 존재', allDays.every((d) => buildThaiMatchRows(d).every((r) => r.gives.length > 3)));

console.log(`\n심화 콘텐츠: ${pass2}/${pass2 + fail2} 통과`);
if (fail2) process.exit(1);

// 샘플 출력 — 콘텐츠 눈검수용
const sample = thaiBirthDay(solar(2024, 5, 15, 19));
console.log('\n─── 샘플 (라후) ───');
console.log(`요일: ${sample.weekdayKr} / 수호신: ${sample.deity.name} — ${sample.deity.desc}`);
console.log(`행운색: ${sample.color.name} (${sample.color.hex}) / 피할 색: ${sample.avoidColor}`);
console.log(`수호불: ${sample.buddha}`);
console.log(`풀이: ${sample.personality}`);
console.log(`키워드: ${sample.keywords.join(' · ')}`);

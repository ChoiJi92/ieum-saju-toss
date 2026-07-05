import { solarToLunar } from '@fullstackfamily/manseryeok';
import { adjustKoreanSolarTime, type SajuInput } from './saju';

/**
 * 자미두수 안성법 엔진 (Phase 1~2: 명궁·12궁·오행국·자미·14주성)
 *
 * 유파 규칙 (삼합파 기준 — scripts/verify-jamidusu.ts 에서 iztro 와 전수 대조):
 *  - 월: 음력 월 그대로 (절기월 아님)
 *  - 윤달: 1~15일 = 본월, 16일~ = 익월 (iztro fixLeap=true 와 동일 규칙)
 *  - 년간: "음력 연도" 기준 (설날 경계). 사주 년주(입춘 경계)와 다를 수 있음 — 자미두수 전통.
 *  - 시지: 사주 엔진과 동일 (-30분 한국 보정 후 시진 — 23:00 출생은 보정 후 22:30 = 해시).
 *    보정 후 23시대 = 자시로 치되 날짜는 달력 생일 유지 (사주 일주 관행과 동일).
 *
 * 검증: 자미성 위치 공식·오호둔·납음오행국은 2026-07-05 iztro@2.5.8 + 손계산 3건(F1/F2/F3)으로
 * 사전 확인했고, scripts/verify-jamidusu.ts 의 9,000+ 차트 전수 대조가 커밋 전 필수.
 */

/** 지지 인덱스 0=자 1=축 2=인 3=묘 4=진 5=사 6=오 7=미 8=신 9=유 10=술 11=해 */
export const JIJI_KR = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
export const JIJI_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
/** 천간 인덱스 0=갑 … 9=계 */
export const CHEONGAN_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

export type MainStar =
  | '자미' | '천기' | '태양' | '무곡' | '천동' | '염정'
  | '천부' | '태음' | '탐랑' | '거문' | '천상' | '천량' | '칠살' | '파군';

export const STAR_HANJA: Record<MainStar, string> = {
  자미: '紫微', 천기: '天機', 태양: '太陽', 무곡: '武曲', 천동: '天同', 염정: '廉貞',
  천부: '天府', 태음: '太陰', 탐랑: '貪狼', 거문: '巨門', 천상: '天相', 천량: '天梁',
  칠살: '七殺', 파군: '破軍',
};

export type PalaceName =
  | '명궁' | '형제궁' | '부처궁' | '자녀궁' | '재백궁' | '질액궁'
  | '천이궁' | '노복궁' | '관록궁' | '전택궁' | '복덕궁' | '부모궁';
/** 명궁에서 지지 역행 순서 */
export const PALACE_ORDER: PalaceName[] = [
  '명궁', '형제궁', '부처궁', '자녀궁', '재백궁', '질액궁',
  '천이궁', '노복궁', '관록궁', '전택궁', '복덕궁', '부모궁',
];

export type Bureau = { element: '수' | '목' | '금' | '토' | '화'; number: 2 | 3 | 4 | 5 | 6; label: string };

export type JamiInput = {
  lunarYear: number;
  lunarMonth: number;   // 1~12
  lunarDay: number;     // 1~30
  isLeapMonth: boolean;
  hourBranch: number;   // 시지 0=자 … 11=해
};

export type JamiPalace = {
  branch: number;          // 지지 인덱스
  name: PalaceName;
  stemIndex: number;       // 궁 천간 (오호둔 배정)
  stars: MainStar[];       // 14주성 중 이 궁에 든 별 (0~2개)
  isBody: boolean;         // 신궁 여부
};

export type JamiChart = {
  input: JamiInput;
  effectiveMonth: number;  // 윤달 조정 후 월 (1~13, 13은 이듬해 1월 상당)
  yearStemIndex: number;   // 음력 연도 천간
  lifeBranch: number;      // 명궁 지지
  bodyBranch: number;      // 신궁 지지
  bureau: Bureau;
  ziweiBranch: number;     // 자미성 지지
  palaces: JamiPalace[];   // index = 지지 0~11
};

/** 납음오행 → 오행국 수 */
const BUREAU_NUM: Record<string, Bureau> = {
  수: { element: '수', number: 2, label: '水2국' },
  목: { element: '목', number: 3, label: '木3국' },
  금: { element: '금', number: 4, label: '金4국' },
  토: { element: '토', number: 5, label: '土5국' },
  화: { element: '화', number: 6, label: '火6국' },
};

/**
 * 60갑자 납음오행 (고전 납음가 — 2간지 1납음).
 * key = `${천간인덱스}-${지지인덱스}`. 전수 데이터는 verify-jamidusu.ts 의 iztro 대조로 검증됨.
 */
const NAPEUM: Record<string, Bureau['element']> = (() => {
  // [첫 간지 천간, 첫 간지 지지, 오행] — 짝(두 번째 간지)은 +1/+1
  const PAIRS: [number, number, Bureau['element']][] = [
    [0, 0, '금'],  // 甲子乙丑 해중금
    [2, 2, '화'],  // 丙寅丁卯 노중화
    [4, 4, '목'],  // 戊辰己巳 대림목
    [6, 6, '토'],  // 庚午辛未 노방토
    [8, 8, '금'],  // 壬申癸酉 검봉금
    [0, 10, '화'], // 甲戌乙亥 산두화
    [2, 0, '수'],  // 丙子丁丑 간하수
    [4, 2, '토'],  // 戊寅己卯 성두토
    [6, 4, '금'],  // 庚辰辛巳 백랍금
    [8, 6, '목'],  // 壬午癸未 양류목
    [0, 8, '수'],  // 甲申乙酉 천중수
    [2, 10, '토'], // 丙戌丁亥 옥상토
    [4, 0, '화'],  // 戊子己丑 벽력화
    [6, 2, '목'],  // 庚寅辛卯 송백목
    [8, 4, '수'],  // 壬辰癸巳 장류수
    [0, 6, '금'],  // 甲午乙未 사중금
    [2, 8, '화'],  // 丙申丁酉 산하화
    [4, 10, '목'], // 戊戌己亥 평지목
    [6, 0, '토'],  // 庚子辛丑 벽상토
    [8, 2, '금'],  // 壬寅癸卯 금박금
    [0, 4, '화'],  // 甲辰乙巳 복등화
    [2, 6, '수'],  // 丙午丁未 천하수
    [4, 8, '토'],  // 戊申己酉 대역토
    [6, 10, '금'], // 庚戌辛亥 차천금
    [8, 0, '목'],  // 壬子癸丑 상자목
    [0, 2, '수'],  // 甲寅乙卯 대계수
    [2, 4, '토'],  // 丙辰丁巳 사중토
    [4, 6, '화'],  // 戊午己未 천상화
    [6, 8, '목'],  // 庚申辛酉 석류목
    [8, 10, '수'], // 壬戌癸亥 대해수
  ];
  const map: Record<string, Bureau['element']> = {};
  for (const [s, b, el] of PAIRS) {
    map[`${s}-${b}`] = el;
    map[`${(s + 1) % 10}-${(b + 1) % 12}`] = el;
  }
  return map;
})();

/** 오호둔 — 년간 → 寅궁 천간 (甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲) */
function yinStemOf(yearStemIndex: number): number {
  return ((yearStemIndex % 5) * 2 + 2) % 10;
}

/** 궁 천간 — 寅궁부터 순행으로 배정 (子·丑궁은 두 바퀴째라 寅·卯와 같은 천간) */
function palaceStem(yearStemIndex: number, branch: number): number {
  return (yinStemOf(yearStemIndex) + ((branch - 2 + 12) % 12)) % 10;
}

/** 안성법 — 음력 생년월일 + 시지 → 명반 */
export function erectChart(input: JamiInput): JamiChart {
  const { lunarYear, lunarMonth, lunarDay, isLeapMonth, hourBranch } = input;
  if (lunarMonth < 1 || lunarMonth > 12 || lunarDay < 1 || lunarDay > 30) {
    throw new Error(`음력 날짜 범위 밖: ${lunarMonth}월 ${lunarDay}일`);
  }
  if (hourBranch < 0 || hourBranch > 11) throw new Error(`시지 범위 밖: ${hourBranch}`);

  // 윤달: 1~15일 본월, 16일~ 익월 (iztro fixLeap=true 동일)
  const effectiveMonth = isLeapMonth && lunarDay >= 16 ? lunarMonth + 1 : lunarMonth;

  // 1) 명궁·신궁: 寅에서 (월-1) 순행 후 시지만큼 역행/순행
  const lifeBranch = (2 + (effectiveMonth - 1) - hourBranch + 24) % 12;
  const bodyBranch = (2 + (effectiveMonth - 1) + hourBranch) % 12;

  // 2) 오행국: 음력 연도 천간(설날 경계) → 오호둔 → 명궁 간지 → 납음
  const yearStemIndex = (((lunarYear - 4) % 10) + 10) % 10;
  const lifeStem = palaceStem(yearStemIndex, lifeBranch);
  const el = NAPEUM[`${lifeStem}-${lifeBranch}`];
  if (!el) throw new Error(`납음 조회 실패: ${CHEONGAN_HANJA[lifeStem]}${JIJI_HANJA[lifeBranch]}`);
  const bureau = BUREAU_NUM[el];

  // 3) 자미성: q = ceil(일/국수), r = q*국수 - 일. r 짝수면 寅+(q-1)+r, 홀수면 寅+(q-1)-r
  const n = bureau.number;
  const q = Math.ceil(lunarDay / n);
  const r = q * n - lunarDay;
  const ziweiBranch = r % 2 === 0 ? (2 + (q - 1) + r) % 12 : (2 + (q - 1) - r + 24) % 12;

  // 4) 14주성: 자미 역포 + 천부(寅申축 대칭) 순포
  const Z = ziweiBranch;
  const F = (16 - Z) % 12; // 천부
  const starAt: [MainStar, number][] = [
    ['자미', Z],
    ['천기', (Z + 11) % 12],
    ['태양', (Z + 9) % 12],
    ['무곡', (Z + 8) % 12],
    ['천동', (Z + 7) % 12],
    ['염정', (Z + 4) % 12],
    ['천부', F],
    ['태음', (F + 1) % 12],
    ['탐랑', (F + 2) % 12],
    ['거문', (F + 3) % 12],
    ['천상', (F + 4) % 12],
    ['천량', (F + 5) % 12],
    ['칠살', (F + 6) % 12],
    ['파군', (F + 10) % 12],
  ];

  // 12궁: 명궁에서 역행
  const palaces: JamiPalace[] = Array.from({ length: 12 }, (_, branch) => ({
    branch,
    name: PALACE_ORDER[(lifeBranch - branch + 12) % 12],
    stemIndex: palaceStem(yearStemIndex, branch),
    stars: [] as MainStar[],
    isBody: branch === bodyBranch,
  }));
  for (const [star, branch] of starAt) palaces[branch].stars.push(star);

  return { input, effectiveMonth, yearStemIndex, lifeBranch, bodyBranch, bureau, ziweiBranch, palaces };
}

/** 궁 조회 (이름으로) */
export function palaceOf(chart: JamiChart, name: PalaceName): JamiPalace {
  const p = chart.palaces.find((x) => x.name === name);
  if (!p) throw new Error(`궁 없음: ${name}`); // 12궁 전부 배정되므로 도달 불가
  return p;
}

/** 공궁이면 대궁(+6)에서 차성 — UI 는 borrowed 로 "빌려 봄" 명시 */
export function starsWithBorrow(chart: JamiChart, name: PalaceName): { stars: MainStar[]; borrowed: boolean } {
  const p = palaceOf(chart, name);
  if (p.stars.length > 0) return { stars: p.stars, borrowed: false };
  return { stars: chart.palaces[(p.branch + 6) % 12].stars, borrowed: true };
}

// ── SajuInput 어댑터 ──

/**
 * 프로필(SajuInput) → 명반. 생시 없으면 null (자시 가정 등 추측 계산 절대 금지 — 신뢰 원칙).
 *
 * 날짜: 달력 생일 그대로 음력 변환 (사주 일주와 동일 관행 — 야자시여도 날짜 유지).
 * 시지: 사주 엔진과 동일한 adjustKoreanSolarTime(-30분 보정) 후 시진.
 *   hourBranch 공식: Math.floor(((adj.hour + 1) % 24) / 2)
 *     ex) adj.hour=23 → (24%24=0)/2=0 → 자시(0)
 *         adj.hour=3  → 4/2=2          → 인시(2)
 *
 * 경계 케이스:
 *   hour=0, min=10 → adj.hour=23, adj.min=40 (전날 23:40)
 *     → hourBranch=(24%24)/2=0 → 자시(0) 유지.
 *     날짜: 달력 생일 그대로 넘기므로 일주 롤백 없음 (사주 엔진과 동일 관행).
 *   hour=23 (야자시) → adj.hour=22, adj.min=30 → hourBranch=(23%24)/2=11 → 해시(亥)?
 *     → 실제: (22+1)%24=23, floor(23/2)=11 → 해시(11).
 *     ※ 사주 엔진의 야자시(hour===23) 특수처리(子+다음날 일간)는 시주(사주) 전용.
 *        자미두수는 시지만 필요하고, 23시=해시(亥)로 입력하는 유파가 일반적이므로
 *        자시(0) 강제 변환 없이 보정 시각 기준 시지 그대로 사용.
 *        (iztro/전통 자미두수: 23시는 亥시로 처리)
 */
export function chartFromSajuInput(input: SajuInput): JamiChart | null {
  if (input.hour === undefined) return null;

  // -30분 한국 태양시 보정 (사주 엔진과 동일 함수 재사용)
  const adj = adjustKoreanSolarTime(
    input.year, input.month, input.day,
    input.hour, input.minute ?? 0
  );

  // 시지: 보정 후 시각 기준
  const hourBranch = Math.floor(((adj.hour + 1) % 24) / 2);

  // 날짜: 달력 생일 그대로 음력 변환 (보정된 날짜 아님)
  let lunar: { year: number; month: number; day: number; isLeapMonth: boolean };
  if (input.calendar === 'lunar') {
    lunar = {
      year: input.year,
      month: input.month,
      day: input.day,
      isLeapMonth: input.leapMonth ?? false,
    };
  } else {
    const result = solarToLunar(input.year, input.month, input.day);
    lunar = result.lunar;
  }

  return erectChart({
    lunarYear: lunar.year,
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    isLeapMonth: lunar.isLeapMonth,
    hourBranch,
  });
}

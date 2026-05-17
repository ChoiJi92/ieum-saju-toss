import { calculateSaju, lunarToSolar, type SajuResult } from '@fullstackfamily/manseryeok';
import type { OhaengKey, Pillar } from '../components/ie';

/**
 * 이음사주 사주 계산 wrapper.
 *
 * - manseryeok JS 라이브러리 (KASI 한국천문연구원 데이터 기반) 호출
 * - 본업 sxtwl 엔진과 7건 케이스 4기둥 100% 일치 검증 통과 (2026-05-10)
 * - 음력 입력은 lunarToSolar 변환 후 calculateSaju 호출
 * - 시 모름 케이스: hour 미입력 → 시주 null
 *
 * MVP 범위: 4기둥(천간/지지) + 오행 분포(8자 카운트).
 * 12운성·12신살·대운·세운·신강·공망 은 Phase 2 자체 룰베이스 추가.
 */

export type SajuInput = {
  /** 입력 년 (1900~2050, manseryeok 지원 범위) */
  year: number;
  /** 입력 월 (1~12) */
  month: number;
  /** 입력 일 (1~31) */
  day: number;
  /** 양력 vs 음력 */
  calendar: 'solar' | 'lunar';
  /** 윤달 여부 (음력만) */
  leapMonth?: boolean;
  /** 시 (0~23). 모름이면 undefined */
  hour?: number;
  /** 분 (0~59). 기본 0 */
  minute?: number;
  /** 성별 */
  gender: 'male' | 'female';
  /** 표시용 이름 */
  name: string;
};

/** 천간 → 오행 매핑 */
const TG_OHAENG: Record<string, OhaengKey> = {
  甲: 'wood', 乙: 'wood',
  丙: 'fire', 丁: 'fire',
  戊: 'earth', 己: 'earth',
  庚: 'metal', 辛: 'metal',
  壬: 'water', 癸: 'water',
};

/** 천간 → 한글 독음 */
export const TG_KR: Record<string, string> = {
  甲: '갑', 乙: '을',
  丙: '병', 丁: '정',
  戊: '무', 己: '기',
  庚: '경', 辛: '신',
  壬: '임', 癸: '계',
};

/** 지지 → 한글 독음 */
export const DZ_KR: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘',
  辰: '진', 巳: '사', 午: '오', 未: '미',
  申: '신', 酉: '유', 戌: '술', 亥: '해',
};

/** 오행 → 한글 (목·화·토·금·수) */
export const OHAENG_KR: Record<OhaengKey, string> = {
  wood: '목', fire: '화', earth: '토', metal: '금', water: '수',
};

/** 오행 → 한글 풀이 (나무·불·흙·쇠·물) */
export const OHAENG_PULIE: Record<OhaengKey, string> = {
  wood: '나무', fire: '불', earth: '흙', metal: '쇠', water: '물',
};

/** 12지 시진 → 한글 시간 라벨 (예: 06:30 → "묘시 (05:30~07:30)") */
const SIJIN_BY_HOUR: Record<number, { branch: string; kr: string; range: string }> = {
  0:  { branch: '子', kr: '자시', range: '23:30~01:30' },
  2:  { branch: '丑', kr: '축시', range: '01:30~03:30' },
  4:  { branch: '寅', kr: '인시', range: '03:30~05:30' },
  6:  { branch: '卯', kr: '묘시', range: '05:30~07:30' },
  8:  { branch: '辰', kr: '진시', range: '07:30~09:30' },
  10: { branch: '巳', kr: '사시', range: '09:30~11:30' },
  12: { branch: '午', kr: '오시', range: '11:30~13:30' },
  14: { branch: '未', kr: '미시', range: '13:30~15:30' },
  16: { branch: '申', kr: '신시', range: '15:30~17:30' },
  18: { branch: '酉', kr: '유시', range: '17:30~19:30' },
  20: { branch: '戌', kr: '술시', range: '19:30~21:30' },
  22: { branch: '亥', kr: '해시', range: '21:30~23:30' },
};

/** 입력 hour → 한글 시진 라벨 (없으면 null) */
export function sijinLabel(hour: number | undefined): string | null {
  if (hour === undefined) return null;
  return SIJIN_BY_HOUR[hour]?.kr ?? null;
}

/**
 * 五子遁 (오자둔) — 일주 천간 → 자시 천간 매핑.
 *   甲己日 → 甲子 / 乙庚日 → 丙子 / 丙辛日 → 戊子 / 丁壬日 → 庚子 / 戊癸日 → 壬子
 */
const OJADON: Record<string, string> = {
  甲: '甲', 己: '甲',
  乙: '丙', 庚: '丙',
  丙: '戊', 辛: '戊',
  丁: '庚', 壬: '庚',
  戊: '壬', 癸: '壬',
};

/** 지지 → 오행 매핑 (장간 본기 기준 한국 명리 표준) */
const DZ_OHAENG: Record<string, OhaengKey> = {
  寅: 'wood', 卯: 'wood',
  巳: 'fire', 午: 'fire',
  辰: 'earth', 戌: 'earth', 丑: 'earth', 未: 'earth',
  申: 'metal', 酉: 'metal',
  子: 'water', 亥: 'water',
};

export type Myeongsik = {
  /** 4기둥 (년·월·일·시 순) */
  pillars: Pillar[];
  /** 일주(日柱) 천간·지지 */
  ilgan: { c: string; ohaeng: OhaengKey };
  /** 오행 분포 (8자 카운트, 시 모름이면 6자) */
  ohaeng: Record<OhaengKey, number>;
  /** 시 모름 여부 */
  unknownTime: boolean;
  /** 시간 보정 적용 여부 */
  isTimeCorrected: boolean;
  /** 보정된 시각 */
  correctedTime?: { hour: number; minute: number };
  /** 신강신약 + 용신 (자체 룰베이스) */
  shinkang: ShinKangResult;
};

/** 4기둥(시까지) 한자 → Pillar[] 변환 */
function pillarsFromHanja(
  yearHanja: string,
  monthHanja: string,
  dayHanja: string,
  hourHanja: string | null
): Pillar[] {
  const make = (label: string, hanja: string, isSelf: boolean): Pillar => {
    const top = hanja[0];
    const bot = hanja[1];
    return {
      label,
      top: { c: top, ohaeng: TG_OHAENG[top] ?? 'earth' },
      bot: { c: bot, ohaeng: DZ_OHAENG[bot] ?? 'earth' },
      isSelf,
    };
  };
  const out: Pillar[] = [
    make('연주', yearHanja, false),
    make('월주', monthHanja, false),
    make('일주', dayHanja, true),
  ];
  if (hourHanja) out.push(make('시주', hourHanja, false));
  return out;
}

/** 오행 분포 카운트 — 8자 (시 모름이면 6자) */
function countOhaeng(pillars: Pillar[]): Record<OhaengKey, number> {
  const counts: Record<OhaengKey, number> = {
    wood: 0, fire: 0, earth: 0, metal: 0, water: 0,
  };
  for (const p of pillars) {
    counts[p.top.ohaeng]++;
    counts[p.bot.ohaeng]++;
  }
  return counts;
}

/**
 * 한국 출생자 태양시 보정.
 * 본업 sxtwl(`saju_calc.py --korean-adjust true`)과 정확히 일치시키기 위해
 * 입력 시각에서 -30분을 직접 빼고, manseryeok 의 자체 보정은 끔.
 *
 * 자시 경계(23:30~00:30) 케이스에서 날짜·일주 변경이 정확히 sxtwl 와 동일하게 처리됨.
 */
function adjustKoreanSolarTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): { year: number; month: number; day: number; hour: number; minute: number } {
  const date = new Date(year, month - 1, day, hour, minute);
  date.setMinutes(date.getMinutes() - 30);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

/* ─────────────────────────────────────────────────────────────
 * 신강신약 + 용신 룰베이스 (단순 버전)
 *   신강 점수 = (일간과 같은 오행 = 비겁) + (일간을 생하는 오행 = 인성)
 *   월주 지지(월령)이 일간 오행 또는 인성이면 +2 가중치
 *   - score >= 6 → 신강
 *   - score 3~5 → 중화
 *   - score <= 2 → 신약
 * 용신: 신강이면 식상·재성·관성에서 부족한 오행 / 신약이면 인성·비겁
 * ─────────────────────────────────────────────────────────────*/

/** 일간 오행 → 인성 오행 (일간을 생하는 오행, 역상생) */
const INSEONG_OF: Record<OhaengKey, OhaengKey> = {
  wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal',
};
/** 일간 오행 → 식상 오행 (일간이 생하는 오행) */
const SIKSANG_OF: Record<OhaengKey, OhaengKey> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
/** 일간 오행 → 재성 오행 (일간이 극하는 오행) */
const JAESEONG_OF: Record<OhaengKey, OhaengKey> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
};
/** 일간 오행 → 관성 오행 (일간을 극하는 오행) */
const GWANSEONG_OF: Record<OhaengKey, OhaengKey> = {
  wood: 'metal', metal: 'fire', fire: 'water', water: 'earth', earth: 'wood',
};

export type ShinKangShinYak = 'shinkang' | 'jonghap' | 'shinyak';

export type ShinKangResult = {
  type: ShinKangShinYak;
  /** 0~100 게이지 위치 */
  gauge: number;
  label: string;
  /** 풀이 텍스트 */
  body: string;
  /** 추천 용신 (오행) + 한글 */
  yongshin: { ohaeng: OhaengKey; kr: string; pulie: string };
  yongshinReason: string;
};

function calcShinKang(myeongsik: Myeongsik): ShinKangResult {
  const ilganOhaeng = myeongsik.ilgan.ohaeng;
  const inseong = INSEONG_OF[ilganOhaeng];
  let score = 0;

  // 명식 8자에서 일간 오행(비겁) + 인성 카운트
  for (let i = 0; i < myeongsik.pillars.length; i++) {
    const p = myeongsik.pillars[i];
    if (p.top.ohaeng === ilganOhaeng) score += 1;
    if (p.bot.ohaeng === ilganOhaeng) score += 1;
    if (p.top.ohaeng === inseong) score += 1;
    if (p.bot.ohaeng === inseong) score += 1;
  }
  // 월주 지지(월령) 가중치
  const monthBranch = myeongsik.pillars[1].bot.ohaeng;
  if (monthBranch === ilganOhaeng) score += 2;
  if (monthBranch === inseong) score += 2;

  const type: ShinKangShinYak =
    score >= 6 ? 'shinkang' : score >= 3 ? 'jonghap' : 'shinyak';

  // 게이지 0~100 (score 0~12 정도 범위 → 정규화)
  const gauge = Math.round(Math.min(100, Math.max(0, (score / 12) * 100)));

  // 용신: 신강이면 부족한 오행 중 식상·재성·관성 / 신약이면 인성
  const counts = myeongsik.ohaeng;
  let yongshinOhaeng: OhaengKey;
  let yongshinReason: string;

  if (type === 'shinkang') {
    // 신강 → 식상/재성/관성 중 부족한 오행을 용신으로
    const candidates: OhaengKey[] = [
      SIKSANG_OF[ilganOhaeng],
      JAESEONG_OF[ilganOhaeng],
      GWANSEONG_OF[ilganOhaeng],
    ];
    yongshinOhaeng = candidates.sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0))[0];
    yongshinReason = `사주에 본인 기운(${OHAENG_PULIE[ilganOhaeng]})이 강해서, 그 기운을 흘려보내는 ${OHAENG_PULIE[yongshinOhaeng]}이 도움이 돼요.`;
  } else if (type === 'shinyak') {
    // 신약 → 인성을 용신
    yongshinOhaeng = inseong;
    yongshinReason = `사주에 본인 기운(${OHAENG_PULIE[ilganOhaeng]})이 약해서, 본인을 채워주는 ${OHAENG_PULIE[yongshinOhaeng]}의 기운이 보약이에요.`;
  } else {
    // 중화 → 가장 부족한 오행
    const all: OhaengKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];
    yongshinOhaeng = all.sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0))[0];
    yongshinReason = `사주가 비교적 균형 잡혀 있어요. 부족한 ${OHAENG_PULIE[yongshinOhaeng]}의 기운을 채워주면 흐름이 더 좋아져요.`;
  }

  const labelMap: Record<ShinKangShinYak, string> = {
    shinkang: '신강',
    jonghap: '중화',
    shinyak: '신약',
  };
  const bodyMap: Record<ShinKangShinYak, string> = {
    shinkang:
      '본인 기운이 단단한 타입. 추진력·자기 주장이 강하지만, 너무 자기 중심이면 주변과 부딪칠 수 있어요. 흘려보내는 활동(표현·운동·돈 쓰는 자리)이 운을 풀어요.',
    jonghap:
      '기운이 비교적 고른 중화 타입. 큰 흔들림은 적지만 결정 순간에 망설임이 있을 수 있어요. 자기만의 페이스를 만들면 강해져요.',
    shinyak:
      '본인 기운이 살짝 부족한 타입. 섬세하고 잘 살피지만 쉽게 지칠 수 있어요. 든든한 사람·환경(인성)을 가까이 두면 안정돼요.',
  };

  return {
    type,
    gauge,
    label: labelMap[type],
    body: bodyMap[type],
    yongshin: {
      ohaeng: yongshinOhaeng,
      kr: OHAENG_KR[yongshinOhaeng],
      pulie: OHAENG_PULIE[yongshinOhaeng],
    },
    yongshinReason,
  };
}

/** 사주 계산 메인 — Input → Myeongsik */
export function computeMyeongsik(input: SajuInput): Myeongsik {
  // 음력 → 양력 변환
  let solar: { year: number; month: number; day: number };
  if (input.calendar === 'lunar') {
    const conv = lunarToSolar(input.year, input.month, input.day, input.leapMonth ?? false);
    solar = { year: conv.solar.year, month: conv.solar.month, day: conv.solar.day };
  } else {
    solar = { year: input.year, month: input.month, day: input.day };
  }

  const unknownTime = input.hour === undefined;
  const rawHour = unknownTime ? 12 : input.hour!;
  const rawMinute = input.minute ?? 0;

  // 한국 -30분 보정을 직접 적용 (manseryeok 자체 보정은 끔)
  const adj = adjustKoreanSolarTime(solar.year, solar.month, solar.day, rawHour, rawMinute);

  const result: SajuResult = calculateSaju(
    adj.year,
    adj.month,
    adj.day,
    adj.hour,
    adj.minute,
    { applyTimeCorrection: false }
  );

  // 야자시(夜子時) 후처리 — 본업 sxtwl 정책 일치:
  //   보정 시각 23:00~24:00 = 야자시 → 시진 = 子(자시) + 시주 천간 = 다음날 일주 기준
  //   (manseryeok 기본은 23:30 자시 시작 + 그날 일주 기준이라 시주 다름)
  //   일주 변경은 보정 시각 자정 기준이라 그대로 유지.
  let correctedHourHanja = result.hourPillarHanja;
  const isYajaSi = !unknownTime && adj.hour === 23;
  if (isYajaSi) {
    const next = new Date(adj.year, adj.month - 1, adj.day);
    next.setDate(next.getDate() + 1);
    const nextResult = calculateSaju(
      next.getFullYear(),
      next.getMonth() + 1,
      next.getDate(),
      12,
      0,
      { applyTimeCorrection: false }
    );
    const nextDayStem = nextResult.dayPillarHanja[0];
    correctedHourHanja = OJADON[nextDayStem] + '子';
  }

  const hourHanja = unknownTime ? null : correctedHourHanja;
  const pillars = pillarsFromHanja(
    result.yearPillarHanja,
    result.monthPillarHanja,
    result.dayPillarHanja,
    hourHanja
  );
  const ohaeng = countOhaeng(pillars);

  const myeongsikDraft: Myeongsik = {
    pillars,
    ilgan: pillars[2].top,
    ohaeng,
    unknownTime,
    isTimeCorrected: result.isTimeCorrected,
    correctedTime: result.correctedTime,
    shinkang: { type: 'jonghap', gauge: 50, label: '중화', body: '', yongshin: { ohaeng: 'wood', kr: '목', pulie: '나무' }, yongshinReason: '' },
  };
  myeongsikDraft.shinkang = calcShinKang(myeongsikDraft);
  return myeongsikDraft;
}

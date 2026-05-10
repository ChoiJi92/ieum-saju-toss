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
    make('年柱', yearHanja, false),
    make('月柱', monthHanja, false),
    make('日柱', dayHanja, true),
  ];
  if (hourHanja) out.push(make('時柱', hourHanja, false));
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

  return {
    pillars,
    ilgan: pillars[2].top,
    ohaeng,
    unknownTime,
    isTimeCorrected: result.isTimeCorrected,
    correctedTime: result.correctedTime,
  };
}

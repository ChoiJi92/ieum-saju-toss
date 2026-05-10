import { calculateSaju } from '@fullstackfamily/manseryeok';
import { fortuneBySipsung, type DailyFortune } from './sipsung';

/**
 * 오늘의 운세 — 본인 일간 vs 오늘 일진(60갑자)으로 십성 계산 → 5섹션.
 *
 * - 오늘 일진 = manseryeok 으로 오늘 날짜의 일주 천간 추출
 * - 시간 무관 (정오 기준 호출, 일주만 사용)
 */

type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

function isStem(s: string): s is Stem {
  return (STEMS as string[]).includes(s);
}

/** 오늘 (또는 지정 날짜) 일진 천간 한 글자 */
export function todayDayStem(date: Date = new Date()): Stem {
  const r = calculateSaju(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    12,
    0,
    { applyTimeCorrection: false }
  );
  const stem = r.dayPillarHanja[0];
  if (!isStem(stem)) {
    // 안전 fallback (이론상 발생 X)
    return '甲';
  }
  return stem;
}

/** 본인 일간 + 오늘 → DailyFortune */
export function todayFortune(myIlgan: string, date: Date = new Date()): DailyFortune | null {
  if (!isStem(myIlgan)) return null;
  const dayStem = todayDayStem(date);
  return fortuneBySipsung(myIlgan, dayStem);
}

import { calculateSaju } from '@fullstackfamily/manseryeok';
import { personalizedFortune, type DailyFortune } from './sipsung';
import type { Myeongsik } from './saju';

/**
 * 오늘의 운세 — 본인 명식(8자) + 오늘 일진 → 십성 + 시드 변동 → 5섹션.
 *
 * - 오늘 일진 = manseryeok 으로 오늘 날짜의 일주 천간 추출
 * - 시간 무관 (정오 기준 호출, 일주만 사용)
 * - 본인 명식 8자 시드 → 같은 일간 다른 사주끼리 점수 ±3 변동 보장
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
  if (!isStem(stem)) return '甲';
  return stem;
}

/** 명식 4기둥 → 시드 문자열 (천간 4 + 지지 4 = 8자) */
function myeongsikSeed(myeongsik: Myeongsik): string {
  return myeongsik.pillars.map((p) => p.top.c + p.bot.c).join('');
}

/** 본인 명식 + 오늘 → DailyFortune (개인화) */
export function todayFortune(myeongsik: Myeongsik, date: Date = new Date()): DailyFortune | null {
  const ilgan = myeongsik.ilgan.c;
  if (!isStem(ilgan)) return null;
  const dayStem = todayDayStem(date);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return personalizedFortune(ilgan, dayStem, `${myeongsikSeed(myeongsik)}|${y}-${m}-${d}`);
}

import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';
import { SCORE } from './month';
import type { Myeongsik } from './saju';

/**
 * 일진 캘린더 — 한 달 전체를 날짜별 길흉 점수로.
 * 일진(그날의 일주) 천간 × 내 일간 → 십성 → 점수. month.ts의 best/worst 로직을 월 전체 그리드로 확장.
 */

function variance(seed: string, key: string, range = 3): number {
  let h = 0;
  const s = seed + key;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % (range * 2 + 1)) - range;
}
function myeongsikSeed(m: Myeongsik): string {
  return m.pillars.map((p) => p.top.c + p.bot.c).join('');
}

type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const isStem = (s: string): s is Stem => (STEMS as string[]).includes(s);

/** 십성별 그날의 한 줄 힌트 */
export const DAY_HINT: Record<Sipsung, string> = {
  비견: '함께하면 힘이 나는 날 — 약속·모임 좋아요',
  겁재: '지갑 단속의 날 — 충동 결제 잠깐 멈춤',
  식신: '즐기기 좋은 날 — 맛있는 것·좋아하는 것',
  상관: '아이디어가 빛나는 날 — 표현하고 제안하세요',
  정재: '꾸준함이 통하는 날 — 정리·저축·실속',
  편재: '기회가 들어오는 날 — 새 자리·새 사람 OK',
  정관: '책임이 빛나는 날 — 공적인 일·면접·계약',
  편관: '무리하면 탈 나는 날 — 큰 결정은 미루기',
  정인: '배움이 잘 붙는 날 — 공부·문서·계획',
  편인: '직감이 예민한 날 — 영감은 메모, 결정은 보류',
};

export type IljinDay = {
  day: number;
  weekday: number;      // 0=일 ~ 6=토
  score: number;        // 50~98
  sipsung: Sipsung | null;
  ganji: string;        // 일진 간지 (예: 戊子)
  hint: string;
};

export type IljinMonth = {
  y: number;
  mo: number;           // 1~12
  ym: string;
  firstWeekday: number; // 1일의 요일
  days: IljinDay[];
  bestDay: number;
  worstDay: number;
};

/** 해당 연·월의 일진 캘린더 (myeongsik 기준 개인화 점수) */
export function iljinMonth(myeongsik: Myeongsik, y: number, mo: number): IljinMonth | null {
  const myIlgan = myeongsik.ilgan.c;
  if (!isStem(myIlgan)) return null;
  const seed = myeongsikSeed(myeongsik);
  const ym = `${y}-${String(mo).padStart(2, '0')}`;
  const daysInMonth = new Date(y, mo, 0).getDate();
  const firstWeekday = new Date(y, mo - 1, 1).getDay();

  const days: IljinDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dr = calculateSaju(y, mo, d, 12, 0, { applyTimeCorrection: false });
    const ganji = dr.dayPillarHanja;
    const ds = ganji[0];
    const sip = isStem(ds) ? getSipsung(myIlgan, ds) : null;
    const base = sip ? SCORE[sip].overall : 70;
    const score = Math.max(50, Math.min(98, base + variance(seed, `${ym}_d${d}`, 3)));
    days.push({
      day: d,
      weekday: new Date(y, mo - 1, d).getDay(),
      score,
      sipsung: sip,
      ganji,
      hint: sip ? DAY_HINT[sip] : '평탄한 흐름의 날',
    });
  }
  const best = days.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = days.reduce((a, b) => (b.score < a.score ? b : a));
  return { y, mo, ym, firstWeekday, days, bestDay: best.day, worstDay: worst.day };
}

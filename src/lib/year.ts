import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';

/**
 * 신년운세 — 본인 일간 × 한 해 12개월 월주 천간 → 십성 → 월별 점수.
 * 분야별 한 줄(연애·재물·커리어·건강)도 십성 분포 기반 자동 산출.
 */

type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';

/** 십성별 5섹션 점수 (sipsung.ts 와 동일 매핑 — 가벼운 사본) */
const SCORE_BY_SIPSUNG: Record<Sipsung, { overall: number; love: number; money: number; work: number; health: number }> = {
  비견: { overall: 72, love: 68, money: 65, work: 78, health: 70 },
  겁재: { overall: 65, love: 60, money: 58, work: 72, health: 70 },
  식신: { overall: 84, love: 88, money: 76, work: 80, health: 82 },
  상관: { overall: 78, love: 72, money: 70, work: 84, health: 75 },
  정재: { overall: 80, love: 76, money: 88, work: 78, health: 75 },
  편재: { overall: 82, love: 78, money: 90, work: 75, health: 72 },
  정관: { overall: 75, love: 78, money: 72, work: 88, health: 70 },
  편관: { overall: 68, love: 65, money: 65, work: 78, health: 60 },
  정인: { overall: 78, love: 72, money: 70, work: 75, health: 80 },
  편인: { overall: 72, love: 75, money: 65, work: 72, health: 70 },
};

const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const isStem = (s: string): s is Stem => (STEMS as string[]).includes(s);

export type MonthForecast = {
  /** 1~12 */
  month: number;
  monthStem: string;
  sipsung: Sipsung | null;
  score: number;
};

export type YearForecast = {
  year: number;
  /** 12개월 */
  months: MonthForecast[];
  /** 한 해 평균 점수 */
  yearScore: number;
  /** 가장 좋은 달 (1~12) */
  bestMonth: number;
  /** 한 해 mood */
  mood: string;
  tagline: string;
  /** 분야별 한 줄 — 연애·재물·커리어·건강 */
  fields: {
    love:    { score: number; oneLine: string };
    money:   { score: number; oneLine: string };
    career:  { score: number; oneLine: string };
    health:  { score: number; oneLine: string };
  };
};

/** 월주 천간 가져오기 — 매월 15일 정오 (절기 경계 안전) */
function monthStemAt(year: number, month: number): string {
  const r = calculateSaju(year, month, 15, 12, 0, { applyTimeCorrection: false });
  return r.monthPillarHanja[0];
}

/** 본인 일간 × 한 해 → YearForecast */
export function yearForecast(myIlgan: string, year: number): YearForecast | null {
  if (!isStem(myIlgan)) return null;

  const months: MonthForecast[] = [];
  let scoreSum = 0;
  const fieldSums = { love: 0, money: 0, work: 0, health: 0 };

  for (let m = 1; m <= 12; m++) {
    const stem = monthStemAt(year, m);
    let sipsung: Sipsung | null = null;
    let score = 70;
    if (isStem(stem)) {
      sipsung = getSipsung(myIlgan, stem);
      const s = SCORE_BY_SIPSUNG[sipsung];
      score = s.overall;
      fieldSums.love   += s.love;
      fieldSums.money  += s.money;
      fieldSums.work   += s.work;
      fieldSums.health += s.health;
    }
    months.push({ month: m, monthStem: stem, sipsung, score });
    scoreSum += score;
  }

  const yearScore = Math.round(scoreSum / 12);
  let bestMonth = 1;
  let bestScore = months[0].score;
  for (const m of months) {
    if (m.score > bestScore) {
      bestScore = m.score;
      bestMonth = m.month;
    }
  }

  // 분야별 평균 점수 + 한 줄 (가장 좋은 달 강조)
  const avgLove   = Math.round(fieldSums.love   / 12);
  const avgMoney  = Math.round(fieldSums.money  / 12);
  const avgWork   = Math.round(fieldSums.work   / 12);
  const avgHealth = Math.round(fieldSums.health / 12);

  const moodMap: Record<Sipsung, string> = {
    비견: '동행의 해', 겁재: '경쟁의 해',
    식신: '꽃피는 해', 상관: '창조의 해',
    정재: '안정의 해', 편재: '기회의 해',
    정관: '책임의 해', 편관: '도전의 해',
    정인: '배움의 해', 편인: '직관의 해',
  };
  const taglineMap: Record<Sipsung, string> = {
    비견: '함께 갈 사람들이 많아지는 해야',
    겁재: '경쟁 속에서 단단해지는 해',
    식신: '하고 싶은 거 다 펼쳐지는 해',
    상관: '틀을 깨고 새로 만드는 해',
    정재: '꾸준히 쌓는 게 답인 해',
    편재: '예상 못한 기회가 들어오는 해',
    정관: '책임이 보상으로 돌아오는 해',
    편관: '한 단계 성장하는 도전의 해',
    정인: '배우고 채우는 해',
    편인: '직관·영감이 빛나는 해',
  };

  // 가장 자주 나온 십성으로 한 해 mood
  const sipsungCount: Partial<Record<Sipsung, number>> = {};
  for (const m of months) {
    if (m.sipsung) sipsungCount[m.sipsung] = (sipsungCount[m.sipsung] ?? 0) + 1;
  }
  const dominant = (Object.entries(sipsungCount) as Array<[Sipsung, number]>).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] ?? '식신';

  return {
    year,
    months,
    yearScore,
    bestMonth,
    mood: moodMap[dominant],
    tagline: taglineMap[dominant],
    fields: {
      love:   { score: avgLove,   oneLine: oneLineForField('love',   bestMonth, avgLove) },
      money:  { score: avgMoney,  oneLine: oneLineForField('money',  bestMonth, avgMoney) },
      career: { score: avgWork,   oneLine: oneLineForField('career', bestMonth, avgWork) },
      health: { score: avgHealth, oneLine: oneLineForField('health', bestMonth, avgHealth) },
    },
  };
}

function oneLineForField(
  field: 'love' | 'money' | 'career' | 'health',
  bestMonth: number,
  avg: number
): string {
  const tone = avg >= 78 ? '활기' : avg >= 70 ? '안정' : '주의';
  if (field === 'love')   return `${bestMonth}월 강한 인연 신호. 한 해 흐름 ${tone}.`;
  if (field === 'money')  return `${bestMonth}월 자산 ↑. ${tone === '활기' ? '하반기 회복' : '꾸준히 다지기'}.`;
  if (field === 'career') return `${bestMonth}월 전환점. ${tone === '활기' ? '도약' : '내실 다지기'}.`;
  return `환절기·연말 면역 주의. 평균 ${tone}.`;
}

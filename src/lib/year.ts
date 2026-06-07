import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';
import type { Myeongsik } from './saju';

/** 명식 8자 + key 로 -3 ~ +3 시드 변동 */
function variance(seed: string, key: string, range = 3): number {
  let h = 0;
  const s = seed + key;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % (range * 2 + 1)) - range;
}
function myeongsikSeed(m: Myeongsik): string {
  return m.pillars.map((p) => p.top.c + p.bot.c).join('');
}

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
  /** 가장 약한 달 (1~12) */
  worstMonth: number;
  /** 한 해 mood */
  mood: string;
  tagline: string;
  /** 한 해 흐름 풀이 (3~4줄) */
  yearBody: string;
  /** 분야별 — 연애·재물·커리어·건강 (각 3줄+) */
  fields: {
    love:    { score: number; oneLine: string; body: string };
    money:   { score: number; oneLine: string; body: string };
    career:  { score: number; oneLine: string; body: string };
    health:  { score: number; oneLine: string; body: string };
  };
  /** 이번 달 포커스 — 보는 달마다 바뀜 */
  monthFocus: { month: number; title: string; body: string };
};

/** 월주 천간 가져오기 — 매월 15일 정오 (절기 경계 안전) */
function monthStemAt(year: number, month: number): string {
  const r = calculateSaju(year, month, 15, 12, 0, { applyTimeCorrection: false });
  return r.monthPillarHanja[0];
}

/** 이번 달 포커스 문구 — 월별 score·십성 기반 */
function buildMonthFocus(
  months: MonthForecast[],
  currentMonth: number
): { month: number; title: string; body: string } {
  const m = months.find((x) => x.month === currentMonth) ?? months[currentMonth - 1] ?? months[0];
  const tone = m.score >= 78 ? '좋은' : m.score >= 68 ? '평온한' : '조심스러운';
  const sipsungHint: Partial<Record<Sipsung, string>> = {
    식신: '하고 싶은 걸 시도하기 좋아요.',
    상관: '창의적인 아이디어가 빛나요.',
    정재: '꾸준히 모으면 결과가 와요.',
    편재: '예상치 못한 기회가 올 수 있어요.',
    정관: '책임감 있게 움직이면 인정받아요.',
    편관: '압박이 있어도 정면 돌파하면 성장해요.',
    정인: '배우거나 공부하는 데 집중하기 좋아요.',
    편인: '직감을 믿고 새로운 방향을 탐색해보세요.',
    비견: '주변 사람과 함께 움직이면 힘이 돼요.',
    겁재: '경쟁보단 자기 페이스를 지키는 게 답이에요.',
  };
  const hint = m.sipsung ? (sipsungHint[m.sipsung] ?? '') : '';
  const body = `${currentMonth}월은 ${tone} 흐름이에요. ${hint}`.trim();
  return { month: currentMonth, title: `${currentMonth}월 포커스`, body };
}

/** 본인 명식 × 한 해 → YearForecast (명식 시드 변동 포함) */
export function yearForecast(myeongsik: Myeongsik, year: number, today: Date = new Date()): YearForecast | null {
  const myIlgan = myeongsik.ilgan.c;
  if (!isStem(myIlgan)) return null;
  const seed = myeongsikSeed(myeongsik);

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
      // 시드 변동 — 같은 십성이라도 사주 다르면 점수 다름
      const adjust = (k: string, base: number) =>
        Math.max(50, Math.min(98, base + variance(seed, `${m}_${k}`, 3)));
      score = adjust('overall', s.overall);
      fieldSums.love   += adjust('love',   s.love);
      fieldSums.money  += adjust('money',  s.money);
      fieldSums.work   += adjust('work',   s.work);
      fieldSums.health += adjust('health', s.health);
    }
    months.push({ month: m, monthStem: stem, sipsung, score });
    scoreSum += score;
  }

  const yearScore = Math.round(scoreSum / 12);
  let bestMonth = 1;
  let bestScore = months[0].score;
  let worstMonth = 1;
  let worstScore = months[0].score;
  for (const m of months) {
    if (m.score > bestScore) {
      bestScore = m.score;
      bestMonth = m.month;
    }
    if (m.score < worstScore) {
      worstScore = m.score;
      worstMonth = m.month;
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

  const currentMonth = today.getMonth() + 1;

  return {
    year,
    months,
    yearScore,
    bestMonth,
    worstMonth,
    mood: moodMap[dominant],
    tagline: taglineMap[dominant],
    yearBody: yearBodyMap[dominant](year, bestMonth, worstMonth, yearScore),
    fields: {
      love:   { score: avgLove,   oneLine: oneLineForField('love',   bestMonth, avgLove),   body: fieldBody('love',   dominant, bestMonth, worstMonth, avgLove) },
      money:  { score: avgMoney,  oneLine: oneLineForField('money',  bestMonth, avgMoney),  body: fieldBody('money',  dominant, bestMonth, worstMonth, avgMoney) },
      career: { score: avgWork,   oneLine: oneLineForField('career', bestMonth, avgWork),   body: fieldBody('career', dominant, bestMonth, worstMonth, avgWork) },
      health: { score: avgHealth, oneLine: oneLineForField('health', bestMonth, avgHealth), body: fieldBody('health', dominant, bestMonth, worstMonth, avgHealth) },
    },
    monthFocus: buildMonthFocus(months, currentMonth),
  };
}

function oneLineForField(
  field: 'love' | 'money' | 'career' | 'health',
  bestMonth: number,
  avg: number
): string {
  const tone = avg >= 78 ? '활기' : avg >= 70 ? '안정' : '주의';
  if (field === 'love')   return `${bestMonth}월에 강한 인연 신호가 와요. 한 해 흐름은 ${tone}이에요.`;
  if (field === 'money')  return `${bestMonth}월에 자산이 가장 잘 모여요. ${tone === '활기' ? '하반기에 회복세가 좋아요' : '꾸준히 다지는 흐름이에요'}.`;
  if (field === 'career') return `${bestMonth}월이 전환점이에요. ${tone === '활기' ? '도약하기 좋은 해예요' : '내실을 다지기 좋은 해예요'}.`;
  return `환절기·연말엔 면역에 신경 써주세요. 평균 흐름은 ${tone}이에요.`;
}

/** 분야별 풍부 풀이 (3~4줄) — 십성 dominant + 평균 점수 기반 */
function fieldBody(
  field: 'love' | 'money' | 'career' | 'health',
  _dominant: Sipsung,
  bestMonth: number,
  worstMonth: number,
  avg: number
): string {
  const tone = avg >= 78 ? '활기 있는' : avg >= 70 ? '안정적인' : '주의가 필요한';
  if (field === 'love') {
    return `${tone} 한 해 인연 흐름이에요. ${bestMonth}월에 가장 강한 인연 신호가 와요 — 자연스럽게 만나는 자리에서 끌림이 깊어지는 시기예요. ${worstMonth}월은 다툼·오해가 살짝 생길 수 있으니 연인이라면 평소보다 한 번 더 마음을 표현해주세요.`;
  }
  if (field === 'money') {
    return `${tone} 재물 흐름이에요. ${bestMonth}월에 자산이 가장 잘 모이는 시기라 저축·투자 점검하기 좋아요. ${worstMonth}월은 큰 지출·갑작스러운 비용이 생길 수 있으니, 연말정산·세금 정리는 연초부터 미리 챙겨두면 마음이 편해요.`;
  }
  if (field === 'career') {
    return `${tone} 커리어 흐름이에요. ${bestMonth}월에 전환점·중요 결정 신호가 와요 — 이직·승진·새 프로젝트 시동에 좋은 타이밍이에요. ${worstMonth}월은 압박·평가가 강해서 정신력 챙기는 게 중요해요. 평소보다 멘토를 자주 만나면 한결 가벼워져요.`;
  }
  return `${tone} 건강 흐름이에요. ${bestMonth}월은 컨디션이 올라와 새 운동·식단을 시작하기 좋은 타이밍이에요. ${worstMonth}월은 면역·스트레스가 누적될 수 있으니, 환절기엔 잠을 충분히 자고 연말엔 과음을 조금만 줄여주세요.`;
}

/** 한 해 흐름 풀이 (3~4줄) — dominant 십성별 */
const yearBodyMap: Record<
  Sipsung,
  (year: number, bestMonth: number, worstMonth: number, score: number) => string
> = {
  비견: (y, b, w) => `${y}년은 함께 갈 사람이 늘어나는 해예요. 혼자 끌고 가던 일도 동료·친구의 손을 빌리면 두 배 가벼워져요. ${b}월에 가장 강한 협업 신호가 와요. ${w}월은 의견 충돌·갈등이 살짝 생길 수 있으니 한 번 더 들어주는 마음으로 가주세요.`,
  겁재: (y, b, w) => `${y}년은 경쟁 속에서 단단해지는 해예요. 라이벌·도전 자리가 평소보다 많지만 그게 본인 실력을 키워줘요. ${b}월에 정점에 닿아요. ${w}월은 충동·과욕이 올라오기 쉬우니 한 박자 쉬어가는 여유가 필요해요.`,
  식신: (y, b) => `${y}년은 하고 싶은 거 마음껏 펼치는 해예요. 자기 표현이 자연스럽게 매력으로 보이는 시기예요. ${b}월에 가장 큰 기회가 와요 — 새 시도·창작·이직에 좋은 타이밍이에요. 즐기되 기록은 꼭 남겨두세요.`,
  상관: (y, b) => `${y}년은 틀을 깨고 새로 만드는 해예요. 평범한 길보단 본인만의 색으로 가는 해예요. ${b}월에 큰 도약이 일어나요. 단 직설적인 발언으로 사람 잃지 않게 톤 조절은 평소보다 한 번 더 신경 써주세요.`,
  정재: (y, b, w) => `${y}년은 꾸준히 쌓는 게 답인 해예요. 큰 도박보단 매일 조금씩 모으는 흐름이 더 큰 결과로 와요. ${b}월에 자산이 가장 잘 모여요. ${w}월은 지출·계약을 평소보다 꼼꼼히 살펴주세요.`,
  편재: (y, b) => `${y}년은 예상 못한 기회·만남이 들어오는 해예요. 안전한 자리에만 있으면 운 절반을 놓치니 새로운 자리·사람을 적극적으로 만나주세요. ${b}월이 정점이에요. 단 큰 베팅은 충분히 검증한 뒤에 결정하는 게 안전해요.`,
  정관: (y, b, w) => `${y}년은 책임이 보상으로 돌아오는 해예요. 약속·신뢰·정공법이 그대로 운으로 와요. ${b}월에 큰 인정·승진·계약 신호가 와요. ${w}월은 무리·번아웃이 올 수 있으니 잠은 꼭 챙겨주세요.`,
  편관: (y, b, w) => `${y}년은 한 단계 성장하는 도전의 해예요. 압박·과제 많지만 정면 돌파하면 한 차원 다른 본인이 돼요. ${b}월에 가장 큰 시험이 와요. ${w}월은 휴식·회복 시기로 활용하면 좋아요.`,
  정인: (y, b) => `${y}년은 배우고 채우는 해예요. 큰 도약보단 내공 쌓기에 집중하기 좋은 시기예요. ${b}월에 좋은 멘토·자료·강의를 만나는 신호가 와요. 책 한 권·강의 하나가 한 해 자산이 돼요.`,
  편인: (y, b) => `${y}년은 직관·영감이 빛나는 해예요. 평범하지 않은 길에서 본인만의 답을 찾는 해예요. ${b}월에 큰 영감 신호가 와요. 단 실행은 충분히 검증한 뒤에 — 직감만 믿고 큰 결정 내리는 건 위험해요.`,
};

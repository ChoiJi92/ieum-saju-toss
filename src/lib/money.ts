import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';

/**
 * 재물운 — 본인 일간 × 이번 달 월주 → 이번 달 점수.
 * 이번 주 7일치 일진 → 일별 재물 점수.
 * 행운 행동 3개 = 십성별 매핑.
 */

type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const isStem = (s: string): s is Stem => (STEMS as string[]).includes(s);

/** 십성별 재물운 점수 */
const MONEY_SCORE: Record<Sipsung, number> = {
  비견: 65, 겁재: 58,
  식신: 76, 상관: 70,
  정재: 88, 편재: 90,
  정관: 72, 편관: 65,
  정인: 70, 편인: 65,
};

/** 십성별 mood */
const MONEY_MOOD: Record<Sipsung, string> = {
  비견: '분담 흐름',
  겁재: '지출 주의',
  식신: '소소한 보상',
  상관: '아이디어 수익',
  정재: '안정 흐름',
  편재: '기회 ↑',
  정관: '꾸준한 수입',
  편관: '큰 지출 주의',
  정인: '자기계발 투자',
  편인: '예측 불가',
};

/** 십성별 행운 행동 3개 */
const MONEY_ACTIONS: Record<Sipsung, Array<{ ic: string; lbl: string; sub: string }>> = {
  비견: [
    { ic: '👥', lbl: '친구와 N빵',     sub: '분담이 운 ↑' },
    { ic: '💸', lbl: '자투리 모으기',   sub: '평소보다 +8% 모일 흐름' },
    { ic: '🎁', lbl: '경조사 챙기기',   sub: '주고받는 자체가 운' },
  ],
  겁재: [
    { ic: '⚠️', lbl: '큰 지출 보류',   sub: '충동 결제 주의' },
    { ic: '📋', lbl: '예산 점검',       sub: '주말 전 한 번' },
    { ic: '🛍️', lbl: '결제 다시 보기', sub: '하루 미루면 절반' },
  ],
  식신: [
    { ic: '🎁', lbl: '나에게 선물',     sub: '소소한 보상이 더 큰 운' },
    { ic: '🍽️', lbl: '맛집 점심',      sub: '좋은 자리에서 영감' },
    { ic: '💸', lbl: '자투리 모으기',   sub: '평소보다 +12% 모일 흐름' },
  ],
  상관: [
    { ic: '💡', lbl: '부업 아이디어',   sub: '메모 한 줄이 시드' },
    { ic: '📊', lbl: '주식 점검',       sub: '수요일 오전이 좋음' },
    { ic: '🎨', lbl: '취미 수익화',     sub: '판매·강의 검토 OK' },
  ],
  정재: [
    { ic: '💰', lbl: '예금 만기 검토',   sub: '재예치·이율 비교' },
    { ic: '📈', lbl: '꾸준한 적립',     sub: '소액 자동이체 ↑' },
    { ic: '🧾', lbl: '영수증 정리',     sub: '연말정산 미리' },
  ],
  편재: [
    { ic: '🎯', lbl: '거래·영업 미팅',   sub: '외부 자리에서 운' },
    { ic: '💡', lbl: '횡재 안테나',     sub: '의외의 정보 ↑' },
    { ic: '📊', lbl: '투자 검토',       sub: '단 큰 결정은 내일로' },
  ],
  정관: [
    { ic: '💼', lbl: '직장 내 평가',     sub: '윗사람 인정' },
    { ic: '📋', lbl: '계약 갱신',       sub: '꼼꼼히 읽고 사인' },
    { ic: '💰', lbl: '월급 관리',       sub: '들어온 직후 분배' },
  ],
  편관: [
    { ic: '⚠️', lbl: '비상금 확인',     sub: '큰 지출 가능성' },
    { ic: '🛡️', lbl: '보험 점검',       sub: '커버리지 확인' },
    { ic: '📋', lbl: '예산 강화',       sub: '주간 단위 관리' },
  ],
  정인: [
    { ic: '📚', lbl: '자기계발 결제',   sub: '강의·책이 시드' },
    { ic: '💰', lbl: '소액 적금',       sub: '꾸준히 채워가기' },
    { ic: '🧾', lbl: '연말정산 미리',   sub: '공제 항목 챙기기' },
  ],
  편인: [
    { ic: '🌙', lbl: '직관 따라가기',   sub: '느낌 좋은 곳에 베팅' },
    { ic: '⏸️', lbl: '큰 결정 미루기',   sub: '내일 다시 보기' },
    { ic: '📊', lbl: '리서치만 하기',   sub: '실행은 다음 주' },
  ],
};

export type MoneyForecast = {
  monthScore: number;
  mood: string;
  /** 이번 주 7일 흐름 — [월·화·수·목·금·토·일] */
  week: Array<{ day: string; score: number; hint: string }>;
  /** 행운 행동 3개 */
  actions: Array<{ ic: string; lbl: string; sub: string }>;
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const HINT_BY_TIER = (s: number) =>
  s >= 85 ? '들어옴 ↑' : s >= 78 ? '안정' : s >= 70 ? '평이' : s >= 62 ? '소비 주의' : '큰 지출 주의';

export function moneyForecast(myIlgan: string, today: Date = new Date()): MoneyForecast | null {
  if (!isStem(myIlgan)) return null;

  // 이번 달 월주 천간 → 십성
  const m = calculateSaju(today.getFullYear(), today.getMonth() + 1, 15, 12, 0, {
    applyTimeCorrection: false,
  });
  const monthStem = m.monthPillarHanja[0];
  const monthSipsung = isStem(monthStem) ? getSipsung(myIlgan, monthStem) : null;
  const monthScore = monthSipsung ? MONEY_SCORE[monthSipsung] : 70;
  const mood = monthSipsung ? MONEY_MOOD[monthSipsung] : '평이';
  const actions = monthSipsung ? MONEY_ACTIONS[monthSipsung] : MONEY_ACTIONS['식신'];

  // 이번 주 월~일 (오늘 기준 그 주 월요일부터)
  const dow = today.getDay(); // 0=일 ~ 6=토
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7)); // 이번 주 월요일

  const week: MoneyForecast['week'] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const r = calculateSaju(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, {
      applyTimeCorrection: false,
    });
    const dStem = r.dayPillarHanja[0];
    const sipsung = isStem(dStem) ? getSipsung(myIlgan, dStem) : null;
    const score = sipsung ? MONEY_SCORE[sipsung] : 70;
    week.push({
      day: DAY_LABELS[d.getDay()],
      score,
      hint: HINT_BY_TIER(score),
    });
  }

  return { monthScore, mood, week, actions };
}

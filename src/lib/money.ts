import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';
import type { Myeongsik } from './saju';
import { profileHint, rotateBySeed } from './personalize';

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

/** 십성별 이번 달 재물 풀이 (3~4줄) */
const MONEY_BODY: Record<Sipsung, string> = {
  비견: '함께 분담하는 흐름이 잘 맞는 달이에요. 친구·동료와 N빵·공동구매·같이 가는 자리에서 작은 이득이 생겨요. 큰 지출은 혼자 결정하기 전에 한 번 의논해보면 더 좋은 가격이 나와요. 이번 달은 의리 비용이 살짝 주의돼요.',
  겁재: '큰 지출·충동 결제·과한 베팅이 주의되는 달이에요. 친구 앞에서 한 턱 쏘는 자리는 자제하고, SNS 자극 결제는 24시간 미뤄주세요. 지갑 관리만 잘하면 운이 자연스럽게 풀려요.',
  식신: '소소한 보상·작은 기쁨 결제가 운을 키우는 달이에요. 큰 투자보단 자기 보상으로 좋아하는 걸 작게 사주세요. 표현·창작 활동을 통한 수익(부업·취미 수익화) 신호도 살짝 와요.',
  상관: '새로운 아이디어가 돈으로 이어질 수 있는 달이에요. 부업·사이드 프로젝트·콘텐츠 수익화를 검토하기 좋아요. 단 충동적 투자는 피해주세요 — 메모만 해두고 다음 달에 다시 보고 결정해주세요.',
  정재: '꾸준한 수입·작은 보상이 차곡차곡 쌓이는 달이에요. 적금·예금 만기·이율 비교를 점검하기 좋은 타이밍이에요. 새 투자보단 기존 자산 정리·재배치가 더 큰 이익으로 와요. 연말정산 준비도 미리 시작해두세요.',
  편재: '예상 못한 돈·기회가 들어오는 달이에요. 호기심 가는 자리·새 사람을 만나야 운이 와요. 잊고 있던 환급·캐시백·당첨 신호도 살짝 와요. 단 큰 베팅은 충분히 검증한 뒤에 결정해주세요.',
  정관: '꾸준하고 안정적인 수입 흐름이에요. 새 투자보단 기존 자산 정리·계약 갱신·세금 챙기기에 집중해주세요. 영수증·서류 정리만 잘해도 작은 절약·환급이 한 달 합쳐 큰 돈으로 돌아와요.',
  편관: '큰 지출·갑작스러운 비용이 들어올 수 있는 달이에요. 비상금·결제 한도를 한 번 확인해두세요. 보험·수리·경조사 같은 불가피한 지출은 미루지 말고 빠르게 처리하면 더 큰 문제는 안 돼요.',
  정인: '큰 수입보다 자기계발 투자가 운으로 돌아오는 달이에요. 강의·책·코스·세미나 결제는 좋아요. 단 무리한 결제는 피해주세요 — 진짜 필요한 거 한두 개만 골라주세요. 배운 만큼 다음 달 수익으로 돌아와요.',
  편인: '예측 불가 흐름이 강한 달이에요. 큰 돈 결정·투자·계약은 일단 미뤄주세요. 직관에 큰 돈을 베팅하면 위험해요. 작은 시도는 괜찮지만 큰 건은 일주일 뒤 다시 보고 결정해주세요.',
};

/** 십성별 행운 행동 3개 — 클릭 시 펼쳐지는 detail 포함 */
const MONEY_ACTIONS: Record<Sipsung, Array<{ ic: string; lbl: string; sub: string; detail: string }>> = {
  비견: [
    { ic: '👥', lbl: '친구와 N빵',     sub: '분담이 운 ↑',
      detail: '친구·동료와 같이 가는 자리에서 N빵·공동 구매로 분담해주세요. 비견 달은 함께 나누는 흐름이 강해서 혼자 결제할 때보다 평균 8% 정도 더 모이는 경향이에요. 큰 지출 전에 한 번 의논하면 더 좋은 가격이 나와요.' },
    { ic: '💸', lbl: '자투리 모으기',   sub: '평소보다 +8% 모일 흐름',
      detail: '잔돈·포인트·자투리 캐시를 한 통장에 모아주세요. 비견 달은 차곡차곡 쌓는 자체가 운으로 작용해요. 자동 저축 5천 원·1만 원 룰만 걸어둬도 한 달 합치면 의외로 큰 돈.' },
    { ic: '🎁', lbl: '경조사 챙기기',   sub: '주고받는 자체가 운',
      detail: '결혼·돌·생일 같은 경조사를 미루지 말고 챙겨주세요. 비견 달은 주고받는 흐름 자체가 운이라, 챙기지 않으면 들어올 운도 함께 막혀요. 부담될 만큼 X — 마음만 보여주는 정도가 적당.' },
  ],
  겁재: [
    { ic: '⚠️', lbl: '큰 지출 보류',   sub: '충동 결제 주의',
      detail: '큰 지출은 결정 전 24시간 미루는 룰을 꼭 지켜주세요. 겁재의 달은 충동·과욕이 강해서 결제 직후 후회가 와요. 잠 한 번 자고 다시 봐도 좋으면 그때 결정해도 늦지 않아요.' },
    { ic: '📋', lbl: '예산 점검',       sub: '주말 전 한 번',
      detail: '한 주가 끝나기 전에 가계부·카드 명세서를 한 번 점검해주세요. 겁재 달은 새는 돈을 자주 놓치는 시기예요. 5분만 점검해도 다음 주 충동 결제를 절반으로 줄일 수 있어요.' },
    { ic: '🛍️', lbl: '결제 다시 보기', sub: '하루 미루면 절반',
      detail: 'SNS 광고·한정판·세일 알림 결제 직전에 일단 닫고 하루만 미뤄주세요. 겁재 달은 절반 이상이 충동 결제예요. 하루 뒤에도 진짜 사고 싶으면 그때 사도 늦지 않아요.' },
  ],
  식신: [
    { ic: '🎁', lbl: '나에게 선물',     sub: '소소한 보상이 더 큰 운',
      detail: '한 달 잘 살았다 싶은 작은 보상으로 좋아하는 걸 사주세요. 식신 달은 자기 보상이 그대로 운을 키워줘요. 비싼 게 아니라도 OK — "나 잘 살았네" 싶은 기분 자체가 다음 운으로 이어져요.' },
    { ic: '🍽️', lbl: '맛집 점심',      sub: '좋은 자리에서 영감',
      detail: '평소 안 가던 맛집·예쁜 카페에서 점심을 먹어보세요. 식신 달은 좋은 자리에서 영감·아이디어·기회가 와요. 혼자도 좋고 친구와도 좋아요 — 자리 자체가 운으로 돌아와요.' },
    { ic: '💸', lbl: '자투리 모으기',   sub: '평소보다 +12% 모일 흐름',
      detail: '잔돈·포인트·자투리 캐시를 한 통장에 모아주세요. 식신 달은 표현·즐거움 흐름이 강해서 모으는 동안 작은 보상도 함께 와요. 평소보다 12% 정도 더 모이는 경향이에요.' },
  ],
  상관: [
    { ic: '💡', lbl: '부업 아이디어',   sub: '메모 한 줄이 시드',
      detail: '본업 외 부업·사이드 프로젝트 아이디어를 한 줄이라도 메모해두세요. 상관 달은 발상이 평소 두 배로 또렷해서 메모 한 줄이 다음 분기 수익의 시드가 돼요. 단 즉흥 투자는 X.' },
    { ic: '📊', lbl: '주식 점검',       sub: '수요일 오전이 좋음',
      detail: '보유 주식·ETF 포트폴리오를 한 번 점검해주세요. 상관 달은 분석·재구성에 좋은 시기예요. 단 새 매수보단 기존 비중 재배치가 답 — 큰 결정은 메모만 해두고 다음 달 다시 보기.' },
    { ic: '🎨', lbl: '취미 수익화',     sub: '판매·강의 검토 OK',
      detail: '잘 하는 취미를 SNS·플랫폼에 올리거나 작게 판매·강의로 시도해보세요. 상관 달은 창작·표현이 그대로 돈으로 이어지는 시기예요. 완벽하게 X — 일단 올리는 게 답이에요.' },
  ],
  정재: [
    { ic: '💰', lbl: '예금 만기 검토',   sub: '재예치·이율 비교',
      detail: '예금·적금 만기 일정과 이율을 한 번 비교해주세요. 정재 달은 안정·정리가 답이라 새 투자보단 기존 자산 재배치가 큰 이익. 5분 비교만 해도 한 달치 추가 수익이 돼요.' },
    { ic: '📈', lbl: '꾸준한 적립',     sub: '소액 자동이체 ↑',
      detail: '월 소액 자동이체 1~2개를 추가해보세요. 정재 달은 한 번에 큰 돈보다 매일 조금씩 모으는 흐름이 답이에요. 5만 원·10만 원 룰 하나면 1년 뒤 큰 자산.' },
    { ic: '🧾', lbl: '영수증 정리',     sub: '연말정산 미리',
      detail: '영수증·기부 영수증·의료비 서류를 미리 모아두세요. 연말 한 번에 몰리면 빠지는 게 생겨요. 정재 달은 차곡차곡 정리 자체가 그대로 환급으로 돌아와요.' },
  ],
  편재: [
    { ic: '🎯', lbl: '거래·영업 미팅',   sub: '외부 자리에서 운',
      detail: '거래처·고객·외부 미팅을 적극적으로 잡아주세요. 편재 달은 사무실 안에 갇혀 있으면 운 절반을 놓쳐요. 평소 연락 못 했던 사람한테도 한 번 연락해보면 의외의 거래로 이어질 수 있어요.' },
    { ic: '💡', lbl: '횡재 안테나',     sub: '의외의 정보 ↑',
      detail: '잊고 있던 환급·캐시백·당첨 알림·포인트를 한 번 정리해보세요. 편재 달은 작은 횡재 신호가 자주 와요. 단 큰 베팅은 X — 작은 돈만 받고 큰 결정은 한 번 더 검증해주세요.' },
    { ic: '📊', lbl: '투자 검토',       sub: '단 큰 결정은 내일로',
      detail: '관심 있던 종목·자산을 검토하기 좋은 달이에요. 편재 달은 정보·기회가 자주 들어와요. 단 충동 매수 X — "왠지 좋아 보여"는 위험. 일주일 뒤에도 좋으면 그때 결정.' },
  ],
  정관: [
    { ic: '💼', lbl: '직장 내 평가',     sub: '윗사람 인정',
      detail: '면담·평가·발표가 있다면 정공법으로 준비해주세요. 정관 달은 화려한 트릭보다 묵묵한 신뢰가 빛나는 시기예요. 평소 안 보이던 디테일까지 챙기면 인정과 보상이 자연스럽게 따라와요.' },
    { ic: '📋', lbl: '계약 갱신',       sub: '꼼꼼히 읽고 사인',
      detail: '월세·보험·구독 서비스 계약 갱신·해지를 챙겨주세요. 약관 한 번 더 읽고 사인. 정관 달은 작은 정리가 다음 달 큰 절약·환급으로 돌아와요.' },
    { ic: '💰', lbl: '월급 관리',       sub: '들어온 직후 분배',
      detail: '월급 들어온 당일 자동이체·저축 분배를 먼저 처리해주세요. 정관 달은 들어온 직후 분배해두면 한 달이 안정적으로 흐르고, 미루면 새는 돈이 늘어나요.' },
  ],
  편관: [
    { ic: '⚠️', lbl: '비상금 확인',     sub: '큰 지출 가능성',
      detail: '통장 잔고와 신용카드 한도를 한 번 점검해주세요. 편관 달은 보험·수리·경조사 같은 갑작스러운 지출이 들어올 수 있어요. 미루지 말고 빠르게 처리하면 더 큰 문제는 안 돼요.' },
    { ic: '🛡️', lbl: '보험 점검',       sub: '커버리지 확인',
      detail: '실손보험·자동차 보험·건강 검진 커버리지를 한 번 확인해주세요. 편관 달은 의료·수리·사고성 지출이 평소보다 들어올 수 있어요. 보장 한 번 점검해두면 마음이 편해져요.' },
    { ic: '📋', lbl: '예산 강화',       sub: '주간 단위 관리',
      detail: '월 단위보다 주 단위로 예산을 좁혀서 관리해주세요. 편관 달은 큰 지출이 한 번에 몰릴 수 있어요. 주말마다 한 번 점검하면 다음 주 충격을 절반으로 줄일 수 있어요.' },
  ],
  정인: [
    { ic: '📚', lbl: '자기계발 결제',   sub: '강의·책이 시드',
      detail: '관심 있던 강의·책·세미나에 결제해도 좋은 달이에요. 정인 달은 자기계발 투자가 운으로 돌아오는 시기라 배운 만큼 다음 분기 수익으로 와요. 단 무리한 결제 X — 진짜 필요한 한두 개만.' },
    { ic: '💰', lbl: '소액 적금',       sub: '꾸준히 채워가기',
      detail: '월 5~10만 원 소액 적금을 한 개 추가해보세요. 정인 달은 큰 도약보단 차곡차곡 쌓는 흐름이 답이에요. 1년 뒤 적금 만기 자체가 큰 자산이 돼요.' },
    { ic: '🧾', lbl: '연말정산 미리',   sub: '공제 항목 챙기기',
      detail: '연말정산 공제 항목(기부·의료비·교육비·청약)을 미리 챙겨주세요. 정인 달은 미리 정리해두면 환급이 평소보다 깔끔하게 들어와요. 영수증·서류 한 폴더에 모아두기.' },
  ],
  편인: [
    { ic: '🌙', lbl: '직관 따라가기',   sub: '느낌 좋은 곳에 베팅',
      detail: '"왠지 이쪽이 끌려" 같은 직관 신호를 작은 돈으로만 시도해보세요. 편인 달은 직관이 ↑이지만 분석은 ↓이라 큰 베팅은 위험해요. 작은 시도 OK, 큰 결정은 일주일 미루기.' },
    { ic: '⏸️', lbl: '큰 결정 미루기',   sub: '내일 다시 보기',
      detail: '투자·계약·이직·큰 지출은 일단 일주일 미뤄주세요. 편인 달은 직감만 믿고 큰 돈 베팅하면 며칠 뒤 후회로 돌아와요. 일주일 뒤에도 좋아 보이면 그때 결정해도 늦지 않아요.' },
    { ic: '📊', lbl: '리서치만 하기',   sub: '실행은 다음 주',
      detail: '관심 있는 자산·시장·종목을 리서치만 하고 실행은 미뤄주세요. 편인 달은 정보 수집에 좋은 시기지만 매수·매도는 다음 달이 답이에요. 메모만 잘 남겨두면 그게 다음 분기 자산.' },
  ],
};

export type MoneyForecast = {
  monthScore: number;
  mood: string;
  /** 이번 달 풀이 (3~4줄) */
  monthBody: string;
  /** 이번 주 7일 흐름 — [월·화·수·목·금·토·일] */
  week: Array<{ day: string; score: number; hint: string }>;
  /** 행운 행동 3개 (펼치면 detail) */
  actions: Array<{ ic: string; lbl: string; sub: string; detail: string }>;
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const HINT_BY_TIER = (s: number) =>
  s >= 85 ? '들어옴 ↑' : s >= 78 ? '안정' : s >= 70 ? '평이' : s >= 62 ? '소비 주의' : '큰 지출 주의';

export function moneyForecast(myeongsik: Myeongsik, today: Date = new Date()): MoneyForecast | null {
  const myIlgan = myeongsik.ilgan.c;
  if (!isStem(myIlgan)) return null;
  const seed = myeongsikSeed(myeongsik);

  // 이번 달 월주 천간 → 십성
  const m = calculateSaju(today.getFullYear(), today.getMonth() + 1, 15, 12, 0, {
    applyTimeCorrection: false,
  });
  const monthStem = m.monthPillarHanja[0];
  const monthSipsung = isStem(monthStem) ? getSipsung(myIlgan, monthStem) : null;
  const baseMonthScore = monthSipsung ? MONEY_SCORE[monthSipsung] : 70;
  const monthScore = Math.max(50, Math.min(98, baseMonthScore + variance(seed, 'month', 3)));
  const mood = monthSipsung ? MONEY_MOOD[monthSipsung] : '평이';
  const actions = monthSipsung ? rotateBySeed(seed, 'money_actions', MONEY_ACTIONS[monthSipsung], 3) : MONEY_ACTIONS['식신'];

  // 이번 주 월~일 (오늘 기준 그 주 월요일부터)
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));

  const week: MoneyForecast['week'] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const r = calculateSaju(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, {
      applyTimeCorrection: false,
    });
    const dStem = r.dayPillarHanja[0];
    const sipsung = isStem(dStem) ? getSipsung(myIlgan, dStem) : null;
    const baseScore = sipsung ? MONEY_SCORE[sipsung] : 70;
    const score = Math.max(50, Math.min(98, baseScore + variance(seed, `week_${i}`, 3)));
    week.push({
      day: DAY_LABELS[d.getDay()],
      score,
      hint: HINT_BY_TIER(score),
    });
  }

  const monthBody = monthSipsung ? `${MONEY_BODY[monthSipsung]} ${profileHint(myeongsik)}` : '평이한 흐름이에요. 큰 변동 없이 평소대로 가도 OK.';

  return { monthScore, mood, monthBody, week, actions };
}

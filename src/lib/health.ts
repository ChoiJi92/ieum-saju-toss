import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';
import type { Myeongsik } from './saju';
import { profileHint, rotateBySeed } from './personalize';

/**
 * 건강운 — 본인 사주 기반.
 *
 * 명리 룰:
 *   오행 균형으로 약한 부위 도출.
 *     木(甲乙) = 간·담·근육·시력
 *     火(丙丁) = 심장·혈관·소장·정신
 *     土(戊己) = 비장·위·소화기
 *     金(庚辛) = 폐·대장·기관지·피부
 *     水(壬癸) = 신장·방광·요추·관절
 *
 *   - 부족한 오행 = 그 장기·부위 약화 신호
 *   - 과한 오행 = 그 부위 부담·과열 신호
 *   - 보충 = 색·맛·식재료로 균형 잡기
 *
 * 4 axis: 체력 / 정신 / 면역 / 소화
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

type Ohaeng = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
const OHAENG_KR: Record<Ohaeng, string> = {
  wood: '목', fire: '화', earth: '토', metal: '금', water: '수',
};

/** 오행별 영향 부위·증상·케어 */
const OHAENG_HEALTH: Record<
  Ohaeng,
  {
    parts: string;     // 영향 받기 쉬운 부위
    symptoms: string;  // 흔한 증상
    foods: [string, string, string]; // 추천 음식 3개
    activity: string;  // 추천 활동
    weakBody: string;  // 부족할 때 케어 풀이 (3~4줄)
    excessBody: string; // 과할 때 케어 풀이 (3~4줄)
  }
> = {
  wood: {
    parts: '간·담·근육·시력',
    symptoms: '피로 누적·짜증·어깨 결림·눈 피로',
    foods: ['녹색 잎채소', '신맛 과일(자몽·키위)', '허브차'],
    activity: '가벼운 스트레칭·산책',
    weakBody: '木 기운이 약하면 간·담의 해독·스트레스 해소 능력이 떨어져요. 짜증이 늘고 어깨·목이 자주 결리는 신호예요. 녹색 잎채소·신맛 과일을 챙기고, 가벼운 산책·스트레칭으로 막힌 기운을 풀어주세요. 잠도 평소보다 30분 일찍 자는 게 도움이 돼요.',
    excessBody: '木 기운이 과하면 화가 자주 올라오고 어깨·목 긴장이 심해질 수 있어요. 매운 음식·과한 카페인은 줄이고 명상·요가로 마음을 차분히 가라앉혀주세요. 깊게 호흡하는 시간을 하루 5분이라도 챙겨주세요.',
  },
  fire: {
    parts: '심장·혈관·소장·정신',
    symptoms: '가슴 답답·불면·두근거림·집중력 저하',
    foods: ['붉은 음식(토마토·고추)', '쓴맛 채소(여주·녹차)', '잡곡밥'],
    activity: '활기찬 산책·요가',
    weakBody: '火 기운이 약하면 심장·혈관·소장 기능이 떨어져요. 가슴이 답답하고 잠이 옅어지는 신호예요. 붉은 음식·쓴맛 채소를 챙기고, 너무 늦게까지 화면 보지 말기. 활기찬 활동으로 기분도 같이 챙겨주세요.',
    excessBody: '火 기운이 과하면 흥분·불면·두근거림이 자주 와요. 자극적인 음식·카페인을 줄이고 차분한 활동(독서·명상·산책)으로 식혀주세요. 잠자기 1시간 전엔 화면 끄기 룰을 지켜주세요.',
  },
  earth: {
    parts: '비장·위·소화기',
    symptoms: '소화불량·식욕 변화·무기력·단 것 당김',
    foods: ['단호박·고구마', '단맛 곡류(현미·잡곡)', '따뜻한 죽·국'],
    activity: '규칙적 식사·요가',
    weakBody: '土 기운이 약하면 소화·흡수 능력이 떨어져요. 식사 후 더부룩하고 무기력해지는 신호예요. 단맛 곡류·따뜻한 음식을 규칙적으로 먹고, 찬 음식·자극적인 음식은 줄여주세요. 식후 가벼운 산책 10분이 큰 도움이 돼요.',
    excessBody: '土 기운이 과하면 식욕 과다·체중 증가·소화 정체가 올 수 있어요. 단 음식·기름진 음식을 줄이고 가벼운 채소·발효식품을 챙겨주세요. 식사 양은 80%로 멈추는 룰을 지켜주세요.',
  },
  metal: {
    parts: '폐·대장·기관지·피부',
    symptoms: '잦은 감기·피부 트러블·변비·호흡 답답',
    foods: ['흰색 음식(무·배·콩)', '매운 음식 소량', '도라지·생강차'],
    activity: '호흡 운동·유산소',
    weakBody: '金 기운이 약하면 폐·대장·면역력이 떨어져요. 환절기마다 감기가 잘 오고 피부 트러블이 잦은 신호예요. 흰색 음식·도라지·매운 음식 소량을 챙기고, 깊은 호흡 운동을 매일 5분 이상 해주세요.',
    excessBody: '金 기운이 과하면 건조감·피부 가려움·기관지 자극이 올 수 있어요. 자극적인 음식·매운 음식을 줄이고 충분한 수분을 챙겨주세요. 보습·가습기로 환경도 부드럽게 해주세요.',
  },
  water: {
    parts: '신장·방광·요추·관절',
    symptoms: '피로 회복 ↓·허리·무릎 시림·부종·빈뇨',
    foods: ['검은 음식(검정콩·흑임자)', '짠맛 소량', '해조류·미역'],
    activity: '걷기·따뜻한 목욕',
    weakBody: '水 기운이 약하면 신장·방광·관절 기능이 떨어져요. 피로 회복이 느리고 허리·무릎이 시린 신호예요. 검은 음식·해조류를 챙기고 충분히 쉬어주세요. 잠 7시간 룰은 절대 깨지 마세요.',
    excessBody: '水 기운이 과하면 부종·냉증·우울감이 올 수 있어요. 짠 음식·찬 음식을 줄이고 따뜻한 음식·따뜻한 목욕으로 몸을 데워주세요. 햇볕 쬐는 시간을 하루 20분 챙겨주세요.',
  },
};

/** 일간별 건강 결 풀이 (4~5줄) */
const HEALTH_BODY_BY_ILGAN: Record<Stem, string> = {
  甲: '큰 나무처럼 추진력이 강한 만큼 어깨·목·간 부담이 쉽게 와요. 한 번에 너무 많이 끌어안으면 다음 날 후폭풍이 커요. 1시간에 한 번 5분 스트레칭, 7시간 수면 룰을 지켜주세요. 가벼운 산책이 가장 큰 보약이에요.',
  乙: '풀처럼 유연한 만큼 외부 자극에 예민할 수 있어요. 환절기·먼지·소음에 빨리 반응해요. 푹 쉬는 시간이 가장 큰 회복이에요. 무리한 운동보단 요가·필라테스·산책이 어울려요. 정신적 휴식도 함께 챙겨주세요.',
  丙: '한낮의 태양처럼 에너지가 큰 만큼 빨리 소진되기도 해요. 활동량이 많아 좋지만 잠을 줄이면 회복이 느려요. 활기찬 운동 ↔ 충분한 수면 균형이 핵심이에요. 가슴·심장 부담이 오면 카페인 줄이기 룰을 지켜주세요.',
  丁: '촛불 같은 섬세한 에너지라 정신적 피로가 빨리 와요. 한 가지에 깊게 집중하다 보면 회복이 늦어져요. 명상·일기·산책 같은 정신 케어가 가장 큰 보약이에요. 카페인·과음은 평소보다 영향이 더 커요.',
  戊: '큰 산처럼 묵직한 체력이지만 한 번 무너지면 회복이 느려요. 평소엔 강하지만 무리하면 큰 병으로 와요. 규칙적인 식사·정기 검진을 챙기는 게 가장 큰 보약이에요. 위·소화기를 자주 살펴주세요.',
  己: '들판처럼 포용력이 큰 만큼 비·소화기가 약점이에요. 식사 시간이 불규칙하면 빨리 영향이 와요. 따뜻한 음식·규칙적 식사·식후 가벼운 산책 룰을 지켜주세요. 단 것·자극적인 음식은 평소보다 더 영향이 커요.',
  庚: '강철 같은 체력이지만 폐·대장이 약점이에요. 환절기·먼지·매연에 평소보다 빨리 반응해요. 깊은 호흡 운동·맑은 공기·충분한 수분이 가장 큰 케어예요. 매운 음식 소량은 좋지만 과하면 자극이 돼요.',
  辛: '잘 닦인 보석처럼 섬세한 체질이라 환경에 예민해요. 피부·기관지·먼지 알레르기가 흔해요. 보습·가습·맑은 공기 환경을 챙기고 충분한 수분을 마셔주세요. 정신적 스트레스도 빨리 피부로 와요.',
  壬: '큰 강처럼 흐름이 좋은 체력이지만 신장·방광이 약점이에요. 차가운 음식·과음·과로가 평소보다 빨리 신호로 와요. 충분한 수면·따뜻한 음식·해조류를 챙겨주세요. 허리·무릎 케어도 평소부터 시작해주세요.',
  癸: '맑은 샘물처럼 차분한 체질이지만 쉽게 지칠 수 있어요. 무리한 운동보단 꾸준한 가벼운 활동이 답이에요. 신장·방광 케어 + 충분한 수면이 가장 큰 보약. 따뜻한 차·반신욕도 좋아요.',
};

/** 부족한 오행별 건강 팁 3개 (아코디언) */
const TIPS_BY_WEAK: Record<
  Ohaeng,
  Array<{ ic: string; lbl: string; sub: string; detail: string }>
> = {
  wood: [
    { ic: '🌿', lbl: '녹색 음식 챙기기', sub: '하루 한 끼는 채소',
      detail: '木 기운이 약하면 간·담의 해독 능력이 떨어져요. 시금치·브로콜리·케일 같은 녹색 잎채소를 하루 한 끼는 꼭 챙겨주세요. 신맛 과일(자몽·키위·레몬)도 도움이 돼요. 채소를 못 먹는 날은 녹즙·신선한 주스로 대체.' },
    { ic: '🚶', lbl: '가벼운 산책', sub: '20분 걷기',
      detail: '木 기운은 움직임으로 풀려요. 격한 운동보단 매일 20분 가벼운 산책이 가장 효과적이에요. 점심·저녁 식사 후 10분씩만 걸어도 어깨·목 긴장이 풀려요. 자연 가까운 길이면 더 좋아요.' },
    { ic: '😴', lbl: '간 휴식 시간', sub: '11시 이전 잠들기',
      detail: '한의학에서 간이 가장 활발히 회복되는 시간은 23시~새벽 1시예요. 그 전에 잠들면 木 기운이 자연스럽게 회복돼요. 야식·과음은 간 부담이 평소보다 더 커요. 잠자기 2시간 전엔 음식 X.' },
  ],
  fire: [
    { ic: '🌶️', lbl: '쓴맛·붉은 음식', sub: '심장·정신 안정',
      detail: '火 기운이 약하면 심장·혈관 기능이 떨어져요. 토마토·붉은 고추·여주·녹차 같은 쓴맛·붉은 음식을 챙겨주세요. 잡곡밥도 도움이 돼요. 단 너무 자극적이면 오히려 火 과열이 되니 적당량.' },
    { ic: '☀️', lbl: '햇볕 쬐기', sub: '하루 20분',
      detail: '火 기운은 햇볕으로 자연스럽게 보충돼요. 점심시간에 20분이라도 밖에 나가서 햇볕을 쬐주세요. 비타민D 합성 + 기분 개선 + 수면 리듬 안정 — 한 번에 다 챙겨져요.' },
    { ic: '🧘', lbl: '잠자기 전 화면 끄기', sub: '1시간 룰',
      detail: '火 기운이 약하면 잠이 옅어져요. 잠자기 1시간 전엔 휴대폰·TV·노트북 끄기 룰을 지켜주세요. 따뜻한 차·독서로 마무리하면 깊은 잠이 들어와요. 깊은 잠 자체가 가장 큰 보약.' },
  ],
  earth: [
    { ic: '🍠', lbl: '단맛 곡류·따뜻한 음식', sub: '비위 보충',
      detail: '土 기운이 약하면 소화기가 약해져요. 단호박·고구마·현미·잡곡 같은 단맛 곡류를 챙기고, 따뜻한 죽·국으로 식사하세요. 찬 음식·생야채는 평소보다 줄여주세요. 따뜻한 차도 좋아요.' },
    { ic: '⏰', lbl: '규칙적 식사', sub: '시간 지키기',
      detail: '土 기운은 규칙성이 답이에요. 매일 비슷한 시간에 식사·간식·잠을 챙겨주세요. 불규칙하면 소화·흡수가 흐트러져요. 식사 양은 80%에서 멈추는 룰도 도움이 돼요.' },
    { ic: '🚶', lbl: '식후 산책', sub: '10분이면 충분',
      detail: '식사 후 10분만 걸어도 소화가 평소보다 잘 돼요. 土 기운 약한 사람은 식후 바로 앉아 있으면 더부룩함이 빨리 와요. 가벼운 산책 + 따뜻한 차로 마무리하는 루틴 추천.' },
  ],
  metal: [
    { ic: '🌬️', lbl: '깊은 호흡 운동', sub: '매일 5분',
      detail: '金 기운이 약하면 폐·면역력이 떨어져요. 매일 5분 깊은 호흡 운동(4초 들이마시고 7초 멈추고 8초 내쉬기)을 해주세요. 폐활량이 늘고 면역도 함께 강해져요. 새벽 공기·산속 공기가 가장 좋아요.' },
    { ic: '🥛', lbl: '흰색 음식 챙기기', sub: '폐·대장 케어',
      detail: '무·배·콩·도라지 같은 흰색 음식이 金 기운을 보충해요. 도라지차·생강차도 좋아요. 매운 음식은 소량은 좋지만 과하면 오히려 자극이 돼요. 환절기엔 따뜻한 흰색 음식 위주로.' },
    { ic: '💧', lbl: '보습·수분 충분히', sub: '하루 1.5L',
      detail: '金 기운이 약하면 피부·기관지가 건조해지기 쉬워요. 하루 1.5L 이상 물을 마시고, 가습기·보습제로 환경도 부드럽게 해주세요. 너무 건조한 날엔 마스크가 도움이 돼요.' },
  ],
  water: [
    { ic: '🌑', lbl: '검은 음식 챙기기', sub: '신장 보충',
      detail: '水 기운이 약하면 신장·방광 기능이 떨어져요. 검정콩·흑임자·흑미·다시마·미역 같은 검은 음식·해조류를 챙겨주세요. 견과류 한 줌도 좋아요. 짠맛은 소량은 좋지만 과하면 부종으로 와요.' },
    { ic: '🛁', lbl: '따뜻한 목욕·반신욕', sub: '주 2회',
      detail: '水 기운 약한 사람은 몸이 차가워지기 쉬워요. 주 2회 따뜻한 목욕·반신욕(38~40도, 20분)으로 몸을 데워주세요. 허리·무릎 시림 완화 + 수면 질 ↑. 잠자기 1시간 전이 좋아요.' },
    { ic: '😴', lbl: '7시간 수면 사수', sub: '신장 회복',
      detail: '한의학에서 신장은 잠으로 회복돼요. 7시간 수면 룰은 절대 깨지 마세요. 잠 줄이면서 일하는 건 水 기운이 약한 사람한테는 절대 X. 잠이 곧 다음 날 에너지의 자본이에요.' },
  ],
};

const KEYWORDS_BY_WEAK: Record<Ohaeng, [string, string, string]> = {
  wood: ['#스트레스해소', '#간케어', '#스트레칭'],
  fire: ['#정신안정', '#수면질', '#햇볕'],
  earth: ['#소화케어', '#규칙적식사', '#따뜻한음식'],
  metal: ['#면역력', '#호흡운동', '#보습'],
  water: ['#피로회복', '#신장케어', '#충분한수면'],
};

const MOOD_BY_WEAK: Record<Ohaeng, string> = {
  wood: '간 케어 시기', fire: '심신 안정 시기',
  earth: '소화 케어 시기', metal: '면역 케어 시기', water: '신장 케어 시기',
};

export type HealthForecast = {
  score: number;
  mood: string;
  tagline: string;
  /** 일간별 건강 결 (4~5줄) */
  body: string;
  /** 4 axis */
  axes: Array<{ ic: string; lbl: string; score: number; color: string; oneLine: string }>;
  /** 가장 약한 오행 + 부위 + 케어 */
  weak: {
    ohaeng: Ohaeng;
    ohaengKr: string;
    parts: string;
    symptoms: string;
    body: string;
    foods: [string, string, string];
    activity: string;
  };
  /** 강점 키워드 3개 */
  keywords: [string, string, string];
  /** 이번 달 건강 흐름 (1~2줄) */
  monthFlow: string;
  /** 건강 팁 3개 (아코디언) */
  tips: Array<{ ic: string; lbl: string; sub: string; detail: string }>;
};

const MONTH_FLOW_BY_SIPSUNG: Record<Sipsung, string> = {
  비견: '이번 달은 평이한 컨디션이에요. 무리만 하지 않으면 안정적으로 흘러가요.',
  겁재: '이번 달은 에너지 ↑이지만 무리·과음 주의보예요. 평소처럼 잠 챙기기 룰을 지켜주세요.',
  식신: '이번 달은 컨디션이 활기 있어요. 좋아하는 활동·음식으로 충전하기 좋은 시기예요.',
  상관: '이번 달은 머리·눈을 많이 쓰는 시기라 정신 피로 ↑. 짧은 산책·낮잠으로 리셋해주세요.',
  정재: '이번 달은 루틴 유지가 답이에요. 무리한 다이어트·갑작스러운 운동 X, 평소대로.',
  편재: '이번 달은 외부 활동량이 많아 쉽게 지칠 수 있어요. 식사·물 챙기기를 평소보다 더 신경 써주세요.',
  정관: '이번 달은 책임감으로 무리하기 쉬운 시기예요. 1시간에 한 번 5분 스트레칭 룰을 지켜주세요.',
  편관: '이번 달은 에너지 소진이 큰 시기예요. 충분한 휴식·수면이 가장 큰 보약이에요.',
  정인: '이번 달은 컨디션이 안정적이고 정신 건강에 좋은 시기예요. 명상·요가 같은 잔잔한 활동이 어울려요.',
  편인: '이번 달은 예민·잠 못 이룸 주의보예요. 카페인·과음을 평소보다 줄이고 일찍 자는 흐름.',
};

export function healthForecast(
  myeongsik: Myeongsik,
  today: Date = new Date()
): HealthForecast | null {
  const myIlgan = myeongsik.ilgan.c;
  if (!isStem(myIlgan)) return null;
  const seed = myeongsikSeed(myeongsik);

  // 오행 카운트 (이미 myeongsik.ohaeng에 있음)
  const counts = myeongsik.ohaeng;
  const ohaengList: Ohaeng[] = ['wood', 'fire', 'earth', 'metal', 'water'];

  // 가장 약한 오행 (카운트 0 우선, 없으면 최저)
  let weakOhaeng: Ohaeng = 'wood';
  let weakCount = Infinity;
  for (const o of ohaengList) {
    if (counts[o] < weakCount) {
      weakCount = counts[o];
      weakOhaeng = o;
    }
  }

  // 4 axis 점수
  // 체력 = 일간 오행 카운트 + 신강도(약 = 페널티)
  // 정신 = 火·水 균형도
  // 면역 = 金 카운트
  // 소화 = 土 카운트
  const ilganOhaeng = (() => {
    const m: Record<Stem, Ohaeng> = {
      甲: 'wood', 乙: 'wood', 丙: 'fire', 丁: 'fire',
      戊: 'earth', 己: 'earth', 庚: 'metal', 辛: 'metal',
      壬: 'water', 癸: 'water',
    };
    return m[myIlgan];
  })();


  const baseVitality = 60 + counts[ilganOhaeng] * 5 + (counts[ilganOhaeng] >= 2 ? 5 : 0);
  const baseMental = 60 + Math.min(counts.fire, counts.water) * 6;
  const baseImmune = 60 + counts.metal * 7;
  const baseDigestion = 60 + counts.earth * 7;

  // 부족한 오행 페널티
  const penalty = (o: Ohaeng) => (counts[o] === 0 ? -8 : counts[o] === 1 ? -3 : 0);

  const adjust = (key: string, v: number) =>
    Math.max(50, Math.min(98, v + variance(seed, key, 3)));

  const vitality  = adjust('vit', baseVitality + penalty(ilganOhaeng));
  const mental    = adjust('men', baseMental + penalty('fire') + penalty('water'));
  const immune    = adjust('imm', baseImmune + penalty('metal'));
  const digestion = adjust('dig', baseDigestion + penalty('earth'));

  const overall = Math.round((vitality + mental + immune + digestion) / 4);

  // 이번 달 월주 십성 → 이번 달 흐름
  const r = calculateSaju(today.getFullYear(), today.getMonth() + 1, 15, 12, 0, {
    applyTimeCorrection: false,
  });
  const mStem = r.monthPillarHanja[0];
  const monthSipsung: Sipsung = isStem(mStem) ? getSipsung(myIlgan, mStem) : '식신';

  const tagline =
    overall >= 85 ? '컨디션이 활기 있는 흐름'
    : overall >= 75 ? '안정적인 흐름이에요'
    : overall >= 65 ? '꾸준한 케어가 답인 시기'
    : '회복이 우선인 시기';

  const tier = (s: number) => (s >= 85 ? 'high' : s >= 75 ? 'mid' : s >= 65 ? 'low' : 'warn');
  const oneLine = (kind: 'vit' | 'men' | 'imm' | 'dig', s: number) => {
    const t = tier(s);
    if (kind === 'vit')
      return t === 'high' ? '활기찬 체력' : t === 'mid' ? '안정적 체력' : t === 'low' ? '꾸준히 다지기' : '휴식 우선';
    if (kind === 'men')
      return t === 'high' ? '정신 안정' : t === 'mid' ? '집중력 좋음' : t === 'low' ? '명상·산책 추천' : '정서 케어 우선';
    if (kind === 'imm')
      return t === 'high' ? '면역력 강해요' : t === 'mid' ? '꾸준한 케어' : t === 'low' ? '환절기 주의' : '호흡 운동 필수';
    return t === 'high' ? '소화 좋아요' : t === 'mid' ? '안정적 소화' : t === 'low' ? '규칙적 식사' : '소화 케어 우선';
  };

  const weakInfo = OHAENG_HEALTH[weakOhaeng];

  return {
    score: overall,
    mood: MOOD_BY_WEAK[weakOhaeng],
    tagline,
    body: `${HEALTH_BODY_BY_ILGAN[myIlgan]} ${profileHint(myeongsik)}`,
    axes: [
      { ic: '💪', lbl: '체력',     score: vitality,  color: '#FF8B6C', oneLine: oneLine('vit', vitality) },
      { ic: '🧠', lbl: '정신',     score: mental,    color: '#9D7BFF', oneLine: oneLine('men', mental)   },
      { ic: '🛡️', lbl: '면역',     score: immune,    color: '#6FCFC9', oneLine: oneLine('imm', immune)   },
      { ic: '🌾', lbl: '소화',     score: digestion, color: '#FFC857', oneLine: oneLine('dig', digestion) },
    ],
    weak: {
      ohaeng: weakOhaeng,
      ohaengKr: OHAENG_KR[weakOhaeng],
      parts: weakInfo.parts,
      symptoms: weakInfo.symptoms,
      body: weakInfo.weakBody,
      foods: weakInfo.foods,
      activity: weakInfo.activity,
    },
    keywords: KEYWORDS_BY_WEAK[weakOhaeng],
    monthFlow: MONTH_FLOW_BY_SIPSUNG[monthSipsung],
    tips: rotateBySeed(seed, 'health_tips', TIPS_BY_WEAK[weakOhaeng], 3),
  };
}

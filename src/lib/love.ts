import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';
import type { Myeongsik } from './saju';

/**
 * 연애운 — 본인 사주 기반.
 *
 * 명리 룰:
 *   - 도화살(桃花): 子午卯酉 지지 = 매력·끌림 신살
 *   - 재성(財星): 일간이 극하는 오행 → 정재(배우자)/편재(연애)
 *   - 관성(官星): 일간을 극하는 오행 → 정관(남편/안정)/편관(애인/자극)
 *   - 식상(食傷): 식신/상관 = 표현·매력 발산
 *   - 인성(印星): 정신적 안정·조력
 *
 * 4 axis 점수:
 *   매력 (도화 + 식상)
 *   인연 신호 (재성·관성 분포 + 합 가능성)
 *   소통 표현 (식상 강도)
 *   관계 안정 (정인 + 정관 + 정재)
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

/** 도화살 지지 — 子午卯酉 */
const DOHWA_BRANCHES = new Set(['子', '午', '卯', '酉']);

/** 십성별 끌리는 타입 (재성·관성에 해당하는 십성에 매칭) */
const ATTRACTED_TYPE_MAP: Record<Sipsung, string> = {
  비견: '비슷한 결의 친구 같은 사람',
  겁재: '경쟁심·승부욕 있는 강한 사람',
  식신: '편안하고 표현이 자연스러운 사람',
  상관: '재치 있고 톡톡 튀는 사람',
  정재: '안정적이고 진중한 사람',
  편재: '활기 있고 사교적인 사람',
  정관: '책임감 있고 신뢰 가는 사람',
  편관: '카리스마 있는 강렬한 사람',
  정인: '따뜻하고 깊은 대화가 통하는 사람',
  편인: '미스터리한 매력의 독특한 사람',
};

/** 일간별 기본 끌리는 타입 (재·관 기준) */
const TYPE_BY_ILGAN: Record<Stem, [Sipsung, Sipsung]> = {
  甲: ['정재', '정관'], 乙: ['편재', '편관'],
  丙: ['정재', '정관'], 丁: ['편재', '편관'],
  戊: ['정재', '정관'], 己: ['편재', '편관'],
  庚: ['정재', '정관'], 辛: ['편재', '편관'],
  壬: ['정재', '정관'], 癸: ['편재', '편관'],
};

/** 일간별 연애 톤 풀이 (4~5줄) */
const LOVE_BODY_BY_ILGAN: Record<Stem, string> = {
  甲: '큰 나무처럼 곧고 정직한 사랑을 해요. 한 번 마음 주면 끝까지 가는 타입이에요. 단 너무 자기 방향만 보다 상대 마음을 놓칠 수 있어요. 유연하게 휘어주는 상대와 균형이 잘 맞아요.',
  乙: '바람에 부드럽게 휘는 풀처럼 세심하고 다정한 사랑을 해요. 상대 마음을 잘 읽고 맞춰주는 타입이에요. 단 너무 맞춰주다 본인이 지칠 수 있으니 자기 시간도 챙겨주세요. 강하게 끌어주는 사람과 잘 맞아요.',
  丙: '한낮의 태양처럼 밝고 표현이 큰 사랑을 해요. 좋아하면 직진, 숨기지 않는 타입이에요. 단 감정 기복이 클 수 있고 빨리 식기도 해요. 차분하게 받아주는 상대와 균형이 잘 맞아요.',
  丁: '촛불처럼 안에서 깊게 빛나는 사랑을 해요. 한 사람에게 마음 깊게 쓰는 타입이라 인연이 오래 가요. 단 감정 소진이 빠르니 정서적 케어가 필요해요. 따뜻하게 비춰주는 사람과 잘 맞아요.',
  戊: '큰 산처럼 묵직하고 듬직한 사랑을 해요. 흔들리지 않는 신뢰가 매력이에요. 단 너무 무거워서 감정 표현이 부족할 수 있으니 한 번 더 다정한 말을 건네주세요. 활기 있는 상대가 균형을 잡아줘요.',
  己: '비옥한 들판처럼 포용하고 키워주는 사랑을 해요. 어머니 같은 따뜻함이 매력이에요. 단 너무 다 받아주다 본인이 흐트러질 수 있어요. 명확한 사람과 함께면 진짜 빛나는 관계가 돼요.',
  庚: '강철처럼 결단력 있고 직선적인 사랑을 해요. 좋고 싫음이 분명한 타입이에요. 단 너무 직설적이면 상대 마음을 다치게 할 수 있어요. 부드럽게 받아주는 상대와 균형이 좋아요.',
  辛: '잘 닦인 보석처럼 섬세하고 완벽주의적인 사랑을 해요. 디테일에 마음 쓰는 타입이에요. 단 자기 기준이 또렷해서 상대를 평가하기 쉬워요. 있는 그대로 받아주는 사람과 잘 맞아요.',
  壬: '큰 강처럼 자유롭고 흐름을 읽는 사랑을 해요. 다양한 사람과 잘 어울리는 타입이에요. 단 너무 흐르다 한 사람에게 정착이 어려울 수 있어요. 방향성을 정해주는 사람과 시너지가 폭발해요.',
  癸: '맑은 샘물처럼 차분하고 깊게 스며드는 사랑을 해요. 조용히 마음 쓰는 타입이에요. 단 너무 조용하면 본인 마음이 잘 안 보여요. 적극적으로 다가와주는 상대와 균형이 잘 맞아요.',
};

/** 솔로/커플 공통 팁 — 십성 dominant 기반 */
const LOVE_TIPS: Record<Sipsung, Array<{ ic: string; lbl: string; sub: string; detail: string }>> = {
  비견: [
    { ic: '👯', lbl: '친구 모임 가기', sub: '인연은 친구의 친구로',
      detail: '동호회·동창회·친구 모임에 적극적으로 가보세요. 비견이 강한 사람은 친구의 친구·소개로 자연스럽게 만나는 인연이 가장 길게 가요. 새 사람 만날 자리에 한 번 가는 것만으로도 한 달 운이 풀려요.' },
    { ic: '💬', lbl: '먼저 표현하기', sub: '오해 키우지 말기',
      detail: '편안한 사이일수록 마음 표현을 한 번 더 해주세요. 비견은 "굳이 말 안 해도 알겠지" 하다가 오해가 쌓여요. "고마워 / 좋아해 / 보고 싶어" 한 마디가 관계를 단단하게 만들어요.' },
    { ic: '🤝', lbl: '같이 하는 활동', sub: '취미·운동 함께',
      detail: '데이트도 카페·식당만 가지 말고 같이 운동·요리·취미 같이 해보세요. 비견은 함께 무언가 만들어가는 자체가 운으로 와요. 둘이서 새 경험 하나 쌓을 때마다 관계가 깊어져요.' },
  ],
  겁재: [
    { ic: '🧘', lbl: '한 박자 쉬기', sub: '발끈 주의',
      detail: '겁재가 강하면 사소한 말투에 발끈하기 쉬워요. 화 났을 때 호흡 한 번 깊게 들이마시고 답하세요. 화났을 때 보낸 메시지·댓글은 다음 날 후회로 돌아와요. 답은 자고 나서 해도 늦지 않아요.' },
    { ic: '⚖️', lbl: '경쟁 모드 OFF', sub: '비교는 독',
      detail: 'SNS·주변 커플과 비교하기 시작하면 끝이 없어요. 겁재 사주는 비교 모드가 켜지면 본인 관계가 흔들려요. 의식적으로 "우리는 우리 페이스" 라고 마음 정리해주세요.' },
    { ic: '💪', lbl: '솔직한 대화', sub: '쌓아두지 말기',
      detail: '서운한 게 있으면 쌓아두지 말고 그날 풀어주세요. 겁재는 쌓이면 한 번에 폭발해서 관계에 흠집을 내요. "지금 이게 좀 신경 쓰여" 한 마디면 풀려요.' },
  ],
  식신: [
    { ic: '✨', lbl: '있는 그대로', sub: '꾸미지 않은 매력',
      detail: '식신은 자연스러운 모습이 가장 매력으로 보여요. 너무 꾸미려 하지 말고 평소 모습 그대로 가주세요. 좋아하는 음식·취미·웃음 포인트 자연스럽게 보여주는 게 가장 큰 어필이에요.' },
    { ic: '🍽️', lbl: '맛있는 데이트', sub: '음식이 매개',
      detail: '식신 사주는 음식·맛집·요리가 자연스러운 인연 매개예요. 같이 맛집 가기·요리해주기·새 음식 도전하기 — 좋은 데이트 코스. 식탁 위에서 자연스러운 대화가 깊어져요.' },
    { ic: '🎁', lbl: '소소한 표현', sub: '큰 이벤트 X',
      detail: '식신은 큰 이벤트보다 일상의 소소한 표현이 운으로 와요. 출근길 메시지·작은 간식·짧은 안부 — 매일의 작은 표현이 한 달 합치면 큰 마음이에요.' },
  ],
  상관: [
    { ic: '🎤', lbl: '톤 조절', sub: '직설은 가시',
      detail: '상관 사주는 재치·유머가 매력 포인트지만 직설이 가시처럼 박힐 수 있어요. 농담의 방향이 상대 약점·외모를 향하면 X. 같이 웃을 수 있는 농담만 — 상대를 깎는 농담은 관계 독이에요.' },
    { ic: '💡', lbl: '새로운 데이트', sub: '평범한 코스 X',
      detail: '상관은 평범한 데이트 코스에 금방 지루함을 느껴요. 전시·공연·낯선 동네·새 액티비티 — 평소 안 가는 자리가 더 빛나는 사이를 만들어요. 한 달에 한 번이라도 새 경험 하나.' },
    { ic: '✍️', lbl: '메시지보다 만남', sub: '글로 풀면 오해',
      detail: '상관 사주는 글로 쓰면 의도보다 강하게 전달돼요. 중요한 얘기는 메신저 X — 직접 만나서 얼굴 보고 풀어주세요. 톤·표정이 같이 가야 진심이 전달돼요.' },
  ],
  정재: [
    { ic: '💍', lbl: '진중한 만남', sub: '오래 갈 인연',
      detail: '정재 사주는 가벼운 만남보다 진중하게 다가가는 자세가 답이에요. 한 사람에게 깊게 가는 흐름이 강해요. 결혼·동거·장기 관점이 자연스럽게 화제로 떠오를 수 있어요. 부담 갖지 말고 천천히, 깊게.' },
    { ic: '📅', lbl: '꾸준한 만남', sub: '주기 규칙',
      detail: '정재는 꾸준함이 신뢰로 쌓이는 흐름이에요. 일정 주기 만남(주 1~2회)을 정해두면 관계가 안정적으로 깊어져요. 자주 안 봐도 약속한 빈도는 지켜주세요.' },
    { ic: '🏠', lbl: '미래 그리기', sub: '구체적 계획',
      detail: '같이 미래를 구체적으로 그려보는 대화 좋아요. 5년 뒤·10년 뒤 어떻게 살고 싶은지 — 정재 사주는 구체적인 계획이 편안함을 줘요. 단 너무 무거워지면 X, 가볍게 풀고 진지하게 마무리.' },
  ],
  편재: [
    { ic: '🎯', lbl: '새로운 자리', sub: '낯선 곳에 인연',
      detail: '편재 사주는 익숙한 자리에만 있으면 인연이 들어올 자리가 좁아져요. 모임·여행·취미 클래스·새 동네 — 낯선 자리에 한 번 가보세요. 의외의 자리에서 케미가 폭발해요.' },
    { ic: '🔥', lbl: '직진 OK', sub: '망설이지 말기',
      detail: '편재는 끌림이 강할 때 망설이면 운이 흘러가요. "한 번 더 만나볼래요?" 같은 작은 직진은 OK. 단 큰 결정(결혼·동거)은 충분히 검증한 뒤에 — 충동 결정은 후회로 와요.' },
    { ic: '🎨', lbl: '경험 공유', sub: '여행·이벤트',
      detail: '편재는 경험을 공유하는 데서 케미가 깊어져요. 여행·페스티벌·콘서트·새 액티비티 — 같이 새 경험 하나 쌓을 때마다 관계가 단단해져요. 일상 데이트만 반복하면 금방 지루.' },
  ],
  정관: [
    { ic: '💼', lbl: '약속 지키기', sub: '신뢰가 곧 사랑',
      detail: '정관 사주는 작은 약속도 한 번 더 지키는 자체가 사랑의 표현이에요. 시간·약속·말한 것 — 사소한 디테일까지 챙기면 상대가 "이 사람 진짜네" 신호를 받아요.' },
    { ic: '📋', lbl: '진중한 대화', sub: '가벼움보다 진심',
      detail: '정관은 가벼운 농담보다 진심 어린 한 마디가 마음에 와닿아요. 농담도 좋지만 정기적으로 진지한 대화 — "요즘 어때?" "최근 가장 힘든 게 뭐야?" 같은 깊은 질문이 관계를 단단하게 해요.' },
    { ic: '😊', lbl: '미소 챙기기', sub: '진지함 ↔ 부드러움',
      detail: '정관은 진중한 게 매력이지만 너무 진지하면 답답해 보여요. 자연스러운 미소·가벼운 농담을 의식적으로 챙겨주세요. 진지함과 부드러움의 균형이 진짜 매력이에요.' },
  ],
  편관: [
    { ic: '⚡', lbl: '솔직한 대화', sub: '회피는 골 깊게',
      detail: '편관 사주는 갈등을 회피하면 골이 깊어져요. 솔직하게 부딪쳐야 풀려요. 단 정공법 + 부드러운 톤 — 강하게 밀되 사람한테는 부드럽게. 자존심 싸움은 결과가 좋아도 손해예요.' },
    { ic: '🛡️', lbl: '평정심 챙기기', sub: '강한 끌림 = 강한 갈등',
      detail: '편관은 강한 끌림과 강한 갈등이 동시에 와요. 평정심을 잃으면 관계가 흔들려요. 명상·산책·일기로 마음 정리하는 시간을 일주일에 한 번이라도 챙겨주세요.' },
    { ic: '🌱', lbl: '함께 성장', sub: '도전적 관계',
      detail: '편관은 평범한 합보다 도전적인 합이라 — 서로 부딪치며 성장하는 관계예요. 같이 새로운 도전·운동·공부 — 함께 한 단계 올라가는 경험이 진짜 사랑으로 이어져요.' },
  ],
  정인: [
    { ic: '📚', lbl: '깊은 대화', sub: '가치관 공유',
      detail: '정인 사주는 외모·돈·조건보다 가치관·꿈·생각으로 통하는 사이가 답이에요. 책·영화·여행 같이 보고 깊게 대화하는 자리에서 진짜 인연이 와요. 가벼운 만남은 빨리 식어요.' },
    { ic: '🌿', lbl: '천천히 깊게', sub: '시간이 친구',
      detail: '정인은 첫 만남보다 두 번째·세 번째 만남에서 진가가 드러나요. 빠른 진행 X — 천천히, 깊이 가는 인연이 진짜예요. 조급해하지 말고 시간이 보여주는 답을 기다려주세요.' },
    { ic: '🤲', lbl: '정신적 케어', sub: '지친 마음 챙기기',
      detail: '정인은 정신적 안정이 핵심이에요. 본인도 상대도 지친 날엔 무리한 데이트보다 조용한 시간 — 같이 책 읽기·산책·차 한 잔. 잔잔한 시간이 가장 큰 충전이에요.' },
  ],
  편인: [
    { ic: '🌙', lbl: '직관 따라가기', sub: '느낌이 답',
      detail: '편인은 분석보다 직관이 정확한 시기예요. "왠지 이 사람" 같은 느낌이 진짜 답일 가능성이 높아요. 단 큰 결정(결혼·이사)은 일주일 미루기 — 일주일 뒤에도 좋으면 그때 결정.' },
    { ic: '🎭', lbl: '특별한 자리', sub: '예술·여행',
      detail: '편인 사주는 평범한 만남보다 특별한 자리·예술·공연·서점·여행에서 케미가 폭발해요. 일반적인 카페 데이트보다 분위기 있는 자리·낯선 도시 — 비일상에서 깊어지는 사이.' },
    { ic: '🌌', lbl: '독립 시간', sub: '혼자 시간도 필요',
      detail: '편인은 혼자만의 시간이 충전이에요. 너무 붙어 있으면 답답해질 수 있어요. 서로 독립적인 시간을 존중하는 관계가 오래 가요. 거리감이 곧 사랑의 또 다른 형태예요.' },
  ],
};

export type LoveForecast = {
  /** 종합 연애운 점수 */
  score: number;
  mood: string;
  tagline: string;
  /** 연애 톤 풀이 (4~5줄) */
  body: string;
  /** 4 axis 점수 */
  axes: Array<{ ic: string; lbl: string; score: number; color: string; oneLine: string }>;
  /** 도화살 분석 */
  dohwa: { count: number; positions: string[]; line: string };
  /** 끌리는 타입 (2개) */
  attractedTypes: [string, string];
  /** 인연 들어오는 시기 (이번 달 + 다음 3개월 중 best) */
  timing: { month: number; reason: string };
  /** 연애 팁 3개 */
  tips: Array<{ ic: string; lbl: string; sub: string; detail: string }>;
};

const MOOD: Record<Sipsung, string> = {
  비견: '함께 가는 결',  겁재: '뜨거운 끌림',
  식신: '자연스런 매력', 상관: '톡톡 튀는 매력',
  정재: '깊고 진중한 결', 편재: '활기찬 끌림',
  정관: '신뢰의 결',     편관: '강렬한 끌림',
  정인: '정신적 교감',   편인: '미스터리한 끌림',
};

export function loveForecast(myeongsik: Myeongsik, today: Date = new Date()): LoveForecast | null {
  const myIlgan = myeongsik.ilgan.c;
  if (!isStem(myIlgan)) return null;
  const seed = myeongsikSeed(myeongsik);

  // 도화살 카운트 (4지지 중 子午卯酉 개수)
  const branches = myeongsik.pillars.map((p) => p.bot.c);
  const dohwaPositions: string[] = [];
  branches.forEach((b, i) => {
    if (DOHWA_BRANCHES.has(b)) {
      const labels = ['연주', '월주', '일주', '시주'];
      dohwaPositions.push(`${labels[i]} ${b}`);
    }
  });
  const dohwaCount = dohwaPositions.length;

  // 십성 분포 (천간 4 — 단, 일간 자기 자신 제외)
  const sipsungCount: Partial<Record<Sipsung, number>> = {};
  myeongsik.pillars.forEach((p, i) => {
    if (i === 2) return; // 일주 천간은 본인 = 제외
    const t = p.top.c;
    if (isStem(t)) {
      const sip = getSipsung(myIlgan, t);
      sipsungCount[sip] = (sipsungCount[sip] ?? 0) + 1;
    }
  });

  const has = (sip: Sipsung) => (sipsungCount[sip] ?? 0) > 0;

  // 4 axis 점수 산출
  const baseAttraction = 60 + dohwaCount * 8 + (has('식신') ? 8 : 0) + (has('상관') ? 6 : 0);
  const baseSignal = 60 + (has('정재') ? 10 : 0) + (has('편재') ? 8 : 0) + (has('정관') ? 8 : 0) + (has('편관') ? 6 : 0);
  const baseExpression = 60 + (has('식신') ? 12 : 0) + (has('상관') ? 10 : 0);
  const baseStability = 60 + (has('정인') ? 8 : 0) + (has('정관') ? 10 : 0) + (has('정재') ? 8 : 0);

  const adjust = (key: string, v: number) =>
    Math.max(50, Math.min(98, v + variance(seed, key, 3)));

  const attraction = adjust('attr', baseAttraction);
  const signal     = adjust('sig',  baseSignal);
  const expression = adjust('expr', baseExpression);
  const stability  = adjust('stab', baseStability);
  const overall    = Math.round((attraction + signal + expression + stability) / 4);

  // dominant 십성 — body·tips·mood 기반
  const dominant = (Object.entries(sipsungCount) as Array<[Sipsung, number]>).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] ?? '식신';

  // 끌리는 타입 — 일간별 재성·관성 매칭
  const [t1, t2] = TYPE_BY_ILGAN[myIlgan];
  const attractedTypes: [string, string] = [
    ATTRACTED_TYPE_MAP[t1],
    ATTRACTED_TYPE_MAP[t2],
  ];

  // 인연 들어오는 시기 — 다음 3개월 중 재·관 십성 강한 달
  const y = today.getFullYear();
  const mNow = today.getMonth() + 1;
  let bestM = mNow;
  let bestS = 0;
  for (let i = 0; i < 4; i++) {
    const checkY = y + Math.floor((mNow - 1 + i) / 12);
    const checkM = ((mNow - 1 + i) % 12) + 1;
    const r = calculateSaju(checkY, checkM, 15, 12, 0, { applyTimeCorrection: false });
    const ms = r.monthPillarHanja[0];
    if (!isStem(ms)) continue;
    const sip = getSipsung(myIlgan, ms);
    let score = 0;
    if (sip === '정재' || sip === '편재') score = 90;
    else if (sip === '정관' || sip === '편관') score = 85;
    else if (sip === '식신' || sip === '상관') score = 75;
    else score = 65;
    score += variance(seed, `tim_${i}`, 3);
    if (score > bestS) {
      bestS = score;
      bestM = checkM;
    }
  }

  const timingReason =
    bestS >= 85 ? '재성·관성이 강한 달이라 끌림이 또렷해져요'
    : bestS >= 75 ? '식상이 활성화돼서 매력이 자연스럽게 빛나요'
    : '잔잔하지만 안정적인 인연 신호가 와요';

  const dohwaLine =
    dohwaCount === 0 ? '도화살이 없어요. 자기 매력은 외모보다 분위기·태도에서 와요.'
    : dohwaCount === 1 ? `도화살 1개가 ${dohwaPositions[0]}에 있어요. 은은한 매력이 매력 포인트예요.`
    : dohwaCount === 2 ? `도화살이 2개 (${dohwaPositions.join(', ')}) 있어요. 매력 신호가 강한 사주예요.`
    : `도화살이 ${dohwaCount}개나 있어요 (${dohwaPositions.join(', ')}). 매력으로 사람을 끌어당기는 흐름이 강해요.`;

  const moodOf = MOOD[dominant];
  const tagline =
    overall >= 85 ? '연애운이 활짝 피어 있어요'
    : overall >= 75 ? '안정적이고 자연스러운 흐름'
    : overall >= 65 ? '담담하지만 깊어지는 시기'
    : '내면을 다지는 차분한 시기';

  // 4 axis oneLine
  const tier = (s: number) => (s >= 85 ? 'high' : s >= 75 ? 'mid' : s >= 65 ? 'low' : 'warn');
  const oneLine = (kind: 'attr' | 'sig' | 'expr' | 'stab', s: number) => {
    const t = tier(s);
    if (kind === 'attr')
      return t === 'high' ? '매력 신호 강해요' : t === 'mid' ? '은은한 매력' : t === 'low' ? '담담한 매력' : '자기 케어 우선';
    if (kind === 'sig')
      return t === 'high' ? '인연 들어올 흐름' : t === 'mid' ? '안정적 신호' : t === 'low' ? '잔잔한 흐름' : '오해 주의';
    if (kind === 'expr')
      return t === 'high' ? '표현이 자연스러워요' : t === 'mid' ? '진심이 잘 전달돼요' : t === 'low' ? '말로 푸는 연습' : '글보단 만남으로';
    return t === 'high' ? '관계가 단단해요' : t === 'mid' ? '신뢰가 쌓이는 시기' : t === 'low' ? '천천히 깊어지기' : '거리 두고 호흡';
  };

  return {
    score: overall,
    mood: moodOf,
    tagline,
    body: LOVE_BODY_BY_ILGAN[myIlgan],
    axes: [
      { ic: '✨', lbl: '매력',     score: attraction, color: '#F495C9', oneLine: oneLine('attr', attraction) },
      { ic: '💞', lbl: '인연 신호', score: signal,    color: '#FF8B6C', oneLine: oneLine('sig',  signal)    },
      { ic: '💬', lbl: '소통 표현', score: expression, color: '#9D7BFF', oneLine: oneLine('expr', expression) },
      { ic: '🤝', lbl: '관계 안정', score: stability,  color: '#3DC795', oneLine: oneLine('stab', stability) },
    ],
    dohwa: { count: dohwaCount, positions: dohwaPositions, line: dohwaLine },
    attractedTypes,
    timing: { month: bestM, reason: timingReason },
    tips: LOVE_TIPS[dominant],
  };
}

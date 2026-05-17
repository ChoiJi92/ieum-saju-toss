import type { Myeongsik } from './saju';

/**
 * 신살(神煞) — 명리 표준 8종.
 *
 *   천을귀인 (天乙貴人) — 일간별 지지 = 어려울 때 도와주는 길성
 *   도화살   (桃花)     — 삼합 = 매력·인기·구설
 *   역마살   (驛馬)     — 삼합 = 이동·여행·이직
 *   화개살   (華蓋)     — 삼합 = 예술·종교·고독
 *   문창귀인 (文昌貴人) — 일간별 지지 = 학문·시험·창작 길성
 *   천덕귀인 (天德貴人) — 월지별 천간·지지 = 인복·하늘의 도움
 *   양인살   (羊刃)     — 양일간(甲丙戊庚壬) 특정 지지 = 칼날 같은 추진력·충동
 *   괴강살   (魁罡)     — 일주 자체가 庚辰·庚戌·壬辰·壬戌·戊戌·戊辰 = 강한 카리스마·고집
 */

const PILLAR_LABELS = ['연주', '월주', '일주', '시주'] as const;

/** 천을귀인 — 일간별 매핑 (한국 명리 표준) */
const CHEONUL_MAP: Record<string, [string, string]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  辛: ['寅', '午'],
  壬: ['卯', '巳'], 癸: ['卯', '巳'],
};

/** 문창귀인 — 일간별 매핑 */
const MUNCHANG_MAP: Record<string, string> = {
  甲: '巳', 乙: '午',
  丙: '申', 戊: '申',
  丁: '酉', 己: '酉',
  庚: '亥', 辛: '子',
  壬: '寅', 癸: '卯',
};

/** 양인살 — 양일간(甲丙戊庚壬)만 인정 (한국 명리 표준) */
const YANGIN_MAP: Record<string, string> = {
  甲: '卯',
  丙: '午', 戊: '午',
  庚: '酉',
  壬: '子',
};

/** 천덕귀인 — 월지별 천간/지지 (둘 중 하나라도 명식에 있으면 인정) */
const CHEONDEOK_MAP: Record<string, string[]> = {
  寅: ['丁'], 卯: ['申'], 辰: ['壬'],
  巳: ['辛'], 午: ['亥'], 未: ['甲'],
  申: ['癸'], 酉: ['寅'], 戌: ['丙'],
  亥: ['乙'], 子: ['巳'], 丑: ['庚'],
};

/** 괴강 일주 6종 */
const GOEGANG_SET = new Set(['庚辰', '庚戌', '壬辰', '壬戌', '戊戌', '戊辰']);

/** 삼합 기반 — 도화·역마·화개 anchor (일지·년지 → 대상 지지) */
const TRIO_DOHWA: Record<string, string> = {
  寅: '卯', 午: '卯', 戌: '卯',
  巳: '午', 酉: '午', 丑: '午',
  申: '酉', 子: '酉', 辰: '酉',
  亥: '子', 卯: '子', 未: '子',
};
const TRIO_YEOKMA: Record<string, string> = {
  寅: '申', 午: '申', 戌: '申',
  巳: '亥', 酉: '亥', 丑: '亥',
  申: '寅', 子: '寅', 辰: '寅',
  亥: '巳', 卯: '巳', 未: '巳',
};
const TRIO_HWAGAE: Record<string, string> = {
  寅: '戌', 午: '戌', 戌: '戌',
  巳: '丑', 酉: '丑', 丑: '丑',
  申: '辰', 子: '辰', 辰: '辰',
  亥: '未', 卯: '未', 未: '未',
};

export type SinsalItem = {
  name: string;        // "천을귀인"
  hanja: string;       // "天乙貴人"
  emoji: string;
  color: string;
  has: boolean;
  /** 기둥 이름 + 지지 (예: "월주 丑") */
  positions: string[];
  /** 짧은 한 줄 (있을 때 / 없을 때) */
  oneLine: string;
  /** 4~5줄 풀이 */
  body: string;
};

/** 명식에서 일치하는 지지 → "기둥명 지지" 라벨 */
function findPositions(branches: string[], target: string): string[] {
  return branches
    .map((b, i) => (b === target ? `${PILLAR_LABELS[i]} ${b}` : null))
    .filter((x): x is string => x !== null);
}

export function getSinsal(myeongsik: Myeongsik): SinsalItem[] {
  const ilgan = myeongsik.ilgan.c;
  const branches = myeongsik.pillars.map((p) => p.bot.c);
  const tops = myeongsik.pillars.map((p) => p.top.c);
  const ilji = branches[2];
  const wolji = branches[1];
  const yeonji = branches[0];
  const iljuKey = `${ilgan}${ilji}`;

  // 천을귀인
  const cheonULTargets = CHEONUL_MAP[ilgan] ?? [];
  const cheonULPositions = cheonULTargets.flatMap((t) => findPositions(branches, t));

  // 문창귀인 — 일간별 1개 지지
  const munchangTarget = MUNCHANG_MAP[ilgan];
  const munchangPositions = munchangTarget ? findPositions(branches, munchangTarget) : [];

  // 양인살 — 양일간(甲丙戊庚壬)만, 특정 지지
  const yanginTarget = YANGIN_MAP[ilgan];
  const yanginPositions = yanginTarget ? findPositions(branches, yanginTarget) : [];

  // 천덕귀인 — 월지로 정해진 천간/지지가 명식 천간 4 또는 지지 4에 있으면
  const cheondeokTargets = CHEONDEOK_MAP[wolji] ?? [];
  const cheondeokPositions: string[] = [];
  cheondeokTargets.forEach((t) => {
    tops.forEach((c, i) => {
      if (c === t) cheondeokPositions.push(`${PILLAR_LABELS[i]} ${c}`);
    });
    branches.forEach((b, i) => {
      if (b === t) cheondeokPositions.push(`${PILLAR_LABELS[i]} ${b}`);
    });
  });

  // 괴강 일주 — 일주 자체가 6종 중 하나
  const isGoegang = GOEGANG_SET.has(iljuKey);
  const goegangPositions = isGoegang ? [`일주 ${iljuKey}`] : [];

  // 도화·역마·화개 anchor — 일지 우선, 없으면 년지
  const dohwaTarget = TRIO_DOHWA[ilji] ?? TRIO_DOHWA[yeonji] ?? '';
  const yeokmaTarget = TRIO_YEOKMA[ilji] ?? TRIO_YEOKMA[yeonji] ?? '';
  const hwagaeTarget = TRIO_HWAGAE[ilji] ?? TRIO_HWAGAE[yeonji] ?? '';

  const dohwaPositions = dohwaTarget ? findPositions(branches, dohwaTarget) : [];
  const yeokmaPositions = yeokmaTarget ? findPositions(branches, yeokmaTarget) : [];
  const hwagaePositions = hwagaeTarget ? findPositions(branches, hwagaeTarget) : [];

  return [
    {
      name: '천을귀인',
      hanja: '天乙貴人',
      emoji: '🌟',
      color: '#FFC857',
      has: cheonULPositions.length > 0,
      positions: cheonULPositions,
      oneLine:
        cheonULPositions.length > 0
          ? '어려울 때 도와주는 사람이 옆에 있어요'
          : '본인 힘으로 길을 만드는 결',
      body:
        cheonULPositions.length > 0
          ? '명식에 천을귀인이 있어요. 어려운 순간에 자연스럽게 도와주는 사람이 옆에 나타나는 길성이에요. 사회생활에서 인복·도움이 ↑이고, 위기 상황에서도 의외의 구원이 와요. 단 받는 만큼 베푸는 마음을 잊지 않으면 운이 더 길게 가요.'
          : '천을귀인은 없어요. 도움을 받기보단 본인 힘으로 길을 만들어가는 자수성가형 결이에요. 단 인복이 약한 게 아니라, 의도적으로 사람들과 연결을 더 챙기면 그게 곧 본인의 천을귀인이 돼요.',
    },
    {
      name: '도화살',
      hanja: '桃花',
      emoji: '🌸',
      color: '#F495C9',
      has: dohwaPositions.length > 0,
      positions: dohwaPositions,
      oneLine:
        dohwaPositions.length > 0
          ? '매력으로 사람을 끌어당기는 흐름'
          : '진실함·분위기로 끌어당기는 결',
      body:
        dohwaPositions.length > 0
          ? '명식에 도화살이 있어요. 외형·분위기·말투에서 매력이 자연스럽게 흘러나오는 흐름이에요. 인기·인연 신호 ↑이고 공연·예술·서비스업처럼 사람 앞에 서는 자리에서 빛나요. 단 화려한 만큼 구설수는 살짝 주의해주세요.'
          : '도화살이 없어요. 외형보단 진실함·분위기·내면으로 사람을 끌어당기는 결이에요. 첫인상보다 두 번째·세 번째 만남에서 진가가 드러나는 매력이에요.',
    },
    {
      name: '역마살',
      hanja: '驛馬',
      emoji: '🚀',
      color: '#5B8DEF',
      has: yeokmaPositions.length > 0,
      positions: yeokmaPositions,
      oneLine:
        yeokmaPositions.length > 0
          ? '한 자리에 머물지 않는 흐름'
          : '한 자리에 깊게 뿌리내리는 결',
      body:
        yeokmaPositions.length > 0
          ? '명식에 역마살이 있어요. 한 자리에 머무르지 않고 이동·변화가 잦은 흐름이에요. 여행·출장·이사·이직이 많은 인생이에요. 변화를 즐기는 결이라 무역·항공·외교·영업·해외 분야에서 빛나요. 안정성을 추구하면 답답해질 수 있어요.'
          : '역마살이 없어요. 한 자리에서 깊게 뿌리내리는 안정형 인생 결이에요. 자주 옮기기보단 한 곳에서 오래 다지는 흐름이 잘 맞아요. 안정성 있는 자리에서 가장 큰 성과가 나와요.',
    },
    {
      name: '화개살',
      hanja: '華蓋',
      emoji: '🎨',
      color: '#9D7BFF',
      has: hwagaePositions.length > 0,
      positions: hwagaePositions,
      oneLine:
        hwagaePositions.length > 0
          ? '예술·철학·고독을 즐기는 결'
          : '활동적·관계 중심의 결',
      body:
        hwagaePositions.length > 0
          ? '명식에 화개살이 있어요. 예술·종교·철학·연구 같은 깊이 있는 영역에 강한 결이에요. 혼자 사색하는 시간을 즐기고, 한 분야에 깊게 파고드는 힘이 있어요. 단 고독을 즐기는 만큼 사람 사이의 거리감도 챙겨야 해요.'
          : '화개살이 없어요. 사람·일·관계 중심의 활동적인 결이에요. 혼자 있기보단 함께 어울리고 움직일 때 에너지가 살아나요.',
    },
    {
      name: '문창귀인',
      hanja: '文昌貴人',
      emoji: '📚',
      color: '#3DC795',
      has: munchangPositions.length > 0,
      positions: munchangPositions,
      oneLine:
        munchangPositions.length > 0
          ? '학문·시험·창작의 길성'
          : '실전 경험으로 쌓는 결',
      body:
        munchangPositions.length > 0
          ? '명식에 문창귀인이 있어요. 학문·시험·자격증·글쓰기·창작에 운이 잘 따르는 길성이에요. 머리 회전이 빠르고 표현력이 자연스러워서, 학자·작가·강사·기획 자리에서 빛나요. 입시·시험 앞두면 평소보다 운이 +α예요.'
          : '문창귀인은 없어요. 책상 위 학문보단 실전·경험으로 쌓아가는 결이에요. 시험 운보단 현장 운이 강한 사주라, 직접 부딪치며 배우는 환경이 더 잘 맞아요.',
    },
    {
      name: '천덕귀인',
      hanja: '天德貴人',
      emoji: '✨',
      color: '#FFB69E',
      has: cheondeokPositions.length > 0,
      positions: cheondeokPositions,
      oneLine:
        cheondeokPositions.length > 0
          ? '하늘이 돕는 인복의 결'
          : '본인 힘으로 쌓는 결',
      body:
        cheondeokPositions.length > 0
          ? '명식에 천덕귀인이 있어요. "하늘이 돕는다"는 의미의 큰 길성이에요. 어려운 순간에 의외의 도움·기회·인연이 자연스럽게 들어와요. 천을귀인이 사람 도움이라면, 천덕귀인은 운 자체의 도움. 베푸는 만큼 더 크게 돌아와요.'
          : '천덕귀인은 없어요. 큰 외부 운보다 본인 노력으로 차곡차곡 쌓아가는 결이에요. 단 운이 약한 게 아니라, 만드는 운이 강한 사주예요. 작은 선행·인연 챙김이 곧 본인의 천덕이 돼요.',
    },
    {
      name: '양인살',
      hanja: '羊刃',
      emoji: '⚔️',
      color: '#FF6B6B',
      has: yanginPositions.length > 0,
      positions: yanginPositions,
      oneLine:
        yanginPositions.length > 0
          ? '칼날 같은 추진력·결단력'
          : '균형 잡힌 추진력의 결',
      body:
        yanginPositions.length > 0
          ? '명식에 양인살이 있어요. 칼날처럼 날카로운 추진력·결단력·승부욕을 가진 사주예요. 큰 결정 자리·위기 돌파·경영·군경에서 폭발적이지만, 충동·과욕도 그만큼 커요. "사용하면 무기, 통제 못 하면 본인을 다치게 한다"는 양면성이 있어요. 정기적 휴식·명상으로 균형 잡기.'
          : '양인살은 없어요. 칼날처럼 강한 추진력은 약하지만, 그만큼 균형 잡힌 진행이 자연스러워요. 한 번에 폭발하기보단 꾸준히 다지는 결이라 장기적으로 안정적이에요.',
    },
    {
      name: '괴강살',
      hanja: '魁罡',
      emoji: '🗡️',
      color: '#4A3F5A',
      has: isGoegang,
      positions: goegangPositions,
      oneLine: isGoegang ? '극단적 카리스마의 결' : '온화한 균형의 결',
      body: isGoegang
        ? '일주 자체가 괴강(魁罡)이에요. 한국 명리에서 매우 강한 일주로 분류돼요. 카리스마·고집·극단성을 함께 가진 일주라, 큰 성공 아니면 큰 실패의 양극단으로 갈 수 있어요. 군경·법조·의사·종교·CEO 자리에서 빛나는 결. 단 자기 통제가 평생 키워드 — 술·도박·충동 결정은 절대 피하세요.'
        : '괴강 일주가 아니에요. 극단성보단 균형 잡힌 진행이 자연스러운 결이에요. 큰 성공·큰 실패 양극보다 안정적으로 꾸준히 성장하는 패턴이 잘 맞아요.',
    },
  ];
}

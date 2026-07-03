import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';
import { TG_KR, DZ_KR } from './saju';
import type { Myeongsik } from './saju';

/**
 * 대운(大運) + 세운(歲運) 룰베이스 계산.
 *
 * 대운 = 10년 단위 인생 흐름. 월주 천간 기준으로 순행/역행.
 *   양년(甲丙戊庚壬) + 남 = 순행
 *   음년(乙丁己辛癸) + 남 = 역행
 *   양년 + 여 = 역행
 *   음년 + 여 = 순행
 * 대운수 = 출생일과 절기까지 거리 / 3 (정밀 계산은 절기 시각 필요).
 *   단순화: 5살 시작 (대부분 케이스 ±2 오차).
 *
 * 세운 = 매년 60갑자. manseryeok calculateSaju 의 yearPillar 활용.
 */

type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const isStem = (s: string): s is Stem => (STEMS as string[]).includes(s);

/** 60갑자에서 한 칸 이동 (순행/역행) */
function shiftGapja(stem: string, branch: string, direction: 'forward' | 'backward', steps: number) {
  const sIdx = STEMS.indexOf(stem as Stem);
  const bIdx = BRANCHES.indexOf(branch);
  const delta = direction === 'forward' ? steps : -steps;
  const newS = ((sIdx + delta) % 10 + 10) % 10;
  const newB = ((bIdx + delta) % 12 + 12) % 12;
  return { stem: STEMS[newS], branch: BRANCHES[newB] };
}

export type DaewoonItem = {
  /** 시작 나이 */
  age: number;
  stem: string;
  branch: string;
  /** 한글 라벨 (갑자·을축 등) */
  label: string;
  sipsung: Sipsung | null;
  /** 현재 대운인지 */
  isCurrent: boolean;
};

export type SeunItem = {
  year: number;
  stem: string;
  branch: string;
  label: string;
  age: number;
  sipsung: Sipsung | null;
  isCurrent: boolean;
};

/** 대운 10개 (시작 나이 5살 가정, 10년 단위 — 5~104살 커버) */
export function getDaewoon(myeongsik: Myeongsik, profile: { year: number; gender: 'male' | 'female' }): DaewoonItem[] {
  const ilgan = myeongsik.ilgan.c;
  // 년주 천간 음양으로 순행/역행 결정
  const yearStem = myeongsik.pillars[0].top.c;
  const yearStemIdx = STEMS.indexOf(yearStem as Stem);
  const isYangYear = yearStemIdx % 2 === 0; // 甲(0)·丙(2)·戊(4)·庚(6)·壬(8) = 양
  const isMale = profile.gender === 'male';
  // 양년+남 OR 음년+여 = 순행, 그 외 역행
  const direction: 'forward' | 'backward' =
    (isYangYear && isMale) || (!isYangYear && !isMale) ? 'forward' : 'backward';

  // 월주에서 시작 (대운 첫 칸은 월주에서 한 칸 이동)
  const monthStem = myeongsik.pillars[1].top.c;
  const monthBranch = myeongsik.pillars[1].bot.c;

  const startAge = 5; // 단순화 (정확한 대운수는 절기 계산 필요)
  const today = new Date();
  const currentAge = today.getFullYear() - profile.year;

  const items: DaewoonItem[] = [];
  for (let i = 0; i < 10; i++) {
    const { stem, branch } = shiftGapja(monthStem, monthBranch, direction, i + 1);
    const age = startAge + i * 10;
    const isCurrent = currentAge >= age && currentAge < age + 10;
    items.push({
      age,
      stem,
      branch,
      label: `${TG_KR[stem] ?? stem}${DZ_KR[branch] ?? branch}`,
      sipsung: isStem(ilgan) && isStem(stem) ? getSipsung(ilgan, stem) : null,
      isCurrent,
    });
  }
  return items;
}

/** 대운 십성별 10년 흐름 해석 (3~4문장) */
export const DAEWOON_TEXT: Record<Sipsung, string> = {
  비견:
    '이 10년은 나 자신을 단단히 세우고 확장해 가는 시기예요. 동료·파트너십이 늘어나고, 독립적으로 움직일수록 빛을 발해요. 경쟁보다는 협력에서 기회를 찾는 태도가 유리하고, 나만의 영역을 꾸준히 넓혀 가면 큰 성취를 맛볼 수 있어요. 혼자 결정하는 습관을 기르는 것이 이 대운의 핵심이에요.',
  겁재:
    '이 10년은 도전과 경쟁이 삶의 엔진이 되는 시기예요. 강한 추진력으로 새로운 분야에 뛰어들 수 있지만, 무리한 투자·보증은 조심해야 해요. 인간관계에서 의리와 신뢰를 검증받는 일이 많아지고, 이기고 지는 경험이 결국 내실을 만들어 줘요. 욕심보다 원칙을 앞세우는 선택이 이 대운을 빛나게 해줄 거예요.',
  식신:
    '이 10년은 여유와 창의가 꽃피는 가장 풍요로운 시기 중 하나예요. 먹고 즐기고 표현하는 모든 것이 복이 되고, 건강 에너지도 넘쳐요. 하고 싶었던 일을 실현할 추진력이 생기고, 주변에서 도움의 손길도 자연스럽게 들어와요. 이 대운에는 재능을 세상에 내보이는 용기를 꼭 내보세요.',
  상관:
    '이 10년은 표현·변화·자유가 키워드인 역동적인 시기예요. 뛰어난 아이디어가 많이 떠오르고, 기존의 틀을 깨는 행보가 주목받아요. 단, 말과 행동이 거칠어질 수 있어 구설수를 조심하고 지나친 자기주장은 자제하는 것이 중요해요. 창의성을 긍정적인 방향으로 발산하면 인생에서 가장 빛나는 챕터가 될 거예요.',
  정재:
    '이 10년은 꾸준히 쌓이는 안정적인 자산 형성의 시기예요. 급진적인 변화보다 성실한 루틴이 빛을 발하고, 직장·수입·가정 모두 안정된 흐름을 탈 수 있어요. 절약과 계획적인 지출 습관이 이 대운의 복을 지키는 열쇠예요. 한 걸음씩 목표를 향해 나아가면 10년 후 든든한 기반이 만들어져 있을 거예요.',
  편재:
    '이 10년은 큰 돈의 흐름이 열리는 역동적인 기회의 시기예요. 사업·부동산·투자 등 굵직한 도전에서 성과를 낼 수 있고, 사교성이 높아져 귀인을 만날 가능성도 커요. 반면 한꺼번에 큰돈을 잃는 리스크도 함께 커지니, 분산 투자와 리스크 관리를 철저히 해야 해요. 기회를 놓치지 않되 욕심보다 판단력으로 움직이는 것이 포인트예요.',
  정관:
    '이 10년은 명예·승진·사회적 책임이 무르익는 안정의 황금기예요. 성실히 해온 일들이 인정받고, 직위나 직책이 올라가는 경험을 하게 될 가능성이 높아요. 규칙과 원칙을 지키는 생활 태도가 신뢰를 쌓고, 장기적으로 더 큰 기회를 열어줘요. 지금 쌓는 평판이 이후 10년의 자산이 된다는 것을 기억해 주세요.',
  편관:
    '이 10년은 강한 압박과 도전 속에서 권한과 실력을 키워 가는 시기예요. 리더십이 필요한 자리에 서거나, 예상치 못한 변화에 휘말릴 수도 있어요. 하지만 이 대운을 잘 버텨낸 사람은 이전보다 훨씬 강해진 자신을 발견하게 돼요. 과도한 자기희생은 금물이고, 건강 관리를 특히 신경 써 주세요.',
  정인:
    '이 10년은 배움·문서·귀인의 기운이 가득한 성장의 시기예요. 자격증·학업·전문성 강화에 투자하면 몇 배의 보상이 돌아와요. 윗사람이나 스승 같은 귀인이 나타나 길을 열어 주고, 계획적인 삶의 방식이 큰 안정으로 이어져요. 욕심보다 깊이를 쌓는 방향으로 가면 이 대운이 인생의 전환점이 될 거예요.',
  편인:
    '이 10년은 직관·아이디어·전환이 삶을 이끄는 특이하고 창의적인 시기예요. 이직·전업·새로운 공부 등 기존과 다른 방향으로 흘러가는 경우가 많고, 영감이 넘치는 순간들이 찾아와요. 집중력이 분산될 수 있으니 한 가지 방향을 정해 깊이 파고드는 전략이 필요해요. 남들이 가지 않는 길에서 나만의 가능성을 발견하는 대운이에요.',
};

/** 세운 십성별 한 해 흐름 한 줄 (1문장) */
export const SEUN_TEXT: Record<Sipsung, string> = {
  비견: '나를 믿고 한 발짝 더 나아가는 자립의 해예요.',
  겁재: '경쟁과 도전이 가득하지만 그 안에서 더 강해지는 해예요.',
  식신: '하고 싶은 일을 펼치며 마음도 몸도 풍요로워지는 해예요.',
  상관: '새로운 표현과 변화로 인생의 방향이 넓어지는 해예요.',
  정재: '꾸준한 노력이 안정적인 결실로 돌아오는 해예요.',
  편재: '예상치 못한 기회와 큰 돈의 흐름이 열리는 해예요.',
  정관: '성실함이 명예와 인정으로 보상받는 해예요.',
  편관: '강한 압박 속에서도 한 단계 성장을 이루는 해예요.',
  정인: '배움과 귀인의 도움으로 실력이 쑥 성장하는 해예요.',
  편인: '직관과 영감이 빛나며 새로운 가능성을 여는 해예요.',
};

/** 세운 11년 (현재 ±5년) */
export function getSeun(myeongsik: Myeongsik, profile: { year: number }): SeunItem[] {
  const ilgan = myeongsik.ilgan.c;
  const today = new Date();
  const currentYear = today.getFullYear();
  const items: SeunItem[] = [];
  for (let offset = -3; offset <= 7; offset++) {
    const y = currentYear + offset;
    const r = calculateSaju(y, 3, 15, 12, 0, { applyTimeCorrection: false });
    const ystem = r.yearPillarHanja[0];
    const ybranch = r.yearPillarHanja[1];
    items.push({
      year: y,
      stem: ystem,
      branch: ybranch,
      label: `${TG_KR[ystem] ?? ystem}${DZ_KR[ybranch] ?? ybranch}`,
      age: y - profile.year,
      sipsung: isStem(ilgan) && isStem(ystem) ? getSipsung(ilgan, ystem) : null,
      isCurrent: y === currentYear,
    });
  }
  return items;
}

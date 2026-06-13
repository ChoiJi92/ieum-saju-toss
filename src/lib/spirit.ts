import type { Myeongsik } from './saju';
import type { OhaengKey } from '../components/ie';

/**
 * 통합 영물 모델 — v2.
 * 구 V2Clone(현 AppShell) 인라인 정의(makeSpirit 희귀도/색상)와 spirit-pet.ts 계열/동물/이미지를 하나로 병합.
 * 사주(Myeongsik)는 "어떤 영물인지"(계열+동물+희귀도)만 결정한다.
 * 표시 단계(stage)는 게임 진행이 결정 → 이미지는 imageFor(stage)로 단계별 생성.
 */

// OhaengKey 와 동일 (wood|fire|earth|metal|water)
export type ElementKey = OhaengKey;
export type ZodiacKey =
  | 'rat' | 'ox' | 'tiger' | 'rabbit' | 'dragon' | 'snake'
  | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig';
export type Stage = 1 | 2 | 3 | 4;

// word = 표시 계열명, imageWord = 이미지/저장 키용(디스크 폴더명). 보통 같지만 土는 분리(언덕 폴더 유지 + 황금 표시).
export const ELEMENTS = {
  wood: { key: 'wood', ko: '목', cn: '木', raw: '#5BD9AC', word: '새싹', imageWord: '새싹', trait: '자라나는', vibe: '생명력과 시작' },
  fire: { key: 'fire', ko: '화', cn: '火', raw: '#FF9E82', word: '노을', imageWord: '노을', trait: '타오르는', vibe: '열정과 표현' },
  earth: { key: 'earth', ko: '토', cn: '土', raw: '#FFD27A', word: '황금', imageWord: '언덕', trait: '품어주는', vibe: '안정과 신뢰' },
  metal: { key: 'metal', ko: '금', cn: '金', raw: '#D6C6FF', word: '달빛', imageWord: '달빛', trait: '벼려진', vibe: '결단과 정제' },
  water: { key: 'water', ko: '수', cn: '水', raw: '#7BA8FF', word: '이슬', imageWord: '이슬', trait: '흐르는', vibe: '지혜와 유연' },
} as const;

export const ZODIAC = {
  rat: { key: 'rat', ko: '쥐', cn: '子', emoji: '🐭', elem: 'water', trait: '영리한' },
  ox: { key: 'ox', ko: '소', cn: '丑', emoji: '🐮', elem: 'earth', trait: '우직한' },
  tiger: { key: 'tiger', ko: '호랑이', cn: '寅', emoji: '🐯', elem: 'wood', trait: '용맹한' },
  rabbit: { key: 'rabbit', ko: '토끼', cn: '卯', emoji: '🐰', elem: 'wood', trait: '다정한' },
  dragon: { key: 'dragon', ko: '용', cn: '辰', emoji: '🐲', elem: 'earth', trait: '당당한' },
  snake: { key: 'snake', ko: '뱀', cn: '巳', emoji: '🐍', elem: 'fire', trait: '신비로운' },
  horse: { key: 'horse', ko: '말', cn: '午', emoji: '🐴', elem: 'fire', trait: '자유로운' },
  goat: { key: 'goat', ko: '양', cn: '未', emoji: '🐑', elem: 'earth', trait: '온화한' },
  monkey: { key: 'monkey', ko: '원숭이', cn: '申', emoji: '🐵', elem: 'metal', trait: '재치있는' },
  rooster: { key: 'rooster', ko: '닭', cn: '酉', emoji: '🐔', elem: 'metal', trait: '당찬' },
  dog: { key: 'dog', ko: '개', cn: '戌', emoji: '🐶', elem: 'earth', trait: '충직한' },
  pig: { key: 'pig', ko: '돼지', cn: '亥', emoji: '🐷', elem: 'water', trait: '복스러운' },
} as const;

export const ELEM_ORDER: ElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];
export const ZOD_ORDER: ZodiacKey[] = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig'];

const SHENG: Record<ElementKey, ElementKey> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const KE: Record<ElementKey, ElementKey> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

// pct = 실제 출현율 (일주 60갑자 기준). 천을귀인=전설 7%, 괴강=영물 10%, 백호·간여지동=희귀 25%, 그 외 일반 58%.
export const RARITY = {
  common: { key: 'common', ko: '일반', stars: 1, raw: '#9C8FC0', pct: '58%' },
  rare: { key: 'rare', ko: '희귀', stars: 2, raw: '#5BD9AC', pct: '25%' },
  spirit: { key: 'spirit', ko: '영물', stars: 3, raw: '#B79CFF', pct: '10%' },
  legend: { key: 'legend', ko: '전설', stars: 4, raw: '#FFD27A', pct: '7%' },
} as const;

export type Rarity = (typeof RARITY)[keyof typeof RARITY];

/**
 * 실제 인구 희소성 기반 등급 — 일주(천간+지지)의 특수 일주로 판정 (60갑자 기준).
 *   천을귀인(7%)→전설 · 괴강(10%)→영물 · 백호·간여지동(25%)→희귀 · 그 외(58%)→일반
 */
const CHEON_EUL: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '辛': ['寅', '午'], '壬': ['卯', '巳'], '癸': ['卯', '巳'],
};
const GOEGANG = new Set(['庚辰', '庚戌', '壬辰', '壬戌', '戊戌', '戊辰']);     // 괴강
const BAEKHO = new Set(['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑']); // 백호대살

function rarityByIlju(stem: string, branch: string, stemElem: ElementKey, branchElem: ElementKey): Rarity {
  const gz = stem + branch;
  if ((CHEON_EUL[stem] ?? []).includes(branch)) return RARITY.legend;   // 천을귀인 ~7%
  if (GOEGANG.has(gz)) return RARITY.spirit;                            // 괴강 ~10%
  if (BAEKHO.has(gz) || stemElem === branchElem) return RARITY.rare;    // 백호·간여지동 ~25%
  return RARITY.common;                                                 // ~58%
}

/** 표시 단계 → 한글 라벨 (이미지 파일명 규칙과 일치) */
export const STAGE_LABEL: Record<Stage, string> = { 1: '아기', 2: '어린', 3: '성체', 4: '영험' };

/** 이미지 보유 조합 — 5계열 × 12지 = 60종 전체 완비 (public/spirits) */
const AVAILABLE: Partial<Record<ElementKey, ZodiacKey[]>> = {
  wood: [...ZOD_ORDER],
  fire: [...ZOD_ORDER],
  earth: [...ZOD_ORDER],
  metal: [...ZOD_ORDER],
  water: [...ZOD_ORDER],
};

/** 년주 지지 한자(子..亥) → ZodiacKey */
const BRANCH_TO_ZOD: Record<string, ZodiacKey> = Object.fromEntries(
  (Object.keys(ZODIAC) as ZodiacKey[]).map((k) => [ZODIAC[k].cn, k])
) as Record<string, ZodiacKey>;

export function makeSpirit(elemKey: ElementKey, zodKey: ZodiacKey, rarityOverride?: Rarity) {
  const elem = ELEMENTS[elemKey];
  const zod = ZODIAC[zodKey];
  const zElem = zod.elem as ElementKey;
  // 본인 정령은 일주 기준 등급(rarityOverride), 도감 그리드 등 일반 호출은 오행 관계 기준
  const rarity = rarityOverride ?? (
    elemKey === zElem ? RARITY.spirit :
    SHENG[zElem] === elemKey ? RARITY.rare :
    KE[elemKey] === zElem ? RARITY.legend :
    RARITY.common
  );

  const line = elem.word;            // 표시 계열명 (황금/노을/새싹…)
  const imageLine = elem.imageWord;  // 이미지·저장 키용 (언덕/노을/새싹…)
  const animal = zod.ko;             // 쥐~돼지
  const key = `${imageLine}${animal}`;     // 안정 키 — 이미지 경로·도감·교감 저장용 (표시명과 분리)
  const available = (AVAILABLE[elemKey] ?? []).includes(zodKey);

  /** 현재 단계 기준 이미지 경로 (없으면 null → 이모지 폴백). ?v= 는 에셋 캐시 버스트(이미지 교체 시 +1) */
  const imageFor = (stage: Stage): string | null =>
    available ? `/spirits/${key}/${key}-${String(stage).padStart(2, '0')}-${STAGE_LABEL[stage]}.png?v=3` : null;

  return {
    elemKey, zodKey, elem, zod, rarity,
    line, animal, key, available, imageFor,
    name: `${line}${animal}`,        // 표시 이름 (황금쥐) — key(언덕쥐)와 분리
    title: `${elem.trait} ${zod.trait} 정령`,
    formula: `${elem.cn}${elem.ko} + ${zod.ko}(${zod.cn})`,
    persona: `${elem.vibe}을 품은 ${zod.trait} 기질. ${line}처럼 ${elem.trait} 마음으로 세상을 대해요.`,
  };
}

export type Spirit = ReturnType<typeof makeSpirit>;

/** 명식 → 통합 영물 (일간 오행 = 계열, 일지 = 동물 → 일주 '나 자신' 기준). null이면 새싹쥐 기본값. */
export function spiritFromMyeongsik(myeongsik: Myeongsik | null): Spirit {
  const elemKey = (myeongsik?.ilgan.ohaeng ?? 'wood') as ElementKey;
  // 동물은 '띠'(년지)가 아니라 일주(일지) 기준 — 사주에서 일주가 '나 자신'을 나타냄 (예: 일간 금 + 일지 소 = "황금소" 류)
  const branch = myeongsik?.pillars[2]?.bot.c ?? '子';
  const zodKey = BRANCH_TO_ZOD[branch] ?? 'rat';
  // 등급은 실제 일주(천간+지지) 기준 — 특수 일주(천을귀인/괴강/백호/간여지동)로 인구 희소성 산출
  const stem = myeongsik?.ilgan.c;
  const rarity = myeongsik && stem ? rarityByIlju(stem, branch, elemKey, ZODIAC[zodKey].elem as ElementKey) : undefined;
  return makeSpirit(elemKey, zodKey, rarity);
}

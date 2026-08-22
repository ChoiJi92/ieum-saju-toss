/**
 * 일본어 로케일 — 정령 뽑기 웹판(일본) 전용.
 *
 * 방침:
 * - 브랜드/세계관은 "韓国の四柱推命"으로 명시 (현지화가 아니라 프리미엄 포지셔닝)
 * - 캐릭터 이름은 일본어로 의미 번역 (친숙하게) + 한국식 계보는 카피로 전달
 * - 12지 현지화: 돼지 → 猪(いのしし, 일본 십이지 표준), 나머지는 동일
 * - 전문용어(천을귀인 등)는 쓰지 않고 쉬운 말로 (한국판에서 확립한 원칙 동일 적용)
 */
import type { ElementKey, ZodiacKey } from './spirit';

/** 오행 계열 — 표시명(일본어) + 성격 키워드 */
export const ELEMENTS_JA: Record<ElementKey, { word: string; reading: string; cn: string; trait: string; vibe: string }> = {
  wood: { word: '若葉', reading: 'わかば', cn: '木', trait: '伸びやかな', vibe: '生命力とはじまり' },
  fire: { word: '夕焼け', reading: 'ゆうやけ', cn: '火', trait: '燃える', vibe: '情熱と表現' },
  earth: { word: '黄金', reading: 'こがね', cn: '土', trait: '包みこむ', vibe: '安定と信頼' },
  metal: { word: '月光', reading: 'げっこう', cn: '金', trait: '研ぎ澄まされた', vibe: '決断と洗練' },
  water: { word: '雫', reading: 'しずく', cn: '水', trait: '流れる', vibe: '知恵としなやかさ' },
};

/** 십이지 — 일본 표준 표기 (亥=猪) */
export const ZODIAC_JA: Record<ZodiacKey, { word: string; reading: string; cn: string; trait: string }> = {
  rat: { word: 'ねずみ', reading: 'ねずみ', cn: '子', trait: '賢い' },
  ox: { word: '牛', reading: 'うし', cn: '丑', trait: '実直な' },
  tiger: { word: '虎', reading: 'とら', cn: '寅', trait: '勇ましい' },
  rabbit: { word: 'うさぎ', reading: 'うさぎ', cn: '卯', trait: '優しい' },
  dragon: { word: '龍', reading: 'りゅう', cn: '辰', trait: '堂々とした' },
  snake: { word: 'へび', reading: 'へび', cn: '巳', trait: '神秘的な' },
  horse: { word: '馬', reading: 'うま', cn: '午', trait: '自由な' },
  goat: { word: '羊', reading: 'ひつじ', cn: '未', trait: '穏やかな' },
  monkey: { word: '猿', reading: 'さる', cn: '申', trait: '機転のきく' },
  rooster: { word: '鶏', reading: 'にわとり', cn: '酉', trait: '凛とした' },
  dog: { word: '犬', reading: 'いぬ', cn: '戌', trait: '忠実な' },
  pig: { word: '猪', reading: 'いのしし', cn: '亥', trait: '福を招く' },
};

/** 등급 — 이름·설명. 근거는 전문용어 없이 (한국판 원칙 동일) */
export const RARITY_JA: Record<string, { ko: string; label: string; desc: string }> = {
  common: { ko: '일반', label: 'ノーマル', desc: '' },
  rare: { ko: '희귀', label: 'レア', desc: '4人にひとりの巡り合わせです。' },
  spirit: { ko: '영물', label: 'エピック', desc: '昔から「気が満ちる日」とされてきた組み合わせ。10人にひとりです。' },
  legend: { ko: '전설', label: 'レジェンド', desc: '昔から「貴人の助けを受けやすい日」とされてきた組み合わせ。100人に7人だけです。' },
};

/** UI 문구 */
export const UI_JA = {
  appName: '이음사주',
  appNameJa: 'イウム四柱推命',
  tagline: '韓国の四柱推命で目覚める、あなただけの精霊',
  // 입력
  inputTitle: '生年月日を教えてください',
  inputSub: '生まれた日の気（き）から、あなたの精霊が決まります',
  year: '年',
  month: '月',
  day: '日',
  hourLabel: '生まれた時間',
  hourUnknown: 'わからない',
  calendarSolar: '新暦',
  calendarLunar: '旧暦',
  nameLabel: 'ニックネーム',
  namePlaceholder: '呼ばれたい名前',
  submit: '精霊を呼び出す',
  // 결과
  resultKicker: 'あなたの精霊',
  formulaLabel: (elemCn: string, zodWord: string, zodCn: string) => `${elemCn} + ${zodWord}（${zodCn}）`,
  rarityBase: '生まれた日の組み合わせで決まります',
  shareBtn: 'カードを保存・シェア',
  retryBtn: 'もう一度',
  // 티저 (다음 단계 예고)
  teaserTitle: 'この子は育ちます',
  teaserBody: '毎日ごはんをあげて撫でると、赤ちゃん → 子ども → 大人 → 霊獣 と4段階で成長します。育成モードは近日公開予定です。',
  // 푸터
  footer: '韓国の四柱推命で見る、あなたの精霊',
  disclaimer: '入力された生年月日は、この端末内でのみ計算され、サーバーには送信されません。',
  disclaimerEntertainment: '本サービスの診断結果は、四柱推命をもとにしたエンターテインメントコンテンツです。人生・健康・金銭・人間関係などの結果を保証するものではありません。',
} as const;

/** JA 웹판 정령 이미지 — public/ja-spirits/{정령키}.png (아기 단계 512px, git 추적) */
export function spiritImgJa(spiritKey: string): string {
  return `/ja-spirits/${encodeURIComponent(spiritKey)}.png`;
}

/** 정령 이름 조합 — 예: 黄金の牛 */
export function spiritNameJa(elem: ElementKey, zod: ZodiacKey): string {
  return `${ELEMENTS_JA[elem].word}の${ZODIAC_JA[zod].word}`;
}

/** 성격 풀이 — 계열 vibe + 십이지 trait 조합 (한국판 persona와 동일 구조) */
export function personaJa(elem: ElementKey, zod: ZodiacKey): string {
  const e = ELEMENTS_JA[elem];
  const z = ZODIAC_JA[zod];
  return `${e.vibe}を宿した、${z.trait}気質。${e.word}のように${e.trait}心で世界と向き合う人です。`;
}

/** 타이틀 — 예: 包みこむ実直な精霊 */
export function titleJa(elem: ElementKey, zod: ZodiacKey): string {
  return `${ELEMENTS_JA[elem].trait}${ZODIAC_JA[zod].trait}精霊`;
}

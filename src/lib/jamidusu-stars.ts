// src/lib/jamidusu-stars.ts — 자미두수 보조성·사화·밝기 (Phase 3, 순수 함수)
// 진리값: 공식은 참고, 최종 근거는 iztro 9,068건 전수 대조 (scripts/verify-jamidusu.ts)
import type { MainStar } from './jamidusu';

export type MinorStar =
  | '록존' | '천마' | '좌보' | '우필' | '문창' | '문곡' | '천괴' | '천월'   // 록존·천마 + 육길
  | '경양' | '타라' | '화성' | '영성' | '지공' | '지겁';                     // 육살
export type Mutagen = '록' | '권' | '과' | '기';
export type Brightness = '묘' | '왕' | '득' | '리' | '평' | '불' | '함';
export type MutagenStar = MainStar | '문창' | '문곡' | '좌보' | '우필';

export const MINOR_STARS: MinorStar[] = ['록존', '천마', '좌보', '우필', '문창', '문곡', '천괴', '천월', '경양', '타라', '화성', '영성', '지공', '지겁'];
export const LUCKY_MINOR: MinorStar[] = ['좌보', '우필', '문창', '문곡', '천괴', '천월'];  // 육길
export const UNLUCKY_MINOR: MinorStar[] = ['경양', '타라', '화성', '영성', '지공', '지겁']; // 육살

// 근거: 록존 — 년간 기준 (甲→寅 乙→卯 丙·戊→巳 丁·己→午 庚→申 辛→酉 壬→亥 癸→子)
const LUCUN_BY_STEM = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
// 근거: 천괴·천월 — 년간 천을귀인 (甲戊庚→丑未, 乙己→子申, 丙丁→亥酉, 辛→午寅, 壬癸→卯巳)
const KUI_BY_STEM = [1, 0, 11, 11, 1, 0, 1, 6, 3, 3];
const YUE_BY_STEM = [7, 8, 9, 9, 7, 8, 7, 2, 5, 5];
// 근거: 천마 — 년지 삼합 (寅午戌→申, 申子辰→寅, 巳酉丑→亥, 亥卯未→巳)
const MA_BY_YEAR_BRANCH = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5]; // index=년지: 子→寅 丑→亥 寅→申 卯→巳 辰→寅 巳→亥 午→申 未→巳 申→寅 酉→亥 戌→申 亥→巳
// 근거: 화성·영성 기점 — 년지 삼합 그룹 (寅午戌: 丑/卯, 申子辰: 寅/戌, 巳酉丑: 卯/戌, 亥卯未: 酉/戌)
const FIRE_START = [2, 3, 1, 9, 2, 3, 1, 9, 2, 3, 1, 9];  // index=년지
const BELL_START = [10, 10, 3, 10, 10, 10, 3, 10, 10, 10, 3, 10];

export type MinorInput = {
  yearStemIndex: number;   // 0=甲 … 9=癸
  yearBranchIndex: number; // 0=子 … 11=亥
  month: number;           // 1~12 (음력월, 윤달 처리 후)
  hourBranch: number;      // 0=자 … 11=해
};

export function placeMinorStars({ yearStemIndex, yearBranchIndex, month, hourBranch }: MinorInput): Record<MinorStar, number> {
  if (yearStemIndex < 0 || yearStemIndex > 9 || yearBranchIndex < 0 || yearBranchIndex > 11 || month < 1 || month > 12 || hourBranch < 0 || hourBranch > 11)
    throw new Error(`보조성 입력 범위 밖: stem=${yearStemIndex} branch=${yearBranchIndex} month=${month} hour=${hourBranch}`);
  const lucun = LUCUN_BY_STEM[yearStemIndex];
  return {
    록존: lucun,
    경양: (lucun + 1) % 12,
    타라: (lucun + 11) % 12,
    천마: MA_BY_YEAR_BRANCH[yearBranchIndex],
    좌보: (4 + (month - 1)) % 12,            // 근거: 辰 기점 순행
    우필: (10 - (month - 1) + 24) % 12,      // 근거: 戌 기점 역행
    문창: (10 - hourBranch + 24) % 12,       // 근거: 戌 기점 역행
    문곡: (4 + hourBranch) % 12,             // 근거: 辰 기점 순행
    천괴: KUI_BY_STEM[yearStemIndex],
    천월: YUE_BY_STEM[yearStemIndex],
    화성: (FIRE_START[yearBranchIndex] + hourBranch) % 12,
    영성: (BELL_START[yearBranchIndex] + hourBranch) % 12,
    지공: (11 - hourBranch + 24) % 12,       // 근거: 亥 기점 역행
    지겁: (11 + hourBranch) % 12,            // 근거: 亥 기점 순행
  };
}

// 근거: 생년사화 (년간 → [화록, 화권, 화과, 화기]). 庚년은 유파 차이 존재 — iztro 디폴트(太陽武曲太陰天同) 채택.
export const MUTAGEN_TABLE: Record<number, [MutagenStar, MutagenStar, MutagenStar, MutagenStar]> = {
  0: ['염정', '파군', '무곡', '태양'], 1: ['천기', '천량', '자미', '태음'],
  2: ['천동', '천기', '문창', '염정'], 3: ['태음', '천동', '천기', '거문'],
  4: ['탐랑', '태음', '우필', '천기'], 5: ['무곡', '탐랑', '천량', '문곡'],
  6: ['태양', '무곡', '태음', '천동'], 7: ['거문', '태양', '문곡', '문창'],
  8: ['천량', '자미', '좌보', '무곡'], 9: ['파군', '거문', '태음', '탐랑'],
};
export const MUTAGEN_KEYS: Mutagen[] = ['록', '권', '과', '기'];

// BRIGHTNESS_TABLE 은 Task 2에서 생성기로 채움 (iztro 유래 정적 테이블)

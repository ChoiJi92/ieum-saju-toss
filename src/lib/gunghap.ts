import { calculateSaju } from '@fullstackfamily/manseryeok';
import { getSipsung, type Sipsung } from './sipsung';

/**
 * 궁합 — 두 사람 일간 → 십성 + 합·충 룰베이스.
 *   세부 4축: 성격·대화·연애·돈 가치관
 *   천간 5합: 甲己·乙庚·丙辛·丁壬·戊癸 (서로 끌림 ↑)
 */

type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const isStem = (s: string): s is Stem => (STEMS as string[]).includes(s);

/** 천간 5합 — 양쪽 모두 끌림 ↑ (보너스 점수) */
const HAP: Record<Stem, Stem> = {
  甲: '己', 己: '甲',
  乙: '庚', 庚: '乙',
  丙: '辛', 辛: '丙',
  丁: '壬', 壬: '丁',
  戊: '癸', 癸: '戊',
};

/** 일간 추출 — 양력 입력 + 한국 시간 보정 X(생년월일만이라 무관) */
export function ilganOf(year: number, month: number, day: number): Stem | null {
  const r = calculateSaju(year, month, day, 12, 0, { applyTimeCorrection: false });
  const stem = r.dayPillarHanja[0];
  return isStem(stem) ? stem : null;
}

/** 십성별 4축 점수 */
const AXIS_BY_SIPSUNG: Record<
  Sipsung,
  { 성격: number; 대화: number; 연애: number; 돈: number }
> = {
  비견: { 성격: 80, 대화: 75, 연애: 65, 돈: 70 },
  겁재: { 성격: 65, 대화: 60, 연애: 55, 돈: 50 },
  식신: { 성격: 88, 대화: 92, 연애: 88, 돈: 75 },
  상관: { 성격: 78, 대화: 88, 연애: 80, 돈: 72 },
  정재: { 성격: 82, 대화: 80, 연애: 78, 돈: 88 },
  편재: { 성격: 75, 대화: 78, 연애: 80, 돈: 80 },
  정관: { 성격: 80, 대화: 80, 연애: 82, 돈: 78 },
  편관: { 성격: 65, 대화: 60, 연애: 70, 돈: 60 },
  정인: { 성격: 85, 대화: 82, 연애: 75, 돈: 70 },
  편인: { 성격: 75, 대화: 70, 연애: 72, 돈: 65 },
};

/** 십성별 한 줄 코멘트 (상대 입장 너에 대해) */
const COMMENT_BY_SIPSUNG: Record<Sipsung, string> = {
  비견: '비슷한 결로 편안한 친구 같은 사이. 단 너무 닮아서 신선함 부족할 수 있어.',
  겁재: '경쟁·자극이 동시에 있는 관계. 서로 발 맞추는 호흡이 핵심.',
  식신: '서로 마음 표현이 자연스럽고 즐거운 사이. 데이트 자체가 행복.',
  상관: '재치·창의가 빛나는 관계. 단 직설적인 말은 한 박자 쉬어가기.',
  정재: '꾸준하고 안정적인 사이. 결혼·장기 관점에서 좋은 흐름.',
  편재: '재미·활력이 넘치는 관계. 새로운 자리·여행이 어울려.',
  정관: '서로 책임감 있게 챙겨주는 진중한 관계. 신뢰 ↑.',
  편관: '강한 끌림이 있지만 갈등도 가능. 진심으로 부딪혀야 풀려.',
  정인: '서로 배우고 채워주는 깊은 관계. 정신적 교감 ↑.',
  편인: '미스터리한 끌림. 평범하지 않은 매력으로 묶임.',
};

export type GunghapResult = {
  totalScore: number;
  tagline: string;
  axes: Array<{ lbl: string; ic: string; score: number; color: string }>;
  comment: string;
  hap: boolean;
  myIlgan: Stem;
  otherIlgan: Stem;
  sipsung: Sipsung;
};

/** 두 사람 일간 → 궁합 */
export function calcGunghap(myIlgan: Stem, otherIlgan: Stem): GunghapResult {
  const sipsung = getSipsung(myIlgan, otherIlgan);
  const axes = AXIS_BY_SIPSUNG[sipsung];
  const isHap = HAP[myIlgan] === otherIlgan;

  // 5합이면 +5 보너스
  const bonus = isHap ? 5 : 0;
  const total = Math.min(
    98,
    Math.round((axes.성격 + axes.대화 + axes.연애 + axes.돈) / 4) + bonus
  );

  const taglineMap: Record<Sipsung, string> = {
    비견: '편안한 친구 같은 사이',
    겁재: '서로 밀고 당기는 사이',
    식신: '서로 결을 잘 알아주는 사이',
    상관: '재치·자극이 빛나는 사이',
    정재: '꾸준히 함께 갈 사이',
    편재: '활기·재미가 넘치는 사이',
    정관: '진중하게 챙겨주는 사이',
    편관: '강한 끌림과 도전의 사이',
    정인: '깊은 정신적 교감의 사이',
    편인: '미스터리한 끌림의 사이',
  };

  return {
    totalScore: total,
    tagline: isHap ? `${taglineMap[sipsung]} (5합 ✨)` : taglineMap[sipsung],
    axes: [
      { lbl: '성격 합',   ic: '☁️', score: axes.성격, color: '#9D7BFF' },
      { lbl: '대화 합',   ic: '💬', score: axes.대화, color: '#3DC795' },
      { lbl: '연애 합',   ic: '💞', score: axes.연애, color: '#F495C9' },
      { lbl: '돈 가치관', ic: '💰', score: axes.돈,   color: '#FFC857' },
    ],
    comment: COMMENT_BY_SIPSUNG[sipsung],
    hap: isHap,
    myIlgan,
    otherIlgan,
    sipsung,
  };
}

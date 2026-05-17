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

/** 대운 6개 (시작 나이 5살 가정, 10년 단위) */
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
  for (let i = 0; i < 8; i++) {
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

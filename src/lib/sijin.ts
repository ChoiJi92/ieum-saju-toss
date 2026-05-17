/**
 * 12지 시진 — 한국시 -30분 보정 라벨 통일.
 *
 * 사주 명리 표준:
 *   한국 표준시(UTC+9)가 한반도 진태양시보다 약 30분 빠르기 때문에
 *   출생 시각에서 30분 빼서 시진을 결정함.
 *   예) 출생 시 00:00 → 보정 23:30 → 자시(子)
 */

export type Sijin = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';

/** [한자, 한글이름, 시각범위] */
export const SIJIN_LIST: readonly [Sijin, string, string][] = [
  ['子', '자시', '23:30~01:30'],
  ['丑', '축시', '01:30~03:30'],
  ['寅', '인시', '03:30~05:30'],
  ['卯', '묘시', '05:30~07:30'],
  ['辰', '진시', '07:30~09:30'],
  ['巳', '사시', '09:30~11:30'],
  ['午', '오시', '11:30~13:30'],
  ['未', '미시', '13:30~15:30'],
  ['申', '신시', '15:30~17:30'],
  ['酉', '유시', '17:30~19:30'],
  ['戌', '술시', '19:30~21:30'],
  ['亥', '해시', '21:30~23:30'],
] as const;

/** 한자 → "자시 (23:30~01:30)" 완성 라벨 */
export const SIJIN_LABEL: Record<Sijin, string> = Object.fromEntries(
  SIJIN_LIST.map(([k, name, range]) => [k, `${name} (${range})`])
) as Record<Sijin, string>;

/** 12지 시진 → 24시 (각 시진 중간 시각) */
export const SIJIN_HOUR: Record<Sijin, number> = {
  子: 0, 丑: 2, 寅: 4, 卯: 6,
  辰: 8, 巳: 10, 午: 12, 未: 14,
  申: 16, 酉: 18, 戌: 20, 亥: 22,
};

/** hour → 시진 (편집 모드 prefill용 역매핑) */
export function hourToSijin(hour: number): Sijin {
  const entries = Object.entries(SIJIN_HOUR) as [Sijin, number][];
  const match = entries.find(([, h]) => h === hour);
  return match?.[0] ?? '未';
}

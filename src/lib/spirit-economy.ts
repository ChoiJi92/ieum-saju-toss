import type { Stage } from './spirit';

/**
 * 정령 성장 경제 — 순수 로직 (React 무관).
 * 단계별 임계치 + 하루 상한 + 자정 롤오버 + 진화 캐리오버.
 * 설계: docs/superpowers/specs/2026-06-07-spirit-growth-economy-design.md
 */

/** 단계별 진화 임계치 (escalating). 4단계(영험)는 최종 → 0 */
export const THRESHOLD: Record<Stage, number> = { 1: 100, 2: 400, 3: 1000, 4: 0 };
/** 하루 성장 상한 (모든 출처 합산 최대) */
export const DAILY_CAP = 70;
/** 무료 교감 1회 획득량 */
export const ACTION_GAIN = { feed: 14, pet: 12, meditate: 12 } as const;
/** 앱활동 보너스 획득량 */
export const BONUS_GAIN = { fortune: 8, attend: 4 } as const;
/** 보상형 광고 1회 획득량 / 하루 최대 횟수 */
export const AD_GAIN = 10;
export const AD_MAX_PER_DAY = 2;

export type ActionKind = keyof typeof ACTION_GAIN; // 'feed'|'pet'|'meditate'
export type BonusKind = keyof typeof BONUS_GAIN;   // 'fortune'|'attend'
export type DayActions = Record<ActionKind, boolean>;
export type DayBonuses = Record<BonusKind, boolean>;

export type SpiritProgress = {
  bond: number;          // 현재 단계 누적 bond (0 ~ THRESHOLD[stage])
  stage: Stage;          // 1~4
  todayKey: string;      // 오늘 추적 날짜 (YYYY-MM-DD)
  gainedToday: number;   // 오늘 획득한 bond (DAILY_CAP 체크용)
  actions: DayActions;   // 오늘 사용한 무료 교감
  bonuses: DayBonuses;   // 오늘 받은 앱활동 보너스
  adsToday: number;      // 오늘 본 보상형 광고 횟수 (0~AD_MAX_PER_DAY)
};

/** 로컬 날짜 YYYY-MM-DD */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function makeDefault(now: Date = new Date()): SpiritProgress {
  return {
    bond: 0, stage: 1, todayKey: todayKey(now), gainedToday: 0,
    actions: { feed: false, pet: false, meditate: false },
    bonuses: { fortune: false, attend: false },
    adsToday: 0,
  };
}

/** 저장된(혹은 구버전) 값을 안전하게 정규화 + 자정 롤오버 */
export function normalize(raw: Partial<SpiritProgress> | undefined, now: Date = new Date()): SpiritProgress {
  const base = makeDefault(now);
  const p: SpiritProgress = {
    ...base,
    ...raw,
    actions: { ...base.actions, ...(raw?.actions ?? {}) },
    bonuses: { ...base.bonuses, ...(raw?.bonuses ?? {}) },
    stage: (raw?.stage ?? 1) as Stage,
    bond: typeof raw?.bond === 'number' ? raw.bond : 0,
  };
  if (p.todayKey !== todayKey(now)) {
    return {
      ...p, todayKey: todayKey(now), gainedToday: 0,
      actions: { feed: false, pet: false, meditate: false },
      bonuses: { fortune: false, attend: false }, adsToday: 0,
    };
  }
  return p;
}

/** 하루 상한 내에서 bond 증가 (실제 적용량 반환) */
export function applyGain(p: SpiritProgress, amount: number): { next: SpiritProgress; gained: number } {
  const room = Math.max(0, DAILY_CAP - p.gainedToday);
  const gained = Math.max(0, Math.min(amount, room));
  if (gained === 0) return { next: p, gained: 0 };
  return { next: { ...p, bond: p.bond + gained, gainedToday: p.gainedToday + gained }, gained };
}

/** 게이지 퍼센트 (0~100). 영험(최종)은 100 */
export function percentOf(p: SpiritProgress): number {
  const th = THRESHOLD[p.stage];
  if (th <= 0) return 100;
  return Math.min(100, Math.round((p.bond / th) * 100));
}

export function canEvolve(p: SpiritProgress): boolean {
  return p.stage < 4 && THRESHOLD[p.stage] > 0 && p.bond >= THRESHOLD[p.stage];
}

/** 진화: 잉여 bond 캐리오버 */
export function doEvolve(p: SpiritProgress): SpiritProgress {
  if (!canEvolve(p)) return p;
  return { ...p, stage: (p.stage + 1) as Stage, bond: Math.max(0, p.bond - THRESHOLD[p.stage]) };
}

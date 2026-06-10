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
/** 무료 교감 1회 기본 획득량 — 셋 다 동일(공정), 차이는 시간대 보너스로 */
export const ACTION_GAIN = { feed: 12, pet: 12, meditate: 12 } as const;
/** 시간대가 맞는 교감 보너스 (아침 먹이 / 낮 쓰다듬기 / 밤 명상) — 하루 3번 올 이유 */
export const TIME_BONUS = 6;
/** 교감별 제철 시간대 (시작시, 끝시) — 끝시 미만. meditate는 자정 넘어감 */
export const ACTION_WINDOW: Record<'feed' | 'pet' | 'meditate', { from: number; to: number; label: string; emoji: string }> = {
  feed: { from: 5, to: 12, label: '아침', emoji: '🌅' },
  pet: { from: 12, to: 18, label: '낮', emoji: '☀️' },
  meditate: { from: 18, to: 5, label: '밤', emoji: '🌙' },
};
/** 지금이 해당 교감의 제철 시간대인가 */
export function inActionWindow(kind: 'feed' | 'pet' | 'meditate', now: Date = new Date()): boolean {
  const h = now.getHours();
  const w = ACTION_WINDOW[kind];
  return w.from < w.to ? h >= w.from && h < w.to : h >= w.from || h < w.to;
}
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

/* ── 연속 출석 스트릭 (앱 레벨, 정령 진행도와 별개 저장) ── */

export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 30];
/** 마일스톤 1회 보상 bond — 특별 보상이라 하루 상한 미적용 (평생 최대 4회, 페이싱 영향 미미) */
export const STREAK_REWARD = 20;

export type StreakState = { streak: number; lastDate: string; maxStreak: number; claimed: number[] };

export function makeStreakDefault(): StreakState {
  return { streak: 0, lastDate: '', maxStreak: 0, claimed: [] };
}

/** 하루 1회 출석 틱. 어제 이어지면 +1, 끊기면 1부터(마일스톤 보상도 리셋). 같은 날 중복 no-op. */
export function tickStreak(prev: StreakState, now: Date = new Date()): { next: StreakState; milestone: number | null } {
  const today = todayKey(now);
  if (prev.lastDate === today) return { next: prev, milestone: null };
  const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const continued = prev.lastDate === todayKey(y);
  const streak = continued ? prev.streak + 1 : 1;
  const claimedBase = continued ? prev.claimed : [];
  const milestone = STREAK_MILESTONES.find((m) => m === streak && !claimedBase.includes(m)) ?? null;
  const next: StreakState = {
    streak,
    lastDate: today,
    maxStreak: Math.max(prev.maxStreak, streak),
    claimed: milestone ? [...claimedBase, milestone] : claimedBase,
  };
  return { next, milestone };
}

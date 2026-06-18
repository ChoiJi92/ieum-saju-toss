import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import {
  type SpiritProgress, type ActionKind, type BonusKind, type DayActions, type DayBonuses, type StreakState,
  THRESHOLD, DAILY_CAP, ACTION_GAIN, BONUS_GAIN, AD_GAIN, AD_MAX_PER_DAY, STREAK_REWARD, TIME_BONUS,
  normalize, applyGain, percentOf, doEvolve, makeStreakDefault, tickStreak as tickStreakPure, inActionWindow, applyHatchCare,
} from './spirit-economy';
import type { Stage } from './spirit';

/**
 * 영물 게임 상태 — key("황금쥐" 등)별 진행도.
 * 순수 로직은 spirit-economy.ts. 여기선 저장/롤오버/액션 게이팅만.
 */
export type { SpiritProgress } from './spirit-economy';

const KEY = 'ieum-saju.spirit.v2';
const STREAK_KEY = 'ieum-saju.streak.v1';
type Store = Record<string, SpiritProgress>;

export type CareResult = { ok: boolean; gained: number; reason?: 'used' | 'capped' | 'maxed'; hatched?: boolean };

type SpiritStateCtx = {
  progressOf: (key: string) => SpiritProgress;
  percent: (key: string) => number;
  thresholdOf: (stage: Stage) => number;
  care: (key: string, kind: ActionKind) => CareResult;
  /** 알 단계 부화용 교감 — bond 없이 부화 카운트만. res.hatched로 부화 완료 여부 */
  eggCare: (key: string, kind: ActionKind) => CareResult;
  claimBonus: (key: string, kind: BonusKind) => CareResult;
  adBoost: (key: string) => CareResult;
  evolve: (key: string) => void;
  remaining: (key: string) => { capLeft: number; adsLeft: number; actions: DayActions; bonuses: DayBonuses };
  /** 연속 출석 — 현재 상태 */
  streak: StreakState;
  /** 하루 1회 출석 틱. 마일스톤(3/7/14/30) 도달 시 정령에 특별 보상 bond 적립 */
  tickStreak: (spiritKey: string) => { streak: number; milestone: number | null; gained: number };
};

const Ctx = createContext<SpiritStateCtx | null>(null);

function load(): Store {
  try { const r = localStorage.getItem(KEY); return r ? (JSON.parse(r) as Store) : {}; } catch { return {}; }
}
function persist(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function loadStreak(): StreakState {
  try { const r = localStorage.getItem(STREAK_KEY); return r ? { ...makeStreakDefault(), ...(JSON.parse(r) as Partial<StreakState>) } : makeStreakDefault(); } catch { return makeStreakDefault(); }
}
function persistStreak(s: StreakState) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function SpiritStateProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => load());

  const progressOf = useCallback((k: string): SpiritProgress => normalize(store[k], new Date()), [store]);

  /** 공통 업데이트: 현재값 normalize → mutator → 저장 */
  const update = useCallback((k: string, fn: (p: SpiritProgress) => { p: SpiritProgress; res: CareResult }): CareResult => {
    let out: CareResult = { ok: false, gained: 0 };
    setStore((prev) => {
      const cur = normalize(prev[k], new Date());
      const { p, res } = fn(cur);
      out = res;
      const next = { ...prev, [k]: p };
      persist(next);
      return next;
    });
    return out;
  }, []);

  const care = useCallback((k: string, kind: ActionKind): CareResult => update(k, (p) => {
    if (p.actions[kind]) return { p, res: { ok: false, gained: 0, reason: 'used' } };
    // 시간대가 맞는 교감(아침 먹이/낮 쓰다듬기/밤 명상)은 보너스
    const amount = ACTION_GAIN[kind] + (inActionWindow(kind, new Date()) ? TIME_BONUS : 0);
    const { next, gained } = applyGain(p, amount);
    const p2 = { ...next, actions: { ...next.actions, [kind]: true } };
    return { p: p2, res: { ok: true, gained, reason: gained === 0 ? 'capped' : undefined } };
  }), [update]);

  const eggCare = useCallback((k: string, kind: ActionKind): CareResult => update(k, (p) => {
    const { next, hatched, already } = applyHatchCare(p, kind);
    return { p: next, res: { ok: !already, gained: 0, hatched } };
  }), [update]);

  const claimBonus = useCallback((k: string, kind: BonusKind): CareResult => update(k, (p) => {
    if (p.bonuses[kind]) return { p, res: { ok: false, gained: 0, reason: 'used' } };
    const { next, gained } = applyGain(p, BONUS_GAIN[kind]);
    const p2 = { ...next, bonuses: { ...next.bonuses, [kind]: true } };
    return { p: p2, res: { ok: true, gained } };
  }), [update]);

  const adBoost = useCallback((k: string): CareResult => update(k, (p) => {
    if (p.adsToday >= AD_MAX_PER_DAY) return { p, res: { ok: false, gained: 0, reason: 'maxed' } };
    const { next, gained } = applyGain(p, AD_GAIN);
    if (gained === 0) return { p, res: { ok: false, gained: 0, reason: 'capped' } };
    return { p: { ...next, adsToday: next.adsToday + 1 }, res: { ok: true, gained } };
  }), [update]);

  const evolve = useCallback((k: string) => { update(k, (p) => ({ p: doEvolve(p), res: { ok: true, gained: 0 } })); }, [update]);

  const percent = useCallback((k: string) => percentOf(normalize(store[k], new Date())), [store]);
  const thresholdOf = useCallback((s: Stage) => THRESHOLD[s], []);
  const remaining = useCallback((k: string) => {
    const p = normalize(store[k], new Date());
    return {
      capLeft: Math.max(0, DAILY_CAP - p.gainedToday),
      adsLeft: Math.max(0, AD_MAX_PER_DAY - p.adsToday),
      actions: p.actions, bonuses: p.bonuses,
    };
  }, [store]);

  const [streak, setStreak] = useState<StreakState>(() => loadStreak());
  const tickStreak = useCallback((spiritKey: string) => {
    let out = { streak: 0, milestone: null as number | null, gained: 0 };
    setStreak((prev) => {
      const { next, milestone } = tickStreakPure(prev, new Date());
      out = { streak: next.streak, milestone, gained: milestone ? STREAK_REWARD : 0 };
      if (next !== prev) persistStreak(next);
      return next;
    });
    if (out.milestone) {
      // 마일스톤 특별 보상 — 하루 상한 미적용 (평생 최대 4회)
      update(spiritKey, (p) => ({ p: { ...p, bond: p.bond + STREAK_REWARD }, res: { ok: true, gained: STREAK_REWARD } }));
    }
    return out;
  }, [update]);

  const value = useMemo(
    () => ({ progressOf, percent, thresholdOf, care, eggCare, claimBonus, adBoost, evolve, remaining, streak, tickStreak }),
    [progressOf, percent, thresholdOf, care, eggCare, claimBonus, adBoost, evolve, remaining, streak, tickStreak],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSpiritState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSpiritState must be used inside <SpiritStateProvider>');
  return ctx;
}

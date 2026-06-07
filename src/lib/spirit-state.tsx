import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import {
  type SpiritProgress, type ActionKind, type BonusKind, type DayActions, type DayBonuses,
  THRESHOLD, DAILY_CAP, ACTION_GAIN, BONUS_GAIN, AD_GAIN, AD_MAX_PER_DAY,
  normalize, applyGain, percentOf, doEvolve,
} from './spirit-economy';
import type { Stage } from './spirit';

/**
 * 영물 게임 상태 — key("황금쥐" 등)별 진행도.
 * 순수 로직은 spirit-economy.ts. 여기선 저장/롤오버/액션 게이팅만.
 */
export type { SpiritProgress } from './spirit-economy';

const KEY = 'ieum-saju.spirit.v2';
type Store = Record<string, SpiritProgress>;

export type CareResult = { ok: boolean; gained: number; reason?: 'used' | 'capped' | 'maxed' };

type SpiritStateCtx = {
  progressOf: (key: string) => SpiritProgress;
  percent: (key: string) => number;
  thresholdOf: (stage: Stage) => number;
  care: (key: string, kind: ActionKind) => CareResult;
  claimBonus: (key: string, kind: BonusKind) => CareResult;
  adBoost: (key: string) => CareResult;
  evolve: (key: string) => void;
  remaining: (key: string) => { capLeft: number; adsLeft: number; actions: DayActions; bonuses: DayBonuses };
};

const Ctx = createContext<SpiritStateCtx | null>(null);

function load(): Store {
  try { const r = localStorage.getItem(KEY); return r ? (JSON.parse(r) as Store) : {}; } catch { return {}; }
}
function persist(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
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
    const { next, gained } = applyGain(p, ACTION_GAIN[kind]);
    const p2 = { ...next, actions: { ...next.actions, [kind]: true } };
    return { p: p2, res: { ok: true, gained, reason: gained === 0 ? 'capped' : undefined } };
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

  const value = useMemo(
    () => ({ progressOf, percent, thresholdOf, care, claimBonus, adBoost, evolve, remaining }),
    [progressOf, percent, thresholdOf, care, claimBonus, adBoost, evolve, remaining],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSpiritState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSpiritState must be used inside <SpiritStateProvider>');
  return ctx;
}

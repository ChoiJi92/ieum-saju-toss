import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import type { Stage } from './spirit';

/**
 * 영물 게임 상태 — 영물 key("새싹토끼")별 진행도.
 * 모든 영물은 아기(stage 1)부터 시작, 교감(bond)으로 영험(4)까지 진화.
 */
export type SpiritProgress = { bond: number; stage: Stage; lastBondAt: string };

const KEY = 'ieum-saju.spirit.v2';
const DEFAULT: SpiritProgress = { bond: 0, stage: 1, lastBondAt: '' };

type Store = Record<string, SpiritProgress>;

type SpiritStateCtx = {
  progressOf: (spiritKey: string) => SpiritProgress;
  bondUp: (spiritKey: string, amount: number) => void;
  evolve: (spiritKey: string) => void;
};

const Ctx = createContext<SpiritStateCtx | null>(null);

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}
function save(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
function stamp(): string {
  try { return new Date().toISOString().slice(0, 10); } catch { return ''; }
}

export function SpiritStateProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => load());

  const progressOf = useCallback((k: string): SpiritProgress => store[k] ?? DEFAULT, [store]);

  const bondUp = useCallback((k: string, amount: number) => {
    setStore((prev) => {
      const cur = prev[k] ?? DEFAULT;
      const next: Store = { ...prev, [k]: { ...cur, bond: Math.min(100, cur.bond + amount), lastBondAt: stamp() } };
      save(next);
      return next;
    });
  }, []);

  const evolve = useCallback((k: string) => {
    setStore((prev) => {
      const cur = prev[k] ?? DEFAULT;
      if (cur.bond < 100 || cur.stage >= 4) return prev;
      const next: Store = { ...prev, [k]: { ...cur, stage: (cur.stage + 1) as Stage, bond: 0 } };
      save(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ progressOf, bondUp, evolve }), [progressOf, bondUp, evolve]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSpiritState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSpiritState must be used inside <SpiritStateProvider>');
  return ctx;
}

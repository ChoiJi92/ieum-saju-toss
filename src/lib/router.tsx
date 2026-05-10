import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

/**
 * 간단 stack 기반 라우터 — 프로토타입 ie-app.jsx 패턴.
 * MVP 단계용. 추후 @granite-js/plugin-router 또는 @use-funnel 로 마이그레이션 가능.
 */

export type ScreenId =
  | 'onboarding'
  | 'input'
  | 'home'
  | 'today'
  | 'share'
  | 'saju'
  | 'year'
  | 'gunghap'
  | 'money'
  | 'history'
  | 'settings';

type RouterCtx = {
  current: ScreenId;
  go: (id: ScreenId) => void;
  back: () => void;
  reset: (id: ScreenId) => void;
  canBack: boolean;
};

const Ctx = createContext<RouterCtx | null>(null);

export function RouterProvider({
  initial = 'onboarding',
  children,
}: {
  initial?: ScreenId;
  children: ReactNode;
}) {
  const [stack, setStack] = useState<ScreenId[]>([initial]);
  const current = stack[stack.length - 1];

  const go = useCallback((id: ScreenId) => setStack((s) => [...s, id]), []);
  const back = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    []
  );
  const reset = useCallback((id: ScreenId) => setStack([id]), []);

  return (
    <Ctx.Provider value={{ current, go, back, reset, canBack: stack.length > 1 }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useRouter must be used inside <RouterProvider>');
  return ctx;
}

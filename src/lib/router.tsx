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
  | 'saju'
  | 'month'
  | 'year'
  | 'love'
  | 'gunghap'
  | 'money'
  | 'career'
  | 'health'
  | 'personality'
  | 'settings'
  | 'terms'
  | 'privacy'
  | 'profiles'
  | 'addProfile'
  | 'tossConfirm';

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
  initialStack,
  children,
}: {
  initial?: ScreenId;
  /** 초기 스택 전체를 직접 지정 (deep link 진입 시 사용) — 지정 시 initial 무시. */
  initialStack?: ScreenId[];
  children: ReactNode;
}) {
  const [stack, setStack] = useState<ScreenId[]>(
    initialStack && initialStack.length > 0 ? initialStack : [initial]
  );
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

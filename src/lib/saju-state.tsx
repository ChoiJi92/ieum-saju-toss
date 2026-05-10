import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { computeMyeongsik, type Myeongsik, type SajuInput } from './saju';

/**
 * 사용자 사주 입력·계산 결과 전역 상태.
 * Input 화면에서 setProfile 호출 → 자동으로 명식 계산 → 다른 화면에서 useSaju 사용.
 */

type SajuState = {
  profile: SajuInput | null;
  myeongsik: Myeongsik | null;
  setProfile: (input: SajuInput) => void;
  reset: () => void;
};

const Ctx = createContext<SajuState | null>(null);

export function SajuProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileRaw] = useState<SajuInput | null>(null);

  const myeongsik = useMemo(
    () => (profile ? computeMyeongsik(profile) : null),
    [profile]
  );

  const setProfile = useCallback((input: SajuInput) => setProfileRaw(input), []);
  const reset = useCallback(() => setProfileRaw(null), []);

  const value = useMemo(
    () => ({ profile, myeongsik, setProfile, reset }),
    [profile, myeongsik, setProfile, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSaju() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSaju must be used inside <SajuProvider>');
  return ctx;
}

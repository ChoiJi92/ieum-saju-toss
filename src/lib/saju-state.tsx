import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { computeMyeongsik, type Myeongsik, type SajuInput } from './saju';

/**
 * Multi-profile 사주 입력·계산 전역 상태.
 *
 * v2 스키마: 여러 사주 저장 + 활성 사주 1개 선택.
 *   - 본인 사주(isSelf=true) 1개 + 가족·친구·연인·기타 N개
 *   - 활성 사주 기준으로 모든 화면(오늘·이달·신년 등) 풀이
 *   - 본인은 삭제 불가, 다른 사주는 자유롭게 추가·삭제
 *
 * v1 → v2 마이그레이션: 기존 단일 profile은 본인 사주로 이전.
 */

const PROFILES_KEY = 'ieum-saju.profiles.v2';
const ACTIVE_KEY = 'ieum-saju.active.v2';
const LEGACY_KEY = 'ieum-saju.profile.v1';

export type ProfileRelation = '본인' | '가족' | '친구' | '연인' | '기타';

export type StoredProfile = SajuInput & {
  id: string;
  relation: ProfileRelation;
  isSelf: boolean;
  createdAt: number;
};

type SajuState = {
  /** 활성 profile (모든 화면의 기준) */
  profile: SajuInput | null;
  /** 활성 profile의 명식 */
  myeongsik: Myeongsik | null;
  /** 전체 profile 목록 */
  profiles: StoredProfile[];
  /** 활성 profile ID */
  activeId: string | null;
  /** 본인 profile (없으면 null — 최초 가입 전) */
  selfProfile: StoredProfile | null;

  /** AddProfile 화면 편집 모드 ID (null이면 새 추가, 값 있으면 수정) */
  editingProfileId: string | null;
  startEditingProfile: (id: string) => void;
  stopEditingProfile: () => void;

  /** 토스 로그인 후 임시 보관 (시간 미정) — TossConfirm 화면에서 시간 선택 후 setSelf */
  tossPending: Omit<SajuInput, 'hour' | 'minute'> | null;
  setTossPending: (info: Omit<SajuInput, 'hour' | 'minute'> | null) => void;

  /** 본인 사주 등록·갱신 (Input 또는 Toss로 받은 정보) */
  setSelf: (input: SajuInput) => void;
  /** 다른 사주 추가 (가족·친구·연인·기타) */
  addProfile: (input: SajuInput, relation: ProfileRelation) => string;
  /** profile 삭제 (본인은 불가) */
  removeProfile: (id: string) => void;
  /** 활성 profile 전환 */
  setActive: (id: string) => void;
  /** profile 수정 (이름·생일 등) */
  updateProfile: (id: string, patch: Partial<Omit<StoredProfile, 'id' | 'createdAt' | 'isSelf'>>) => void;
  /** 전체 초기화 (모든 profile + 히스토리 삭제 — Settings에서 호출) */
  reset: () => void;
};

const Ctx = createContext<SajuState | null>(null);

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 미지원 환경 — 패스
  }
}

function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** 초기 로드 — v1 마이그레이션 포함 */
function loadInitial(): { profiles: StoredProfile[]; activeId: string | null } {
  // v2 우선 시도
  const v2Profiles = readJson<StoredProfile[]>(PROFILES_KEY);
  const v2Active = readJson<string>(ACTIVE_KEY);
  if (v2Profiles && Array.isArray(v2Profiles) && v2Profiles.length > 0) {
    const active =
      v2Active && v2Profiles.some((p) => p.id === v2Active) ? v2Active : v2Profiles[0].id;
    return { profiles: v2Profiles, activeId: active };
  }

  // v1 마이그레이션
  const legacy = readJson<SajuInput>(LEGACY_KEY);
  if (legacy && legacy.name && legacy.year) {
    const self: StoredProfile = {
      ...legacy,
      id: makeId(),
      relation: '본인',
      isSelf: true,
      createdAt: Date.now(),
    };
    writeJson(PROFILES_KEY, [self]);
    writeJson(ACTIVE_KEY, self.id);
    removeKey(LEGACY_KEY);
    return { profiles: [self], activeId: self.id };
  }

  return { profiles: [], activeId: null };
}

export function SajuProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadInitial(), []);
  const [profiles, setProfiles] = useState<StoredProfile[]>(initial.profiles);
  const [activeId, setActiveId] = useState<string | null>(initial.activeId);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [tossPending, setTossPending] = useState<Omit<SajuInput, 'hour' | 'minute'> | null>(null);

  const startEditingProfile = useCallback((id: string) => setEditingProfileId(id), []);
  const stopEditingProfile = useCallback(() => setEditingProfileId(null), []);

  const persist = useCallback((next: StoredProfile[], activeNext: string | null) => {
    writeJson(PROFILES_KEY, next);
    if (activeNext) writeJson(ACTIVE_KEY, activeNext);
    else removeKey(ACTIVE_KEY);
  }, []);

  const setSelf = useCallback(
    (input: SajuInput) => {
      setProfiles((prev) => {
        const existingSelf = prev.find((p) => p.isSelf);
        let next: StoredProfile[];
        let nextActive: string | null;
        if (existingSelf) {
          // 본인 사주 갱신 (편집)
          const updated: StoredProfile = { ...existingSelf, ...input };
          next = prev.map((p) => (p.id === existingSelf.id ? updated : p));
          nextActive = activeId ?? existingSelf.id;
        } else {
          // 본인 사주 최초 등록
          const created: StoredProfile = {
            ...input,
            id: makeId(),
            relation: '본인',
            isSelf: true,
            createdAt: Date.now(),
          };
          next = [created, ...prev];
          nextActive = created.id;
          setActiveId(created.id);
        }
        persist(next, nextActive);
        return next;
      });
    },
    [activeId, persist]
  );

  const addProfile = useCallback(
    (input: SajuInput, relation: ProfileRelation): string => {
      const id = makeId();
      const created: StoredProfile = {
        ...input,
        id,
        relation,
        isSelf: false,
        createdAt: Date.now(),
      };
      setProfiles((prev) => {
        const next = [...prev, created];
        persist(next, activeId);
        return next;
      });
      return id;
    },
    [activeId, persist]
  );

  const removeProfile = useCallback(
    (id: string) => {
      setProfiles((prev) => {
        const target = prev.find((p) => p.id === id);
        if (!target || target.isSelf) return prev; // 본인은 삭제 X
        const next = prev.filter((p) => p.id !== id);
        let nextActive = activeId;
        if (activeId === id) {
          const self = next.find((p) => p.isSelf);
          nextActive = self ? self.id : next[0]?.id ?? null;
          setActiveId(nextActive);
        }
        persist(next, nextActive);
        return next;
      });
    },
    [activeId, persist]
  );

  const setActive = useCallback(
    (id: string) => {
      setProfiles((prev) => {
        if (!prev.some((p) => p.id === id)) return prev;
        setActiveId(id);
        persist(prev, id);
        return prev;
      });
    },
    [persist]
  );

  const updateProfile = useCallback(
    (id: string, patch: Partial<Omit<StoredProfile, 'id' | 'createdAt' | 'isSelf'>>) => {
      setProfiles((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
        persist(next, activeId);
        return next;
      });
    },
    [activeId, persist]
  );

  const reset = useCallback(() => {
    setProfiles([]);
    setActiveId(null);
    removeKey(PROFILES_KEY);
    removeKey(ACTIVE_KEY);
    removeKey(LEGACY_KEY);
  }, []);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId]
  );

  const selfProfile = useMemo(() => profiles.find((p) => p.isSelf) ?? null, [profiles]);

  // SajuInput 형태로 expose (다른 화면들이 그대로 받아서 씀)
  const profile: SajuInput | null = useMemo(() => {
    if (!activeProfile) return null;
    const { id, relation, isSelf, createdAt, ...input } = activeProfile;
    void id; void relation; void isSelf; void createdAt;
    return input;
  }, [activeProfile]);

  const myeongsik = useMemo(
    () => (profile ? computeMyeongsik(profile) : null),
    [profile]
  );

  const value = useMemo(
    () => ({
      profile,
      myeongsik,
      profiles,
      activeId,
      selfProfile,
      editingProfileId,
      startEditingProfile,
      stopEditingProfile,
      tossPending,
      setTossPending,
      setSelf,
      addProfile,
      removeProfile,
      setActive,
      updateProfile,
      reset,
    }),
    [
      profile,
      myeongsik,
      profiles,
      activeId,
      selfProfile,
      editingProfileId,
      startEditingProfile,
      stopEditingProfile,
      tossPending,
      setSelf,
      addProfile,
      removeProfile,
      setActive,
      updateProfile,
      reset,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSaju() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSaju must be used inside <SajuProvider>');
  return ctx;
}

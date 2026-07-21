import { calculateSaju } from '@fullstackfamily/manseryeok';
import { makeSpirit, ZODIAC, type ElementKey, type ZodiacKey, type Spirit } from './spirit';

/**
 * 오늘의 정령 포획 — 매일 일진(그날 일주)으로 정령 1마리가 찾아오고, 잡으면 도감에 등록.
 * - 어떤 정령: 오늘의 일주(천간+지지) → 모두 동일, 매일 바뀜 → 꾸준히 모으면 60종 완성
 * - 나와의 궁합: 내 일간 오행 vs 정령 오행 → 포획 확률 보너스 (잘 맞는 날 잘 잡힘)
 * - 포획: 희귀도별 기본 확률 + 궁합 보너스. 실패 시 광고 보고 재도전(하루 최대 3회)
 */

const STEM_OHAENG: Record<string, ElementKey> = {
  '甲': 'wood', '乙': 'wood', '丙': 'fire', '丁': 'fire', '戊': 'earth',
  '己': 'earth', '庚': 'metal', '辛': 'metal', '壬': 'water', '癸': 'water',
};
const BRANCH_ZOD: Record<string, ZodiacKey> = Object.fromEntries(
  (Object.keys(ZODIAC) as ZodiacKey[]).map((k) => [ZODIAC[k].cn, k]),
) as Record<string, ZodiacKey>;

const SHENG: Record<ElementKey, ElementKey> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const KE: Record<ElementKey, ElementKey> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

export const CATCH_BASE: Record<string, number> = { common: 75, rare: 50, spirit: 30, legend: 15 };
export const CATCH_MAX_ATTEMPTS = 3;

export function todayDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 오늘의 일진 정령 (그날 일주 천간+지지 기반). 모두 동일, 매일 바뀜. */
export function todaySpirit(date: Date = new Date()): Spirit {
  try {
    const r = calculateSaju(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0, { applyTimeCorrection: false });
    const gz = r.dayPillarHanja;
    const elem = STEM_OHAENG[gz[0]] ?? 'wood';
    const zod = BRANCH_ZOD[gz[1]] ?? 'rat';
    return makeSpirit(elem, zod);
  } catch {
    return makeSpirit('wood', 'rat');
  }
}

/** 내 일간 오행 vs 정령 오행 궁합 0~100 (생/비화 높음, 극 낮음) */
export function gunghapScore(mine: ElementKey, theirs: ElementKey): number {
  if (SHENG[theirs] === mine) return 92; // 정령이 나를 생(도움) — 최고
  if (mine === theirs) return 85;        // 비화(동질)
  if (SHENG[mine] === theirs) return 78;  // 내가 정령을 생(베풂)
  if (KE[mine] === theirs) return 60;     // 내가 정령을 극
  if (KE[theirs] === mine) return 48;     // 정령이 나를 극
  return 65;
}

/** 포획 확률 % — 희귀도 기본 + 궁합 보너스(50 기준 ±20p) */
export function catchChance(rarityKey: string, gunghap: number): number {
  const base = CATCH_BASE[rarityKey] ?? 60;
  const bonus = Math.round(((gunghap - 50) / 50) * 20);
  return Math.max(5, Math.min(95, base + bonus));
}

/* ── 영속 (localStorage) ── */
const KEY = 'ieum-saju.catch.v1';
type CatchDay = { date: string; attempts: number; caught: boolean; greeted: boolean };
type CatchStore = { caught: string[]; day: CatchDay };

/** 오늘 하루의 빈 포획 상태 (자정 롤오버·마이그레이션 공통) */
function freshDay(date = ''): CatchDay { return { date, attempts: 0, caught: false, greeted: false }; }

function load(): CatchStore {
  try {
    const r = localStorage.getItem(KEY);
    if (r) {
      const s = JSON.parse(r) as Partial<CatchStore>;
      const d = s.day as Partial<CatchDay> | undefined;
      // greeted는 후기 추가 필드 — 구버전 저장분은 false로 정규화
      const day: CatchDay = d
        ? { date: d.date ?? '', attempts: d.attempts ?? 0, caught: Boolean(d.caught), greeted: Boolean(d.greeted) }
        : freshDay();
      return { caught: s.caught ?? [], day };
    }
  } catch { /* ignore */ }
  return { caught: [], day: freshDay() };
}
function save(s: CatchStore) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ } }

/** 포획으로 도감에 등록된 정령 키 집합 */
export function caughtKeys(): Set<string> { return new Set(load().caught); }

export type TodayCatch = { attempts: number; caught: boolean; greeted: boolean; attemptsLeft: number };
/** 오늘의 포획 진행 상태 (자정 리셋) */
export function todayCatchState(date: Date = new Date()): TodayCatch {
  const s = load();
  const dk = todayDateKey(date);
  const day = s.day.date === dk ? s.day : freshDay(dk);
  return { attempts: day.attempts, caught: day.caught, greeted: day.greeted, attemptsLeft: Math.max(0, CATCH_MAX_ATTEMPTS - day.attempts) };
}

/** 포획 시도 — 확률 굴림 + 저장. success/남은 도전 반환 */
export function attemptCatch(spiritKey: string, chance: number, date: Date = new Date()): { success: boolean; attemptsLeft: number; done: boolean } {
  const s = load();
  const dk = todayDateKey(date);
  if (s.day.date !== dk) s.day = freshDay(dk);
  if (s.day.caught || s.day.attempts >= CATCH_MAX_ATTEMPTS) {
    return { success: s.day.caught, attemptsLeft: Math.max(0, CATCH_MAX_ATTEMPTS - s.day.attempts), done: true };
  }
  s.day.attempts += 1;
  const success = Math.random() * 100 < chance;
  if (success) {
    s.day.caught = true;
    if (!s.caught.includes(spiritKey)) s.caught.push(spiritKey);
  }
  save(s);
  const attemptsLeft = Math.max(0, CATCH_MAX_ATTEMPTS - s.day.attempts);
  return { success, attemptsLeft, done: success || attemptsLeft === 0 };
}

/**
 * '인사하기' — 이미 도감에 있는 오늘의 정령과 하루 1회 교감.
 * 잡을 게 없는 날에도 데일리 미션('잡기 시도')을 완료할 수 있게 해주는 참여 경로.
 * 이미 인사했으면 already=true (중복 보상 방지).
 */
export function greetToday(date: Date = new Date()): { ok: boolean; already: boolean } {
  const s = load();
  const dk = todayDateKey(date);
  if (s.day.date !== dk) s.day = freshDay(dk);
  if (s.day.greeted) return { ok: false, already: true };
  s.day.greeted = true;
  save(s);
  return { ok: true, already: false };
}

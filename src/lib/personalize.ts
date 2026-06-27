import type { Myeongsik } from './saju';

export function pillarSeed(m: Myeongsik): string {
  return m.pillars.map((p) => p.top.c + p.bot.c).join('');
}

export function pickBySeed<T>(seed: string, key: string, items: T[]): T {
  if (items.length === 0) throw new Error('pickBySeed requires non-empty items');
  let h = 0;
  const s = `${seed}:${key}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return items[Math.abs(h) % items.length];
}

export function rotateBySeed<T>(seed: string, key: string, items: T[], take: number): T[] {
  if (items.length === 0 || take <= 0) return [];
  let h = 0;
  const s = `${seed}:${key}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const start = Math.abs(h) % items.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(take, items.length); i++) {
    out.push(items[(start + i) % items.length]);
  }
  return out;
}

export type HintDomain = 'love' | 'money' | 'career' | 'health' | 'month';

const HEAVY_KR: Record<string, string> = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };

/** 도메인별 톤(리듬) 문장 — 운세 종류마다 다르게 읽히도록 분리 */
const TEMPO_BY_DOMAIN: Record<HintDomain, string[]> = {
  love: [
    '연애는 서두르기보다 한 박자 천천히 다가갈 때 더 잘 풀려요.',
    '먼저 건네는 다정한 표현 하나가 흐름을 바꿔요.',
    '내 리듬을 지키면서 만나면 관계가 더 단단해져요.',
  ],
  money: [
    '큰 결정은 한 번에, 작은 지출은 주 단위로 점검하는 리듬이 잘 맞아요.',
    '버는 것보다 새는 돈을 먼저 막으면 흐름이 살아나요.',
    '항목 하나씩 정리하듯 관리하면 재물이 안정돼요.',
  ],
  career: [
    '일은 벌이기보다 우선순위 한 개씩 끝내는 방식이 잘 맞아요.',
    '빠르게 시작하고 짧게 점검하는 업무 리듬이 잘 맞아요.',
    '사람 일정에 끌리기보다 내 루틴을 먼저 고정하면 능률이 올라요.',
  ],
  health: [
    '한 번에 무리하기보다 매일 조금씩 쌓는 관리가 잘 맞아요.',
    '수면 루틴부터 고정하면 컨디션이 빠르게 돌아와요.',
    '강하게 운동하기보다 가볍게 자주 움직이는 편이 좋아요.',
  ],
  month: [
    '이번 달은 빠르게 시작하고 짧게 점검하는 리듬이 잘 맞아요.',
    '이번 달은 한 번에 크게 벌리기보다 우선순위 1개씩 끝내는 방식이 좋아요.',
    '이번 달은 사람 일정에 끌리기보다 내 루틴 먼저 고정하면 흐름이 살아나요.',
  ],
};

/** 도메인별 "기운 활용" 방향 */
const FOCUS_BY_DOMAIN: Record<HintDomain, string> = {
  love: '관계에', money: '재물 관리에', career: '일에', health: '몸 관리에', month: '이번 달 흐름에',
};

export function profileHint(m: Myeongsik, domain: HintDomain = 'month'): string {
  const seed = pillarSeed(m);
  const hourBranch = m.pillars[3]?.bot?.c ?? '';
  const dayBranch = m.pillars[2]?.bot?.c ?? '';
  const heavy = Object.entries(m.ohaeng).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'earth';
  const heavyKr = HEAVY_KR[heavy] ?? '토';

  // 도메인을 키에 포함 → 운세마다 다른 톤 문장이 선택됨
  const style = pickBySeed(seed, `style:${domain}`, TEMPO_BY_DOMAIN[domain]);
  // 시지(태어난 시)를 모르면 일지만 사용 (빈 괄호 방지)
  const basis = hourBranch ? `일지(${dayBranch})와 시지(${hourBranch})` : `일지(${dayBranch})`;

  return `${style} ${basis} 기준으로 보면 ${heavyKr} 기운을 ${FOCUS_BY_DOMAIN[domain]} 살리는 게 핵심이에요.`;
}

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

export function profileHint(m: Myeongsik): string {
  const seed = pillarSeed(m);
  const hourBranch = m.pillars[3]?.bot?.c ?? '';
  const dayBranch = m.pillars[2]?.bot?.c ?? '';
  const heavy = Object.entries(m.ohaeng).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'earth';
  const heavyKr: Record<string, string> = {
    wood: '목',
    fire: '화',
    earth: '토',
    metal: '금',
    water: '수',
  };

  const style = pickBySeed(seed, 'style', [
    '이번 달은 빠르게 시작하고 짧게 점검하는 리듬이 잘 맞아요.',
    '이번 달은 한 번에 크게 벌리기보다 우선순위 1개씩 끝내는 방식이 좋아요.',
    '이번 달은 사람 일정에 끌리기보다 내 루틴 먼저 고정하면 흐름이 살아나요.',
  ]);

  return `${style} 시지(${hourBranch})·일지(${dayBranch}) 기준으로 보면 ${heavyKr[heavy]} 기운 활용이 핵심이에요.`;
}

/**
 * 한글 조사 붙이기.
 *
 * "노을쥐을(를)" 처럼 괄호로 얼버무리면 읽는 사람 눈에 밟힌다. 받침을 보고 골라 붙인다.
 * report-outline.ts 안에만 있던 것을 화면에서도 쓸 수 있게 옮겼다.
 */

/** 마지막 글자에 받침이 있는가. 한글이 아니면 없는 것으로 본다. */
export function hasBatchim(word: string): boolean {
  const last = word.trim().slice(-1);
  const c = last.charCodeAt(0);
  if (Number.isNaN(c) || c < 0xac00 || c > 0xd7a3) return false;
  return (c - 0xac00) % 28 !== 0;
}

export const 이가 = (w: string) => `${w}${hasBatchim(w) ? '이' : '가'}`;
export const 을를 = (w: string) => `${w}${hasBatchim(w) ? '을' : '를'}`;
export const 은는 = (w: string) => `${w}${hasBatchim(w) ? '은' : '는'}`;
export const 과와 = (w: string) => `${w}${hasBatchim(w) ? '과' : '와'}`;

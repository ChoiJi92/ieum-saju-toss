// src/screens/app/jami-tokens.ts — 자미두수 화면 공용 표시 토큰 (ScreenJamidusu ↔ JamiChartGrid)

// 사화 뱃지 색상 — 알파 변형은 rgba 리터럴 (CSS var에 알파 접미 불가)
export const MUTAGEN_COLOR: Record<string, string> = {
  록: 'var(--v2-mint)',
  권: 'var(--v2-peach)',
  과: 'var(--v2-butter)',
  기: 'var(--v2-lavender)',
};

// 밝기 중 모디파이어를 표시할 등급
export const BRIGHT_GRADES = new Set(['묘', '왕', '득']);
export const DARK_GRADES = new Set(['불', '함']);

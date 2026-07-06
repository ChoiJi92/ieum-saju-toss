// src/screens/app/jami-tokens.ts — 자미두수 화면 공용 표시 토큰 (ScreenJamidusu ↔ JamiChartGrid)

// 사화 뱃지 색상 — 알파 변형은 rgba 리터럴 (CSS var에 알파 접미 불가)
export const MUTAGEN_COLOR: Record<string, string> = {
  록: 'var(--v2-mint)',
  권: 'var(--v2-peach)',
  과: 'var(--v2-butter)',
  기: 'var(--v2-lavender)',
};
// MUTAGEN_COLOR의 알파 변형 (뱃지 배경 .13 / 테두리 .27) — 값 변경 시 세 맵 동기 유지
export const MUTAGEN_BG: Record<string, string> = {
  록: 'rgba(91,217,172,.13)',
  권: 'rgba(255,158,130,.13)',
  과: 'rgba(255,210,122,.13)',
  기: 'rgba(183,156,255,.13)',
};
export const MUTAGEN_LINE: Record<string, string> = {
  록: 'rgba(91,217,172,.27)',
  권: 'rgba(255,158,130,.27)',
  과: 'rgba(255,210,122,.27)',
  기: 'rgba(183,156,255,.27)',
};

// 사화 짧은 라벨 — 처음 보는 유저용 한 단어 설명 (바텀시트·명궁 카드 뱃지에 병기)
// 근거: 화록=재록·순조, 화권=권세·추진, 화과=명예·인정, 화기=조심·걸림
export const MUTAGEN_LABEL: Record<string, string> = {
  록: '풀리는 기운',
  권: '밀어붙이는 힘',
  과: '인정받는 기운',
  기: '조심할 기운',
};

// 밝기 중 모디파이어를 표시할 등급
export const BRIGHT_GRADES = new Set(['묘', '왕', '득']);
export const DARK_GRADES = new Set(['불', '함']);

// 밝기 7등급 짧은 라벨 — 밝은 순서 묘>왕>득>리>평>불>함
// 근거: 廟(입묘·최명)>旺>得地>利益>平和>不得地>陷(낙함·최암)
export const BRIGHTNESS_LABEL: Record<string, string> = {
  묘: '가장 밝음',
  왕: '밝음',
  득: '자리 잡음',
  리: '이로움',
  평: '보통',
  불: '흐림',
  함: '빛이 약함',
};

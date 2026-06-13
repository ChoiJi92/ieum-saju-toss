// src/screens/v2/nav.ts  (minimal — extended in next task)
export type Tab = 'home' | 'grow' | 'collection' | 'profile';
export const TABS: { key: Tab; ic: string; label: string }[] = [
  { key: 'home', ic: '✦', label: '홈' },
  { key: 'grow', ic: '❀', label: '성장' },
  { key: 'collection', ic: '◈', label: '도감' },
  { key: 'profile', ic: '☾', label: '내정보' },
];

/** 탭 안에서 push 가능한 라우트 (탭 루트 + 도메인 상세) */
export type Route =
  | Tab
  | 'today' | 'month' | 'year' | 'love' | 'money' | 'career' | 'health'
  | 'gunghap' | 'sinsal' | 'personality'
  | 'fortunes' | 'calendar' | 'profiles' | 'addProfile' | 'terms' | 'privacy';

/** 탭 진입 전 온보딩 플로우 (탭 바깥) */
export type FlowScreen = 'onboarding' | 'input' | 'reveal';

/** 보상형(긴 광고) 차단 게이트 — 내용 많은/정적 운세 */
// 궁합은 라우트 진입 시 게이트하지 않음 — 상대 입력 후 '궁합 보기' 버튼에서 광고 (ScreenGunghap 내부 처리)
export const REWARDED_ROUTES: Route[] = ['month', 'year', 'personality', 'sinsal'];
/** 전면형(짧은 광고) 진입 노출 — 매일 바뀌는 도메인 운세 */
export const INTERSTITIAL_ROUTES: Route[] = ['love', 'money', 'career', 'health'];
export const ROUTE_TITLE: Record<string, string> = {
  month: '이달의 운세', year: '올해의 운세', love: '연애운', money: '금전운', career: '직업운',
  health: '건강운', gunghap: '궁합', sinsal: '신살', personality: '성격 분석', calendar: '일진 달력',
};

/** 홈 "운세 더보기" 그리드 항목 (다음 태스크에서 사용) */
export const FORTUNE_MENU: { route: Route; ic: string; label: string; sub: string; color: string }[] = [
  { route: 'today', ic: '☀️', label: '오늘의 운세', sub: '하루 흐름', color: 'var(--v2-lavender)' },
  { route: 'calendar', ic: '🗓️', label: '일진 달력', sub: '날짜별 길흉', color: 'var(--v2-mint)' },
  { route: 'month', ic: '🌙', label: '이달의 운세', sub: '한 달 흐름', color: 'var(--v2-peach)' },
  { route: 'year', ic: '🌟', label: '올해의 운세', sub: '12개월', color: 'var(--v2-butter)' },
  { route: 'love', ic: '💕', label: '연애운', sub: '인연·매력', color: 'var(--v2-rose)' },
  { route: 'money', ic: '💰', label: '금전운', sub: '재물 흐름', color: 'var(--v2-mint)' },
  { route: 'career', ic: '💼', label: '직업운', sub: '커리어·적성', color: 'var(--v2-lavender)' },
  { route: 'health', ic: '🌿', label: '건강운', sub: '컨디션·약점', color: 'var(--v2-mint)' },
  { route: 'gunghap', ic: '💑', label: '궁합', sub: '두 사람 결', color: 'var(--v2-rose)' },
  { route: 'sinsal', ic: '🪄', label: '신살', sub: '8가지 기운', color: 'var(--v2-butter)' },
];

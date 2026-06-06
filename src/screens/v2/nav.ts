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
  | 'gunghap' | 'sinsal' | 'personality';

/** 탭 진입 전 온보딩 플로우 (탭 바깥) */
export type FlowScreen = 'onboarding' | 'input' | 'reveal';

/** 리워드 광고 게이트 대상(오늘 제외 프리미엄 운세) */
export const PAID_ROUTES: Route[] = ['month', 'year', 'love', 'money', 'career', 'health', 'gunghap', 'sinsal', 'personality'];
export const ROUTE_TITLE: Record<string, string> = {
  month: '이달의 운세', year: '올해의 운세', love: '연애운', money: '금전운', career: '직업운',
  health: '건강운', gunghap: '궁합', sinsal: '신살', personality: '성격 분석',
};

/** 홈 "운세 더보기" 그리드 항목 (다음 태스크에서 사용) */
export const FORTUNE_MENU: { route: Route; ic: string; label: string; sub: string; color: string }[] = [
  { route: 'today', ic: '☀', label: '오늘의 운세', sub: '하루 흐름', color: 'var(--v2-lavender)' },
  { route: 'month', ic: '🌙', label: '이달의 운세', sub: '한 달 흐름', color: 'var(--v2-peach)' },
  { route: 'year', ic: '✶', label: '올해의 운세', sub: '12개월', color: 'var(--v2-butter)' },
  { route: 'love', ic: '💞', label: '연애운', sub: '인연·매력', color: 'var(--v2-rose)' },
  { route: 'money', ic: '💰', label: '금전운', sub: '재물 흐름', color: 'var(--v2-mint)' },
  { route: 'career', ic: '💼', label: '직업운', sub: '커리어·적성', color: 'var(--v2-lavender)' },
  { route: 'health', ic: '🌿', label: '건강운', sub: '컨디션·약점', color: 'var(--v2-mint)' },
  { route: 'gunghap', ic: '🤍', label: '궁합', sub: '두 사람 결', color: 'var(--v2-rose)' },
  { route: 'sinsal', ic: '🔮', label: '신살', sub: '8가지 기운', color: 'var(--v2-butter)' },
];

# 이음사주 광고 프리패스 + DB 없는 최소 지표 Implementation Plan

> **For Hermes:** 다른 세션에서 이 파일을 먼저 읽고 이어서 진행한다. 사용자가 명시적으로 “계속/진행” 승인하면 구현한다. 구현 시 기존 리워드 광고 보상 조건(`userEarnedReward`만 unlock)을 유지하고, 각 단계 후 `yarn build`로 검증한다.

**Goal:** 이음사주 앱의 “콘텐츠마다 광고를 봐야 하는 피로감”을 줄이기 위해 광고 1회 시청 후 5분 동안 상세 콘텐츠를 광고 없이 볼 수 있는 프리패스를 추가하고, DB 없이 앱인토스 콘솔 + localStorage 로컬 카운터로 최소 지표를 확인한다.

**Architecture:** 프리패스 상태는 클라이언트 localStorage에 `adPassUntil` timestamp로 저장한다. `RewardedAdGate`는 렌더 시 프리패스가 유효하면 광고 없이 바로 unlock하고, 광고 보상 완료 시 프리패스 만료 시각을 5분 뒤로 갱신한다. 지표는 중앙 DB/외부 분석툴 없이 localStorage 카운터에만 저장해 QA/디버그용으로 확인하며, 전체 광고 성과는 앱인토스 광고 콘솔의 노출/eCPM/예상 수익으로 본다.

**Tech Stack:** React + TypeScript, Apps in Toss `@apps-in-toss/web-framework` rewarded ad, custom stack router, localStorage, 기존 `src/lib/ads.ts`, `src/components/RewardedAdGate.tsx`.

---

## 배경 및 제품 결정

현재 우려:

```text
콘텐츠마다 광고 1회 → 유저가 “또 광고야?” 피로감을 느낄 수 있음
```

채택 방향:

```text
광고 1회 완료 → 5분 동안 전체 상세 콘텐츠 광고 없이 열람
```

이번에는 DB를 붙이지 않는다.

이유:

- 지금 목적은 광고 피로도 완화와 UX 개선이다.
- DB/분석 인프라까지 붙이면 작업 범위가 과해진다.
- 출시 초기에는 앱인토스 광고 콘솔 + 실제 QA 체감 + 로컬 카운터로 충분하다.
- 정확한 전체 사용자 행동 분석은 나중에 재화/복채 기능을 붙일 때 검토한다.

---

## 앱인토스에서 기본 제공하는 광고 지표

공식 앱인토스 개발자센터 `인앱 광고 > 콘솔 가이드`에서 확인한 내용:

앱인토스 광고 콘솔 제공 지표:

```text
- 총 광고 노출 수
- eCPM
- 총 예상 수익
```

업데이트 주기:

```text
성과 데이터는 성과 발생 익일 오전 4시에 업데이트
```

정산:

```text
매월 1일부터 말일까지의 수익은 다음 달 1일 업데이트
다음 달 1일 확정된 수익은 해당 월 말일 입금
```

중요:

```text
앱인토스 콘솔은 광고 성과 확인용이다.
프리패스 사용률, 콘텐츠 열람 수, 화면별 이탈 등 제품 지표는 기본 제공 범위만으로는 부족할 수 있다.
```

---

## 이번 범위에서 볼 수 있는 지표

### 앱인토스 콘솔로 확인

```text
- 광고 노출 수 변화
- eCPM 변화
- 총 예상 수익 변화
```

프리패스 전후 비교 기준:

```text
프리패스 전 3일 평균 vs 프리패스 후 3~7일 평균
```

### localStorage 로컬 카운터로 확인

중앙 집계는 안 되지만 QA/내 기기 확인용으로 충분한 지표:

```text
- appOpen
- adGateView
- adWatchClick
- adRewarded
- adDismissed
- adFailed
- freepassGranted
- freepassUsed
- contentUnlocked
```

주의:

```text
localStorage 카운터는 전체 유저 통계가 아니다.
기기별 로컬 디버그/QA 확인용이다.
```

---

## 핵심 정책

### 프리패스

```text
기간: 광고 보상 완료 시점부터 5분
범위: RewardedAdGate를 쓰는 전체 상세 콘텐츠
저장: localStorage timestamp
키: ieum-saju.adPassUntil.v1
```

### 무료/유료성 콘텐츠 방향

무료 유지 추천:

```text
- 오늘의 운세 요약
- 홈 히어로 점수
- 기본 명식 일부
```

프리패스/광고 필요:

```text
- 오늘 상세 풀이
- 사주 명식 상세
- 성격 카드
- 연애운 상세
- 재물운 상세
- 직업운 상세
- 건강운 상세
- 궁합 상세
- 월간 좋은 날/상세
```

### 보상 조건

반드시 유지:

```text
userEarnedReward 이벤트가 있어야만 프리패스 발급
```

열면 안 되는 경우:

```text
- dismissed
- failedToShow
- onError
- unsupported
- not_configured
```

---

## 구현 대상 파일

확인된 현재 주요 파일:

- `src/lib/ads.ts`
  - `preloadRewardedAdForResult()`
  - `showRewardedAdForResult()`
  - 현재 리워드 보상 조건 관리
- `src/components/RewardedAdGate.tsx`
  - 광고 게이트 UI
  - 광고 보상 완료 후 결과 unlock
- `src/screens/Home.tsx`
  - 홈 mount 시 광고 preload 호출
  - 필요하면 프리패스 남은 시간 배지 표시 가능
- `src/screens/Settings.tsx`
  - 로컬 통계 디버그 섹션을 넣기 좋은 위치

신규 파일 추천:

- Create: `src/lib/ad-pass.ts`
- Create: `src/lib/local-stats.ts`

---

## Task 1: 프리패스 유틸 추가

**Objective:** localStorage 기반 5분 광고 프리패스 상태를 관리한다.

**Files:**

- Create: `src/lib/ad-pass.ts`

**Implementation:**

```ts
const AD_PASS_KEY = 'ieum-saju.adPassUntil.v1';
export const AD_PASS_DURATION_MS = 5 * 60 * 1000;

function now() {
  return Date.now();
}

function readNumber(key: string): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(key);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function getAdPassUntil(): number {
  return readNumber(AD_PASS_KEY);
}

export function getAdPassRemainingMs(): number {
  return Math.max(0, getAdPassUntil() - now());
}

export function hasActiveAdPass(): boolean {
  return getAdPassRemainingMs() > 0;
}

export function grantAdPass(durationMs = AD_PASS_DURATION_MS): number {
  const until = now() + durationMs;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AD_PASS_KEY, String(until));
  }
  return until;
}

export function clearAdPass() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AD_PASS_KEY);
  }
}

export function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
```

**Verification:**

```bash
yarn build
```

Expected: 빌드 성공.

---

## Task 2: DB 없는 로컬 통계 유틸 추가

**Objective:** 중앙 DB 없이 QA 기기에서만 확인 가능한 localStorage 카운터를 만든다.

**Files:**

- Create: `src/lib/local-stats.ts`

**Implementation:**

```ts
type StatEvent =
  | 'appOpen'
  | 'adGateView'
  | 'adWatchClick'
  | 'adRewarded'
  | 'adDismissed'
  | 'adFailed'
  | 'freepassGranted'
  | 'freepassUsed'
  | 'contentUnlocked';

type Stats = {
  version: 1;
  byDay: Record<string, Partial<Record<StatEvent, number>>>;
};

const STATS_KEY = 'ieum-saju.localStats.v1';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readStats(): Stats {
  if (typeof window === 'undefined') return { version: 1, byDay: {} };
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (!raw) return { version: 1, byDay: {} };
    const parsed = JSON.parse(raw) as Stats;
    return parsed?.version === 1 && parsed.byDay ? parsed : { version: 1, byDay: {} };
  } catch {
    return { version: 1, byDay: {} };
  }
}

function writeStats(stats: Stats) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function trackLocal(event: StatEvent) {
  const stats = readStats();
  const day = todayKey();
  stats.byDay[day] = stats.byDay[day] ?? {};
  stats.byDay[day][event] = (stats.byDay[day][event] ?? 0) + 1;
  writeStats(stats);
}

export function getLocalStats() {
  return readStats();
}

export function clearLocalStats() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STATS_KEY);
  }
}
```

**Verification:**

```bash
yarn build
```

Expected: 빌드 성공.

---

## Task 3: RewardedAdGate에 프리패스 적용

**Objective:** 프리패스가 유효하면 광고 없이 결과를 열고, 광고 보상 완료 시 프리패스를 5분 발급한다.

**Files:**

- Modify: `src/components/RewardedAdGate.tsx`

**Implementation Notes:**

1. import 추가:

```ts
import { formatRemaining, getAdPassRemainingMs, grantAdPass, hasActiveAdPass } from '../lib/ad-pass';
import { trackLocal } from '../lib/local-stats';
```

2. mount 시 프리패스 확인:

```ts
useEffect(() => {
  trackLocal('adGateView');
  if (hasActiveAdPass()) {
    trackLocal('freepassUsed');
    trackLocal('contentUnlocked');
    setUnlocked(true);
    onUnlocked?.();
    return;
  }
  // 기존 preload 유지
}, []);
```

주의: 현재 `RewardedAdGate`의 props와 내부 구현을 먼저 읽고 정확한 위치에 반영한다. 이미 `unlocked`, `preparing`, `adReady` 상태가 있음.

3. 광고 버튼 클릭 시 카운터:

```ts
trackLocal('adWatchClick');
```

4. `result === 'rewarded'`일 때:

```ts
grantAdPass();
trackLocal('adRewarded');
trackLocal('freepassGranted');
trackLocal('contentUnlocked');
```

5. `dismissed` / `failed` 분기에서:

```ts
trackLocal('adDismissed'); // dismissed
trackLocal('adFailed'); // failed/not_configured/unsupported 등
```

6. 게이트 UI 문구 변경:

기존:

```text
광고 보고 결과보기
```

추천:

```text
광고 보고 5분 프리패스 열기
```

설명 문구:

```text
광고를 끝까지 보면 5분 동안 모든 사주 콘텐츠를 광고 없이 볼 수 있어요.
```

보상 완료 후 별도 토스트가 없다면 결과 화면으로 바로 열려도 된다.

**Verification:**

```bash
yarn build
```

Expected: 빌드 성공.

Manual QA:

```text
1. localStorage에서 ieum-saju.adPassUntil.v1 삭제
2. 상세 콘텐츠 진입
3. 광고 게이트 노출 확인
4. 광고 보상 완료 후 결과 열림
5. 다른 상세 콘텐츠로 이동
6. 5분 이내라면 광고 없이 바로 결과 열림
```

---

## Task 4: 프리패스 남은 시간 표시

**Objective:** 유저가 “지금 광고 없이 볼 수 있는 상태”를 이해하게 한다.

**Files:**

- Modify: `src/components/RewardedAdGate.tsx`
- Optional Modify: `src/screens/Home.tsx`

**Recommended UX:**

게이트에서 프리패스 유효 시 보통 바로 unlock되므로, 홈에 배지를 표시하면 좋다.

홈 배지 예시:

```text
프리패스 04:32 남음
```

단, 최초 구현에서는 홈 배지 없이 게이트 자동 통과만 구현해도 된다.

홈 배지를 넣는 경우:

- `getAdPassRemainingMs()`로 남은 시간 계산
- `setInterval`로 1초마다 갱신
- 0이 되면 배지 숨김

주의:

- 너무 큰 UI를 만들지 말고 홈 상단/메뉴 위 작은 chip 정도로 처리.

**Verification:**

```bash
yarn build
```

Expected: 빌드 성공.

---

## Task 5: 설정 화면에 로컬 통계 디버그 섹션 추가(Optional)

**Objective:** DB 없이도 QA 기기에서 오늘의 프리패스/광고 흐름을 확인한다.

**Files:**

- Modify: `src/screens/Settings.tsx`

**Implementation:**

설정 화면 하단에 작은 디버그 섹션 추가:

```text
로컬 통계(이 기기)
오늘
- 광고 게이트: N
- 광고 클릭: N
- 광고 완료: N
- 프리패스 발급: N
- 프리패스 사용: N
- 콘텐츠 열람: N
```

초기에는 운영 유저에게 보여도 큰 문제는 없지만, 깔끔하게 하려면 작게 접어두거나 `개발 정보` 형태로 표시한다.

Reset 버튼:

```text
로컬 통계 초기화
```

주의:

- 이것은 전체 유저 통계가 아니라 “이 기기 기준”이라고 표시해야 한다.

**Verification:**

```bash
yarn build
```

Expected: 빌드 성공.

---

## Task 6: 앱 실행/콘텐츠 unlock 카운터 연결(Optional)

**Objective:** DB 없이도 기본 사용 흐름을 로컬 카운터로 확인한다.

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/components/RewardedAdGate.tsx`

**Implementation:**

`App.tsx` 또는 최상위 Shell에서 1회:

```ts
useEffect(() => {
  trackLocal('appOpen');
}, []);
```

주의:

- React StrictMode/dev 환경에서는 2회 찍힐 수 있다. 운영 빌드 기준으로 판단.
- 정확한 분석 목적이 아니므로 과하게 보정하지 않아도 된다.

---

## Task 7: 최종 빌드 및 산출물 확인

**Objective:** AIT 빌드가 깨지지 않는지 검증한다.

**Commands:**

```bash
yarn build
```

Expected:

```text
Rsbuild 성공
AIT build completed
.ait artifact 생성
```

추가 확인:

```bash
git diff -- src/lib/ad-pass.ts src/lib/local-stats.ts src/components/RewardedAdGate.tsx src/screens/Home.tsx src/screens/Settings.tsx src/App.tsx
```

Expected:

```text
- 프리패스/localStorage/게이트/선택적 UI 변경만 포함
- 광고 보상 조건은 userEarnedReward 유지
- dismissed/failed/unsupported에서 결과가 열리지 않음
```

---

## 프리패스 배포 후 3~7일 판단 기준

앱인토스 콘솔에서 확인:

```text
- 총 광고 노출 수
- eCPM
- 총 예상 수익
```

좋은 신호:

```text
- 광고 노출 수가 약간 줄어도 eCPM/수익이 크게 무너지지 않음
- 실제 QA에서 여러 콘텐츠 탐색이 훨씬 편해짐
- 광고 1회 후 콘텐츠 2~4개 정도 자연스럽게 열람 가능
```

조정 필요 신호:

```text
- 광고 노출 수가 60~80% 급감
- 예상 수익도 급감
- 프리패스 1회로 너무 많은 콘텐츠를 다 소비함
```

조정 옵션:

```text
- 5분 → 3분으로 단축
- 일부 고가치 콘텐츠는 프리패스 제외
- 성격 카드/오늘 상세 등은 프리패스 포함, 신년운세/궁합 상세는 별도 광고 유지
```

복채/재화 기능 배포 조건:

```text
프리패스 UX는 좋아졌지만 재방문이 약함 → 출석 복채 검토
광고 노출이 너무 줄어 보완 필요 → 복채로 콘텐츠 1개 열람 구조 검토
유저가 하루 여러 콘텐츠를 봄 → 복채/출석으로 다음날 재방문 장치 추가
```

추천 일정:

```text
Day 0: 프리패스 배포
Day 3: 앱인토스 콘솔 광고 지표 1차 확인
Day 7: 유지/3분 조정/복채 설계 여부 결정
```

---

## Acceptance Criteria

- [ ] 광고 보상 완료 시 `ieum-saju.adPassUntil.v1`이 현재 시각 + 5분으로 저장된다.
- [ ] 프리패스 유효 시간 안에 다른 상세 콘텐츠 진입 시 광고 없이 바로 unlock된다.
- [ ] 프리패스 만료 후에는 다시 광고 게이트가 뜬다.
- [ ] `dismissed`, `failed`, `unsupported`, `not_configured`에서는 프리패스가 발급되지 않는다.
- [ ] localStorage 로컬 통계가 증가한다.
- [ ] DB/외부 분석툴/새 서버 저장소를 추가하지 않는다.
- [ ] `yarn build`가 성공한다.

---

## Notes for Next Session

- 사용자는 DB를 지금 붙이는 것을 원하지 않는다.
- 사용자는 프리패스 도입에는 동의했다.
- 핵심 목적은 광고 피로도 감소다.
- 앱인토스가 제공하는 공식 광고 지표는 `총 광고 노출 수`, `eCPM`, `총 예상 수익`이며 익일 오전 4시에 업데이트된다.
- 로컬 카운터는 전체 통계가 아니라 QA/디버그용임을 명확히 해야 한다.
- 구현 전 사용자의 명시 승인(예: “계속”)을 받고 진행한다.

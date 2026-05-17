# 이음사주 로컬 콘텐츠 확장 Implementation Plan

> **For Hermes:** 다른 세션에서 이 파일을 먼저 읽고 이어서 진행한다. 구현 시 `subagent-driven-development` 또는 직접 구현을 사용하되, 각 단계 후 `yarn build`로 검증한다.

**Goal:** 이음사주 앱에 AI/API 없이 동작하는 룰 기반 개인화 콘텐츠를 추가해 재방문·체류시간·리워드 광고 소비 지점을 늘린다.

**Architecture:** 기존 `myeongsik` 계산 결과를 입력으로 받아 `src/lib/*`의 순수 함수가 콘텐츠 모델을 생성하고, `src/screens/*` 화면에서 카드형 UI로 렌더링한다. 문장은 AI 생성이 아니라 일간/일주/오행/십성/일진/월운 기반 템플릿 조합으로 만든다.

**Tech Stack:** React + TypeScript, 현재 커스텀 stack router(`src/lib/router.tsx`), 기존 사주 계산/상태(`src/lib/saju.ts`, `src/lib/saju-state.tsx`), 기존 UI 컴포넌트(`src/components/ie.tsx`), 리워드 게이트(`src/components/RewardedAdGate.tsx`).

---

## 현재 앱 구조 요약

확인된 주요 파일:

- `src/App.tsx`
  - 화면 import 및 `ScreenId`별 switch 라우팅.
  - `NEEDS_PROFILE`에 프로필 필수 화면 목록 존재.
  - deep link map 존재.
- `src/lib/router.tsx`
  - `ScreenId` union 타입에 화면 ID를 추가해야 신규 화면 접근 가능.
- `src/screens/Home.tsx`
  - 홈 메뉴 배열 `menus`에서 각 콘텐츠 진입점 관리.
  - 현재 메뉴: today, month, year, saju, love, gunghap, money, career, health.
  - 홈 mount 시 `preloadRewardedAdForResult()` 호출 중.
- `src/components/RewardedAdGate.tsx`
  - 리워드 광고 완료 후 결과를 공개하는 게이트.
  - 신규 고가치 콘텐츠는 이 게이트를 재사용하면 됨.
- 기존 콘텐츠 로직:
  - `src/lib/today.ts`
  - `src/lib/month.ts`
  - `src/lib/year.ts`
  - `src/lib/love.ts`
  - `src/lib/money.ts`
  - `src/lib/career.ts`
  - `src/lib/health.ts`
  - `src/lib/gunghap.ts`
  - `src/lib/ilju-pulie.ts`
  - `src/lib/sipsung.ts`
  - `src/lib/sinsal.ts`

## 중요한 방향성

이번 확장은 **AI를 쓰지 않는다.**

구현 방식:

```text
사용자 생년월일/시각
→ 기존 명식 계산 결과(myeongsik)
→ 일간/일주/오행/십성/월지/일진/월운 등 룰 계산
→ 미리 작성된 문장 템플릿 조합
→ 개인화 콘텐츠 화면 출력
```

장점:

- API 비용 없음
- 응답 빠름
- 개인정보 외부 전송 없음
- 토스 미니앱에서 안정적
- 문장 품질/정책 리스크 직접 통제 가능
- 리워드 광고 게이트와 궁합 좋음

---

## 추천 구현 우선순위

### 1순위 — 나의 사주 성격 카드

목적:

- 앱 첫인상 강화
- 저장/공유하고 싶은 결과 제공
- 기존 명식 데이터만으로 바로 구현 가능

콘텐츠 구성:

- 한 줄 정체성
- 나의 매력 포인트
- 사람들이 나를 오해하는 부분
- 내가 편해지는 환경
- 나의 반복 패턴
- 나와 잘 맞는 사람
- 나와 안 맞는 사람
- 오늘 기억할 문장

추천 화면 ID:

- `personality`

추천 파일:

- Create: `src/lib/personality.ts`
- Create: `src/screens/Personality.tsx`
- Modify: `src/lib/router.tsx`
- Modify: `src/App.tsx`
- Modify: `src/screens/Home.tsx`

### 2순위 — 나의 연애 스타일

목적:

- 연애운보다 더 개인화된 상시 콘텐츠
- 궁합과 연결 가능

콘텐츠 구성:

- 나는 사랑할 때 어떤 사람인가
- 내가 끌리는 타입
- 내가 연애에서 반복하는 실수
- 상대가 나에게 서운해하는 지점
- 오래 가는 연애법
- 썸/연락 팁

추천 화면 ID:

- 기존 `love` 화면을 확장하거나 신규 `loveStyle` 추가.
- 빠른 적용은 기존 `src/lib/love.ts`, `src/screens/Love.tsx` 확장 추천.

### 3순위 — 나의 돈 버는 방식

목적:

- 재물운을 더 실용적으로 전환
- 광고 보고 열람할 명분이 강함

콘텐츠 구성:

- 돈 버는 방식
- 돈이 새는 패턴
- 잘 맞는 수입 구조
- 부업 성향
- 투자 성향
- 돈 모으는 팁
- 피해야 할 돈 문제

추천 화면 ID:

- 기존 `money` 화면 확장 추천.

### 4순위 — 오늘의 맞춤 행동 가이드

목적:

- 매일 재방문 유도

콘텐츠 구성:

- 오늘 하면 좋은 행동 3개
- 오늘 피해야 할 행동 3개
- 오늘의 말투/대화 팁
- 오늘의 행운 시간대
- 오늘의 행운 컬러
- 오늘의 조심할 관계
- 오늘의 한 줄 부적 문장

추천 화면 ID:

- 기존 `today` 화면 확장 추천.

### 5순위 — 월간 운세 캘린더

목적:

- 체류시간 증가
- 좋은 날/조심할 날은 사용자가 다시 확인하기 좋음

콘텐츠 구성:

- 이번 달 전체 분위기
- 연애/금전/일/건강 흐름
- 좋은 날 TOP 3
- 조심할 날 TOP 3
- 중요한 결정하기 좋은 날
- 돈 쓰기 좋은/나쁜 날

추천 화면 ID:

- 기존 `month` 화면 확장 추천.

---

## 1차 구현 범위 추천

다른 세션에서 바로 시작한다면 1차는 아래만 구현한다.

```text
1. 나의 사주 성격 카드 신규 화면
2. 홈 메뉴에 성격 카드 추가
3. 리워드 광고 게이트 적용
4. yarn build 검증
```

이유:

- 신규 콘텐츠로 체감 변화가 큼
- 기존 화면을 깨뜨릴 가능성이 낮음
- 기존 명식 데이터만 필요
- AI/API 없이 문장 템플릿으로 충분히 자연스럽게 구현 가능

---

## Task 1: 신규 화면 ID 추가

**Objective:** 라우터가 `personality` 화면을 인식하게 한다.

**Files:**

- Modify: `src/lib/router.tsx`
- Modify: `src/App.tsx`

**Implementation:**

`src/lib/router.tsx`의 `ScreenId` union에 추가:

```ts
  | 'personality'
```

`src/App.tsx`에서:

1. import 추가

```ts
import ScreenPersonality from './screens/Personality';
```

2. `NEEDS_PROFILE`에 추가

```ts
const NEEDS_PROFILE: ScreenId[] = [
  'today',
  'saju',
  'month',
  'year',
  'love',
  'gunghap',
  'money',
  'career',
  'health',
  'personality',
  'profiles',
  'addProfile',
];
```

3. switch case 추가

```tsx
case 'personality':
  return <ScreenPersonality />;
```

4. deep link map 선택 추가

```ts
personality: 'personality',
```

**Verification:**

```bash
yarn build
```

Expected: TypeScript/빌드 오류가 없어야 한다. 단, `ScreenPersonality` 파일을 아직 만들지 않았다면 이 단계만 단독 실행 시 import 오류가 날 수 있으므로 Task 2와 함께 적용해도 된다.

---

## Task 2: 성격 카드 콘텐츠 생성 함수 작성

**Objective:** `myeongsik`을 받아 AI 없이 성격 카드 데이터를 반환하는 순수 함수를 만든다.

**Files:**

- Create: `src/lib/personality.ts`

**Recommended API:**

```ts
export type PersonalityCard = {
  title: string;
  subtitle: string;
  identity: string;
  strengths: string[];
  misunderstood: string[];
  comfortZone: string[];
  patterns: string[];
  goodMatches: string[];
  difficultMatches: string[];
  mantra: string;
};

export function personalityCard(myeongsik: Myeongsik): PersonalityCard;
```

주의:

- `Myeongsik` 타입은 기존 `src/lib/saju.ts` export 상태를 확인해서 import한다.
- 타입명이 다르면 기존 파일(`today.ts`, `money.ts`, `career.ts`)의 import 방식을 따른다.

**Logic Draft:**

- `myeongsik.ilgan.c` 또는 유사 필드로 일간 확인.
- `myeongsik.ilgan.ohaeng`으로 주 오행 확인.
- `myeongsik.pillars[2]`로 일주 확인 가능하면 일주 키워드 사용.
- `myeongsik.ohaeng` 카운트로 과다/부족 오행 보정 문장 추가.

문장 톤:

- 한국어
- 따뜻하지만 너무 뜬구름 잡지 않기
- “당신은 ~한 사람이에요” 식으로 개인화
- 기술 메타/알고리즘 설명은 화면에 노출하지 않기

**Starter Content Example:**

```ts
const ILGAN_COPY = {
  甲: {
    identity: '크게 자라는 나무처럼, 방향이 잡히면 오래 밀고 가는 사람이에요.',
    strengths: ['시작을 만들어내는 힘', '솔직한 추진력', '사람을 이끄는 큰 그림'],
    misunderstood: ['고집이 세 보이지만 사실은 기준을 지키는 중이에요.'],
  },
  乙: {
    identity: '부드러운 풀처럼, 상황에 맞춰 살아남는 감각이 좋은 사람이에요.',
    strengths: ['유연함', '관계 감각', '섬세한 조율력'],
    misunderstood: ['맞춰주는 것처럼 보여도 안쪽의 취향은 꽤 분명해요.'],
  },
  // 丙 丁 戊 己 庚 辛 壬 癸도 채우기
} as const;
```

**Verification:**

```bash
yarn build
```

Expected: 타입 오류 없음.

---

## Task 3: 성격 카드 화면 작성

**Objective:** 리워드 광고를 본 뒤 성격 카드를 카드형 UI로 보여준다.

**Files:**

- Create: `src/screens/Personality.tsx`

**Implementation Notes:**

- 기존 화면 스타일을 재사용한다.
- `useRouter()`로 뒤로가기 제공.
- `useSaju()`에서 `profile`, `myeongsik` 가져오기.
- `RewardedAdGate`로 잠금 처리.
- 광고 보상 완료 후 결과 공개.

**Skeleton:**

```tsx
import { useMemo, useState } from 'react';
import { Header, MoodOrb, Reveal, IECard } from '../components/ie'; // 실제 export 이름 확인 필요
import { RewardedAdGate } from '../components/RewardedAdGate';
import { useRouter } from '../lib/router';
import { useSaju } from '../lib/saju-state';
import { personalityCard } from '../lib/personality';

export default function ScreenPersonality() {
  const { back } = useRouter();
  const { profile, myeongsik } = useSaju();
  const [unlocked, setUnlocked] = useState(false);

  const card = useMemo(
    () => (myeongsik ? personalityCard(myeongsik) : null),
    [myeongsik],
  );

  if (!myeongsik || !card) return null;

  if (!unlocked) {
    return (
      <RewardedAdGate
        title="나의 사주 성격 카드"
        description="광고를 보면 내 성향·매력·관계 패턴을 카드로 열어드릴게요."
        onCancel={back}
        onUnlocked={() => setUnlocked(true)}
      />
    );
  }

  return (
    <div className="ie-screen" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 기존 화면들의 Header 사용 패턴을 보고 맞춰 구현 */}
    </div>
  );
}
```

주의:

- `components/ie.tsx`의 실제 export 이름을 확인하고 맞춰야 한다. 현재 Home에서는 `IECopy`, `IELogo`, `MoodOrb`, `Reveal`, `Sparkle`를 사용 중이다.
- `Saju.tsx`, `Money.tsx`, `Career.tsx`의 화면 패턴을 참고해 일관된 디자인으로 작성한다.

**Verification:**

```bash
yarn build
```

Expected: 빌드 성공.

---

## Task 4: 홈 메뉴에 성격 카드 추가

**Objective:** 사용자가 홈에서 성격 카드로 진입할 수 있게 한다.

**Files:**

- Modify: `src/screens/Home.tsx`

**Implementation:**

`menus` 배열에 항목 추가. 추천 위치는 `내 사주 명식` 바로 다음 또는 `오늘의 운세` 다음.

```ts
{
  id: 'personality',
  icon: '🪞',
  title: '성격 카드',
  sub: '나의 매력·관계 패턴',
  color: '#9D7BFF',
},
```

**Verification:**

```bash
yarn build
```

Expected: `ScreenId` 타입 오류 없이 빌드 성공.

---

## Task 5: 문장 품질 보강

**Objective:** 최소한의 룰 기반 개인화 품질을 확보한다.

**Files:**

- Modify: `src/lib/personality.ts`

**Minimum Content Requirements:**

10천간 전부 작성:

- 甲
- 乙
- 丙
- 丁
- 戊
- 己
- 庚
- 辛
- 壬
- 癸

5오행 보정 문장 작성:

- wood
- fire
- earth
- metal
- water

오행 과다/부족 처리:

- 가장 많은 오행 1개 기반 강점 문장
- 0개인 오행이 있으면 보완 문장
- 0개가 없으면 균형 문장

**Tone Examples:**

좋은 문장:

```text
겉으로는 담담해 보여도 안쪽에는 기준이 분명한 사람이에요.
관계에서는 말보다 태도와 반복되는 행동을 더 믿는 편이에요.
```

피해야 할 문장:

```text
당신은 무조건 성공합니다.
이 사주는 돈복이 강해서 투자하면 됩니다.
알고리즘상 금 기운이 3개라서...
```

---

## Task 6: 최종 검증

**Objective:** 다음 세션이 실제 완성 여부를 확인한다.

**Commands:**

```bash
yarn build
```

Expected:

- Rsbuild 성공
- `.ait` artifact 생성 성공
- TypeScript 오류 없음

추가 확인:

```bash
git diff -- src/lib/router.tsx src/App.tsx src/screens/Home.tsx src/lib/personality.ts src/screens/Personality.tsx
```

Expected:

- 신규 화면/로직/홈 메뉴만 변경되어 있어야 함.
- 광고 로직, 인증, 결제, 기존 사주 계산 로직을 불필요하게 건드리지 않아야 함.

---

## 후속 확장 후보

성격 카드 완료 후 이어서 붙일 콘텐츠:

1. `src/lib/love.ts`, `src/screens/Love.tsx` 확장
   - 연애 스타일
   - 끌리는 타입
   - 반복 실수
   - 오래 가는 연애법

2. `src/lib/money.ts`, `src/screens/Money.tsx` 확장
   - 돈 버는 방식
   - 돈 새는 패턴
   - 부업/투자 성향

3. `src/lib/today.ts`, `src/screens/Today.tsx` 확장
   - 오늘의 행동 가이드
   - 행운 시간대/컬러/대화 팁

4. `src/lib/month.ts`, `src/screens/Month.tsx` 확장
   - 월간 캘린더형 좋은 날/주의일

---

## Acceptance Criteria

1차 완료 기준:

- [ ] 홈에 `성격 카드` 메뉴가 보인다.
- [ ] 메뉴 클릭 시 리워드 광고 게이트가 뜬다.
- [ ] 광고 보상 완료 후 성격 카드 결과가 열린다.
- [ ] 결과는 AI/API 호출 없이 `myeongsik` 기반 룰/템플릿으로 생성된다.
- [ ] 프로필 없이는 기존 `NoProfileGuard`가 동작한다.
- [ ] `yarn build` 성공.
- [ ] 기존 today/saju/month/year/love/gunghap/money/career/health 화면 진입 타입이 깨지지 않는다.

---

## Notes for Next Session

- 사용자는 한국어 UI/설명을 선호한다.
- 사용자는 “AI 없이도 되는 콘텐츠인지”를 확인했고, 이번 확장은 **룰 기반 로컬 콘텐츠**로 진행하는 것이 의도다.
- 사용자는 최소 기능보다 “제대로 기능 붙인 상태”를 선호하지만, 이번 1차는 성격 카드 하나를 완성도 있게 붙이는 것이 가장 효율적이다.
- 기존 리워드 광고 게이트는 최근 수정되어 preload/show 구조가 반영되어 있다.
- 구현 전 사용자가 “계속/진행”처럼 명시 승인하길 선호한다는 점을 기억하라.

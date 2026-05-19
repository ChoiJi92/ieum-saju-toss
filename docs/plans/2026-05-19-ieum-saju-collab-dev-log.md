# 이음사주 협업 개발 로그 (Hermes + Claude)

## 목적
- 다른 세션/다른 에이전트(Claude 포함)에서도 같은 맥락으로 즉시 이어서 실행 가능하도록
  결정사항, 리스크, 실행순서, QA를 누적 기록한다.

## 오늘 읽은 기준 문서
- `docs/plans/2026-05-19-ieum-saju-ad-freepass-no-db-metrics.md`

## 오늘 합의된 방향 (요약)
1. 광고 1회 보상 완료 시 5분 프리패스 유지
2. DB 없이 localStorage + 앱인토스 콘솔 지표로 1차 운영
3. 기존 보상 조건 유지: `userEarnedReward`일 때만 unlock/프리패스 발급

## Claude 리뷰 결과 반영 포인트 (핵심)
### 강점
- 범위 작고 빠르게 배포 가능
- 보상 조건 유지로 정책 리스크 낮음
- v1 storage key로 마이그레이션 여지 확보

### 우선 보완해야 할 리스크 TOP5
1. 게이트 플래시 방지 필요
   - `useState(() => hasActiveAdPass())`로 초기 동기 판단
2. localStorage 예외 처리 필요
   - `setItem/getItem` try-catch 필수
3. 향후 화이트리스트 분기 포인트 필요
   - `RewardedAdGate`에 `passEligible?: boolean`(default true) 시그니처 선반영
4. 유저 체감 부족
   - 보상 완료 직후 "5분 프리패스" 토스트 1회 노출
5. 통계 이벤트 정의 명확화
   - `gateAttempt`, `adShown`, `adConfirmClick`, `adRewarded`, `freepassGranted`, `freepassUsed`, `contentUnlocked`

## 구현 권장 순서 (확정안)
1. `src/lib/ad-pass.ts` 생성 (5분 프리패스 + 예외처리)
2. `src/lib/local-stats.ts` 생성 (로컬 카운터 + 예외처리)
3. `src/components/RewardedAdGate.tsx` 반영
   - 우선순위: dev bypass > freepass > ad
   - lazy init으로 깜빡임 제거
   - rewarded 시 pass 발급 + 토스트
   - `passEligible` prop 추가
4. `src/App.tsx`에서 appOpen 1회 track
5. `src/screens/Settings.tsx`에 로컬 통계 디버그(이 기기 기준) + 초기화
6. `yarn build` 검증
7. 수동 QA 체크리스트 수행

## 최소 QA 체크리스트
- 프리패스 없을 때: 게이트 노출
- 보상 완료 후: 다른 상세 탭 5분 내 즉시 오픈(플래시 없음)
- 5분 만료 후: 다시 게이트 노출
- dismissed/failed/unsupported/not_configured: 프리패스 미발급
- 새로고침 후: 프리패스 유지
- storage 예외 발생 시: 크래시 없이 fallback
- `yarn build` 성공

## 운영 지표 기준
- 앱인토스 콘솔: 노출 수 / eCPM / 예상 수익
- 비교창: 배포 전 3일 평균 vs 배포 후 3~7일 평균
- 로컬 통계는 QA/개발 디버그용(전체 유저 지표 아님)

## 다음 세션 실행 프롬프트(복붙용)
```text
이 파일 먼저 읽고 그대로 이어서 진행:
docs/plans/2026-05-19-ieum-saju-collab-dev-log.md

그리고 원본 계획 문서:
docs/plans/2026-05-19-ieum-saju-ad-freepass-no-db-metrics.md

규칙:
- userEarnedReward일 때만 unlock/pass 발급
- 각 단계 후 yarn build
- 변경사항/리스크/테스트결과를 이 로그 파일에 계속 append
```

---

## Change Log
### 2026-05-19
- 원본 plan 읽고 Claude 리뷰 병행 완료
- 구현 전 보완 포인트(무플리커/예외처리/토스트/passEligible/이벤트정의) 확정
- cmux 실시간 협업(surface:1 Claude ↔ surface:7 Hermes)으로 최종 체크리스트 재검증 완료
- Claude P0 확정:
  1) unlocked lazy init으로 플래시 제거
  2) 프리패스 활성 시 preload/SDK 호출 스킵
  3) localStorage 전 구간 try/catch fallback
  4) 이벤트 명세 단일화(adWatchClick vs adConfirmClick 충돌 제거)
  5) 우선순위 고정(dev bypass > freepass > ad)
- Claude P1 확정:
  1) passEligible prop 선반영
  2) 보상 직후 5분 프리패스 토스트
  3) 홈 남은시간 배지 interval/visibility 보강
  4) Settings 초기화 시 프리패스 키도 함께 삭제
  5) appOpen 중복 카운트 방지 가드
- Claude 권장 구현 순서 확정:
  `src/lib/ad-pass.ts -> src/lib/local-stats.ts -> src/components/RewardedAdGate.tsx -> src/App.tsx -> src/screens/Home.tsx -> src/screens/Settings.tsx -> yarn build`
- QA 10항목도 동일 문서 기준으로 고정(보상 조건, 5분 만료, 예외 fallback, 빌드/산출물 검증 포함)

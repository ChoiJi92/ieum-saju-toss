# 이음사주 토스 미니앱 — 다음 작업 인수인계

작성일: 2026-05-17
작성자: Claude 세션 (사용자 의뢰)
목적: 다른 세션에서 이어서 작업할 수 있도록 컨텍스트·결정사항·다음 작업 정리

---

## 0. 한 줄 요약

PDF 사주 본업 매출 부진 → **토스 미니앱이 메인 BM으로 격상**. 단, 미니앱은 가벼운 결제 환경이라 ₩9,900 같은 단가 어려움. **무료 콘텐츠 두껍게 + 광고 노출 늘리기 + ₩990~₩1,990 저단가 IAP 후행**이 현실적 전략. 작업 1순위는 **광고 없는 entry hook 콘텐츠 (띠별 오늘) + Share 화면 부활**.

---

## 1. 컨텍스트 (왜 이 작업)

- 2026-05-17 사용자 발화: "PDF 본업이 잘 안 돼서 앱에 더 시간 쏟고 있다"
- PDF 사주 리포트 (₩10,000 기본 / ₩20,000 프리미엄) 판매 부진
  - Threads 정지(2026-05-05)·새 계정 보수적 운영 등 마케팅 채널 위축 영향
- 미니앱 = 결제 마찰 적고 토스 트래픽 자체로 유입 → 매출 영향 더 빠름
- 사용자가 직접 한 결정 (2026-05-17): "우선 무료 콘텐츠를 좀 늘리자"

---

## 2. 현재 미니앱 상태 (2026-05-17 코드 검증 결과)

### 프로젝트 경로
`/Users/choijihoon/ieum-saju-toss/`

### BM 현황
- **리워드 광고 단일 모델** (`src/lib/ads.ts`)
  - 결과 공개를 광고 시청(`userEarnedReward`)에 묶음
  - 광고 ID는 아직 `TEST_AD_GROUP` (사업자등록·콘솔 발급 대기)
- **인앱결제(IAP) 미도입** — 결제 코드 일체 없음

### 인증·백엔드
- 토스 OAuth 로그인 + `TossConfirm` 화면 구현 완료 (Client ID 발급 전이라 mock fallback)
- Vercel Serverless 백엔드 (`backend/`) = OAuth 토큰 교환만, DB·결제 검증 없음

### 화면 17개 (2026-05-10 메모리 14 → 17)
- 추가: `AddProfile`, `Profiles`, `TossConfirm`, `Legal`
- 제거: `History`, `Share` ← **바이럴 진입 막힘**
- 그 외 유지: Onboarding · Input · Home · Today · Month · Year · Saju · Love · Gunghap · Money · Career · Health · Settings

### 콘텐츠 lib (`src/lib/`)
- 핵심: `saju.ts` · `sipsung.ts` · `today.ts` · `month.ts` · `year.ts` · `love.ts` · `gunghap.ts` · `money.ts` · `career.ts` · `health.ts`
- 추가: `ilju-pulie.ts` (60갑자 일주 풀이) · `sijin.ts` · `sinsal.ts` (신살 4종) · `daewoon.ts` (대운 + 세운)
- 인프라: `ads.ts` · `toss-auth.ts` · `saju-state.tsx` · `router.tsx`

### ⚠️ Verified 사실 (코드 grep 확인)
- **신살·대운·세운·일주 풀이는 이미 `Saju.tsx`에 모두 노출됨** (line 286·291·296·102)
- 이전 세션 추천 "신살·대운 화면 추가"는 **이미 있어서 작업할 필요 없음**

---

## 3. 시장 데이터 (앱인토스·운세 카테고리)

### 앱인토스 플랫폼 규모
- 누적 1,300개 미니앱, **5,100만 이용자** (2026.02 기준)
- 출시 100일 = 200개 미니앱, 누적 260만 이용자, 1,500만 페이지뷰
- **이용자 평균 체류 6.7분** — 토스 앱 내 평균 대비 높음 (결제 결정 충분히 가능)
- 미니앱 75%가 실제 매출 발생 (전자신문 2026.08)

### 운세 카테고리
- **점신**: 앱인토스에서 예상치 **6배 일간 이용자** — 사주 카테고리 hot
- 점신·포스텔러 모델 = 무료 콘텐츠 풍부 + 결제 부담 X
- Google Play 운세 앱 프리미엄: $3.99 ~ $7.99 (₩4,900 ~ ₩9,900)

### 소규모 팀 수익 사례
- 코심(eSIM): 론칭 첫 주 ₩260만
- 디스팟(할인쿠폰): 첫 달 ₩1,000만

### 결론
- 결제 자체는 일어남 (사용자 우려 절반 맞고 절반 틀림)
- 그러나 **무료 콘텐츠가 얇으면 결제로 가는 funnel 약함** → 무료 hook 먼저

---

## 4. BM 결정 사항

### 단기 (~1개월) — 광고 단일 모델 유지하며 노출 확장
1. 무료 콘텐츠 늘리기 → 광고 노출 ↑ → 광고 매출 ↑
2. Share 화면 부활 → 바이럴 신규 유입
3. 재방문 동력 (일운 푸시) — Apps in Toss SDK 푸시 가능 여부 확인 필요

### 중기 (1~2개월) — IAP 도입 (사업자등록·콘솔 IAP 등록 후)
- 가격대 ₩990 / ₩1,990 (sweet spot)
- ₩4,900 구독은 retention 검증 후 도입
- 토스 인앱결제 정책 verified (`developers-apps-in-toss.toss.im`):
  - 비게임 미니앱 IAP 상품 최대 30개
  - 가격대 ₩400 ~ ₩1,400,000 (10원 단위)
  - 자동 갱신 구독 지원 (주/월/년)
  - 수수료 = 앱마켓 15% + 토스 5% = **총 20%**
  - 결제 API: `createOneTimePurchaseOrder` → `processProductGrant` (30초 안 지급)
  - 별도 환불 API 없음 (사용자가 토스에서 환불 요청 → REFUNDED 상태 조회만)
  - 현금성·환가성·토스 포인트 결합 상품 X

### 장기 (2~3개월 이후) — 차별화·LTV
- AI 사주 챗봇 (LLM 합성 — `saju-writer` 노하우 이식)
- 단가 ₩4,900 무제한 구독 / ₩990 질문당 결제

---

## 5. 단가 가이드라인

❌ 이전 제안(₩9,900 풀 리포트·₩4,900 구독)은 미니앱 환경에 비싸 보임. 폐기.

✅ 수정안 (사용자 직관 반영 + 시장 데이터)
- 무료(광고 없음): 띠별 오늘 / 명식표·한 페이지 요약
- 무료(광고 시청 1회): 오늘·이달·올해·연애·재물·직업·건강·궁합 등 모든 기존 콘텐츠
- ₩990: 일간 깊이 풀이 / 오늘 풀버전 노광고
- ₩1,990: 궁합 PDF / 이름 풀이 / 택일 / 2026 한해 요약
- ₩2,990 ~ ₩3,900 (실험): 풀 리포트 미니버전 / 가족 3인 묶음
- ₩4,900/월 구독 (1~2개월 retention 모인 후): 광고 제거 + 챗봇 + 무제한

---

## 6. 무료 콘텐츠 추가 계획 (사용자 결정 방향)

### 이미 노출돼 있어 추가 작업 X
- 명식표·일주 풀이·신살(4종)·대운·세운 — `Saju.tsx`
- 오늘·이달·올해 운세 — `Today/Month/Year`
- 연애·재물·직업·건강·궁합 — `Love/Money/Career/Health/Gunghap`

### 🆕 새로 추가해야 할 무료 콘텐츠 (진짜 빈자리)

| 우선순위 | 컨텐츠 | lib 필요 | 화면 필요 | 광고 방식 | 추정 작업량 |
|--|--|--|--|--|--|
| **P0** | 띠별 오늘 (12지 카드, 가입 X entry) | 신규 `zodiac.ts` | 신규 `Zodiac.tsx` | 광고 없음 (entry hook) | 1일 |
| **P0** | Share 화면 부활 (행운/결과 카드 공유) | 신규 `share-card.ts` (이미지 렌더) | 신규 `Share.tsx` | 광고 시청 후 카드 unlock | 1~2일 |
| **P1** | 이름 풀이 | 신규 `name-pulie.ts` | 신규 `Name.tsx` | 광고 1회 unlock | 2일 |
| **P1** | 택일 (결혼·이사·개업) | 신규 `taekil.ts` | 신규 `Taekil.tsx` | 광고 1회 unlock | 2~3일 |
| **P2** | 가족 사주 비교 (Profiles 활용 깊이) | `gunghap.ts` 확장 | `Profiles.tsx` 보강 | 광고 1회 unlock | 1~2일 |
| **P2** | 일운 푸시 알림 | Apps in Toss SDK 푸시 검토 | — | 알림 → 진입 → 광고 | 1일 + 검증 |

### 🎯 1순위 추천: P0 두 개
- **띠별 오늘** → 광고 없는 entry hook, 가입 안 한 사람 진입로 (점신 모델 핵심)
- **Share 부활** → 결과 카드 공유 = 친구 초대 트리거 (이전 세션에서 제거된 것 부활)

이 두 개 합쳐서 2~3일이면 끝남. 효과는 신규 유입·바이럴 둘 다.

---

## 7. 작업 우선순위 (P0 → P3)

### P0 (이번 주, 무료 콘텐츠·바이럴 확장)
1. **띠별 오늘 화면** — 광고 없는 entry hook
2. **Share 화면 부활** — 결과 카드 공유, 바이럴
3. **Home/Onboarding에 띠별 오늘 진입로 노출**

### P1 (다음 주, 콘텐츠 추가로 광고 노출 ↑)
4. **이름 풀이** (광고 시청 후 unlock)
5. **택일** (광고 시청 후 unlock)

### P2 (2~3주차)
6. **가족 사주 비교** 화면 보강 (Profiles 활용)
7. **일운 푸시** (Apps in Toss SDK 푸시 가능 여부 검토 후)

### P3 (1개월차, IAP 도입)
8. **백엔드 IAP 연동** — `backend/api/iap/` 신설
   - 주문 발급·검증·DB (Vercel Postgres / Upstash 가벼운 거)
   - `createOneTimePurchaseOrder` → `processProductGrant` 콜백 30초 처리
   - 서버 검증: 주문 상태 조회 API
9. **상품 설계 (콘솔 등록)** — 30개 안에서 ₩990·₩1,990 라인업
10. **첫 IAP 콘텐츠 출시** — 풀 리포트 미니버전 ₩2,990 (PDF 자산 활용)

### P4 (2~3개월차)
11. **AI 사주 챗봇** — LLM 합성, ₩4,900/월 구독 또는 ₩990/질문
12. **광고 제거 구독** — ₩4,900/월

---

## 8. 첫 작업 (다음 세션 즉시 시작 가능)

### 작업명: 띠별 오늘 + Share 화면 부활 (P0 묶음)

#### 8.1. 띠별 오늘 화면
- 신규 lib: `src/lib/zodiac.ts`
  - 12지 → 출생연도 기준 매핑 (자축인묘진사오미신유술해)
  - 12지별 오늘 한 줄 운세 (룰베이스, 일진 기반)
  - 12지 이모지 매핑 (`feedback_saju_zodiac_emoji_standard` 메모리 참조: 🐭🐮🐯🐰🐲🐍🐴🐑🐵🐔🐶🐷)
- 신규 화면: `src/screens/Zodiac.tsx`
  - 12지 카드 그리드 (3x4 또는 4x3)
  - 각 카드: 이모지 + 한자 + 출생연도 범위 + 오늘 한 줄
  - 광고 없음 (entry hook이라)
  - "내 진짜 사주는?" CTA → Input·TossConfirm 진입
- 라우터 추가: `Zodiac` 스크린, Onboarding/Home에서 진입 가능
- Home 상단에 "오늘의 띠별 운세 보기" 카드 노출

#### 8.2. Share 화면 부활
- 신규 lib: `src/lib/share-card.ts`
  - 결과 카드 이미지 생성 (Canvas / SVG / DOM-to-image)
  - 디자인: 친근 존댓말 톤 + 한자 병기 (이음사주 브랜드)
  - 슬로건 "어제와 내일을 이어주는 이음사주" 포함
- 신규 화면: `src/screens/Share.tsx`
  - 광고 시청 후 결과 카드 unlock
  - 토스 친구한테 보내기 / 외부 공유 (Apps in Toss SDK 검토)
  - 추후 1주 무료 체험권 등 인센티브 add 가능
- 진입로: Today·Month·Year 화면 하단에 "친구한테 공유" 버튼

---

## 9. 사용자 미결정 사항 (다음 세션에서 확인 필요)

| 항목 | 상태 | 메모 |
|--|--|--|
| 사업자등록증 발급 | 확인 안 됨 | `project_toss_miniapp_mvp` 메모리에서 발급 대기 중. IAP 활성화 전제. |
| 광고 ID 발급 | 안 됨 | TEST_AD_GROUP 상태. 사업자등록 후 콘솔에서 발급. |
| 토스 로그인 Client ID | 안 됨 | 사업자 검토 통과 후 발급. 현재 mock fallback. |
| IAP 도입 시점 | 1~2주 뒤 | 무료 콘텐츠 P0·P1 끝나고 사업자 등록도 끝난 시점에. |
| Apps in Toss SDK 푸시 알림 | 미확인 | 공식 문서 확인 필요. |

---

## 10. 참고 메모리·문서·코드

### 메모리 (`/Users/choijihoon/.claude/projects/-Users-choijihoon/memory/`)
- `project_saju_pivot_2026-05-17.md` ⭐ — BM pivot 결정 (이번 세션)
- `project_toss_miniapp_mvp.md` — 14화면 빌드 완료 상태 (2026-05-10)
- `project_toss_miniapp_brand.md` — 브랜드 통합·친근 존댓말·한자병기
- `feedback_ieumsaju_brand_slogan.md` — "어제와 내일을 이어주는 이음사주"
- `feedback_saju_zodiac_emoji_standard.md` — 12지 이모지 표준
- `feedback_saju_pricing_actual.md` — PDF 실판매가 (참고)

### 공식 문서
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [IAP 콘솔 가이드](https://developers-apps-in-toss.toss.im/iap/console.html)
- [IAP API 레퍼런스](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EC%9D%B8%EC%95%B1%20%EA%B2%B0%EC%A0%9C/IAP.html)
- [토스피드 앱인토스 100일 200개](https://toss.im/tossfeed/article/41463)
- [전자신문 앱인토스 수익 기여](https://www.etnews.com/20250808000079)

### 코드 진입점
- `src/screens/Home.tsx` (1~199 line) — 띠별 오늘 카드 진입로 추가 위치
- `src/screens/Saju.tsx` (286~296 line) — 신살·대운·세운 이미 노출됨 (작업 X)
- `src/lib/ads.ts` — 광고 SDK wrapper (`showAdMobInterstitialAd`, `preloadRewardedAdForResult`)
- `src/lib/router.tsx` — 스크린 ID 추가 위치
- `backend/api/toss/` — IAP API 추가할 디렉토리 (P3)

---

## 11. 다음 세션 진입 가이드

1. 이 파일 (`NEXT_STEPS.md`) 먼저 읽기
2. `project_saju_pivot_2026-05-17.md` 메모리 확인
3. 사용자에게 "P0 작업 시작할까요?" 또는 "다른 우선순위 있나요?" 확인
4. P0 시작 결정 시:
   - 띠별 오늘 → `zodiac.ts` lib 작성 + `Zodiac.tsx` 화면 + 라우터 연결
   - Share 부활 → `share-card.ts` + `Share.tsx` + 공유 버튼 진입로
5. 작업 전에 **반드시 코드 grep으로 verify** (이번 세션 같은 outdated 메모리 사고 방지)

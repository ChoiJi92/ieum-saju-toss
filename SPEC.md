# 이음사주 토스 미니앱 — SPEC

> **상태:** 2026-05-10 Phase A~C 완료 (11 화면 + 광고 SDK 통합) · Phase D 진행 중
> **출처:** `~/Desktop/토스사주미니앱_기획.md` + 시장 재분석(찐사주 발견) + Claude Design 프로토타입 (`~/Downloads/ieumsaju/`)
> **본업 관계:** 이음사주 통합 브랜드. 채널별 톤·가격·디자인 변주 (카카오/카카오뱅크 모델).
> **수익 모델:** ⚡ **광고 (AdMob 인터스티셜)** — ₩990/구슬/페이월 X (2026-05-10 변경)

---

## 0. 한 줄 요약

토스 사주 미니앱 시장은 묘한명리·제로사주·명리담·**찐사주** 4진영. 모두 다크 톤 + ₩990 단가. 우리 빈자리 = **밝은 Cloud Pastel + 친근 존댓말 + 한자병기 정확** + 본업 PDF funnel 자연 동선. 5~6주 MVP, 운영비 월 ₩8~15만, 마진 월 ₩70~165만 추정.

---

## 1. 시장 분석 — 4진영

| 앱 | 컬러 | 모델 | 강점 | 약점 |
|---|---|---|---|---|
| 묘한명리 | 일반 | 광고 unlock | 무료 | 일률 콘텐츠 |
| 제로사주 | 다크 사이키 보라 | ₩990 freemium | 정본 10챕터 | 단발성 결제 |
| 명리담 | 노랑+점수 | 광고 30초 데일리 | 명리 정통 | 광고 피로 |
| **찐사주** ⭐ | 다크 보라+핑크 | ₩990 + 구슬 묶음 | AI 채팅·양자택일·반려동물·전생 스토리·매운맛 듀얼 톤 | 토스 안 자체 완결 |

**찐사주 핵심 발견** (2026-05-09 오전):
- ₩990 = 평생사주 8챕터 (사주구조·성격·재물·연애·직업·건강·대운·인생매뉴얼) + 매운맛 ₩990 추가
- 구슬 5/10/30 묶음 할인 (13/15/21%) + 1년 유효기간 = 락인
- 데일리 운세 무료인데도 ~1000자 깊이 (한자병기·정재·편재·관성 친절 풀이)
- 톤 4종 mix: 데일리 따뜻 / 무물보 친구 반말 / 평생 LLM 비유 / 매운맛 다크
- 반려동물 궁합 8유형 + 전생 스토리텔링 ("고려시대 설원 위 길 잃은 검은 개...")

---

## 2. 우리 차별축 (찐사주 못 한 자리)

1. **밝은 Cloud Pastel 컬러** — 4진영 다 다크. 시장 빈자리.
2. **본업 PDF funnel** — 토스 ₩990 → 만족 → 카톡 PDF 1만/2만 송출. 찐사주 못 함.
3. **정본 한자 풀이 정확성** — 본업 5천 PDF 의뢰 노하우. 찐사주 LLM 티 부드럽게 부르지만 정확성·깊이는 우리.
4. **신뢰 카피** — Threads @ieum.saju + 카톡 채널 + PDF 후기 = 시장 신뢰.

❌ **토스 자산 연동 안 함** — 처음엔 시그니처 차별축 후보였으나 사용자 결정으로 제외 (2026-05-09).

---

## 3. 브랜드 — 이음사주 통합

| 채널 | 가격 | 컬러·톤 | 깊이 |
|---|---|---|---|
| 카톡·당근 | ₩1만/2만 | 골드 #D4AF37 + 다크, 정본 존댓말 | 12~30챕터 |
| Threads @ieum.saju | 무료 | (텍스트), 반말 짧은 인사이트 | 한 줄 |
| **토스 미니앱** | **₩990 + 묶음** | **Cloud Pastel 라벤더+피치, 친근 존댓말 + 한자병기** | 8~10 카테고리 |

**공통 자산:**
- 슬로건: "어제와 내일을 이어주는 이음사주"
- 시그니처 키워드: "**결**" (카피·CTA·공유 카드의 앵커)
- 한자병기 정확성

⚠️ **카피 톤 정리 필요**: Claude Design 시안 ③ "오늘은 직진이야 ☁️" 반말 섞임. 일관 친근 존댓말 vs 카드별 시적 한 줄 반말 허용 — 향후 카피 가이드 결정.

---

## 4. Cloud Pastel 디자인 시스템

토큰: `src/index.css` 본체 (`~/Downloads/e-tokens.css` 원본 기반).

### 컬러
- **Brand**: 라벤더 `#9D7BFF` (primary) / 피치 `#FF8B6C` / 민트 `#3DC795` / 로즈 `#F495C9`
- **오방색**: 木 민트 / 火 피치 / 土 버터 #FFC857 / 金 라벤더소프트 #C9B6F0 / 水 블루 #5B8DEF
- **배경**: `#FAF6FB` 옅은 라벤더 (밝은 톤)
- **텍스트**: `#2A2333` 다크 보라 4단계
- **CTA**: 라벤더→피치 그라디언트 + pop 섀도우 (시그니처)

### 타이포
- **Pretendard Variable** 단일 (한자도 같은 폰트)
- display 56 / hero 32 / title-1 28 / title-2 22 / body-l 16 / body-m 14 / caption 11

### 모서리·섀도우
- sm 14 / md 18 / lg 24 / xl 32 / pill 999
- 라벤더 톤 섀도우 (`rgba(157,123,255,…)`)

---

## 5. MVP 화면 (11개, 광고 모델)

| # | 화면 | 광고 | 상태 |
|---|---|---|---|
| 01 | Onboarding (MoodOrb + 시작하기) | ❌ | ✅ Phase A |
| 02 | Input (이름·생년월일·양력음력·윤달·시진 12지·성별) | ❌ | ✅ Phase B |
| 03 | Home (히어로 + 점수 칩 + 메뉴 5개) | ❌ | ✅ Phase A |
| 04 | Today (5섹션 점수+풀이) | ✅ | ✅ Phase B |
| 05 | Share (1:1 / 9:16 카드) | ❌ | ✅ Phase B |
| 06 | Saju (4기둥 명식 + 오행 분포) | ✅ | ✅ Phase C |
| 07 | Year 신년운세 (월별 막대) | ✅ | ✅ Phase C |
| 08 | Gunghap (입력→광고→결과) | ✅ | ✅ Phase C |
| 09 | Money 재물운 (76점 + 주간 흐름) | ✅ | ✅ Phase C |
| 10 | History (이전 풀이 모음) | ❌ | ✅ Phase C |
| 11 | Settings | ❌ | ✅ Phase C |
| ~~12~~ | ~~Paywall~~ | - | ❌ 광고 모델로 제거 |

**Phase D (진행 중):** 백엔드 사주 계산 wrapping(`~/saju-report` Python sxtwl 엔진 → FastAPI) + 광고 그룹 ID 콘솔 발급 + 운영 호스팅.

---

## 6. 수익 모델 — 광고 (2026-05-10 변경)

- **AdMob 인터스티셜** (`@apps-in-toss/web-bridge` API)
  - `loadAdMobInterstitialAd` / `showAdMobInterstitialAd`
  - 광고 그룹 ID = `VITE_AD_GROUP_ID` (env), 콘솔 → 미니앱 → 광고 발급
- **노출 시점**: 운세 결과 진입 시 (Today / Saju / Year / Gunghap-result / Money)
- **광고 wrapper**: `src/lib/ads.ts` → `showInterstitialThen(onClose)` + 8초 fallback
- **사업자등록**: 광고 수익 정산받으려면 필수 (간이/일반 과세). 부가세 면세 사업자 X. 출시 직전 등록.

### Phase 2 가능성 (보류)
- ₩990 단건 + 구슬 묶음 (찐사주 모델) — 광고 모델 검증 후 추가 검토
- PDF funnel (카톡 채널 → 본업 ₩1만/2만 정본) — 자연 동선 유도 가능

---

## 8. 기술 스택

### Frontend
- `@apps-in-toss/web-framework` 1.5.2 (Web React, RN 아님)
- React 18 + TypeScript + rsbuild
- `@granite-js/plugin-router` (Phase 1 라우터)
- Pretendard Variable CDN

### Backend (Phase 1)
- 본업 `~/saju-report` Python 사주 엔진 wrapping
- Anthropic Claude Haiku 4.5 + prompt caching (운영비 ₩1~3만/월)

### 호스팅
- 미니앱: 앱인토스 자체 CDN (`*.apps.tossmini.com`)
- 백엔드: Vercel / Railway 무료 티어

---

## 9. 입점 절차 진행 상황

- [x] 콘솔 가입 + 워크스페이스 생성 (2026-05-09)
- [x] 미니앱 등록 1·2단계 — 기본 정보 + 카테고리 (이름 "이음사주" / 운세 / Primary `#9D7BFF`)
- [x] Granite SDK + boilerplate 셋업 (Yarn 4.9.1 / Vite-like rsbuild / @apps-in-toss/web-framework 1.5.2)
- [x] **Phase A** — 폴더 구조 + 공용 컴포넌트(`IE*`·MoodOrb 등) + 라우터 + Onboarding/Home
- [x] **Phase B** — Input·Today·Share + 광고 SDK wrapper (`src/lib/ads.ts`)
- [x] **Phase C** — Saju·Year·Gunghap·Money·History·Settings (광고 모델 적용)
- [ ] **Phase D** — 백엔드 사주 계산 wrapping (FastAPI) + 광고 ID 발급 + 운영 호스팅 ← **현재**
- [ ] 사업자등록 (간이과세자, 출시 직전, 홈택스 1시간)
- [ ] 로고·썸네일·스크린샷 자체 제작
- [ ] 4단계 심사 통과 (운영·디자인·기능·보안)
- [ ] 출시

---

## 10. ❌ 명시적 결정 사항 (반복 금지)

- ❌ Next.js (web-framework가 RN 아닌 Web React + rsbuild)
- ❌ React Native (사주앱 = Web 미니앱 충분)
- ❌ 별도 브랜드 (이음사주 통합)
- ❌ 토스 블루 단독 / 다크+골드 / 보라 다크 (Cloud Pastel 결정)
- ❌ 명조체 폰트 (Pretendard 단일)
- ❌ 토스 자산 연동 (사용자 결정 2026-05-09)
- ❌ ₩9,900 단건 결제 (토스 가격 천장)
- ❌ ₩990 결제 / 구슬 묶음 / 페이월 (Phase 1 광고 모델로 변경 2026-05-10)
- ❌ 카테고리 1개 좁히기 (다양화 — 11화면 구조)
- ❌ 찐사주식 반말 톤 (친근 존댓말 + 한자병기)
- ❌ 토스 그래픽·로고 사용 (가이드 위반)

---

## 11. 출처·메모리

- 어제 분석: `~/Desktop/토스사주미니앱_기획.md`
- 사용자 메모리: `~/.claude/projects/-Users-choijihoon/memory/project_toss_miniapp_brand.md`
- 디자인 산출물: `~/Downloads/E _ _ _.html` + `~/Downloads/e-tokens.css`
- 본업 사주 엔진: `~/saju-report/` (재사용)

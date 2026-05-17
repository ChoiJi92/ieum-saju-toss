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

**Phase D (진행 중):** 사주 계산 클라이언트화(@fullstackfamily/manseryeok, 백엔드 X) + Saju 화면 실 명식 연동 ✅ + Today/Year/Money 동적화 (예정) + 광고 그룹 ID 콘솔 발급.

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
- 간단 stack 라우터 (`src/lib/router.tsx`) — 추후 `@granite-js/plugin-router` 또는 `@use-funnel` 마이그 가능
- Tailwind v4 (`@theme` 블록으로 Cloud Pastel 토큰 매핑)
- Pretendard Variable CDN

### Saju 계산 — ⭐ 클라이언트 (백엔드 X)
- **`@fullstackfamily/manseryeok` 1.0.8** (KASI 한국천문연구원 데이터, 1900~2050)
- 본업 `~/saju-report` sxtwl Python 엔진과 **14건 케이스 4기둥 100% 일치** (2026-05-10)
  - 본업 의뢰자 7건 (양력 4 + 음력 3) ✅
  - 자시 경계 5건 (23:00 / 23:30 / 23:45 / 00:00 / 00:30) ✅
  - 절기 경계 2건 (입춘 직전·직후) ✅
- `src/lib/saju.ts` — `computeMyeongsik(input)` 호출 → 4기둥·오행 분포·일간
- `src/lib/saju-state.tsx` — `SajuProvider` Context + `useSaju` 훅

**핵심 패치 2가지** (sxtwl 정책 일치):
1. **한국 -30분 직접 보정** + manseryeok 자체 보정 OFF (`applyTimeCorrection: false`)
2. **야자시(夜子時) 후처리** — 보정 시각 23:00~24:00 = 자시 + 다음날 일주 기준 시주 천간 (오자둔)

**주의**: 윤달 케이스는 본업 sxtwl이 `--leap` 옵션 미지원이라 비교 불가. manseryeok `lunarToSolar(y, m, d, isLeap)` API로 처리는 가능하나 본업과 정합 검증은 보류.

Phase 2 추가 룰베이스: 12운성·12신살·대운·세운·신강·공망 (만세력 데이터로 자체 계산)

### 호스팅
- 미니앱 빌드: 앱인토스 자체 CDN (`*.apps.tossmini.com`)
- **백엔드: 없음** — 사주 계산 + 광고 SDK 모두 클라이언트. 운영비 ₩0
- LLM 카피 합성(Phase 2)은 별도 검토 — Anthropic Claude Haiku 4.5 + prompt caching 도입 시 ₩1~3만/월

---

## 9. 입점 절차 진행 상황

- [x] 콘솔 가입 + 워크스페이스 생성 (2026-05-09)
- [x] 미니앱 등록 1·2단계 — 기본 정보 + 카테고리 (이름 "이음사주" / 운세 / Primary `#9D7BFF`)
- [x] Granite SDK + boilerplate 셋업 (Yarn 4.9.1 / Vite-like rsbuild / @apps-in-toss/web-framework 1.5.2)
- [x] **Phase A** — 폴더 구조 + 공용 컴포넌트(`IE*`·MoodOrb 등) + 라우터 + Onboarding/Home
- [x] **Phase B** — Input·Today·Share + 광고 SDK wrapper (`src/lib/ads.ts`)
- [x] **Phase C** — Saju·Year·Gunghap·Money·History·Settings (광고 모델 적용)
- [x] **Phase D 1차** — manseryeok 채택 (sxtwl과 7/7 일치) + saju.ts wrapper + SajuProvider + Saju 실 명식 연동 + Home 히어로 fix
- [ ] **Phase D 2차** — Today/Year/Money/Gunghap 실 명식 연동 + LLM 카피 합성(Phase 2) + 광고 ID 발급
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

---

## 12. 출시 체크리스트 (2026-05-10 기준)

### 콘텐츠 / 화면 (Code-side — 완료)
- [x] 14 화면 구현 (Onboarding · Input · Home · Today · Month · Year · Saju · Love · Gunghap · Money · Career · Health · History · Settings · Share)
- [x] 십성 룰베이스 + 명식 시드 변동 (같은 일간 다른 사주 다른 점수)
- [x] 친근 존댓말 톤 통일 (반말·메모체 잔재 제거)
- [x] 행동 가이드 아코디언 (Month·Money·Love·Career·Health 클릭 시 detail 펼침)
- [x] 신살 카드 (천을귀인·도화·역마·화개) 사주 명식에 추가
- [x] Home 점수 칩 동적화 (오늘 fortune 데이터 연결)

### 사용자 작업 (Console / 외부 — 사용자 직접)
- [ ] **사업자등록** — 이음 (SW 업종 → 일반과세, 간이 배제)
- [ ] **앱인토스 콘솔 가입** — `apps-in-toss.toss.im`
- [ ] **AdMob 광고 그룹 ID 발급** → `.env`의 `VITE_AD_GROUP_ID`에 주입
- [ ] **앱 아이콘 600×600 PNG** 자체 제작 (현재 placeholder URL — `granite.config.ts`)
- [ ] **스크린샷 6장** (1080×1920) — Home · Today · Month · Saju · Year · Love
- [ ] **약관·개인정보처리방침** 노션 페이지 사업자명·연락처 최신화
- [ ] **콘솔 미니앱 등록** + 내부 테스트 → 심사 제출
- [ ] **AdMob 결제 정보** 등록 (광고 수익 정산용 계좌)

### 출시 후 (Post-launch)
- [ ] AdMob CPM·노출수 모니터링
- [ ] 사용자 피드백 수집 (카카오 채널·당근·문의 메일)
- [ ] PDF 사주 풀이 cross-sell 전환율 측정
- [ ] 십성 룰베이스 → LLM 합성 업그레이드 (Phase 2, Anthropic Haiku 4.5 + 캐싱)

### 환경 변수 (.env)
```bash
VITE_AD_GROUP_ID=실콘솔발급ID         # 광고 정산
```

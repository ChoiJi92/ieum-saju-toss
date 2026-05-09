# 이음사주 — 토스 미니앱

> **어제와 내일을 이어주는 이음사주**
>
> 본업(이음사주 PDF 1만/2만 정본·카톡 채널·Threads @ieum.saju)과 같은 브랜드.
> 토스 미니앱은 Cloud Pastel 디자인 시스템 + 친근 존댓말 + 한자병기 톤으로 채널 변주.

## 스택

- **`@apps-in-toss/web-framework`** (Web React 미니앱, RN 아님)
- **rsbuild** + React 18 + TypeScript
- **`@granite-js/plugin-router`** — 화면 라우팅 (Phase 1 추가 예정)
- **Pretendard Variable** (CDN)
- 디자인 토큰: `src/index.css` (Cloud Pastel 시스템)

## 명령어

```bash
yarn install         # 첫 셋업 (corepack enable 후 yarn 4.9.1)
yarn dev             # 로컬 개발 (granite dev → rsbuild dev)
yarn build           # 빌드
yarn deploy          # ait deploy (앱인토스 콘솔 업로드)
```

## 폴더 구조

```
ieum-saju-toss/
├── granite.config.ts     # 앱 메타 (displayName / icon / primaryColor)
├── rsbuild.config.ts     # 빌드 설정
├── index.html            # entry html (lang="ko" + Pretendard CDN)
├── src/
│   ├── App.tsx           # 첫 랜딩 화면
│   ├── index.tsx         # ReactDOM 진입
│   ├── index.css         # Cloud Pastel 토큰 + reset
│   └── env.d.ts
├── SPEC.md               # 의사결정 / 디자인 / Phase 정리
└── README.md
```

## 핵심 의사결정 요약

자세한 건 [`SPEC.md`](./SPEC.md) 참고.

- **브랜드**: 본업과 같은 "이음사주" 통합. 채널별 톤만 변주.
- **컬러**: Cloud Pastel 라벤더 `#9D7BFF` + 피치 `#FF8B6C` + 민트 `#3DC795`.
  본업 골드 `#D4AF37`은 토스에선 사용 X.
- **시그니처 키워드**: "결" — 카피·CTA·공유 카드의 앵커 단어.
- **가격**: ₩990 단가 + 구슬 묶음(5/10/30개). 토스 자체 완결, PDF funnel 자연 동선.
- **Phase 1 (5주 MVP)**: 온보딩·명식 로딩·오늘의 운세(무료)·사주팔자 8챕터(₩990)·신년운세(₩990)·공유 카드.
- **Phase 2**: 궁합·무물보·양자택일·재물운(일반)·길일·반려동물 궁합.
- **❌ 토스 자산 연동 안 함** (사용자 결정 2026-05-09).

## 다음 마일스톤

1. `yarn install` + `yarn dev` 동작 확인 (QR로 토스 앱 미리보기)
2. 라우터 셋업 (`@granite-js/plugin-router`) + 화면 5개 분리
3. 온보딩 화면 ① 구현 (생년월일 입력, STEP 진행 바, 양력/음력)
4. 명식 로딩 화면 ② (戊 한자 원 + 그라데이션 링)
5. 사주 계산 백엔드 wrapping (본업 saju-report Python 엔진 재사용)

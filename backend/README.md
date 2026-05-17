# 이음사주 백엔드 (Vercel Serverless)

토스 로그인 OAuth2 token exchange + user info fetch 전용 백엔드.
무료 티어 내에서 동작 (월 100GB 대역폭, 100시간 실행).

## 구조

```
backend/
├── api/toss/exchange.ts   # POST /api/toss/exchange
├── package.json
├── tsconfig.json
├── vercel.json
├── .env.example
└── README.md
```

## API

### `POST /api/toss/exchange`

**Request**
```json
{
  "authorizationCode": "abc123...",
  "referrer": "DEFAULT"
}
```

**Response 200**
```json
{
  "ci": "...",
  "name": "최지훈",
  "birthDate": "1992-05-13",
  "gender": "male",
  "phoneNumber": "010-1234-5678",
  "email": "..."
}
```

**Error codes**
- `400 MISSING_AUTHORIZATION_CODE`
- `405 METHOD_NOT_ALLOWED`
- `500 TOSS_OAUTH_NOT_CONFIGURED` — 환경변수 미설정
- `502 TOKEN_EXCHANGE_FAILED` — 토스 token endpoint 실패
- `502 USERINFO_FAILED` — 토스 user info endpoint 실패
- `502 INCOMPLETE_USER_INFO` — 필수 필드 누락

## 배포 (Vercel)

### 1. CLI 설치
```bash
npm install -g vercel
```

### 2. 첫 배포
```bash
cd backend
vercel
```
프롬프트에 답:
- Set up and deploy → Y
- Scope → 본인 계정
- Link to existing project? → N
- Project name → `ieum-saju-api` (또는 원하는 이름)
- In which directory is your code? → `./`
- Want to override the settings? → N

배포 완료 후 도메인 발급: `https://ieum-saju-api.vercel.app`

### 3. 환경변수 등록
Vercel 대시보드 → 프로젝트 → Settings → Environment Variables:

| Key | Value | Environment |
|---|---|---|
| `TOSS_CLIENT_ID` | cert.support@toss.im 발급값 | Production |
| `TOSS_CLIENT_SECRET` | cert.support@toss.im 발급값 | Production |
| `ALLOWED_ORIGIN` | 토스 미니앱 도메인 | Production |

발급 메일에 다른 URL 안내되면 `TOSS_TOKEN_URL`, `TOSS_USERINFO_URL`도 추가.

### 4. 클라이언트 연결
이음사주 미니앱 `.env`에:
```
VITE_TOSS_AUTH_API=https://ieum-saju-api.vercel.app/api/toss
```

재배포 시 토스 로그인 자동 활성화 (`lib/toss-auth.ts` 의 mock fallback 자동 disable).

### 5. 운영 배포
```bash
vercel --prod
```

## 로컬 테스트

```bash
cp .env.example .env.local
# .env.local에 TOSS_CLIENT_ID, TOSS_CLIENT_SECRET 채우기
vercel dev
# http://localhost:3000/api/toss/exchange
```

## 모니터링

- Vercel 대시보드 → Functions → Logs (실시간 로그)
- 호출 횟수·에러율 자동 추적

## 비용

| 항목 | 무료 한도 | 우리 예상 사용량 |
|---|---|---|
| Function 실행 | 100시간/월 | < 1시간 (호출 1회 ~100ms) |
| 대역폭 | 100GB/월 | < 1GB |
| 함수 호출 | 100K/월 (Hobby) | < 10K |

예상 매월 비용: **₩0**

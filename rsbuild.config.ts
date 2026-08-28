import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// loadEnv 는 .env 파일을 읽으면서 process.env 까지 덮어쓴다.
// 그래서 호출하기 전에 "빌드를 띄운 쪽이 명시적으로 넘긴 값"을 먼저 떠둬야 한다.
const injected = { ...process.env };

// .env(.local) 의 VITE_* / PUBLIC_* 변수를 번들에 inject — import.meta.env 로 접근.
const { publicVars } = loadEnv({ prefixes: ['VITE_', 'PUBLIC_'] });

// 위 스냅샷을 마지막에 덮어씌운다.
// 이걸 안 하면 build:prod 로 .env.prod 를 넘겨도 로컬 .env 값이 그대로 번들에 박힌다.
// 실제로 개발용 VITE_REPORT_MOCK_ORDER 가 운영 번들에 섞여 들어간 적이 있다
// (그 값이 있으면 결제를 건너뛰고 리포트가 나간다).
// 명시적으로 넘어온 환경변수를 항상 마지막에 덮어써서 그 사고를 막는다.
const define: Record<string, string> = { ...publicVars };
for (const [key, value] of Object.entries(injected)) {
  if (/^(VITE_|PUBLIC_)/.test(key)) define[`import.meta.env.${key}`] = JSON.stringify(value ?? '');
}

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: process.env.APP_TARGET === 'ja' ? './index.ja.html' : './index.html',
  },
  source: {
    // APP_TARGET=ja → 일본어 웹판 단독 빌드 (Vercel 배포용). 기본은 토스 미니앱.
    entry: {
      index: process.env.APP_TARGET === 'ja' ? './src/ja.tsx' : './src/index.tsx',
    },
    define,
  },
});

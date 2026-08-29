import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import aitDevtools from '@apps-in-toss/devtools/unplugin';

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
  // 앱인토스 SDK 를 mock 으로 바꿔 일반 브라우저에서 결제·광고까지 돌려본다.
  // SDK 3.x 는 샌드박스 앱을 주지 않고 이 도구로 테스트하게 되어 있다.
  // 콘솔 QR 은 진짜 토스 앱이라 실제 결제가 되므로 로컬 검증은 여기서 해야 한다.
  // 프로덕션 빌드에서는 플러그인이 통째로 꺼져 번들에 한 바이트도 들어가지 않는다.
  tools: {
    rspack: (config) => {
      if (process.env.NODE_ENV !== 'production') {
        config.plugins = [...(config.plugins ?? []), aitDevtools.rspack()];
      }
      return config;
    },
  },
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

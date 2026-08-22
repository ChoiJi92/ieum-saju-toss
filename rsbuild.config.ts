import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// .env(.local) 의 VITE_* / PUBLIC_* 변수를 번들에 inject — import.meta.env 로 접근.
const { publicVars } = loadEnv({ prefixes: ['VITE_', 'PUBLIC_'] });

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
    define: publicVars,
  },
});

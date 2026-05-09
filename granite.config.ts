import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'ieum-saju',
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'rsbuild dev',
      build: 'rsbuild build',
    },
  },
  permissions: [],
  outdir: 'dist',
  brand: {
    displayName: '이음사주',
    // TODO: 출시 전 자체 제작 600x600 PNG 로고로 교체
    icon: 'https://static.toss.im/appsintoss/73/10550764-5ac1-44e2-9ff3-ad78d8d2e71a.png',
    primaryColor: '#9D7BFF',
    bridgeColorMode: 'inverted',
  },
  webViewProps: {
    type: 'partner',
  },
});

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
    icon: 'https://static.toss.im/appsintoss/41691/7009c4a8-1520-43df-9190-e7be5a727f5e.png',
    primaryColor: '#9D7BFF',
  },
  webViewProps: {
    type: 'partner',
  },
});

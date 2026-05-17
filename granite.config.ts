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
    icon: 'https://static.toss.im/appsintoss/41691/73e8a7a3-7f51-4321-8f22-1668a0bbce9f.png',
    primaryColor: '#9D7BFF',
  },
  webViewProps: {
    type: 'partner',
  },
});

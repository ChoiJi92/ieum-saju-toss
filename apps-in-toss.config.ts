import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * SDK 3.x 설정. (2.x 의 granite.config.ts 를 대체)
 *
 * 2.x 대비 달라진 것
 *   - 파일명    granite.config.ts        → apps-in-toss.config.ts
 *   - 산출물    outdir                   → webBundleDir
 *   - 브랜드    brand.displayName/icon   → 콘솔에서 관리 (여기선 primaryColor 만)
 *   - 개발서버  web.host/port/commands   → 제거 (package.json 스크립트가 담당)
 *   - 웹뷰      webViewProps             → webView (속성 구성도 다름)
 */
export default defineConfig({
  appName: 'ieum-saju',
  brand: {
    primaryColor: '#9D7BFF',
  },
  permissions: [],
  webBundleDir: 'dist',
});

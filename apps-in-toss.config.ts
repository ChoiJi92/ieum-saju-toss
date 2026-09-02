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
  /**
   * 토스 상단 바의 뒤로가기는 끈다. 우리 화면마다 V2TopBar 의 `<` 가 있어서 둘이 같이 보였고,
   * 2026-09-02 검수에서 "중복된 버튼을 제거해 주세요" 로 반려됐다(20260902-54).
   * 우리 것은 스택을 되돌리지만 토스 것은 웹뷰 히스토리를 되돌려 SPA 에선 아무것도 안 하거나
   * 닫기 확인만 띄웠으니, 남길 쪽은 우리 것이다. 하드웨어 뒤로가기는 AppShell 이 backEvent 로 받는다.
   */
  navigationBar: {
    withBackButton: false,
  },
});

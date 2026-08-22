import ReactDOM from 'react-dom/client';
import './index.css';
import JaApp from './screens/JaApp';

/**
 * 일본어 웹판 엔트리 — 정령 뽑기 단독 페이지.
 * 빌드: APP_TARGET=ja rsbuild build  (rsbuild.config.ts 에서 entry 스위칭)
 */
const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<JaApp />);
}

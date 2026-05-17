import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// .env(.local) 의 VITE_* / PUBLIC_* 변수를 번들에 inject — import.meta.env 로 접근.
const { publicVars } = loadEnv({ prefixes: ['VITE_', 'PUBLIC_'] });

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/index.tsx',
    },
    define: publicVars,
  },
});

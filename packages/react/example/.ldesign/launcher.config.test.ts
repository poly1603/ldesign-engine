import { defineConfig } from '@ldesign/launcher'

/** 测试环境启动器配置（React） */
export default defineConfig({
  framework: { type: 'react' },
  server: { host: '0.0.0.0', port: 5175, open: false, hmr: false },
  preview: { host: '0.0.0.0', port: 4175, strictPort: false, open: false },
  build: { outDir: 'dist-test', sourcemap: true, minify: false, target: 'esnext', emptyOutDir: true, reportCompressedSize: false },
  define: { __DEV__: true, __API_URL__: JSON.stringify('http://localhost:3001/api'), __ENV__: JSON.stringify('test') },
  launcher: { logLevel: 'silent', cache: { enabled: true, dir: 'node_modules/.vite-test', strategy: 'disk' } },
  cacheDir: 'node_modules/.vite-test',
  base: '/',
  envPrefix: ['VITE_', 'LDESIGN_']
})


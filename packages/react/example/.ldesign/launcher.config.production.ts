import { defineConfig } from '@ldesign/launcher'

/** 生产环境启动器配置（React） */
export default defineConfig({
  framework: { type: 'react' },
  server: { host: '0.0.0.0', port: 5175, open: false },
  preview: { host: '0.0.0.0', port: 4175, strictPort: false, open: false },
  build: { outDir: 'dist-prod', sourcemap: false, minify: true, target: 'es2015', cssMinify: true, emptyOutDir: true, reportCompressedSize: true, chunkSizeWarningLimit: 500 },
  define: { __DEV__: false, __API_URL__: JSON.stringify('https://api.example.com'), __ENV__: JSON.stringify('production') },
  launcher: { logLevel: 'warn', cache: { enabled: true, dir: 'node_modules/.vite-prod', strategy: 'disk' } },
  cacheDir: 'node_modules/.vite-prod',
  base: '/',
  envPrefix: ['VITE_', 'LDESIGN_']
})


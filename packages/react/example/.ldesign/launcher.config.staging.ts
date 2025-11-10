import { defineConfig } from '@ldesign/launcher'

/** 预发布环境启动器配置（React） */
export default defineConfig({
  framework: { type: 'react' },
  server: { host: '0.0.0.0', port: 5175, open: false },
  preview: { host: '0.0.0.0', port: 4175, strictPort: false, open: false },
  build: { outDir: 'dist-staging', sourcemap: true, minify: true, target: 'es2015', cssMinify: true, emptyOutDir: true, reportCompressedSize: true, chunkSizeWarningLimit: 500 },
  define: { __DEV__: false, __API_URL__: JSON.stringify('https://staging-api.example.com'), __ENV__: JSON.stringify('staging') },
  launcher: { logLevel: 'info', cache: { enabled: true, dir: 'node_modules/.vite-staging', strategy: 'disk' } },
  cacheDir: 'node_modules/.vite-staging',
  base: '/',
  envPrefix: ['VITE_', 'LDESIGN_']
})


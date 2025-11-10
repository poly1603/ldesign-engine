import { defineConfig } from '@ldesign/launcher'

/** 开发环境启动器配置（React） */
export default defineConfig({
  framework: { type: 'react' },
  server: { host: '0.0.0.0', port: 5175, open: true, hmr: true, strictPort: false, cors: true },
  preview: { host: '0.0.0.0', port: 4175, strictPort: false, open: false },
  build: { outDir: 'dist-dev', sourcemap: true, minify: false, target: 'esnext', emptyOutDir: true, reportCompressedSize: false, chunkSizeWarningLimit: 1000 },
  define: { __DEV__: true, __API_URL__: JSON.stringify('http://localhost:8080/api'), __ENV__: JSON.stringify('development') },
  launcher: { logLevel: 'debug', cache: { enabled: true, dir: 'node_modules/.vite-dev', strategy: 'disk' } },
  cacheDir: 'node_modules/.vite-dev',
  base: '/',
  envPrefix: ['VITE_', 'LDESIGN_']
})


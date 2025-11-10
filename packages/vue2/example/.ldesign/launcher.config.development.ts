import { defineConfig } from '@ldesign/launcher'

/** 开发环境启动器配置（Vue2） */
export default defineConfig({
  framework: { type: 'vue2' },
  server: { host: '0.0.0.0', port: 5176, open: true, hmr: true, strictPort: false, cors: true },
  preview: { host: '0.0.0.0', port: 4176, strictPort: false, open: false },
  build: { outDir: 'dist-dev', sourcemap: true, minify: false, target: 'esnext', emptyOutDir: true },
  define: { __DEV__: true, __API_URL__: JSON.stringify('http://localhost:8080/api'), __ENV__: JSON.stringify('development') },
  launcher: { logLevel: 'debug', cache: { enabled: true, dir: 'node_modules/.vite-dev', strategy: 'disk' } },
  cacheDir: 'node_modules/.vite-dev',
  base: '/',
  envPrefix: ['VITE_', 'LDESIGN_']
})


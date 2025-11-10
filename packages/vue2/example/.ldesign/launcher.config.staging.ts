import { defineConfig } from '@ldesign/launcher'

/** 预发布环境启动器配置（Vue2） */
export default defineConfig({
  framework: { type: 'vue2' },
  server: { host: '0.0.0.0', port: 5176, open: false },
  preview: { host: '0.0.0.0', port: 4176, strictPort: false, open: false },
  build: { outDir: 'dist-staging', sourcemap: true, minify: true, target: 'es2015', emptyOutDir: true },
  define: { __DEV__: false, __API_URL__: JSON.stringify('https://staging-api.example.com'), __ENV__: JSON.stringify('staging') },
  launcher: { logLevel: 'info', cache: { enabled: true, dir: 'node_modules/.vite-staging', strategy: 'disk' } },
  cacheDir: 'node_modules/.vite-staging',
  base: '/',
  envPrefix: ['VITE_', 'LDESIGN_']
})


import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: { type: 'angular' },
  server: { host: '0.0.0.0', port: 5179, open: false },
  preview: { host: '0.0.0.0', port: 4179, strictPort: false, open: false },
  build: { outDir: 'dist-staging', sourcemap: true, minify: true, target: 'es2015', emptyOutDir: true },
  define: { __DEV__: false, __API_URL__: JSON.stringify('https://staging-api.example.com'), __ENV__: JSON.stringify('staging') },
  launcher: { logLevel: 'info', cache: { enabled: true, dir: 'node_modules/.vite-staging', strategy: 'disk' } },
  cacheDir: 'node_modules/.vite-staging',
  base: '/',
  envPrefix: ['VITE_', 'LDESIGN_']
})


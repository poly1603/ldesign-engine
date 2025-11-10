import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: { type: 'solid' },
  server: { host: '0.0.0.0', port: 5178, open: false, hmr: false },
  preview: { host: '0.0.0.0', port: 4178, strictPort: false, open: false },
  build: { outDir: 'dist-test', sourcemap: true, minify: false, target: 'esnext', emptyOutDir: true },
  define: { __DEV__: true, __API_URL__: JSON.stringify('http://localhost:3001/api'), __ENV__: JSON.stringify('test') },
  launcher: { logLevel: 'silent', cache: { enabled: true, dir: 'node_modules/.vite-test', strategy: 'disk' } },
  cacheDir: 'node_modules/.vite-test',
  base: '/',
  envPrefix: ['VITE_', 'LDESIGN_']
})


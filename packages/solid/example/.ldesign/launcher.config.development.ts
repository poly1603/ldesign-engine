import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: { type: 'solid' },
  server: { host: '0.0.0.0', port: 5178, open: true, hmr: true, strictPort: false, cors: true },
  preview: { host: '0.0.0.0', port: 4178, strictPort: false, open: false },
  build: { outDir: 'dist-dev', sourcemap: true, minify: false, target: 'esnext', emptyOutDir: true },
  define: { __DEV__: true, __API_URL__: JSON.stringify('http://localhost:8080/api'), __ENV__: JSON.stringify('development') },
  launcher: { logLevel: 'debug', cache: { enabled: true, dir: 'node_modules/.vite-dev', strategy: 'disk' } },
  cacheDir: 'node_modules/.vite-dev',
  base: '/',
  envPrefix: ['VITE_', 'LDESIGN_']
})


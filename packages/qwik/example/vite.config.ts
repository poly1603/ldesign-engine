import { defineConfig } from 'vite'
import { qwikVite } from '@builder.io/qwik/optimizer'

export default defineConfig({
  plugins: [qwikVite()],
  server: {
    host: '0.0.0.0',
    port: 5106,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})


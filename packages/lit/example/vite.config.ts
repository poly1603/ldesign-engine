import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5107,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})








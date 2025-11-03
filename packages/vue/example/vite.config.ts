import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5100,
    open: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})








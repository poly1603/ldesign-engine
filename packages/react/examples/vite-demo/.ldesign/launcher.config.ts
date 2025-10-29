import { defineConfig } from '@ldesign/launcher'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    host: 'localhost',
    open: true
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: true
  },

  resolve: {
    alias: [
      { find: '@', replacement: './src' }
    ]
  }
})



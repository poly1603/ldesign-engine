import { defineConfig } from '@ldesign/launcher'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  server: {
    port: 5174,
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



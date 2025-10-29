import { defineConfig } from '@ldesign/launcher'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],

  server: {
    port: 5175,
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



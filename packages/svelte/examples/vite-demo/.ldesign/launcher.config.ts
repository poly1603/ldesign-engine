import { defineConfig } from '@ldesign/launcher'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],

  server: {
    port: 5176,
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



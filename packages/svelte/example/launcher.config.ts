/**
 * Svelte Engine 示例 - Launcher 配置
 */
import { defineConfig } from '@ldesign/launcher'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [
    svelte({
      // Svelte 5.x 默认配置即可
      hot: {
        preserveLocalState: true,
      },
    }),
  ],

  server: {
    port: 3001,
    host: 'localhost',
    open: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },

  resolve: {
    alias: [
      { find: '@', replacement: './src' },
    ],
  },

  launcher: {
    logLevel: 'info',
  },
})


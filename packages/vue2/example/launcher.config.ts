/**
 * Vue 2 Engine 示例 - Launcher 配置
 */
import { defineConfig } from '@ldesign/launcher'
import vue2 from '@vitejs/plugin-vue2'

export default defineConfig({
  plugins: [
    vue2(),
  ],

  server: {
    port: 3002,
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
      { find: 'vue', replacement: 'vue/dist/vue.esm.js' },
    ],
  },

  launcher: {
    logLevel: 'info',
  },
})


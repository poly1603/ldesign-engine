import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ldesign/engine-core': resolve(__dirname, '../packages/core/src'),
      '@ldesign/engine-vue3': resolve(__dirname, '../packages/vue3/src'),
    },
  },
  server: {
    port: 5200,
    open: true,
  },
})

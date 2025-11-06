import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

export default defineConfig({
  framework: {
    type: 'vue2'
  },

  server: {
    host: '0.0.0.0',
    port: 5176,
    open: false
  },

  preview: {
    host: '0.0.0.0',
    port: 4176,
    strictPort: false
  },

  build: {
    outDir: 'dist',
    sourcemap: true
  },

  resolve: {
    alias: {
      '@ldesign/engine-vue2': resolve(__dirname, '../../../vue2/src/index.ts'),
      '@ldesign/engine-core': resolve(__dirname, '../../../core/src/index.ts'),
      '@ldesign/router-vue2': resolve(__dirname, '../../../../../router/packages/vue2/src/index.ts'),
      '@ldesign/router': resolve(__dirname, '../../../../../router/packages/core/src/index.ts'),
      // 使用包含编译器的完整构建版本
      'vue': 'vue/dist/vue.esm.js'
    }
  }
})


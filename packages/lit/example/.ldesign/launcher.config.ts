import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5178,
    open: false
  },

  preview: {
    host: '0.0.0.0',
    port: 4179,
    strictPort: false
  },

  build: {
    outDir: 'dist',
    sourcemap: true
  },

  resolve: {
    alias: {
      '@ldesign/engine-lit': resolve(__dirname, '../../../lit/src/index.ts'),
      '@ldesign/engine-core': resolve(__dirname, '../../../core/src/index.ts'),
      '@ldesign/router-lit': resolve(__dirname, '../../../../../router/packages/lit/src/index.ts'),
      '@ldesign/router': resolve(__dirname, '../../../../../router/packages/core/src/index.ts'),
    }
  }
})


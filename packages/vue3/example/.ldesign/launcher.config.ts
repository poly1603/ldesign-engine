import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

export default defineConfig({
  framework: {
    type: 'vue3',
    options: {
      jsx: false
    }
  },
  
  server: {
    host: '0.0.0.0',
    port: 5174,
    open: false
  },
  
  preview: {
    host: '0.0.0.0',
    port: 4174,
    strictPort: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  resolve: {
    alias: {
      '@ldesign/engine-vue3': resolve(__dirname, '../../../vue3/src/index.ts'),
      '@ldesign/engine-core': resolve(__dirname, '../../../core/src/index.ts'),
    }
  }
})


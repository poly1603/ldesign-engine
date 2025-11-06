import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

export default defineConfig({
  framework: {
    type: 'qwik',
    options: {
      devInput: 'src/main.tsx'
    }
  },
  
  server: {
    host: '0.0.0.0',
    port: 5180,
    open: true
  },
  
  preview: {
    host: '0.0.0.0',
    port: 4180,
    strictPort: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  resolve: {
    alias: {
      '@ldesign/engine-qwik': resolve(__dirname, '../../../qwik/src/index.ts'),
      '@ldesign/engine-core': resolve(__dirname, '../../../core/src/index.ts'),
      '@ldesign/router-qwik': resolve(__dirname, '../../../../../router/packages/qwik/src/index.ts'),
      '@ldesign/router': resolve(__dirname, '../../../../../router/packages/core/src/index.ts'),
    }
  }
})


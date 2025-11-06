import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

export default defineConfig({
  framework: {
    type: 'preact'
  },
  
  server: {
    host: '0.0.0.0',
    port: 5181,
    open: false
  },
  
  preview: {
    host: '0.0.0.0',
    port: 4181,
    strictPort: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  resolve: {
    alias: {
      '@ldesign/engine-preact': resolve(__dirname, '../../../preact/src/index.ts'),
      '@ldesign/engine-core': resolve(__dirname, '../../../core/src/index.ts'),
      '@ldesign/router-preact': resolve(__dirname, '../../../../../router/packages/preact/src/index.ts'),
      '@ldesign/router': resolve(__dirname, '../../../../../router/packages/core/src/index.ts'),
    }
  }
})


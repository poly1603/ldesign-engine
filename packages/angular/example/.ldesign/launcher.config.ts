import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

export default defineConfig({
  framework: {
    type: 'angular'
  },
  
  server: {
    host: '0.0.0.0',
    port: 5179,
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
      '@ldesign/engine-angular': resolve(__dirname, '../../../angular/src/index.ts'),
      '@ldesign/engine-core': resolve(__dirname, '../../../core/src/index.ts'),
      '@ldesign/router-angular': resolve(__dirname, '../../../../../router/packages/angular/src/index.ts'),
      '@ldesign/router': resolve(__dirname, '../../../../../router/packages/core/src/index.ts'),
    }
  }
})


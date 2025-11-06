import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

export default defineConfig({
  framework: {
    type: 'svelte'
  },
  
  server: {
    host: '0.0.0.0',
    port: 5177,
    open: false
  },
  
  preview: {
    host: '0.0.0.0',
    port: 4177,
    strictPort: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  resolve: {
    alias: {
      '@ldesign/engine-svelte': resolve(__dirname, '../../../svelte/src/index.ts'),
      '@ldesign/engine-core': resolve(__dirname, '../../../core/src/index.ts'),
      '@ldesign/router-svelte': resolve(__dirname, '../../../../../router/packages/svelte/src/index.ts'),
      '@ldesign/router': resolve(__dirname, '../../../../../router/packages/core/src/index.ts'),
      '/themes': resolve(__dirname, '../../../../../../themes'),
    }
  }
})


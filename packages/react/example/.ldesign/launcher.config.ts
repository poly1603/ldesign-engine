import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

export default defineConfig({
  framework: {
    type: 'react'
  },
  
  server: {
    host: '0.0.0.0',
    port: 5175,
    open: false
  },
  
  preview: {
    host: '0.0.0.0',
    port: 4175,
    strictPort: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  resolve: {
    alias: {
      '@ldesign/engine-react': resolve(__dirname, '../../../react/src/index.ts'),
      '@ldesign/engine-core': resolve(__dirname, '../../../core/src/index.ts'),
    }
  }
})


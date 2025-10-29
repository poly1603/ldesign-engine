import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'react',
    options: {
      jsxRuntime: 'automatic'
    }
  },
  
  server: {
    host: '0.0.0.0',
    port: 5101,
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})


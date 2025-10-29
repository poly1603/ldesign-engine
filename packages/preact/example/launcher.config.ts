import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'preact',
    options: {}
  },
  
  server: {
    host: '0.0.0.0',
    port: 5104,
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})


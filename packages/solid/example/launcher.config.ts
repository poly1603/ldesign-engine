import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'solid',
    options: {}
  },
  
  server: {
    host: '0.0.0.0',
    port: 5103,
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})


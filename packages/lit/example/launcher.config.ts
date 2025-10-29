import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'lit',
    options: {}
  },
  
  server: {
    host: '0.0.0.0',
    port: 5107,
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})


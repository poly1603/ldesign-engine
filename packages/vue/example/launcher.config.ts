import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'vue3',
    options: {
      jsx: false
    }
  },
  
  server: {
    host: '0.0.0.0',
    port: 5100,
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})


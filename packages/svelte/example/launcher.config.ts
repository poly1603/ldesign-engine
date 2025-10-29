import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  framework: {
    type: 'svelte',
    options: {}
  },
  
  server: {
    host: '0.0.0.0',
    port: 5102,
    open: false
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})


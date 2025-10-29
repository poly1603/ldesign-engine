import { defineConfig } from '@ldesign/launcher'

export default defineConfig({
  name: '@ldesign/engine-vue-example',
  framework: 'vue',
  entry: './src/main.ts',
  
  server: {
    port: 5173,
    open: true
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})

import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  output: {
    esm: {
      dir: 'es'
    },
    cjs: {
      dir: 'lib'
    },
    umd: {
      dir: 'dist',
      name: 'LDesignEngineReact',
      input: 'src/index.ts'
    },
  },
})


import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  output: {
    esm: true,
    cjs: true,
    umd: {
      enabled: true,
      name: 'LDesignEngineSvelte',
      input: 'src/index.ts',
      minify: true,
    },
  },
})


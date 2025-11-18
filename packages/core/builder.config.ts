import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  output: {
    esm: {
      enabled: true,
      dir: 'es',
    },
    cjs: {
      enabled: true,
      dir: 'lib',
      extension: '.cjs',
    },
    umd: {
      enabled: true,
      name: 'LDesignEngineCore',
      input: 'src/index.ts',
      minify: true,
    },
  },
})


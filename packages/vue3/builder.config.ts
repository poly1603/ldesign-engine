import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  output: {
    esm: true,
    cjs: true,
    umd: {
      enabled: true,
      name: 'LDesignEngineVue3',
      input: 'src/index.ts',
      minify: true,
    },
  },
  external: [
    '@ldesign/engine-core',
    '@ldesign/router-vue3',
    '@ldesign/router-vue',
    'vue',
    'vue-router',
  ],
})


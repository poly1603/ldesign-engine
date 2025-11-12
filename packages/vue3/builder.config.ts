import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  output: {
    esm: {
      dir: 'es',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    cjs: {
      dir: 'lib',
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
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
    '@ldesign/i18n-vue',
    '@ldesign/i18n-core',
    'vue',
    'vue-router',
  ],
})


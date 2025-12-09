/**
 * @ldesign/engine-vue3 构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',
  output: [
    { format: 'esm', dir: 'es', preserveModules: true, preserveModulesRoot: 'src' },
    { format: 'esm', dir: 'esm', preserveModules: true, preserveModulesRoot: 'src' },
    { format: 'cjs', dir: 'lib', preserveModules: true, preserveModulesRoot: 'src' },
    { format: 'umd', dir: 'dist', name: 'LDesignEngineVue3' },
  ],
  external: ['@ldesign/engine-core', '@ldesign/router-vue3', '@ldesign/router-vue', '@ldesign/i18n-vue', '@ldesign/i18n-core', 'vue', 'vue-router'],
  dts: true,
  clean: true,
})


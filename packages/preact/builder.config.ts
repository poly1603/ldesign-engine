/**
 * Preact 适配器构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  output: {
    esm: true,
    cjs: true,
    umd: {
      enabled: true,
      name: 'LDesignEnginePreact',
      input: 'src/index.ts',
      minify: true,
    },
  },
})


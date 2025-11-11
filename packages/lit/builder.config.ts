/**
 * Lit 适配器构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  output: {
    esm: true,
    cjs: true,
    umd: {
      enabled: true,
      name: 'LDesignEngineLit',
      input: 'src/index.ts',
      minify: true,
    },
  },
  build: {
    target: 'es2022', // 支持 top-level await
  },
})


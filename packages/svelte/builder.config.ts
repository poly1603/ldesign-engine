import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  output: {
    esm: true,
    cjs: true,
    // UMD 格式不支持动态 import，暂时禁用
    // 因为 Engine 需要动态加载 Router 包
    umd: {
      enabled: false,
      name: 'LDesignEngineSvelte',
      input: 'src/index.ts',
      minify: true,
    },
  },
})


import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  // 统一使用默认打包器（rollup），兼容性更好
  output: {
    esm: true,
    cjs: true,
    umd: {
      enabled: true,
      name: 'LDesignEngineAngular',
      input: 'src/index.ts',
      minify: true,
    },
  },
  // 将内部工作空间包与框架依赖外部化，避免重写为 monorepo 相对路径
  external(id: string) {
    return (
      /^@ldesign\//.test(id)
      || /^@angular\//.test(id)
      || id === 'rxjs'
      || id === 'zone.js'
    )
  },
})

import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  // 使用 esbuild 以更好地保留外部依赖的模块标识（不改写为物理路径）
  bundler: 'esbuild',
  output: {
    esm: {
      // esbuild 下不需要 preserveStructure，按文件输出即可
    },
    cjs: {},
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


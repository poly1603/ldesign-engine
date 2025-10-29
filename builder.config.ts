/**
 * LDesign Engine 构建配置
 */
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'dts'],
    dir: {
      esm: 'es',
      cjs: 'lib',
    },
  },
  external: [
    // 外部化所有子包
    '@ldesign/engine-core',
    '@ldesign/engine-vue',
    '@ldesign/engine-react',
    '@ldesign/engine-angular',
    '@ldesign/engine-solid',
    '@ldesign/engine-svelte',
    // 外部化 peer dependencies
    'vue',
    'react',
    'react-dom',
    '@angular/core',
    '@angular/common',
    'solid-js',
    'svelte',
  ],
  dts: {
    enabled: true,
  },
  sourcemap: true,
  minify: false, // 主包不需要压缩，子包会压缩
})


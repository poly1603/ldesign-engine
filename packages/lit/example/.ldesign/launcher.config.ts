import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

/**
 * 基础配置
 * 所有环境共享的基础配置，会被环境特定配置覆盖
 */
export default defineConfig({
  framework: {
    type: 'lit',
    options: {
      jsx: false
    }
  },

  // 开发服务器配置（基础配置，会被环境配置覆盖）
  server: {
    host: '0.0.0.0',
    port: 5178,
    open: false,
    strictPort: false
  },

  // 预览服务器配置（基础配置，会被环境配置覆盖）
  preview: {
    host: '0.0.0.0',
    port: 4178,
    strictPort: false
  },

  // 构建配置（基础配置，会被环境配置覆盖）
  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true
  },

  // 路径别名配置
  resolve: {
    alias: [
      {
        find: '@ldesign/engine-lit',
        replacement: resolve(__dirname, '../../../lit/src/index.ts')
      },
      {
        find: '@ldesign/engine-core',
        replacement: resolve(__dirname, '../../../core/src/index.ts')
      },
      {
        find: '@ldesign/router-lit',
        replacement: resolve(__dirname, '../../../../../router/packages/lit/src/index.ts')
      },
      {
        find: '@ldesign/router',
        replacement: resolve(__dirname, '../../../../../router/packages/core/src/index.ts')
      }
    ]
  },

  // 缓存配置
  cacheDir: 'node_modules/.vite',

  // 公共路径
  base: '/',

  // 环境变量前缀
  envPrefix: ['VITE_', 'LDESIGN_']
})


import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

/**
 * 测试环境配置
 *
 * 测试环境特点：
 * - 静默模式，减少日志输出
 * - 快速构建配置
 * - 测试专用的 API 地址
 * - 使用独立的端口和输出目录
 */
export default defineConfig({
  framework: {
    type: 'lit',
    options: {
      jsx: false
    }
  },

  // 开发服务器配置
  server: {
    host: '0.0.0.0',
    port: 5181, // 测试环境端口
    open: false, // 测试环境不自动打开浏览器
    hmr: false // 测试环境禁用 HMR
  },

  // 预览服务器配置
  preview: {
    host: '0.0.0.0',
    port: 4181, // 测试环境预览端口
    strictPort: false,
    open: false
  },

  // 构建配置
  build: {
    outDir: 'dist-test', // 测试环境输出目录
    sourcemap: true, // 测试环境保留 sourcemap 便于调试
    minify: false, // 测试环境不压缩，加快构建速度
    target: 'esnext',
    emptyOutDir: true, // 构建前清空输出目录
    reportCompressedSize: false // 不报告压缩大小
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

  // 测试环境全局变量
  define: {
    __DEV__: true,
    __API_URL__: JSON.stringify('http://localhost:3001/api'), // 测试 API 地址
    __ENV__: JSON.stringify('test')
  },

  // Launcher 特定配置
  launcher: {
    logLevel: 'silent', // 测试环境静默模式
    cache: {
      enabled: true, // 启用缓存
      dir: 'node_modules/.vite-test', // 测试环境缓存目录
      strategy: 'disk' // 使用磁盘缓存
    }
  },

  // 缓存配置
  cacheDir: 'node_modules/.vite-test',

  // 公共路径
  base: '/',

  // 环境变量前缀
  envPrefix: ['VITE_', 'LDESIGN_']
})


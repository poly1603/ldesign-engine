import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

/**
 * 开发环境配置
 *
 * 开发环境特点：
 * - 启用详细日志
 * - 生成 sourcemap 便于调试
 * - 自动打开浏览器
 * - 启用 HMR 热更新
 * - 不压缩代码，加快构建速度
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
    port: 5178, // 开发环境端口
    open: true, // 开发环境自动打开浏览器
    hmr: true, // 启用热模块替换
    strictPort: false, // 端口被占用时自动尝试下一个端口
    cors: true // 启用 CORS
  },

  // 预览服务器配置
  preview: {
    host: '0.0.0.0',
    port: 4178, // 开发环境预览端口
    strictPort: false,
    open: false
  },

  // 构建配置
  build: {
    outDir: 'dist-dev', // 开发环境输出目录
    sourcemap: true, // 开发环境生成 sourcemap
    minify: false, // 开发环境不压缩，加快构建速度
    target: 'esnext', // 使用最新的 ES 特性
    emptyOutDir: true, // 构建前清空输出目录
    reportCompressedSize: false, // 不报告压缩大小，加快构建
    chunkSizeWarningLimit: 1000 // 提高 chunk 大小警告阈值
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

  // 开发环境全局变量
  define: {
    __DEV__: true,
    __API_URL__: JSON.stringify('http://localhost:8080/api'),
    __ENV__: JSON.stringify('development')
  },

  // Launcher 特定配置
  launcher: {
    logLevel: 'debug', // 开发环境显示详细日志
    cache: {
      enabled: true, // 启用缓存
      dir: 'node_modules/.vite-dev', // 开发环境缓存目录
      strategy: 'disk' // 使用磁盘缓存
    }
  },

  // 缓存配置
  cacheDir: 'node_modules/.vite-dev',

  // 公共路径
  base: '/',

  // 环境变量前缀
  envPrefix: ['VITE_', 'LDESIGN_']
})


import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

/**
 * 预发布环境配置
 *
 * 预发布环境特点：
 * - 接近生产环境的配置
 * - 保留 sourcemap 便于问题排查
 * - 使用预发布 API 地址
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
    port: 5180, // 预发布环境端口
    open: false
  },

  // 预览服务器配置
  preview: {
    host: '0.0.0.0',
    port: 4180, // 预发布环境预览端口
    strictPort: false,
    open: false
  },

  // 构建配置
  build: {
    outDir: 'dist-staging', // 预发布环境输出目录
    sourcemap: true, // 预发布环境保留 sourcemap，便于问题排查
    minify: true, // 启用代码压缩
    target: 'es2015',
    cssMinify: true,
    emptyOutDir: true, // 构建前清空输出目录
    reportCompressedSize: true, // 报告压缩大小
    chunkSizeWarningLimit: 500, // 降低 chunk 大小警告阈值
    rollupOptions: {
      output: {
        manualChunks: {
          'lit-vendor': ['lit'],
          'engine-vendor': ['@ldesign/engine-lit', '@ldesign/engine-core']
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
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

  // 预发布环境全局变量
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://staging-api.example.com'), // 预发布 API 地址
    __ENV__: JSON.stringify('staging')
  },

  // Launcher 特定配置
  launcher: {
    logLevel: 'info', // 预发布环境显示信息级别日志
    cache: {
      enabled: true, // 启用缓存
      dir: 'node_modules/.vite-staging', // 预发布环境缓存目录
      strategy: 'disk' // 使用磁盘缓存
    },
    optimization: {
      minify: 'esbuild', // 使用 esbuild 压缩
      treeShaking: {
        enabled: true,
        preset: 'safest' // 安全的 tree shaking
      }
    }
  },

  // 缓存配置
  cacheDir: 'node_modules/.vite-staging',

  // 公共路径（预发布环境可能需要配置 CDN 路径）
  base: '/',

  // 环境变量前缀
  envPrefix: ['VITE_', 'LDESIGN_']
})


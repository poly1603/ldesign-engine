import { defineConfig } from '@ldesign/launcher'
import { resolve } from 'path'

/**
 * 生产环境配置
 * 
 * 生产环境特点：
 * - 最小日志级别
 * - 启用代码压缩和优化
 * - 不生成 sourcemap（减少体积）
 * - 优化构建输出
 * - 使用独立的端口和输出目录
 */
export default defineConfig({
  framework: {
    type: 'vue3',
    options: {
      jsx: false
    }
  },
  
  // 开发服务器配置（生产环境通常不使用，但保留配置）
  server: {
    host: '0.0.0.0',
    port: 5175, // 生产环境端口（如果需要在生产环境运行 dev）
    open: false // 生产环境不自动打开浏览器
  },
  
  // 预览服务器配置
  preview: {
    host: '0.0.0.0',
    port: 4175, // 生产环境预览端口
    strictPort: false,
    open: false
  },
  
  // 构建配置
  build: {
    outDir: 'dist-prod', // 生产环境输出目录
    sourcemap: false, // 生产环境不生成 sourcemap，减少体积
    minify: true, // 启用代码压缩
    target: 'es2015', // 兼容更多浏览器
    cssMinify: true, // 压缩 CSS
    emptyOutDir: true, // 构建前清空输出目录
    reportCompressedSize: true, // 报告压缩大小
    chunkSizeWarningLimit: 500, // 降低 chunk 大小警告阈值
    rollupOptions: {
      output: {
        // 代码分割优化
        manualChunks: {
          'vue-vendor': ['vue'],
          'engine-vendor': ['@ldesign/engine-vue3', '@ldesign/engine-core']
        },
        // 文件名包含 hash，便于缓存
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
        find: '@ldesign/engine-vue3',
        replacement: resolve(__dirname, '../../../vue3/src/index.ts')
      },
      {
        find: '@ldesign/engine-core',
        replacement: resolve(__dirname, '../../../core/src/index.ts')
      }
    ]
  },
  
  // 生产环境全局变量
  define: {
    __DEV__: false,
    __API_URL__: JSON.stringify('https://api.example.com'),
    __ENV__: JSON.stringify('production')
  },
  
  // Launcher 特定配置
  launcher: {
    logLevel: 'warn', // 生产环境只显示警告和错误
    cache: {
      enabled: true, // 启用缓存
      dir: 'node_modules/.vite-prod', // 生产环境缓存目录
      strategy: 'disk' // 使用磁盘缓存
    },
    optimization: {
      minify: 'esbuild', // 使用 esbuild 压缩
      treeShaking: {
        enabled: true,
        preset: 'smallest' // 最小化 tree shaking
      }
    }
  },
  
  // 缓存配置
  cacheDir: 'node_modules/.vite-prod',
  
  // 公共路径（生产环境可能需要配置 CDN 路径）
  base: '/',
  
  // 环境变量前缀
  envPrefix: ['VITE_', 'LDESIGN_']
})



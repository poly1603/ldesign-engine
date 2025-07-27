# 构建配置

本章将详细介绍如何配置 @ldesign/engine 应用的构建过程，包括开发环境、测试环境和生产环境的不同配置策略。

## 基础构建配置

### Vite 配置

```typescript
// vite.config.ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  // 基础配置
  root: './src',
  base: '/',
  publicDir: '../public',

  // 构建配置
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',

    // 代码分割
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.ts'),
        worker: resolve(__dirname, 'src/worker.ts')
      },
      output: {
        // 分包策略
        manualChunks: {
          vendor: ['@ldesign/engine'],
          utils: ['lodash', 'dayjs'],
          ui: ['vue', 'element-plus']
        },
        // 文件命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.')
          const ext = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name!)) {
            return `media/[name]-[hash].${ext}`
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name!)) {
            return `images/[name]-[hash].${ext}`
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name!)) {
            return `fonts/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        }
      }
    },

    // Terser 配置
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      },
      mangle: {
        safari10: true
      }
    }
  },

  // 开发服务器配置
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  },

  // 预览服务器配置
  preview: {
    host: '0.0.0.0',
    port: 4173,
    cors: true
  },

  // 依赖优化
  optimizeDeps: {
    include: [
      '@ldesign/engine',
      'lodash',
      'dayjs'
    ],
    exclude: [
      'some-large-dependency'
    ]
  },

  // 环境变量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})
```

### 环境配置

```typescript
// config/build.config.ts
interface BuildConfig {
  mode: 'development' | 'testing' | 'production'
  debug: boolean
  sourcemap: boolean
  minify: boolean
  analyze: boolean
  cdn: boolean
  publicPath: string
  outputDir: string
}

const configs: Record<string, BuildConfig> = {
  development: {
    mode: 'development',
    debug: true,
    sourcemap: true,
    minify: false,
    analyze: false,
    cdn: false,
    publicPath: '/',
    outputDir: 'dist-dev'
  },

  testing: {
    mode: 'testing',
    debug: true,
    sourcemap: true,
    minify: true,
    analyze: true,
    cdn: false,
    publicPath: '/test/',
    outputDir: 'dist-test'
  },

  production: {
    mode: 'production',
    debug: false,
    sourcemap: false,
    minify: true,
    analyze: true,
    cdn: true,
    publicPath: '/app/',
    outputDir: 'dist'
  }
}

export function getBuildConfig(env: string = 'development'): BuildConfig {
  return configs[env] || configs.development
}

// 动态 Vite 配置
export function createViteConfig(env: string) {
  const config = getBuildConfig(env)

  return defineConfig({
    mode: config.mode,
    base: config.publicPath,

    build: {
      outDir: config.outputDir,
      sourcemap: config.sourcemap,
      minify: config.minify ? 'terser' : false,

      rollupOptions: {
        plugins: [
          // 条件性添加插件
          ...(config.analyze ? [bundleAnalyzer()] : []),
          ...(config.cdn ? [cdnPlugin()] : [])
        ]
      }
    },

    define: {
      __DEV__: config.debug,
      __PROD__: config.mode === 'production',
      __TEST__: config.mode === 'testing'
    }
  })
}
```

## 多环境构建

### 环境变量管理

```bash
# .env.development
VITE_APP_TITLE=LDesign Engine Dev
VITE_API_BASE_URL=http://localhost:8080/api
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
VITE_ENABLE_MOCK=true

# .env.testing
VITE_APP_TITLE=LDesign Engine Test
VITE_API_BASE_URL=https://test-api.example.com/api
VITE_DEBUG=true
VITE_LOG_LEVEL=info
VITE_ENABLE_MOCK=false

# .env.production
VITE_APP_TITLE=LDesign Engine
VITE_API_BASE_URL=https://api.example.com/api
VITE_DEBUG=false
VITE_LOG_LEVEL=error
VITE_ENABLE_MOCK=false
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
```

### 构建脚本

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "npm run build:prod",
    "build:dev": "vite build --mode development",
    "build:test": "vite build --mode testing",
    "build:prod": "vite build --mode production",
    "build:analyze": "npm run build:prod && npx vite-bundle-analyzer dist",
    "preview": "vite preview",
    "preview:test": "vite preview --mode testing",
    "preview:prod": "vite preview --mode production"
  }
}
```

### 条件编译

```typescript
// src/config/index.ts
interface AppConfig {
  title: string
  apiBaseUrl: string
  debug: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  features: {
    mock: boolean
    pwa: boolean
    analytics: boolean
    hotReload: boolean
  }
}

const config: AppConfig = {
  title: import.meta.env.VITE_APP_TITLE || 'LDesign Engine',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  debug: import.meta.env.VITE_DEBUG === 'true',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',

  features: {
    mock: import.meta.env.VITE_ENABLE_MOCK === 'true',
    pwa: import.meta.env.VITE_ENABLE_PWA === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    hotReload: import.meta.env.DEV
  }
}

export default config

// 条件性功能加载
if (config.features.mock) {
  import('./mock').then(({ setupMock }) => {
    setupMock()
  })
}

if (config.features.analytics && !config.debug) {
  import('./analytics').then(({ initAnalytics }) => {
    initAnalytics()
  })
}

if (config.features.pwa) {
  import('./pwa').then(({ registerSW }) => {
    registerSW()
  })
}
```

## 代码分割策略

### 路由级分割

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/Home.vue')
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      children: [
        {
          path: 'analytics',
          component: () => import('../views/dashboard/Analytics.vue')
        },
        {
          path: 'reports',
          component: () => import('../views/dashboard/Reports.vue')
        }
      ]
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('../views/Admin.vue'),
      meta: { requiresAuth: true, role: 'admin' }
    }
  ]
})

export default router
```

### 组件级分割

```typescript
// src/components/LazyComponents.ts
import { defineAsyncComponent } from 'vue'

// 懒加载组件
export const LazyChart = defineAsyncComponent({
  loader: () => import('./Chart.vue'),
  loadingComponent: () => import('./Loading.vue'),
  errorComponent: () => import('./Error.vue'),
  delay: 200,
  timeout: 3000
})

export const LazyDataTable = defineAsyncComponent({
  loader: () => import('./DataTable.vue'),
  loadingComponent: () => import('./Loading.vue'),
  delay: 200
})

// 条件性加载
export const ConditionalEditor = defineAsyncComponent({
  loader: () => {
    if (import.meta.env.VITE_ENABLE_EDITOR === 'true') {
      return import('./RichEditor.vue')
    }
 else {
      return import('./SimpleEditor.vue')
    }
  }
})
```

### 插件级分割

```typescript
// src/plugins/dynamic-loader.ts
class DynamicPluginLoader {
  private loadedPlugins = new Set<string>()

  async loadPlugin(name: string, condition?: () => boolean) {
    if (this.loadedPlugins.has(name)) {
      return
    }

    if (condition && !condition()) {
      console.log(`插件 ${name} 不满足加载条件`)
      return
    }

    try {
      const plugin = await this.importPlugin(name)
      await plugin.install()
      this.loadedPlugins.add(name)
      console.log(`插件 ${name} 加载成功`)
    }
 catch (error) {
      console.error(`插件 ${name} 加载失败:`, error)
    }
  }

  private async importPlugin(name: string) {
    switch (name) {
      case 'analytics':
        return import('./analytics-plugin')
      case 'charts':
        return import('./charts-plugin')
      case 'editor':
        return import('./editor-plugin')
      case 'maps':
        return import('./maps-plugin')
      default:
        throw new Error(`未知插件: ${name}`)
    }
  }
}

const pluginLoader = new DynamicPluginLoader()

// 根据配置动态加载插件
if (config.features.analytics) {
  pluginLoader.loadPlugin('analytics')
}

if (config.features.charts) {
  pluginLoader.loadPlugin('charts')
}

// 根据用户权限加载插件
if (user.hasPermission('editor')) {
  pluginLoader.loadPlugin('editor')
}

export default pluginLoader
```

## 资源优化

### 图片优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { imageOptimize } from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    // 图片压缩
    imageOptimize({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      optipng: { optimizationLevel: 7 },
      pngquant: { quality: [0.65, 0.8] },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false },
          { name: 'removeEmptyAttrs', active: false }
        ]
      },
      webp: { quality: 75 }
    })
  ]
})
```

### 字体优化

```typescript
// src/utils/font-loader.ts
class FontLoader {
  private loadedFonts = new Set<string>()

  async loadFont(fontFamily: string, fontUrl: string) {
    if (this.loadedFonts.has(fontFamily)) {
      return
    }

    try {
      const font = new FontFace(fontFamily, `url(${fontUrl})`)
      await font.load()
      document.fonts.add(font)
      this.loadedFonts.add(fontFamily)
      console.log(`字体 ${fontFamily} 加载成功`)
    }
 catch (error) {
      console.error(`字体 ${fontFamily} 加载失败:`, error)
    }
  }

  preloadCriticalFonts() {
    const criticalFonts = [
      { family: 'Inter', url: '/fonts/inter-regular.woff2' },
      { family: 'Inter', url: '/fonts/inter-bold.woff2' }
    ]

    criticalFonts.forEach((font) => {
      this.loadFont(font.family, font.url)
    })
  }

  loadFontOnDemand(fontFamily: string) {
    const fontMap: Record<string, string> = {
      'Roboto': '/fonts/roboto.woff2',
      'Source Code Pro': '/fonts/source-code-pro.woff2',
      'Noto Sans CJK': '/fonts/noto-sans-cjk.woff2'
    }

    const fontUrl = fontMap[fontFamily]
    if (fontUrl) {
      this.loadFont(fontFamily, fontUrl)
    }
  }
}

const fontLoader = new FontLoader()

// 预加载关键字体
fontLoader.preloadCriticalFonts()

export default fontLoader
```

### CSS 优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { createStyleImportPlugin } from 'vite-plugin-style-import'

export default defineConfig({
  css: {
    // CSS 预处理器配置
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
          @import "@/styles/mixins.scss";
        `
      }
    },

    // PostCSS 配置
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('cssnano')({
          preset: 'default'
        }),
        require('@fullhuman/postcss-purgecss')({
          content: ['./src/**/*.{vue,js,ts}'],
          defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
        })
      ]
    }
  },

  plugins: [
    // 按需导入样式
    createStyleImportPlugin({
      libs: [
        {
          libraryName: 'element-plus',
          esModule: true,
          resolveStyle: (name) => {
            return `element-plus/theme-chalk/${name}.css`
          }
        }
      ]
    })
  ]
})
```

## 构建优化

### 缓存策略

```typescript
// build/cache-config.ts
export const cacheConfig = {
  // 文件哈希策略
  fileHashing: {
    // 内容哈希用于长期缓存
    assets: '[name].[contenthash:8].[ext]',
    chunks: '[name].[contenthash:8].js',

    // 版本哈希用于版本控制
    entries: '[name].[hash:8].js'
  },

  // 缓存组配置
  cacheGroups: {
    // 第三方库
    vendor: {
      test: /\/node_modules\//,
      name: 'vendors',
      chunks: 'all',
      priority: 10,
      reuseExistingChunk: true
    },

    // 公共代码
    common: {
      name: 'common',
      minChunks: 2,
      chunks: 'all',
      priority: 5,
      reuseExistingChunk: true
    },

    // 样式文件
    styles: {
      name: 'styles',
      test: /\.(css|scss|sass|less)$/,
      chunks: 'all',
      priority: 15,
      reuseExistingChunk: true
    }
  }
}
```

### 构建性能优化

```typescript
// build/performance.config.ts
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  // 构建性能优化
  build: {
    // 启用多线程
    minify: 'terser',
    terserOptions: {
      parallel: true,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },

    // 预构建优化
    rollupOptions: {
      // 外部依赖
      external: ['vue', 'vue-router'],

      // 输出配置
      output: {
        // 手动分包
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue')) {
              return 'vue-vendor'
            }
            if (id.includes('lodash')) {
              return 'utils-vendor'
            }
            if (id.includes('element-plus')) {
              return 'ui-vendor'
            }
            return 'vendor'
          }

          if (id.includes('src/components')) {
            return 'components'
          }

          if (id.includes('src/utils')) {
            return 'utils'
          }
        }
      }
    }
  },

  // 依赖预构建
  optimizeDeps: {
    // 强制预构建
    include: [
      'vue',
      'vue-router',
      '@ldesign/engine',
      'lodash-es',
      'dayjs'
    ],

    // 排除预构建
    exclude: [
      'some-esm-dep'
    ]
  },

  // 解析配置
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      '@components': resolve(__dirname, '../src/components'),
      '@utils': resolve(__dirname, '../src/utils'),
      '@assets': resolve(__dirname, '../src/assets')
    }
  }
})
```

### 构建监控

```typescript
// build/monitor.ts
import { gzipSync } from 'node:zlib'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { Plugin } from 'vite'

interface BuildStats {
  files: Array<{
    name: string
    size: number
    gzipSize: number
    type: 'js' | 'css' | 'asset'
  }>
  totalSize: number
  totalGzipSize: number
  buildTime: number
}

export function buildMonitorPlugin(): Plugin {
  let startTime: number
  const stats: BuildStats = {
    files: [],
    totalSize: 0,
    totalGzipSize: 0,
    buildTime: 0
  }

  return {
    name: 'build-monitor',

    buildStart() {
      startTime = Date.now()
      console.log('🚀 开始构建...')
    },

    generateBundle(options, bundle) {
      Object.keys(bundle).forEach((fileName) => {
        const chunk = bundle[fileName]

        if (chunk.type === 'chunk' || chunk.type === 'asset') {
          const content = chunk.type === 'chunk' ? chunk.code : chunk.source
          const size = Buffer.byteLength(content, 'utf8')
          const gzipSize = gzipSync(content).length

          let type: 'js' | 'css' | 'asset' = 'asset'
          if (fileName.endsWith('.js'))
type = 'js'
          else if (fileName.endsWith('.css'))
type = 'css'

          stats.files.push({
            name: fileName,
            size,
            gzipSize,
            type
          })

          stats.totalSize += size
          stats.totalGzipSize += gzipSize
        }
      })
    },

    buildEnd() {
      stats.buildTime = Date.now() - startTime
      this.generateBuildReport(stats)
    },

    generateBuildReport(stats: BuildStats) {
      console.log('\n📊 构建报告:')
      console.log('='.repeat(50))

      // 按类型分组
      const byType = stats.files.reduce((acc, file) => {
        if (!acc[file.type])
acc[file.type] = []
        acc[file.type].push(file)
        return acc
      }, {} as Record<string, typeof stats.files>)

      // 显示各类型文件
      Object.keys(byType).forEach((type) => {
        const files = byType[type]
        const totalSize = files.reduce((sum, f) => sum + f.size, 0)
        const totalGzipSize = files.reduce((sum, f) => sum + f.gzipSize, 0)

        console.log(`\n${type.toUpperCase()} 文件:`)
        files.forEach((file) => {
          console.log(`  ${file.name}: ${this.formatSize(file.size)} (gzip: ${this.formatSize(file.gzipSize)})`)
        })
        console.log(`  小计: ${this.formatSize(totalSize)} (gzip: ${this.formatSize(totalGzipSize)})`)
      })

      // 总计
      console.log(`\n📦 总大小: ${this.formatSize(stats.totalSize)}`)
      console.log(`🗜️ Gzip 大小: ${this.formatSize(stats.totalGzipSize)}`)
      console.log(`⏱️ 构建时间: ${stats.buildTime}ms`)

      // 性能建议
      this.generatePerformanceAdvice(stats)
    },

    formatSize(bytes: number): string {
      const sizes = ['B', 'KB', 'MB', 'GB']
      if (bytes === 0)
return '0 B'
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return `${Math.round(bytes / 1024 ** i * 100) / 100} ${sizes[i]}`
    },

    generatePerformanceAdvice(stats: BuildStats) {
      console.log('\n💡 性能建议:')

      // 检查大文件
      const largeFiles = stats.files.filter(f => f.size > 500 * 1024) // 500KB
      if (largeFiles.length > 0) {
        console.log('⚠️ 发现大文件:')
        largeFiles.forEach((file) => {
          console.log(`  - ${file.name}: ${this.formatSize(file.size)}`)
        })
        console.log('  建议: 考虑代码分割或懒加载')
      }

      // 检查压缩率
      const compressionRatio = stats.totalGzipSize / stats.totalSize
      if (compressionRatio > 0.7) {
        console.log('⚠️ 压缩率较低，建议检查是否有重复代码或未压缩的资源')
      }

      // 检查构建时间
      if (stats.buildTime > 60000) {
        console.log('⚠️ 构建时间较长，建议优化构建配置或使用缓存')
      }
    }
  }
}
```

## 构建脚本自动化

### 自动化构建脚本

```bash
#!/bin/bash
# build.sh

set -e

echo "🚀 开始自动化构建流程"

# 环境检查
echo "📋 检查环境..."
node --version
npm --version

# 清理
echo "🧹 清理旧文件..."
rm -rf dist dist-*

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 代码检查
echo "🔍 代码检查..."
npm run lint
npm run type-check

# 运行测试
echo "🧪 运行测试..."
npm run test

# 构建
echo "🏗️ 开始构建..."
case "$1" in
  "dev")
    npm run build:dev
    ;;
  "test")
    npm run build:test
    ;;
  "prod")
    npm run build:prod
    ;;
  *)
    echo "使用方法: $0 {dev|test|prod}"
    exit 1
    ;;
esac

# 构建分析
echo "📊 构建分析..."
npm run analyze

# 生成报告
echo "📄 生成构建报告..."
node scripts/generate-build-report.js

echo "✅ 构建完成!"
```

### 构建报告生成

```javascript
// scripts/generate-build-report.js
const fs = require('node:fs')
const path = require('node:path')
const { gzipSync } = require('node:zlib')

function generateBuildReport() {
  const distDir = path.resolve(__dirname, '../dist')
  const reportPath = path.resolve(__dirname, '../build-report.json')

  if (!fs.existsSync(distDir)) {
    console.error('构建目录不存在')
    return
  }

  const report = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    files: [],
    summary: {
      totalFiles: 0,
      totalSize: 0,
      totalGzipSize: 0
    }
  }

  function scanDirectory(dir, relativePath = '') {
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
      const filePath = path.join(dir, file)
      const relativeFilePath = path.join(relativePath, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        scanDirectory(filePath, relativeFilePath)
      }
 else {
        const content = fs.readFileSync(filePath)
        const size = stat.size
        const gzipSize = gzipSync(content).length

        report.files.push({
          path: relativeFilePath,
          size,
          gzipSize,
          type: path.extname(file).slice(1) || 'unknown'
        })

        report.summary.totalFiles++
        report.summary.totalSize += size
        report.summary.totalGzipSize += gzipSize
      }
    })
  }

  scanDirectory(distDir)

  // 按大小排序
  report.files.sort((a, b) => b.size - a.size)

  // 写入报告
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('📄 构建报告已生成:', reportPath)
  console.log('📊 总文件数:', report.summary.totalFiles)
  console.log('📦 总大小:', formatSize(report.summary.totalSize))
  console.log('🗜️ Gzip 大小:', formatSize(report.summary.totalGzipSize))
}

function formatSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0)
return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round(bytes / 1024 ** i * 100) / 100} ${sizes[i]}`
}

generateBuildReport()
```

## 总结

构建配置是现代前端应用开发的重要环节。通过合理的构建配置，您可以：

### 关键配置要点

1. **多环境支持**：为不同环境配置不同的构建参数
2. **代码分割**：合理分割代码以优化加载性能
3. **资源优化**：压缩和优化各种资源文件
4. **缓存策略**：利用浏览器缓存提升用户体验
5. **构建监控**：监控构建过程和结果
6. **自动化流程**：自动化构建、测试和部署流程

### 性能优化建议

- 使用适当的代码分割策略
- 启用 Tree Shaking 去除无用代码
- 优化图片和字体资源
- 配置合理的缓存策略
- 监控构建产物大小
- 使用 CDN 加速资源加载

通过这些配置和优化，您可以构建出高性能、可维护的 @ldesign/engine 应用。

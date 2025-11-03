# 常见问题

本文档收集了使用 LDesign Engine 时的常见问题和解答。

## 基础问题

### Q: LDesign Engine 是什么？

**A:** LDesign Engine 是一个现代化、跨框架的应用引擎，提供统一的插件系统、状态管理、事件系统等核心功能。它支持 **Vue 3、React、Angular、Svelte、Solid.js** 等主流框架，让你可以用相同的 API 在不同框架中构建应用。

### Q: LDesign Engine 与其他框架有什么区别？

**A:** LDesign Engine 不仅仅是一个组件库或状态管理库，而是一个完整的应用基础设施。它提供：

- 🔌 **插件化架构** - 模块化扩展能力
- ⚡ **中间件系统** - 请求/响应处理管道
- 📡 **事件系统** - 全局通信机制
- 💾 **状态管理** - 响应式状态管理
- 🛡️ **安全管理** - 内置安全防护
- ⚡ **性能监控** - 实时性能分析
- 🔧 **开发工具** - 完整的开发体验

### Q: 是否可以在现有的 Vue 项目中使用？

**A:** 是的，LDesign Engine 设计为渐进式采用：

```typescript
// 在现有项目中逐步引入
import { createEngine } from '@ldesign/engine'

// 只使用需要的功能
const engine = createEngine({
  config: { debug: true },
  // 只启用需要的模块
})

// 与现有 Vue 应用集成
app.use(engine)
```

### Q: 支持哪些框架和版本？

**A:** LDesign Engine 支持以下框架：

| 框架 | 支持版本 | 适配器包 | 状态 |
|------|----------|----------|------|
| **Vue 3** | 3.3+ (推荐), 3.2+ | `@ldesign/engine-vue` | ✅ 完整支持 |
| **React** | 18+ | `@ldesign/engine-react` | ✅ 完整支持 |
| **Angular** | 18+ | `@ldesign/engine-angular` | ✅ 完整支持 |
| **Svelte** | 4+ | `@ldesign/engine-svelte` | ✅ 完整支持 |
| **Solid.js** | 1.8+ | `@ldesign/engine-solid` | ✅ 完整支持 |
| Vue 2.x | - | - | ❌ 不支持 |

### Q: 是否支持 TypeScript？

**A:** 完全支持！LDesign Engine 使用 TypeScript 开发，提供：

- 完整的类型定义
- 智能代码提示
- 编译时类型检查
- 泛型支持

```typescript
import type { Engine, EngineConfig, Plugin } from '@ldesign/engine'

const config: EngineConfig = {
  debug: true,
  appName: 'My App',
}

const plugin: Plugin = {
  name: 'my-plugin',
  install: (engine: Engine) => {
    // 类型安全的插件开发
  },
}
```

## 安装和配置

### Q: 如何选择合适的安装方式？

**A:** 根据项目需求选择：

```bash
# 完整安装（推荐）
pnpm add @ldesign/engine

# 按需安装（高级用户）
pnpm add @ldesign/engine-core
pnpm add @ldesign/engine-plugins
pnpm add @ldesign/engine-vue
```

### Q: 如何配置开发和生产环境？

**A:** 使用环境配置：

```typescript
import { createEngine, presets } from '@ldesign/engine'

// 开发环境
const devEngine = createEngine({
  ...presets.development(),
  config: {
    debug: true,
    logLevel: 'debug',
  },
})

// 生产环境
const prodEngine = createEngine({
  ...presets.production(),
  config: {
    debug: false,
    logLevel: 'error',
    enableErrorReporting: true,
  },
})
```

### Q: 如何处理包体积问题？

**A:** 使用 Tree Shaking 和按需加载：

```typescript
// 只导入需要的功能
import { createEngine } from '@ldesign/engine/core'
import { eventsPlugin } from '@ldesign/engine/events'
import { statePlugin } from '@ldesign/engine/state'

const engine = createEngine({
  plugins: [statePlugin, eventsPlugin],
})

// 动态导入大型插件
async function loadHeavyPlugin() {
  const { heavyPlugin } = await import('@ldesign/engine/heavy-plugin')
  engine.use(heavyPlugin)
}
```

## 功能使用

### Q: 如何在组件中访问引擎实例？

**A:** 有多种方式：

```typescript
import type { Engine } from '@ldesign/engine'
// 2. 使用 composable
import { useEngine } from '@ldesign/engine/vue'

// 1. 使用 inject (推荐)
import { inject } from 'vue'

export default {
  setup() {
    const engine = inject<Engine>('engine')
    return { engine }
  },
}

export default {
  setup() {
    const engine = useEngine()
    return { engine }
  },
}

// 3. 全局属性
export default {
  mounted() {
    this.$engine.logger.info('组件已挂载')
  },
}
```

### Q: 如何在插件之间共享数据？

**A:** 使用状态管理和事件系统：

```typescript
// 插件 A：设置共享数据
const pluginA = {
  name: 'plugin-a',
  install: (engine) => {
    engine.state.set('shared.data', { value: 42 })
    engine.events.emit('plugin-a:ready', { data: 'hello' })
  },
}

// 插件 B：使用共享数据
const pluginB = {
  name: 'plugin-b',
  dependencies: ['plugin-a'],
  install: (engine) => {
    // 获取共享状态
    const sharedData = engine.state.get('shared.data')

    // 监听其他插件事件
    engine.events.on('plugin-a:ready', (data) => {
      console.log('收到插件A的数据:', data)
    })
  },
}
```

### Q: 如何处理异步插件加载？

**A:** 使用异步插件模式：

```typescript
const asyncPlugin = {
  name: 'async-plugin',
  install: async (engine) => {
    // 异步初始化
    const config = await fetch('/api/plugin-config').then(r => r.json())

    engine.state.set('plugin.config', config)

    // 通知插件就绪
    engine.events.emit('async-plugin:ready')
  },
}

// 等待异步插件就绪
engine.events.once('async-plugin:ready', () => {
  console.log('异步插件已就绪')
})
```

### Q: 如何实现状态持久化？

**A:** 配置状态持久化：

```typescript
const engine = createEngine({
  state: {
    persistence: {
      enabled: true,
      storage: 'localStorage', // 或 'sessionStorage', 'indexedDB'
      keys: ['user', 'settings', 'preferences'],
      prefix: 'myapp:',

      // 自定义序列化
      serialize: data => JSON.stringify(data),
      deserialize: data => JSON.parse(data),

      // 加密存储
      encryption: {
        enabled: true,
        key: 'your-encryption-key',
      },
    },
  },
})
```

## 性能优化

### Q: 如何优化应用启动性能？

**A:** 使用以下策略：

```typescript
// 1. 延迟加载非关键插件
const engine = createEngine({
  plugins: [
    // 只加载关键插件
    corePlugin,
    authPlugin,
  ],
})

// 延迟加载其他插件
requestIdleCallback(() => {
  engine.use(analyticsPlugin)
  engine.use(chatPlugin)
})

// 2. 使用插件预加载
engine.preloadPlugins(['analytics', 'chat'])

// 3. 状态预热
engine.state.preload(['user', 'settings'])
```

### Q: 如何监控和优化内存使用？

**A:** 使用性能监控：

```typescript
// 启用内存监控
const engine = createEngine({
  performance: {
    enabled: true,
    memoryMonitoring: true,

    // 内存阈值警告
    memoryThreshold: 50 * 1024 * 1024, // 50MB

    // 自动清理
    autoCleanup: true,
  },
})

// 监听内存警告
engine.events.on('performance:memory-warning', (info) => {
  console.warn('内存使用过高:', info)

  // 执行清理操作
  engine.cache.cleanup()
  engine.state.cleanup()
})

// 手动内存分析
const memoryInfo = engine.performance.getMemoryInfo()
console.log('内存使用情况:', memoryInfo)
```

### Q: 如何优化事件系统性能？

**A:** 使用事件优化技巧：

```typescript
// 1. 使用事件命名空间
engine.events.on('user:*', handler) // 监听所有用户事件

// 2. 事件节流
const throttledHandler = engine.utils.throttle(handler, 100)
engine.events.on('scroll', throttledHandler)

// 3. 事件批处理
engine.events.batch('analytics', 10, 1000).on((events) => {
  // 批量处理分析事件
  sendAnalytics(events)
})

// 4. 及时清理监听器
const unsubscribe = engine.events.on('data:update', handler)
// 组件销毁时清理
onUnmounted(() => unsubscribe())
```

## 错误处理

### Q: 如何处理插件加载错误？

**A:** 使用错误处理策略：

```typescript
// 1. 插件级错误处理
const robustPlugin = {
  name: 'robust-plugin',
  install: (engine) => {
    try {
      // 插件初始化逻辑
      initializePlugin()
    }
    catch (error) {
      engine.logger.error('插件初始化失败:', error)

      // 降级处理
      initializeFallback()
    }
  },
}

// 2. 全局插件错误处理
engine.events.on('plugin:error', ({ plugin, error }) => {
  console.error(`插件 ${plugin.name} 出错:`, error)

  // 可选择禁用有问题的插件
  engine.plugins.disable(plugin.name)
})

// 3. 插件依赖错误处理
const dependentPlugin = {
  name: 'dependent-plugin',
  dependencies: ['base-plugin'],
  install: (engine) => {
    if (!engine.plugins.isRegistered('base-plugin')) {
      throw new Error('依赖插件未找到')
    }
  },
}
```

### Q: 如何调试状态管理问题？

**A:** 使用调试工具：

```typescript
// 1. 启用状态调试
const engine = createEngine({
  config: { debug: true },
  state: {
    debug: true,

    // 状态变化日志
    logChanges: true,

    // 状态历史记录
    history: {
      enabled: true,
      maxSize: 50,
    },
  },
})

// 2. 监听所有状态变化
engine.state.subscribe('*', (key, newValue, oldValue) => {
  console.log(`状态变化: ${key}`, { oldValue, newValue })
})

// 3. 状态快照和回滚
const snapshot = engine.state.createSnapshot()
// ... 执行操作
engine.state.restoreSnapshot(snapshot)

// 4. 开发者工具集成
if (process.env.NODE_ENV === 'development') {
  window.__ENGINE_STATE__ = engine.state
}
```

## 部署和生产

### Q: 如何准备生产环境部署？

**A:** 使用生产环境配置：

```typescript
const productionEngine = createEngine({
  config: {
    debug: false,
    logLevel: 'error',
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
  },

  security: {
    xss: { enabled: true },
    csrf: { enabled: true },
    csp: { enabled: true },
  },

  performance: {
    enabled: true,
    autoOptimization: true,

    // 生产环境性能预算
    budget: {
      fcp: 1500,
      lcp: 2500,
      fid: 100,
    },
  },
})
```

### Q: 如何监控生产环境性能？

**A:** 配置监控和报告：

```typescript
const engine = createEngine({
  performance: {
    enabled: true,

    // 性能数据上报
    reporting: {
      enabled: true,
      endpoint: '/api/performance',
      interval: 30000,

      // 只上报关键指标
      metrics: ['fcp', 'lcp', 'fid', 'cls'],
    },
  },

  // 错误报告
  errorReporting: {
    enabled: true,
    endpoint: '/api/errors',

    // 错误过滤
    filter: (error) => {
      // 过滤掉网络错误等
      return !error.message.includes('Network Error')
    },
  },
})
```

### Q: 如何进行版本升级？

**A:** 遵循升级指南：

1. **检查变更日志** - 了解破坏性变更
2. **更新依赖** - 逐步更新相关依赖
3. **运行测试** - 确保功能正常
4. **渐进式部署** - 使用蓝绿部署或金丝雀发布

```bash
# 检查当前版本
pnpm list @ldesign/engine

# 查看可用版本
pnpm view @ldesign/engine versions --json

# 升级到最新版本
pnpm update @ldesign/engine

# 运行测试
pnpm test
```

## 社区和支持

### Q: 如何贡献代码？

**A:** 欢迎贡献！请查看 [贡献指南](https://github.com/ldesign/engine/blob/main/CONTRIBUTING.md)。

### Q: 如何报告 Bug？

**A:** 在 [GitHub Issues](https://github.com/ldesign/engine/issues) 提交，请包含：

- 详细的错误描述
- 重现步骤
- 环境信息
- 最小重现示例

### Q: 如何获取技术支持？

**A:** 多种方式获取帮助：

- 📖 [官方文档](https://ldesign.github.io/engine/)
- 💬 [GitHub Discussions](https://github.com/ldesign/engine/discussions)
- 🏷️ [Stack Overflow](https://stackoverflow.com/questions/tagged/ldesign-engine)
- 📧 [邮件支持](mailto:support@ldesign.com)

## 跨框架使用

### Q: 如何在 Vue 项目中使用？

**A:** 安装 Vue 适配器：

```bash
pnpm add @ldesign/engine-core @ldesign/engine-vue
```

```typescript
// main.ts
import { createApp } from 'vue'
import { 
  createCoreEngine,
  createI18nPlugin,
  createThemePlugin 
} from '@ldesign/engine-core'
import { VueEnginePlugin } from '@ldesign/engine-vue'
import App from './App.vue'

const engine = createCoreEngine({
  name: 'my-app',
  plugins: [
    createI18nPlugin({ /* ... */ }),
    createThemePlugin({ /* ... */ })
  ]
})

await engine.initialize()

const app = createApp(App)
app.use(VueEnginePlugin, { engine })
app.mount('#app')
```

在组件中使用 Composables：

```vue
<script setup>
import { useEngine, useI18n, useTheme } from '@ldesign/engine-vue'

const engine = useEngine()
const { t, locale, setLocale } = useI18n()
const { theme, setTheme } = useTheme()
</script>
```

### Q: 如何在 React 项目中使用？

**A:** 安装 React 适配器：

```bash
pnpm add @ldesign/engine-core @ldesign/engine-react
```

```tsx
// main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { 
  createCoreEngine,
  createI18nPlugin,
  createThemePlugin 
} from '@ldesign/engine-core'
import { EngineProvider } from '@ldesign/engine-react'
import App from './App'

const engine = createCoreEngine({
  name: 'my-app',
  plugins: [
    createI18nPlugin({ /* ... */ }),
    createThemePlugin({ /* ... */ })
  ]
})

await engine.initialize()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EngineProvider engine={engine}>
      <App />
    </EngineProvider>
  </React.StrictMode>
)
```

在组件中使用 Hooks：

```tsx
import { useEngine, useI18n, useTheme } from '@ldesign/engine-react'

function MyComponent() {
  const engine = useEngine()
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  
  return <div>{t('hello')}</div>
}
```

### Q: 如何在 Angular 项目中使用？

**A:** 安装 Angular 适配器：

```bash
pnpm add @ldesign/engine-core @ldesign/engine-angular
```

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core'
import { 
  createCoreEngine,
  createI18nPlugin,
  createThemePlugin 
} from '@ldesign/engine-core'
import { provideEngine } from '@ldesign/engine-angular'

const engine = createCoreEngine({
  name: 'my-app',
  plugins: [
    createI18nPlugin({ /* ... */ }),
    createThemePlugin({ /* ... */ })
  ]
})

await engine.initialize()

export const appConfig: ApplicationConfig = {
  providers: [
    provideEngine(engine)
  ]
}
```

在组件中注入服务：

```typescript
import { Component, inject } from '@angular/core'
import { EngineService, I18nService, ThemeService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-root',
  template: `<h1>{{ t('hello') }}</h1>`
})
export class AppComponent {
  private engine = inject(EngineService)
  private i18n = inject(I18nService)
  private theme = inject(ThemeService)
  
  t = this.i18n.translate.bind(this.i18n)
}
```

### Q: 如何在多个框架之间共享配置？

**A:** 将公共配置抽离到单独的文件：

```typescript
// shared/engine-config.ts
import { createI18nPlugin, createThemePlugin, createSizePlugin } from '@ldesign/engine-core'

export const sharedPlugins = [
  createI18nPlugin({
    locale: 'en-US',
    fallbackLocale: 'en-US',
    messages: {
      'en-US': {
        hello: 'Hello',
        welcome: 'Welcome'
      },
      'zh-CN': {
        hello: '你好',
        welcome: '欢迎'
      }
    }
  }),
  
  createThemePlugin({
    defaultTheme: 'light',
    themes: {
      light: { colors: { primary: '#1890ff' } },
      dark: { colors: { primary: '#177ddc' } }
    }
  }),
  
  createSizePlugin({
    defaultSize: 'medium'
  })
]

export const createSharedEngine = (name: string) => {
  return createCoreEngine({
    name,
    plugins: sharedPlugins
  })
}
```

然后在不同框架中导入：

```typescript
// Vue
import { createSharedEngine } from '@/shared/engine-config'
const engine = createSharedEngine('vue-app')

// React
import { createSharedEngine } from '@/shared/engine-config'
const engine = createSharedEngine('react-app')
```

### Q: 可以在同一个项目中混用多个框架吗？

**A:** 可以！Engine 支持微前端架构，你可以在不同的微应用中使用不同的框架，但共享同一个 Engine 实例。查看 [Micro-Frontend Guide](./micro-frontend.md) 了解更多。

### Q: 如何从某个框架迁移到另一个框架？

**A:** Engine 的设计让框架迁移变得更简单：

1. **业务逻辑保持不变** - 所有核心功能和插件都是框架无关的
2. **只需更换适配器** - 将 `@ldesign/engine-vue` 换成 `@ldesign/engine-react`
3. **API 一致性** - Composables/Hooks/Services 提供相同的 API

示例：

```typescript
// Vue
const { t } = useI18n()

// React  
const { t } = useI18n()

// Angular
const i18n = inject(I18nService)
const t = i18n.translate.bind(i18n)
```

## 架构和设计

### Q: Engine 的架构是怎样的？

**A:** Engine 采用三层架构：

```
╔══════════════════════════════════╗
║  框架层 (Framework Layer)      ║
║  Vue | React | Angular | ...     ║
╠══════════════════════════════════╣
║  适配器层 (Adapter Layer)      ║
║  响应式集成 | 生命周期管理    ║
╠══════════════════════════════════╣
║  核心层 (Core Layer)            ║
║  引擎 | 插件 | 事件 | 状态      ║
╚══════════════════════════════════╝
```

- **核心层**: 完全框架无关，包含所有业务逻辑
- **适配器层**: 桥接核心和具体框架
- **框架层**: 提供框架特定的 API

### Q: 为什么需要同时安装 `engine-core` 和框架适配器？

**A:** 这是模块化设计的优势：

1. **按需安装** - 只安装需要的框架适配器
2. **更小的 Bundle** - Tree-shaking 友好
3. **独立版本** - 核心和适配器可以独立升级
4. **更好的维护性** - 清晰的依赖关系

### Q: 插件系统是如何工作的？

**A:** 插件是扩展 Engine 功能的标准方式：

```typescript
// 创建插件
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  dependencies: ['other-plugin'], // 可选
  
  install(engine) {
    // 注册功能
    engine.state.set('plugin-data', {})
    
    // 监听事件
    engine.events.on('app:ready', () => {
      console.log('App is ready')
    })
    
    // 扩展 engine
    engine.myFeature = () => {
      // 自定义功能
    }
  },
  
  uninstall(engine) {
    // 清理资源
  }
}

// 使用插件
engine.use(myPlugin)
```

如果你的问题没有在这里找到答案，请查看 [故障排除指南](./troubleshooting.md) 或在社区寻求帮助。

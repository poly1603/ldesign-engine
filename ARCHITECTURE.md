# @ldesign/engine 架构设计文档

## 📋 目录
- [概述](#概述)
- [设计原则](#设计原则)
- [架构层次](#架构层次)
- [核心包职责](#核心包职责)
- [框架适配器职责](#框架适配器职责)
- [插件系统设计](#插件系统设计)
- [目录结构](#目录结构)
- [迁移计划](#迁移计划)

## 概述

@ldesign/engine 是一个**多框架通用的应用引擎**,提供插件系统、中间件、状态管理、事件系统等核心功能。

### 核心目标
1. **框架无关**: 核心功能不依赖任何框架,可在任何 JavaScript 环境运行
2. **一致性**: 所有框架适配器提供一致的 API 和使用体验
3. **可扩展性**: 通过插件系统轻松扩展功能(如 i18n、主题、尺寸等)
4. **类型安全**: 完整的 TypeScript 类型支持
5. **高性能**: 优化的性能和最小化的打包体积

## 设计原则

### 1. 关注点分离
```
┌─────────────────────────────────────┐
│     Framework-Specific Layer        │  <- Vue/React/Angular 等框架特定代码
│   (Framework Adapters & Bindings)   │
├─────────────────────────────────────┤
│      Framework Adapter Layer        │  <- 框架适配器抽象层
│    (Unified Framework Interface)    │
├─────────────────────────────────────┤
│         Core Engine Layer           │  <- 框架无关的核心功能
│  (Plugin, State, Events, Lifecycle) │
└─────────────────────────────────────┘
```

### 2. 依赖方向
- ✅ 框架层 → 适配器层 → 核心层
- ❌ 核心层不能依赖框架层
- ❌ 核心层不能依赖适配器层

### 3. 一致性原则
所有框架适配器必须提供一致的API:
```typescript
// Vue
const engine = await createEngineApp({ ... })

// React
const engine = await createEngineApp({ ... })

// Angular
const engine = await createEngineApp({ ... })
```

## 架构层次

### Layer 1: @ldesign/engine-core (核心层)
**完全框架无关**,包含所有通用功能:

#### 核心模块
- **Plugin System** (插件管理)
  - 插件注册、卸载、生命周期
  - 依赖解析和版本管理
  - 插件共享状态
  
- **Middleware System** (中间件系统)
  - 中间件注册和执行
  - 洋葱模型实现
  - 错误处理
  
- **Event System** (事件系统)
  - 事件发布/订阅
  - 事件优先级
  - 事件重放和调试
  
- **State Management** (状态管理)
  - 状态存储和更新
  - 时间旅行(Time-travel)
  - 分布式同步
  
- **Lifecycle Management** (生命周期管理)
  - 统一的生命周期钩子
  - 异步生命周期支持
  
- **Cache System** (缓存系统)
  - 多级缓存
  - LRU/LFU 策略
  - 智能缓存管理
  
- **Logger System** (日志系统)
  - 分级日志
  - 日志过滤和格式化
  - 性能分析
  
- **Config System** (配置管理)
  - 配置加载和合并
  - 动态配置更新
  - 配置验证
  
- **DI Container** (依赖注入)
  - 服务注册和解析
  - 作用域管理
  - 循环依赖检测

#### 高级模块
- **Performance** (性能监控)
  - 性能指标收集
  - 性能预算
  - 虚拟滚动
  
- **Security** (安全管理)
  - XSS 防护
  - CSRF 防护
  - 内容安全策略
  
- **Notifications** (通知系统)
  - 消息队列
  - 动画管理
  - 样式管理
  
- **HMR** (热模块替换)
  - 模块热更新
  - 状态保持
  
- **DevTools** (开发工具)
  - 事件流可视化
  - 内存时间线
  - 性能火焰图
  
- **Workers** (Web Workers)
  - 后台任务处理
  - 线程池管理
  
- **Micro-Frontend** (微前端)
  - 应用加载和卸载
  - 应用通信
  
- **AI Integration** (AI 集成)
  - AI 模型集成
  - 智能助手

#### 适配器抽象
- **Framework Adapter Interface**
  - 状态适配器接口
  - 事件适配器接口
  - 生命周期映射
  - 应用创建/挂载/销毁

### Layer 2: Framework Adapters (适配器层)
**框架特定的适配器实现**:

#### Vue Adapter (@ldesign/engine-vue)
```typescript
// 实现框架适配器接口
export class VueFrameworkAdapter implements FrameworkAdapter {
  createApp(rootComponent, options) { /* Vue 特定实现 */ }
  mount(app, element) { /* Vue 特定实现 */ }
  createStateAdapter() { /* 使用 Vue reactive */ }
  createEventAdapter() { /* 使用 Vue event emitter */ }
  // ...
}

// 提供 Vue 专用 API
export class Vue3EngineImpl extends CoreEngineImpl {
  app?: App
  // Vue 特定方法
}

// 组合式 API
export function useEngine() { /* ... */ }
export function usePlugin(name) { /* ... */ }

// 指令系统
export const vLoading = { /* ... */ }
```

#### React Adapter (@ldesign/engine-react)
```typescript
// 实现框架适配器接口
export class ReactFrameworkAdapter implements FrameworkAdapter {
  createApp(rootComponent, options) { /* React 特定实现 */ }
  mount(app, element) { /* React 特定实现 */ }
  createStateAdapter() { /* 使用 React state */ }
  createEventAdapter() { /* 使用 React event system */ }
  // ...
}

// 提供 React 专用 API
export class ReactEngineImpl extends CoreEngineImpl {
  root?: ReactRoot
  // React 特定方法
}

// Hooks
export function useEngine() { /* ... */ }
export function usePlugin(name) { /* ... */ }

// 组件
export const EngineProvider: FC<{ engine }> = ({ children }) => { /* ... */ }
```

#### 其他适配器
- Angular (@ldesign/engine-angular)
- Svelte (@ldesign/engine-svelte)
- Solid (@ldesign/engine-solid)
- Alpine.js (@ldesign/engine-alpinejs)
- Qwik (@ldesign/engine-qwik)
- 等等...

### Layer 3: 主包 (@ldesign/engine)
**聚合所有功能**,提供便捷的导入:

```typescript
// 重新导出核心功能
export * from '@ldesign/engine-core'

// 重新导出 Vue 集成 (默认)
export * from '@ldesign/engine-vue'

// 可选导出其他框架
// export * from '@ldesign/engine-react'
```

## 核心包职责

### @ldesign/engine-core

#### 必须包含
✅ 所有框架无关的业务逻辑
✅ 插件管理器、中间件管理器
✅ 事件系统、状态管理
✅ 生命周期管理
✅ 缓存、日志、配置
✅ 性能监控、安全管理
✅ 通知系统、HMR 支持
✅ 开发工具集成
✅ Workers、微前端
✅ AI 集成

#### 不能包含
❌ 任何框架特定代码 (Vue, React, etc.)
❌ 框架特定的响应式系统
❌ 框架特定的组件/指令
❌ DOM 操作 (除非是通用的)

#### 导出结构
```typescript
// 核心引擎
export { CoreEngineImpl, createCoreEngine }

// 适配器接口
export type { FrameworkAdapter, StateAdapter, EventAdapter }
export { FrameworkAdapterRegistry }

// 管理器
export type { PluginManager, MiddlewareManager, EventManager, ... }
export { createPluginManager, createMiddlewareManager, ... }

// 类型
export type * from './types'

// 工具
export * from './utils'
```

## 框架适配器职责

### 框架适配器包 (@ldesign/engine-{framework})

#### 必须包含
✅ 框架适配器实现 (实现 `FrameworkAdapter` 接口)
✅ 框架特定的引擎包装类 (继承 `CoreEngineImpl`)
✅ 框架特定的 API (Vue: composables, React: hooks)
✅ 框架特定的组件/指令
✅ 框架特定的状态桥接
✅ 框架特定的事件集成

#### 实现要求
1. **实现 FrameworkAdapter 接口**
```typescript
export class VueFrameworkAdapter implements FrameworkAdapter<App, Component> {
  readonly info: FrameworkInfo = {
    name: 'vue',
    version: '3.x',
    features: {
      reactive: true,
      components: true,
      directives: true,
      slots: true
    }
  }
  
  createApp(rootComponent: Component, options?: any): App {
    const app = createApp(rootComponent, options)
    return app
  }
  
  async mount(app: App, element: string | Element): Promise<void> {
    app.mount(element)
  }
  
  async unmount(app: App): Promise<void> {
    app.unmount()
  }
  
  registerEngine(app: App, engine: CoreEngine): void {
    app.provide('engine', engine)
    app.config.globalProperties.$engine = engine
  }
  
  createStateAdapter(): StateAdapter {
    return new VueStateAdapter()
  }
  
  createEventAdapter(): EventAdapter {
    return new VueEventAdapter()
  }
  
  mapLifecycleHooks(): LifecycleHookMap {
    return {
      beforeMount: 'onBeforeMount',
      mounted: 'onMounted',
      beforeUpdate: 'onBeforeUpdate',
      updated: 'onUpdated',
      beforeUnmount: 'onBeforeUnmount',
      unmounted: 'onUnmounted'
    }
  }
}
```

2. **扩展核心引擎**
```typescript
export class Vue3EngineImpl extends CoreEngineImpl {
  private adapter: VueFrameworkAdapter
  app?: App
  
  constructor(config: CoreEngineConfig = {}) {
    super(config)
    this.adapter = new VueFrameworkAdapter()
  }
  
  createApp(rootComponent: Component): App {
    this.app = this.adapter.createApp(rootComponent)
    this.adapter.registerEngine(this.app, this)
    return this.app
  }
  
  async mount(element: string | Element): Promise<void> {
    if (!this.app) throw new Error('App not created')
    await this.adapter.mount(this.app, element)
  }
}
```

3. **提供一致的创建函数**
```typescript
export async function createEngineApp(
  options: Vue3EngineAppOptions
): Promise<Vue3Engine> {
  const engine = new Vue3EngineImpl(options.config)
  await engine.init()
  
  // 注册插件、中间件
  // ...
  
  return engine
}
```

## 插件系统设计

### 统一插件接口

所有插件遵循统一的接口,可在任何框架中使用:

```typescript
// 核心插件接口 (在 @ldesign/engine-core 中定义)
export interface Plugin {
  name: string
  version?: string
  dependencies?: string[]
  
  // 安装钩子
  install(context: PluginContext): void | Promise<void>
  beforeInstall?(context: PluginContext): void | Promise<void>
  afterInstall?(context: PluginContext): void | Promise<void>
  
  // 卸载钩子
  uninstall?(context: PluginContext): void | Promise<void>
  beforeUninstall?(context: PluginContext): void | Promise<void>
  afterUninstall?(context: PluginContext): void | Promise<void>
  
  // 配置
  config?: Record<string, any>
  defaultConfig?: Record<string, any>
}

// 插件上下文
export interface PluginContext {
  engine: CoreEngine
  logger: Logger
  config: ConfigManager
  events: EventManager
  state: StateManager
  cache: CacheManager
  // ...其他管理器
}
```

### 标准插件示例

#### 1. i18n 插件
```typescript
// packages/core/src/plugins/i18n-plugin.ts
export interface I18nPluginConfig {
  locale: string
  fallbackLocale: string
  messages: Record<string, Record<string, string>>
}

export function createI18nPlugin(config: I18nPluginConfig): Plugin {
  return {
    name: 'i18n',
    version: '1.0.0',
    
    install(context: PluginContext) {
      const { state, events } = context
      
      // 创建 i18n 状态
      state.setState('i18n', {
        currentLocale: config.locale,
        messages: config.messages
      })
      
      // 提供切换语言方法
      context.engine.setLocale = (locale: string) => {
        state.setState('i18n.currentLocale', locale)
        events.emit('locale:changed', { locale })
      }
      
      // 提供翻译方法
      context.engine.t = (key: string, params?: Record<string, any>) => {
        const locale = state.getState('i18n.currentLocale')
        const message = state.getState(`i18n.messages.${locale}.${key}`)
        // 处理占位符...
        return message
      }
    }
  }
}
```

#### 2. 主题插件
```typescript
// packages/core/src/plugins/theme-plugin.ts
export interface ThemePluginConfig {
  themes: Record<string, Record<string, string>>
  defaultTheme: string
}

export function createThemePlugin(config: ThemePluginConfig): Plugin {
  return {
    name: 'theme',
    version: '1.0.0',
    
    install(context: PluginContext) {
      const { state, events } = context
      
      // 初始化主题状态
      state.setState('theme', {
        current: config.defaultTheme,
        themes: config.themes
      })
      
      // 切换主题方法
      context.engine.setTheme = (themeName: string) => {
        const theme = config.themes[themeName]
        if (!theme) {
          throw new Error(`Theme "${themeName}" not found`)
        }
        
        // 应用 CSS 变量
        Object.entries(theme).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--${key}`, value)
        })
        
        state.setState('theme.current', themeName)
        events.emit('theme:changed', { theme: themeName })
      }
      
      // 应用默认主题
      context.engine.setTheme(config.defaultTheme)
    }
  }
}
```

#### 3. 尺寸插件
```typescript
// packages/core/src/plugins/size-plugin.ts
export interface SizePluginConfig {
  sizes: ('small' | 'medium' | 'large')[]
  defaultSize: 'small' | 'medium' | 'large'
}

export function createSizePlugin(config: SizePluginConfig): Plugin {
  return {
    name: 'size',
    version: '1.0.0',
    
    install(context: PluginContext) {
      const { state, events } = context
      
      state.setState('size', {
        current: config.defaultSize,
        available: config.sizes
      })
      
      context.engine.setSize = (size: string) => {
        if (!config.sizes.includes(size as any)) {
          throw new Error(`Size "${size}" not available`)
        }
        
        document.documentElement.setAttribute('data-size', size)
        state.setState('size.current', size)
        events.emit('size:changed', { size })
      }
      
      context.engine.setSize(config.defaultSize)
    }
  }
}
```

### 插件使用示例

```typescript
// 在任何框架中使用相同方式
import { createEngineApp } from '@ldesign/engine-vue' // or '@ldesign/engine-react'
import { createI18nPlugin } from '@ldesign/engine-core'
import { createThemePlugin } from '@ldesign/engine-core'
import { createSizePlugin } from '@ldesign/engine-core'

const engine = await createEngineApp({
  plugins: [
    createI18nPlugin({
      locale: 'zh-CN',
      fallbackLocale: 'en-US',
      messages: {
        'zh-CN': { hello: '你好' },
        'en-US': { hello: 'Hello' }
      }
    }),
    createThemePlugin({
      defaultTheme: 'light',
      themes: {
        light: { primary: '#007bff', background: '#ffffff' },
        dark: { primary: '#0056b3', background: '#1a1a1a' }
      }
    }),
    createSizePlugin({
      defaultSize: 'medium',
      sizes: ['small', 'medium', 'large']
    })
  ]
})

// 使用插件功能
engine.setLocale('en-US')
engine.setTheme('dark')
engine.setSize('large')
```

## 目录结构

```
packages/engine/
├── packages/
│   ├── core/                       # 核心包 (框架无关)
│   │   ├── src/
│   │   │   ├── adapters/          # 框架适配器接口
│   │   │   │   ├── framework-adapter.ts
│   │   │   │   ├── reactive-state-bridge.ts
│   │   │   │   └── index.ts
│   │   │   ├── plugin/            # 插件系统
│   │   │   │   ├── plugin-manager.ts
│   │   │   │   ├── plugins/       # 内置插件
│   │   │   │   │   ├── i18n-plugin.ts
│   │   │   │   │   ├── theme-plugin.ts
│   │   │   │   │   ├── size-plugin.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── middleware/        # 中间件系统
│   │   │   ├── events/            # 事件系统
│   │   │   ├── state/             # 状态管理
│   │   │   ├── lifecycle/         # 生命周期
│   │   │   ├── cache/             # 缓存系统
│   │   │   ├── logger/            # 日志系统
│   │   │   ├── config/            # 配置管理
│   │   │   ├── di/                # 依赖注入
│   │   │   ├── performance/       # 性能监控
│   │   │   ├── security/          # 安全管理
│   │   │   ├── notifications/     # 通知系统
│   │   │   ├── hmr/               # 热更新
│   │   │   ├── devtools/          # 开发工具
│   │   │   ├── workers/           # Web Workers
│   │   │   ├── micro-frontend/    # 微前端
│   │   │   ├── ai/                # AI 集成
│   │   │   ├── types/             # 类型定义
│   │   │   ├── utils/             # 工具函数
│   │   │   ├── errors/            # 错误处理
│   │   │   ├── core-engine.ts     # 核心引擎实现
│   │   │   └── index.ts
│   │   ├── examples/              # 核心包示例
│   │   │   └── basic/
│   │   │       ├── src/
│   │   │       ├── package.json
│   │   │       └── launcher.config.ts
│   │   ├── tests/                 # 测试
│   │   ├── docs/                  # 文档
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── vue/                        # Vue 适配器
│   │   ├── src/
│   │   │   ├── adapter/           # Vue 适配器实现
│   │   │   │   ├── vue-framework-adapter.ts
│   │   │   │   ├── vue-state-adapter.ts
│   │   │   │   ├── vue-event-adapter.ts
│   │   │   │   └── index.ts
│   │   │   ├── composables/       # 组合式 API
│   │   │   │   ├── use-engine.ts
│   │   │   │   ├── use-plugin.ts
│   │   │   │   └── index.ts
│   │   │   ├── directives/        # Vue 指令
│   │   │   │   ├── v-loading.ts
│   │   │   │   └── index.ts
│   │   │   ├── engine-app.ts      # Vue 引擎实现
│   │   │   ├── types.ts           # Vue 特定类型
│   │   │   └── index.ts
│   │   ├── examples/              # Vue 示例项目
│   │   │   └── basic/
│   │   │       ├── src/
│   │   │       │   ├── App.vue
│   │   │       │   └── main.ts
│   │   │       ├── package.json
│   │   │       └── launcher.config.ts
│   │   ├── docs/                  # Vue 文档
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── react/                      # React 适配器
│   │   ├── src/
│   │   │   ├── adapter/           # React 适配器实现
│   │   │   ├── hooks/             # React Hooks
│   │   │   ├── components/        # React 组件
│   │   │   ├── engine-app.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── examples/
│   │   ├── docs/
│   │   ├── tests/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── angular/                    # Angular 适配器
│   ├── solid/                      # Solid 适配器
│   ├── svelte/                     # Svelte 适配器
│   ├── alpinejs/                   # Alpine.js 适配器
│   ├── astro/                      # Astro 适配器
│   ├── lit/                        # Lit 适配器
│   ├── nextjs/                     # Next.js 适配器
│   ├── nuxtjs/                     # Nuxt.js 适配器
│   ├── preact/                     # Preact 适配器
│   ├── qwik/                       # Qwik 适配器
│   ├── remix/                      # Remix 适配器
│   └── sveltekit/                  # SvelteKit 适配器
│
├── src/                            # 主包 (聚合导出)
│   ├── index.ts                    # 默认导出 (core + vue)
│   ├── core.ts                     # 仅导出 core
│   ├── vue.ts                      # 仅导出 vue
│   ├── react.ts                    # 仅导出 react
│   └── ...
│
├── examples/                       # 综合示例
│   ├── vue-full-featured/         # Vue 完整功能示例
│   ├── react-full-featured/       # React 完整功能示例
│   └── ...
│
├── docs/                           # VitePress 文档
│   ├── .vitepress/
│   │   └── config.ts
│   ├── guide/
│   │   ├── getting-started.md
│   │   ├── core-concepts.md
│   │   ├── plugin-system.md
│   │   └── ...
│   ├── frameworks/
│   │   ├── vue.md
│   │   ├── react.md
│   │   └── ...
│   ├── api/
│   │   ├── core-engine.md
│   │   ├── plugin-manager.md
│   │   └── ...
│   ├── plugins/
│   │   ├── i18n.md
│   │   ├── theme.md
│   │   └── ...
│   └── index.md
│
├── tests/                          # 集成测试
│   ├── integration/
│   └── e2e/
│
├── package.json
├── ARCHITECTURE.md                 # 本文档
└── README.md
```

## 迁移计划

### Phase 1: 准备阶段
1. ✅ 创建架构文档
2. 分析现有代码,标识需要迁移的模块
3. 设置新的目录结构

### Phase 2: 核心迁移
1. 将框架无关代码迁移到 `@ldesign/engine-core`
2. 实现 `FrameworkAdapter` 接口
3. 创建响应式状态桥接器

### Phase 3: 适配器实现
1. 重构 Vue 适配器
2. 重构 React 适配器
3. 重构其他框架适配器

### Phase 4: 插件系统
1. 实现统一插件接口
2. 创建标准插件 (i18n, theme, size)
3. 迁移现有插件

### Phase 5: 示例和文档
1. 为每个框架创建示例项目
2. 编写 VitePress 文档
3. 创建迁移指南

### Phase 6: 测试和优化
1. 编写集成测试
2. 性能优化
3. Bundle size 优化

## 版本兼容性

### Breaking Changes
- 核心引擎 API 保持兼容
- 框架适配器 API 统一化
- 插件系统升级

### Migration Path
提供详细的迁移指南和工具协助用户升级。

## 性能目标

- **Core Bundle**: < 50KB (gzipped)
- **Framework Adapter**: < 20KB (gzipped)
- **Tree-shaking**: 100% 支持
- **Side-effects**: 明确标记

## 质量标准

- **Type Coverage**: 100%
- **Test Coverage**: > 90%
- **Documentation**: 完整的 API 文档和使用指南
- **Examples**: 每个框架至少一个完整示例

---

**最后更新**: 2025-10-29
**版本**: 0.3.0 → 1.0.0

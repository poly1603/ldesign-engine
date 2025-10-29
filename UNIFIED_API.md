# 统一的框架引擎 API

本文档描述了所有框架引擎的统一 API 设计和使用方式。

## 概述

所有框架（Vue、React、Svelte、Solid、Angular、Preact、Qwik、Lit、AlpineJS、NextJS、NuxtJS、Remix、SvelteKit、Astro）现在都通过统一的 `createEngineApp` 函数来创建应用实例。

## 统一的 API 设计

### 1. 入口函数

所有框架都使用相同的函数签名：

```typescript
async function createEngineApp(
  options: FrameworkEngineAppOptions
): Promise<FrameworkEngine>
```

### 2. 配置选项

所有框架的配置选项都遵循相同的结构：

```typescript
interface FrameworkEngineAppOptions {
  // 根组件（仅适用于组件式框架：Vue、React、Svelte、Solid、Preact）
  rootComponent?: Component
  
  // 挂载元素（可选，某些框架如 NextJS、NuxtJS 自己管理）
  mountElement?: string | Element
  
  // 引擎配置
  config?: CoreEngineConfig
  
  // 插件列表
  plugins?: Plugin[]
  
  // 中间件列表
  middleware?: Middleware[]
  
  // 功能开关（框架特定）
  features?: {
    // 通用功能
    enableDevTools?: boolean
    
    // SSR 框架特定
    enableSSR?: boolean
    serializeState?: boolean
    
    // 框架特定功能
    // ...
  }
  
  // 生命周期回调
  onReady?: (engine: FrameworkEngine) => void | Promise<void>
  onMounted?: (engine: FrameworkEngine) => void | Promise<void>
  onError?: (error: Error, context: string) => void
}
```

### 3. 引擎接口

所有框架引擎都实现以下核心接口：

```typescript
interface FrameworkEngine extends CoreEngine {
  // 挂载应用
  mount(mountElement?: string | Element): Promise<void>
  
  // 卸载应用
  unmount(): Promise<void>
  
  // 框架特定方法
  // ...
}
```

## 核心特性

### 1. Plugin（插件系统）

所有框架都支持统一的插件系统：

```typescript
const engine = await createEngineApp({
  plugins: [
    myPlugin1,
    myPlugin2,
  ],
})

// 或者动态注册
await engine.use(myPlugin)
```

### 2. Middleware（中间件）

所有框架都支持统一的中间件系统：

```typescript
const engine = await createEngineApp({
  middleware: [
    loggingMiddleware,
    authMiddleware,
  ],
})

// 或者动态注册
engine.middleware.use(myMiddleware)
```

### 3. Lifecycle（生命周期）

所有框架都支持统一的生命周期钩子：

- `beforeMount` - 挂载前
- `mount` - 挂载时
- `afterMount` - 挂载后
- `beforeUnmount` - 卸载前
- `unmount` - 卸载时
- `afterUnmount` - 卸载后
- `error` - 错误处理

```typescript
const engine = await createEngineApp({
  onReady: async (engine) => {
    console.log('Engine ready')
  },
  onMounted: async (engine) => {
    console.log('App mounted')
  },
  onError: (error, context) => {
    console.error(`Error in ${context}:`, error)
  },
})
```

## 框架分类

### 组件式框架（需要 rootComponent）

这些框架需要提供根组件：

- **Vue** - 使用 `createApp()` 挂载
- **React** - 使用 `createRoot().render()` 挂载
- **Svelte** - 使用 `new Component()` 挂载
- **Solid** - 使用 `render()` 挂载
- **Preact** - 使用 `render()` 挂载

示例：

```typescript
import { createEngineApp } from '@ldesign/engine-vue'
import App from './App.vue'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
})
```

### 声明式框架（不需要 rootComponent）

这些框架使用声明式方式，不需要手动挂载：

- **Qwik** - 声明式，自动水合
- **Lit** - 使用自定义元素
- **AlpineJS** - 使用 x-data 指令

示例：

```typescript
import { createEngineApp } from '@ldesign/engine-qwik'

const engine = await createEngineApp({
  config: { /* ... */ },
  features: {
    enableSSR: true,
  },
})
```

### 元框架（SSR 支持）

这些框架支持服务端渲染和状态序列化：

- **NextJS** - React 元框架
- **NuxtJS** - Vue 元框架
- **Remix** - React 元框架
- **SvelteKit** - Svelte 元框架
- **Astro** - 多框架支持

这些框架的引擎都提供额外的 SSR 方法：

```typescript
interface SSREngine extends CoreEngine {
  serializeState(): string
  deserializeState(serialized: string): void
  isServerSide(): boolean
  isClientSide(): boolean
}
```

示例：

```typescript
import { createEngineApp } from '@ldesign/engine-nextjs'

const engine = await createEngineApp({
  config: { /* ... */ },
  features: {
    enableSSR: true,
    serializeState: true,
  },
})

// 服务端
if (engine.isServerSide()) {
  const state = engine.serializeState()
  // 注入到 HTML
}

// 客户端
if (engine.isClientSide()) {
  engine.deserializeState(window.__ENGINE_STATE__)
}
```

### 依赖注入框架

- **Angular** - 使用依赖注入系统

Angular 既可以通过 `createEngineApp` 使用，也可以通过 `EngineService` 在依赖注入系统中使用：

```typescript
// 方式 1: 使用 createEngineApp
import { createEngineApp } from '@ldesign/engine-angular'

const engine = await createEngineApp({
  config: { /* ... */ },
})

// 方式 2: 使用 EngineService（推荐）
import { EngineService } from '@ldesign/engine-angular'

@Component({
  // ...
})
export class MyComponent {
  constructor(private engine: EngineService) {}
}
```

## 使用示例

### 基础使用

```typescript
import { createEngineApp } from '@ldesign/engine-{framework}'

const engine = await createEngineApp({
  rootComponent: App, // 仅组件式框架需要
  mountElement: '#app',
  config: {
    debug: true,
  },
  plugins: [myPlugin],
  middleware: [myMiddleware],
  onReady: async (engine) => {
    console.log('Ready!')
  },
})
```

### 高级使用

```typescript
import { createEngineApp } from '@ldesign/engine-{framework}'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    debug: true,
    logger: customLogger,
  },
  plugins: [
    pluginA,
    pluginB,
  ],
  middleware: [
    loggingMiddleware,
    authMiddleware,
  ],
  features: {
    enableDevTools: true,
    enableSSR: true, // 仅 SSR 框架
  },
  onReady: async (engine) => {
    // 引擎初始化完成
    await engine.state.set('initialized', true)
  },
  onMounted: async (engine) => {
    // 应用挂载完成
    console.log('App mounted')
  },
  onError: (error, context) => {
    // 错误处理
    console.error(`Error in ${context}:`, error)
  },
})

// 动态注册插件
await engine.use(dynamicPlugin)

// 动态注册中间件
engine.middleware.use(dynamicMiddleware)

// 访问状态
const state = engine.state.get('myKey')

// 发送事件
engine.events.emit('myEvent', { data: 'value' })

// 卸载应用
await engine.unmount()
```

## 版本信息

所有框架包都导出版本号：

```typescript
import { version } from '@ldesign/engine-{framework}'
console.log(version) // '0.2.0'
```

## 总结

通过统一的 `createEngineApp` API，所有框架现在都具有：

1. ✅ 统一的入口函数
2. ✅ 统一的配置选项结构
3. ✅ 统一的插件系统
4. ✅ 统一的中间件系统
5. ✅ 统一的生命周期管理
6. ✅ 统一的错误处理
7. ✅ 一致的使用体验

这使得在不同框架之间切换变得更加容易，同时保持了各框架的特性和优势。


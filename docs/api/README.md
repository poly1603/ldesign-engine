# API 参考

完整的 @ldesign/engine API 文档。

## 核心 API

### [CoreEngine](./core-engine.md)
核心引擎 API,管理所有核心功能。

```typescript
interface CoreEngine {
  plugins: PluginManager
  middleware: MiddlewareManager
  lifecycle: LifecycleManager
  events: EventManager
  state: StateManager
  cache: CacheManager
  logger: Logger
  config: ConfigManager
  di: DIContainer
  
  init(): Promise<void>
  destroy(): Promise<void>
  use(plugin: Plugin): Promise<void>
  getStatus(): EngineStatus
}
```

## 管理器 API

### [PluginManager](./plugin-manager.md)
插件管理器 - 注册、卸载和管理插件。

**主要方法:**
- `register(plugin: Plugin): Promise<void>`
- `unregister(name: string): Promise<void>`
- `get(name: string): Plugin | undefined`
- `getAll(): Plugin[]`
- `has(name: string): boolean`

### [EventManager](./event-manager.md)
事件管理器 - 发布/订阅事件系统。

**主要方法:**
- `on(event: string, handler: EventHandler): Unsubscribe`
- `once(event: string, handler: EventHandler): Unsubscribe`
- `off(event: string, handler?: EventHandler): void`
- `emit(event: string, data?: any): void`
- `clear(event?: string): void`

### [StateManager](./state-manager.md)
状态管理器 - 响应式状态管理。

**主要方法:**
- `setState(path: string, value: any): void`
- `getState(path?: string): any`
- `watch(path: string, callback: WatchCallback): Unwatch`
- `batch(fn: () => void): void`
- `reset(): void`

### [CacheManager](./cache-manager.md)
缓存管理器 - LRU 缓存系统。

**主要方法:**
- `set(key: string, value: any, options?: CacheOptions): void`
- `get(key: string): any`
- `has(key: string): boolean`
- `delete(key: string): boolean`
- `clear(): void`
- `clearByTag(tag: string): void`

### [LifecycleManager](./lifecycle-manager.md)
生命周期管理器 - 应用生命周期钩子。

**主要方法:**
- `on(hook: LifecycleHook, handler: LifecycleHandler): void`
- `off(hook: LifecycleHook, handler?: LifecycleHandler): void`
- `execute(hook: LifecycleHook, context: any): Promise<void>`

### [MiddlewareManager](./middleware-manager.md)
中间件管理器 - 洋葱模型中间件。

**主要方法:**
- `use(middleware: Middleware): void`
- `remove(name: string): void`
- `execute(context: any): Promise<void>`
- `getAll(): Middleware[]`

### [Logger](./logger.md)
日志系统 - 分级日志记录。

**主要方法:**
- `debug(message: string, ...args: any[]): void`
- `info(message: string, ...args: any[]): void`
- `warn(message: string, ...args: any[]): void`
- `error(message: string, ...args: any[]): void`
- `setLevel(level: LogLevel): void`

### [ConfigManager](./config-manager.md)
配置管理器 - 应用配置管理。

**主要方法:**
- `get(key: string, defaultValue?: any): any`
- `set(key: string, value: any): void`
- `has(key: string): boolean`
- `watch(key: string, callback: ConfigWatchCallback): Unwatch`

### [DIContainer](./di-container.md)
依赖注入容器 - 服务注册和解析。

**主要方法:**
- `registerSingleton(name: string, constructor: Constructor): void`
- `registerFactory(name: string, factory: Factory): void`
- `registerValue(name: string, value: any): void`
- `resolve<T>(name: string): T`
- `has(name: string): boolean`

## 框架适配器 API

### [FrameworkAdapter](./framework-adapter.md)
框架适配器接口 - 框架集成标准。

```typescript
interface FrameworkAdapter<TApp, TComponent, TElement> {
  readonly info: FrameworkInfo
  
  createApp(rootComponent: TComponent, options?: any): TApp
  mount(app: TApp, element: string | TElement): Promise<void>
  unmount(app: TApp): Promise<void>
  registerEngine(app: TApp, engine: CoreEngine): void
  
  createStateAdapter(): StateAdapter
  createEventAdapter(): EventAdapter
  mapLifecycleHooks(): LifecycleHookMap
}
```

### [StateAdapter](./state-adapter.md)
状态适配器 - 框架响应式系统桥接。

### [EventAdapter](./event-adapter.md)
事件适配器 - 框架事件系统桥接。

## 插件 API

### [Plugin](./plugin.md)
插件接口 - 扩展引擎功能。

```typescript
interface Plugin {
  name: string
  version?: string
  dependencies?: string[]
  
  install(context: PluginContext): void | Promise<void>
  beforeInstall?(context: PluginContext): void | Promise<void>
  afterInstall?(context: PluginContext): void | Promise<void>
  
  uninstall?(context: PluginContext): void | Promise<void>
  beforeUninstall?(context: PluginContext): void | Promise<void>
  afterUninstall?(context: PluginContext): void | Promise<void>
}
```

### [PluginContext](./plugin-context.md)
插件上下文 - 插件可访问的资源。

## 类型定义

### 基础类型

```typescript
// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 生命周期钩子
type LifecycleHook = 
  | 'beforeInit' | 'init' | 'afterInit'
  | 'beforeMount' | 'mount' | 'afterMount'
  | 'beforeUnmount' | 'unmount' | 'afterUnmount'
  | 'beforeDestroy' | 'destroy' | 'afterDestroy'
  | 'error'

// 事件处理器
type EventHandler<T = any> = (data: T) => void | Promise<void>

// 取消订阅函数
type Unsubscribe = () => void
```

### 配置类型

```typescript
interface CoreEngineConfig {
  name?: string
  debug?: boolean
  logger?: LoggerConfig
  cache?: CacheConfig
}

interface LoggerConfig {
  level?: LogLevel
  enabled?: boolean
  prefix?: string
}

interface CacheConfig {
  maxSize?: number
  ttl?: number
  strategy?: 'lru' | 'lfu'
}
```

## 使用示例

### 创建引擎

```typescript
import { createCoreEngine } from '@ldesign/engine-core'

const engine = createCoreEngine({
  name: 'My App',
  debug: true,
  logger: {
    level: 'debug',
    enabled: true
  }
})

await engine.init()
```

### 使用插件

```typescript
import { createI18nPlugin } from '@ldesign/engine-core'

await engine.use(createI18nPlugin({
  locale: 'zh-CN',
  messages: { /* ... */ }
}))
```

### 监听事件

```typescript
engine.events.on('theme:changed', (data) => {
  console.log('Theme changed:', data.to)
})
```

### 管理状态

```typescript
engine.state.setState('user', { name: 'Tom' })
const user = engine.state.getState('user')
```

## 框架特定 API

### Vue 3

```typescript
import { createEngineApp, useEngine } from '@ldesign/engine-vue'

// 创建应用
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app'
})

// 在组件中使用
const engine = useEngine()
```

### React

```typescript
import { createEngineApp, useEngine } from '@ldesign/engine-react'

// 创建应用
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#root'
})

// 在组件中使用
const engine = useEngine()
```

## 快速查找

### 按功能分类

**插件相关:**
- [PluginManager](./plugin-manager.md)
- [Plugin](./plugin.md)
- [PluginContext](./plugin-context.md)

**事件相关:**
- [EventManager](./event-manager.md)
- [EventAdapter](./event-adapter.md)

**状态相关:**
- [StateManager](./state-manager.md)
- [StateAdapter](./state-adapter.md)

**生命周期相关:**
- [LifecycleManager](./lifecycle-manager.md)
- [FrameworkAdapter](./framework-adapter.md)

**工具相关:**
- [Logger](./logger.md)
- [CacheManager](./cache-manager.md)
- [ConfigManager](./config-manager.md)
- [DIContainer](./di-container.md)

## 版本兼容性

| API | v0.3.x | v1.0.x |
|-----|--------|--------|
| CoreEngine | ✅ | ✅ |
| PluginManager | ✅ | ✅ |
| EventManager | ✅ | ✅ |
| StateManager | ✅ | ✅ |
| FrameworkAdapter | ❌ | ✅ |

## 贡献

发现 API 文档问题?请 [提交 Issue](https://github.com/your-org/ldesign/issues)。

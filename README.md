# @ldesign/engine

一个强大、灵活的 Vue 3 应用引擎，提供插件系统、中间件、依赖注入、配置管理等企业级功能。

## 特性

- 🚀 **插件系统** - 模块化的插件架构，支持动态加载和卸载
- 🔧 **中间件支持** - 生命周期钩子中间件，支持异步执行
- 💉 **依赖注入** - 基于 Vue 3 provide/inject 的 DI 容器
- ⚙️ **配置管理** - 响应式配置系统，支持配置监听
- 📡 **事件系统** - 强大的事件发射器，支持一次性监听
- 🎯 **TypeScript** - 完整的 TypeScript 支持，类型安全
- 🔍 **调试工具** - 内置调试和性能监控功能
- 🛡️ **错误处理** - 统一的错误处理机制

## 安装

```bash
npm install @ldesign/engine
# 或
pnpm add @ldesign/engine
# 或
yarn add @ldesign/engine
```

## 快速开始

```typescript
import { createEngine } from '@ldesign/engine'
import type { Plugin } from '@ldesign/engine'

// 创建引擎实例
const engine = createEngine({
  name: 'MyApp',
  version: '1.0.0',
  debug: true
})

// 创建插件
const myPlugin: Plugin = {
  name: 'my-plugin',
  install(engine, options) {
    engine.provide('myService', {
      hello: () => console.log('Hello from plugin!')
    })
  }
}

// 安装插件
await engine.use(myPlugin)

// 挂载应用
const instance = await engine.mount('#app')
```

## 核心概念

### 引擎生命周期

引擎具有以下状态：
- `created` - 引擎已创建
- `mounting` - 正在挂载
- `mounted` - 已挂载
- `unmounting` - 正在卸载
- `unmounted` - 已卸载
- `destroying` - 正在销毁
- `destroyed` - 已销毁
- `error` - 错误状态

### 插件系统

插件是扩展引擎功能的主要方式：

```typescript
const plugin: Plugin = {
  name: 'my-plugin',
  install(engine, options) {
    // 插件安装逻辑
  },
  uninstall(engine) {
    // 插件卸载逻辑（可选）
  },
  dependencies: ['other-plugin'], // 依赖的其他插件（可选）
  priority: 10 // 安装优先级（可选）
}
```

### 中间件系统

中间件在生命周期钩子中执行：

```typescript
engine.addMiddleware('beforeMount', async (context, next) => {
  console.log('Before mount')
  await next() // 调用下一个中间件
  console.log('After next middleware')
})
```

支持的生命周期钩子：
- `beforeCreate`
- `created`
- `beforeMount`
- `mounted`
- `beforeUpdate`
- `updated`
- `beforeUnmount`
- `unmounted`

### 依赖注入

```typescript
// 提供服务
engine.provide('apiClient', new ApiClient())

// 注入服务
const apiClient = engine.inject<ApiClient>('apiClient')
```

### 配置管理

```typescript
// 设置配置
engine.setConfig('theme', 'dark')

// 获取配置
const theme = engine.getConfig('theme')

// 监听配置变化
engine.watchConfig('theme', (newValue, oldValue) => {
  console.log(`Theme changed from ${oldValue} to ${newValue}`)
})
```

### 事件系统

```typescript
// 监听事件
engine.on('custom:event', (data) => {
  console.log('Event received:', data)
})

// 发射事件
engine.emit('custom:event', { message: 'Hello!' })

// 一次性监听
engine.once('custom:event', (data) => {
  console.log('This will only run once')
})
```

## API 参考

### createEngine(config?)

创建引擎实例。

**参数：**
- `config` (可选) - 引擎配置对象

**返回：** `Engine` 实例

### Engine 接口

#### 核心方法

- `mount(selector: string | Element): Promise<ComponentPublicInstance>` - 挂载应用
- `unmount(): Promise<void>` - 卸载应用
- `destroy(): Promise<void>` - 销毁引擎

#### 插件管理

- `use(plugin: Plugin, options?: any): Promise<Engine>` - 安装插件
- `unuse(pluginName: string): Promise<Engine>` - 卸载插件
- `hasPlugin(pluginName: string): boolean` - 检查插件是否已安装

#### 中间件管理

- `addMiddleware(hook: LifecycleHook, middleware: MiddlewareFunction): void` - 添加中间件
- `removeMiddleware(hook: LifecycleHook, middleware: MiddlewareFunction): void` - 移除中间件

#### 配置管理

- `getConfig<T>(key: string): T | undefined` - 获取配置
- `setConfig(key: string, value: any): void` - 设置配置
- `updateConfig(updates: Partial<EngineConfig>): void` - 批量更新配置
- `watchConfig(key: string, callback: ConfigWatcher): UnwatchFn` - 监听配置变化

#### 依赖注入

- `provide(key: string | symbol, value: any): void` - 提供服务
- `inject<T>(key: string | symbol): T | undefined` - 注入服务

#### 事件系统

- `emit(event: string, ...args: any[]): void` - 发射事件
- `on(event: string, handler: EventHandler): UnsubscribeFn` - 监听事件
- `off(event: string, handler?: EventHandler): void` - 取消监听
- `once(event: string, handler: EventHandler): UnsubscribeFn` - 一次性监听

#### 调试和监控

- `getDebugInfo()` - 获取调试信息
- `healthCheck()` - 健康检查

#### 属性

- `state: EngineState` - 引擎状态
- `app: App | null` - Vue 应用实例
- `config: Readonly<EngineConfig>` - 引擎配置
- `name: string` - 引擎名称
- `version: string` - 引擎版本

## 配置选项

```typescript
interface EngineConfig {
  name?: string // 引擎名称
  version?: string // 引擎版本
  debug?: boolean // 调试模式
  performance?: PerformanceConfig // 性能配置
  dev?: DevConfig // 开发配置
  errorHandler?: ErrorHandler // 错误处理器
  [key: string]: any // 自定义配置
}
```

## 内置插件

### 性能监控插件

```typescript
import { performancePlugin } from '@ldesign/engine/plugins'

await engine.use(performancePlugin, {
  trackMemory: true,
  trackTiming: true,
  sampleRate: 1.0
})
```

### 错误处理插件

```typescript
import { errorHandlerPlugin } from '@ldesign/engine/plugins'

await engine.use(errorHandlerPlugin, {
  enableGlobalHandler: true,
  enableVueHandler: true,
  enablePromiseHandler: true
})
```

## 示例

查看 `examples/` 目录获取更多使用示例。

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建
pnpm run build

# 测试
pnpm run test

# 类型检查
pnpm run typecheck

# 代码检查
pnpm run lint
```

## 许可证

MIT

一个基于 Vue 3 的轻量级应用引擎，提供插件系统、中间件、配置管理、事件系统和依赖注入等功能。

## 特性

- 🚀 **轻量级**: 基于 Vue 3，最小化内存占用
- 🔌 **插件系统**: 支持插件依赖管理和生命周期控制
- 🎯 **中间件**: 完整的生命周期钩子中间件支持
- ⚙️ **配置管理**: 响应式配置系统，支持监听和验证
- 📡 **事件系统**: 内置事件发射器，支持自定义事件通信
- 💉 **依赖注入**: 基于 Vue 3 的 provide/inject 机制
- 🛡️ **错误处理**: 全局错误捕获和恢复策略
- 📊 **性能监控**: 内置性能监控和调试工具
- 🔧 **TypeScript**: 完整的类型定义和智能提示
- 🔥 **热重载**: 支持开发模式和热重载

## 安装

```bash
npm install @ldesign/engine
# 或
yarn add @ldesign/engine
# 或
pnpm add @ldesign/engine
```

## 快速开始

### 基本使用

```typescript
import { createEngine } from '@ldesign/engine'

// 创建引擎实例
const engine = createEngine({
  rootComponent: {
    template: '<div>Hello Engine!</div>'
  }
})

// 挂载到DOM
engine.mount('#app')
```

### 使用插件

```typescript
import { createEngine, performancePlugin } from '@ldesign/engine'

const engine = createEngine()

// 使用性能监控插件
await engine.use(performancePlugin, {
  enabled: true,
  trackMemory: true
})

engine.mount('#app')
```

### 配置管理

```typescript
const engine = createEngine({
  apiUrl: 'https://api.example.com',
  theme: 'dark'
})

// 获取配置
const apiUrl = engine.getConfig<string>('apiUrl')

// 设置配置
engine.setConfig('theme', 'light')

// 监听配置变化
const unwatch = engine.watchConfig('theme', (newValue, oldValue) => {
  console.log(`Theme changed from ${oldValue} to ${newValue}`)
})

// 取消监听
unwatch()
```

### 中间件系统

```typescript
// 添加生命周期中间件
engine.addMiddleware('beforeMount', async (context, next) => {
  console.log('Before mount middleware')
  await next()
})

engine.addMiddleware('mounted', async (context, next) => {
  console.log('Mounted middleware')
  await next()
})
```

### 事件系统

```typescript
// 监听事件
const unsubscribe = engine.on('custom:event', (data) => {
  console.log('Received:', data)
})

// 发射事件
engine.emit('custom:event', { message: 'Hello!' })

// 一次性监听
engine.once('engine:mounted', () => {
  console.log('Engine mounted!')
})

// 取消监听
unsubscribe()
```

### 依赖注入

```typescript
// 提供服务
engine.provide('userService', {
  getCurrentUser: () => ({ id: 1, name: 'John' })
})

// 注入服务
const userService = engine.inject('userService')
```

## 创建自定义插件

```typescript
import type { Plugin } from '@ldesign/engine'

const myPlugin: Plugin = {
  name: 'my-plugin',
  async install(engine, options) {
    // 插件安装逻辑
    engine.provide('myService', {
      doSomething: () => console.log('Doing something...')
    })

    // 添加中间件
    engine.addMiddleware('mounted', async (context, next) => {
      console.log('My plugin middleware')
      await next()
    })

    // 监听事件
    engine.on('custom:event', (data) => {
      console.log('Plugin received event:', data)
    })
  },

  uninstall(engine) {
    // 插件卸载逻辑
    console.log('Plugin uninstalled')
  }
}

// 使用插件
await engine.use(myPlugin, { option1: 'value1' })
```

## API 参考

### Engine 接口

```typescript
interface Engine {
  // 核心方法
  mount: (selector: string | Element) => Promise<ComponentPublicInstance>
  unmount: () => Promise<void>
  destroy: () => Promise<void>

  // 配置管理
  getConfig: <T>(key: string) => T | undefined
  setConfig: (key: string, value: any) => void
  updateConfig: (updates: Partial<EngineConfig>) => void
  watchConfig: (key: string, callback: ConfigWatcher) => UnwatchFn

  // 插件系统
  use: (plugin: Plugin, options?: any) => Promise<Engine>
  unuse: (pluginName: string) => Promise<Engine>
  hasPlugin: (pluginName: string) => boolean

  // 中间件系统
  addMiddleware: (hook: LifecycleHook, middleware: MiddlewareFunction) => void
  removeMiddleware: (hook: LifecycleHook, middleware: MiddlewareFunction) => void

  // 事件系统
  emit: (event: string, ...args: any[]) => void
  on: (event: string, handler: EventHandler) => UnsubscribeFn
  off: (event: string, handler?: EventHandler) => void
  once: (event: string, handler: EventHandler) => UnsubscribeFn

  // 依赖注入
  provide: (key: string | symbol, value: any) => void
  inject: <T>(key: string | symbol) => T | undefined

  // 状态查询
  readonly state: EngineState
  readonly app: App | null
  readonly config: Readonly<EngineConfig>
}
```

### 生命周期钩子

- `beforeCreate`: 引擎创建前
- `created`: 引擎创建后
- `beforeMount`: 挂载前
- `mounted`: 挂载后
- `beforeUpdate`: 更新前
- `updated`: 更新后
- `beforeUnmount`: 卸载前
- `unmounted`: 卸载后

### 系统事件

- `engine:created`: 引擎创建
- `engine:mounted`: 引擎挂载
- `engine:unmounted`: 引擎卸载
- `engine:destroyed`: 引擎销毁
- `engine:error`: 引擎错误
- `plugin:error`: 插件错误
- `middleware:error`: 中间件错误

## 内置插件

### 性能监控插件

```typescript
import { performancePlugin } from '@ldesign/engine'

await engine.use(performancePlugin, {
  enabled: true,
  trackMemory: true,
  trackTiming: true,
  sampleRate: 1.0,
  maxMetrics: 1000
})

// 使用性能监控API
engine.startTiming('operation')
// ... 执行操作
engine.endTiming('operation')

// 获取性能指标
const metrics = engine.getPerformanceMetrics()
const summary = engine.getPerformanceSummary()
```

### 错误处理插件

```typescript
import { errorHandlerPlugin } from '@ldesign/engine'

await engine.use(errorHandlerPlugin, {
  enabled: true,
  captureUnhandledRejections: true,
  captureUnhandledErrors: true,
  maxErrors: 100,
  enableRecovery: true,
  reportToConsole: true
})

// 注册自定义错误处理器
engine.registerErrorHandler('custom', (error, context) => {
  console.log('Custom error handler:', error)
})

// 设置恢复策略
engine.setRecoveryStrategy('TypeError', 'retry')

// 获取错误统计
const stats = engine.getErrorStats()
```

## 配置选项

```typescript
interface EngineConfig {
  // 根组件
  rootComponent?: any

  // 错误处理
  errorHandler?: ErrorHandler

  // 性能配置
  performance?: PerformanceConfig

  // 开发配置
  dev?: DevConfig

  // 自定义配置
  [key: string]: any
}
```

## 开发和调试

```typescript
// 获取调试信息
const debugInfo = engine.getDebugInfo()
console.log('Engine Debug Info:', debugInfo)

// 健康检查
const health = engine.healthCheck()
if (!health.healthy) {
  console.warn('Engine issues:', health.issues)
}

// 开发模式配置
const engine = createEngine({
  dev: {
    enabled: true,
    verbose: true,
    enableHMR: true
  }
})
```

## 最佳实践

1. **插件设计**: 保持插件单一职责，避免过度耦合
2. **中间件使用**: 合理使用中间件，避免阻塞主线程
3. **配置管理**: 使用类型安全的配置访问方法
4. **错误处理**: 实现适当的错误边界和恢复策略
5. **性能优化**: 使用性能监控插件跟踪关键指标
6. **内存管理**: 及时清理事件监听器和中间件

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### 1.0.0

- 初始版本发布
- 基础引擎功能
- 插件系统
- 中间件系统
- 配置管理
- 事件系统
- 依赖注入
- 性能监控插件
- 错误处理插件

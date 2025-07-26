# API 参考

本章提供 @ldesign/engine 的完整 API 参考文档，包括核心类、接口、方法和事件的详细说明。

## 核心 API

### Engine 类

`Engine` 是 @ldesign/engine 的核心类，负责管理整个应用的生命周期。

#### 构造函数

```typescript
new Engine(config: EngineConfig)
```

**参数：**
- `config` (EngineConfig): 引擎配置对象

**示例：**
```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  debug: true
})
```

#### 属性

##### name
```typescript
readonly name: string
```
引擎实例名称。

##### version
```typescript
readonly version: string
```
引擎实例版本。

##### state
```typescript
readonly state: EngineState
```
引擎当前状态，可能的值：
- `'idle'` - 空闲状态
- `'starting'` - 启动中
- `'running'` - 运行中
- `'stopping'` - 停止中
- `'stopped'` - 已停止
- `'error'` - 错误状态

##### config
```typescript
readonly config: EngineConfig
```
引擎配置对象。

#### 生命周期方法

##### start()
```typescript
start(): Promise<void>
```
启动引擎实例。

**示例：**
```typescript
await engine.start()
console.log('引擎已启动')
```

##### stop()
```typescript
stop(): Promise<void>
```
停止引擎实例。

**示例：**
```typescript
await engine.stop()
console.log('引擎已停止')
```

##### restart()
```typescript
restart(): Promise<void>
```
重启引擎实例。

**示例：**
```typescript
await engine.restart()
console.log('引擎已重启')
```

#### 插件管理

##### use()
```typescript
use(plugin: Plugin, config?: any): Engine
use(plugins: Plugin[], config?: any): Engine
```
注册并安装插件。

**参数：**
- `plugin` (Plugin | Plugin[]): 插件实例或插件数组
- `config` (any, 可选): 插件配置

**返回值：**
- `Engine`: 引擎实例（支持链式调用）

**示例：**
```typescript
// 注册单个插件
engine.use(myPlugin, { option: 'value' })

// 注册多个插件
engine.use([plugin1, plugin2, plugin3])

// 链式调用
engine
  .use(plugin1)
  .use(plugin2)
  .start()
```

##### registerPlugin()
```typescript
registerPlugin(plugin: Plugin, config?: any): Promise<void>
```
注册插件（不自动安装）。

**参数：**
- `plugin` (Plugin): 插件实例
- `config` (any, 可选): 插件配置

##### installPlugin()
```typescript
installPlugin(name: string): Promise<void>
```
安装已注册的插件。

**参数：**
- `name` (string): 插件名称

##### uninstallPlugin()
```typescript
uninstallPlugin(name: string): Promise<void>
```
卸载插件。

**参数：**
- `name` (string): 插件名称

##### enablePlugin()
```typescript
enablePlugin(name: string): Promise<void>
```
启用插件。

**参数：**
- `name` (string): 插件名称

##### disablePlugin()
```typescript
disablePlugin(name: string): Promise<void>
```
禁用插件。

**参数：**
- `name` (string): 插件名称

##### hasPlugin()
```typescript
hasPlugin(name: string): boolean
```
检查是否已注册指定插件。

**参数：**
- `name` (string): 插件名称

**返回值：**
- `boolean`: 是否已注册

##### getPlugin()
```typescript
getPlugin<T = Plugin>(name: string): T | undefined
```
获取插件实例。

**参数：**
- `name` (string): 插件名称

**返回值：**
- `T | undefined`: 插件实例或 undefined

##### getPlugins()
```typescript
getPlugins(): Plugin[]
```
获取所有已注册的插件。

**返回值：**
- `Plugin[]`: 插件数组

##### getPluginConfig()
```typescript
getPluginConfig(name: string): any
```
获取插件配置。

**参数：**
- `name` (string): 插件名称

**返回值：**
- `any`: 插件配置对象

##### updatePluginConfig()
```typescript
updatePluginConfig(name: string, config: any): void
```
更新插件配置。

**参数：**
- `name` (string): 插件名称
- `config` (any): 新的配置对象

#### 事件系统

##### on()
```typescript
on(event: string, listener: Function): Engine
on(events: Record<string, Function>): Engine
```
注册事件监听器。

**参数：**
- `event` (string): 事件名称
- `listener` (Function): 事件处理函数
- `events` (Record<string, Function>): 事件映射对象

**返回值：**
- `Engine`: 引擎实例（支持链式调用）

**示例：**
```typescript
// 注册单个事件
engine.on('user:login', (user) => {
  console.log('用户登录:', user.name)
})

// 注册多个事件
engine.on({
  'user:login': (user) => console.log('登录:', user.name),
  'user:logout': (user) => console.log('登出:', user.name)
})
```

##### off()
```typescript
off(event: string, listener?: Function): Engine
```
移除事件监听器。

**参数：**
- `event` (string): 事件名称
- `listener` (Function, 可选): 要移除的监听器，如果不提供则移除所有监听器

**返回值：**
- `Engine`: 引擎实例

##### once()
```typescript
once(event: string, listener: Function): Engine
```
注册一次性事件监听器。

**参数：**
- `event` (string): 事件名称
- `listener` (Function): 事件处理函数

**返回值：**
- `Engine`: 引擎实例

##### emit()
```typescript
emit(event: string, ...args: any[]): boolean
```
触发事件。

**参数：**
- `event` (string): 事件名称
- `...args` (any[]): 事件参数

**返回值：**
- `boolean`: 是否有监听器处理了该事件

**示例：**
```typescript
// 触发事件
engine.emit('user:login', { id: 1, name: 'John' })

// 带多个参数
engine.emit('data:updated', data, timestamp, source)
```

##### listenerCount()
```typescript
listenerCount(event: string): number
```
获取指定事件的监听器数量。

**参数：**
- `event` (string): 事件名称

**返回值：**
- `number`: 监听器数量

##### eventNames()
```typescript
eventNames(): string[]
```
获取所有已注册的事件名称。

**返回值：**
- `string[]`: 事件名称数组

#### 中间件系统

##### use()
```typescript
use(middleware: Middleware): Engine
use(middlewares: Middleware[]): Engine
```
注册中间件。

**参数：**
- `middleware` (Middleware | Middleware[]): 中间件函数或数组

**返回值：**
- `Engine`: 引擎实例

**示例：**
```typescript
// 注册单个中间件
engine.use(async (ctx, next) => {
  console.log('请求开始')
  await next()
  console.log('请求结束')
})

// 注册多个中间件
engine.use([
  authMiddleware,
  loggingMiddleware,
  errorHandlingMiddleware
])
```

##### execute()
```typescript
execute(context: any): Promise<any>
```
执行中间件链。

**参数：**
- `context` (any): 执行上下文

**返回值：**
- `Promise<any>`: 执行结果

#### 状态管理

##### getState()
```typescript
getState(): any
getState(path: string): any
```
获取状态。

**参数：**
- `path` (string, 可选): 状态路径，支持点号分隔

**返回值：**
- `any`: 状态值

**示例：**
```typescript
// 获取整个状态
const state = engine.getState()

// 获取特定路径的状态
const user = engine.getState('user')
const userName = engine.getState('user.name')
```

##### setState()
```typescript
setState(state: any): void
setState(path: string, value: any): void
setState(updater: (state: any) => any): void
```
设置状态。

**参数：**
- `state` (any): 新的状态对象
- `path` (string): 状态路径
- `value` (any): 状态值
- `updater` (Function): 状态更新函数

**示例：**
```typescript
// 设置整个状态
engine.setState({ user: { name: 'John', age: 30 } })

// 设置特定路径的状态
engine.setState('user.name', 'Jane')

// 使用更新函数
engine.setState(state => ({
  ...state,
  user: { ...state.user, age: state.user.age + 1 }
}))
```

##### subscribe()
```typescript
subscribe(listener: (state: any) => void): () => void
subscribe(path: string, listener: (value: any) => void): () => void
```
订阅状态变化。

**参数：**
- `listener` (Function): 状态变化监听器
- `path` (string): 要监听的状态路径

**返回值：**
- `Function`: 取消订阅函数

**示例：**
```typescript
// 订阅整个状态变化
const unsubscribe = engine.subscribe(state => {
  console.log('状态变化:', state)
})

// 订阅特定路径的状态变化
const unsubscribeUser = engine.subscribe('user', user => {
  console.log('用户信息变化:', user)
})

// 取消订阅
unsubscribe()
unsubscribeUser()
```

#### 服务管理

##### registerService()
```typescript
registerService(name: string, service: any): void
```
注册服务。

**参数：**
- `name` (string): 服务名称
- `service` (any): 服务实例

**示例：**
```typescript
engine.registerService('apiService', {
  async get(url) {
    const response = await fetch(url)
    return response.json()
  },
  async post(url, data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }
})
```

##### getService()
```typescript
getService<T = any>(name: string): T | undefined
```
获取服务实例。

**参数：**
- `name` (string): 服务名称

**返回值：**
- `T | undefined`: 服务实例或 undefined

**示例：**
```typescript
const apiService = engine.getService('apiService')
const data = await apiService.get('/api/users')
```

##### hasService()
```typescript
hasService(name: string): boolean
```
检查是否已注册指定服务。

**参数：**
- `name` (string): 服务名称

**返回值：**
- `boolean`: 是否已注册

##### unregisterService()
```typescript
unregisterService(name: string): void
```
注销服务。

**参数：**
- `name` (string): 服务名称

#### 方法管理

##### addMethod()
```typescript
addMethod(name: string, method: Function): void
```
添加方法到引擎实例。

**参数：**
- `name` (string): 方法名称
- `method` (Function): 方法函数

**示例：**
```typescript
engine.addMethod('greet', (name: string) => {
  return `Hello, ${name}!`
})

// 使用添加的方法
const greeting = engine.greet('World')
console.log(greeting) // "Hello, World!"
```

##### removeMethod()
```typescript
removeMethod(name: string): void
```
移除方法。

**参数：**
- `name` (string): 方法名称

##### hasMethod()
```typescript
hasMethod(name: string): boolean
```
检查是否存在指定方法。

**参数：**
- `name` (string): 方法名称

**返回值：**
- `boolean`: 是否存在

#### 错误处理

##### onError()
```typescript
onError(handler: (error: Error, context?: any) => void): Engine
```
注册错误处理器。

**参数：**
- `handler` (Function): 错误处理函数

**返回值：**
- `Engine`: 引擎实例

**示例：**
```typescript
engine.onError((error, context) => {
  console.error('引擎错误:', error.message)
  console.error('错误上下文:', context)
  
  // 发送错误报告
  errorReportingService.report(error, context)
})
```

##### handleError()
```typescript
handleError(error: Error, context?: any): void
```
处理错误。

**参数：**
- `error` (Error): 错误对象
- `context` (any, 可选): 错误上下文

## 接口定义

### EngineConfig

引擎配置接口。

```typescript
interface EngineConfig {
  // 基本信息
  name: string                    // 引擎名称
  version: string                 // 引擎版本
  description?: string            // 引擎描述
  
  // 调试配置
  debug?: boolean                 // 是否启用调试模式
  logLevel?: 'error' | 'warn' | 'info' | 'debug'  // 日志级别
  
  // 事件配置
  maxListeners?: number           // 最大监听器数量
  
  // 插件配置
  plugins?: PluginConfig[]        // 预配置的插件
  
  // 状态配置
  initialState?: any              // 初始状态
  
  // 性能配置
  performance?: {
    enableMetrics?: boolean       // 是否启用性能指标
    metricsInterval?: number      // 指标收集间隔
  }
  
  // 错误处理配置
  errorHandling?: {
    catchUnhandledRejections?: boolean  // 是否捕获未处理的 Promise 拒绝
    catchUncaughtExceptions?: boolean   // 是否捕获未捕获的异常
  }
  
  // 环境配置
  env?: 'development' | 'production' | 'test'  // 运行环境
  
  // 自定义配置
  [key: string]: any
}
```

### Plugin

插件接口。

```typescript
interface Plugin {
  // 基本信息
  name: string                    // 插件唯一标识
  version: string                 // 插件版本
  description?: string            // 插件描述
  author?: string                 // 插件作者
  license?: string                // 插件许可证
  homepage?: string               // 插件主页
  keywords?: string[]             // 插件关键词
  
  // 依赖关系
  dependencies?: string[]         // 必需依赖
  peerDependencies?: string[]     // 对等依赖
  optionalDependencies?: string[] // 可选依赖
  
  // 生命周期钩子
  install: (engine: Engine) => void | Promise<void>
  uninstall?: (engine: Engine) => void | Promise<void>
  enable?: (engine: Engine) => void | Promise<void>
  disable?: (engine: Engine) => void | Promise<void>
  
  // 配置
  config?: any                    // 默认配置
  schema?: JSONSchema             // 配置验证模式
  
  // 元数据
  tags?: string[]                 // 插件标签
  category?: string               // 插件分类
  priority?: number               // 加载优先级
  
  // 兼容性
  engines?: {
    '@ldesign/engine': string     // 支持的引擎版本
  }
}
```

### Middleware

中间件接口。

```typescript
type Middleware = (context: any, next: () => Promise<void>) => Promise<void>
```

### EngineState

引擎状态枚举。

```typescript
type EngineState = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'
```

## 事件参考

### 引擎生命周期事件

#### engine:starting
引擎开始启动时触发。

```typescript
engine.on('engine:starting', () => {
  console.log('引擎正在启动...')
})
```

#### engine:started
引擎启动完成时触发。

```typescript
engine.on('engine:started', () => {
  console.log('引擎已启动')
})
```

#### engine:stopping
引擎开始停止时触发。

```typescript
engine.on('engine:stopping', () => {
  console.log('引擎正在停止...')
})
```

#### engine:stopped
引擎停止完成时触发。

```typescript
engine.on('engine:stopped', () => {
  console.log('引擎已停止')
})
```

#### engine:error
引擎发生错误时触发。

```typescript
engine.on('engine:error', (error) => {
  console.error('引擎错误:', error)
})
```

### 插件生命周期事件

#### plugin:registered
插件注册时触发。

```typescript
engine.on('plugin:registered', ({ plugin, config }) => {
  console.log(`插件 ${plugin.name} 已注册`)
})
```

#### plugin:installed
插件安装时触发。

```typescript
engine.on('plugin:installed', ({ plugin }) => {
  console.log(`插件 ${plugin.name} 已安装`)
})
```

#### plugin:uninstalled
插件卸载时触发。

```typescript
engine.on('plugin:uninstalled', ({ plugin }) => {
  console.log(`插件 ${plugin.name} 已卸载`)
})
```

#### plugin:enabled
插件启用时触发。

```typescript
engine.on('plugin:enabled', ({ plugin }) => {
  console.log(`插件 ${plugin.name} 已启用`)
})
```

#### plugin:disabled
插件禁用时触发。

```typescript
engine.on('plugin:disabled', ({ plugin }) => {
  console.log(`插件 ${plugin.name} 已禁用`)
})
```

#### plugin:config-updated
插件配置更新时触发。

```typescript
engine.on('plugin:config-updated', ({ pluginName, config }) => {
  console.log(`插件 ${pluginName} 配置已更新`)
})
```

### 状态管理事件

#### state:changed
状态变化时触发。

```typescript
engine.on('state:changed', ({ path, oldValue, newValue }) => {
  console.log(`状态 ${path} 从 ${oldValue} 变为 ${newValue}`)
})
```

#### state:initialized
状态初始化时触发。

```typescript
engine.on('state:initialized', (initialState) => {
  console.log('状态已初始化:', initialState)
})
```

### 服务管理事件

#### service:registered
服务注册时触发。

```typescript
engine.on('service:registered', ({ name, service }) => {
  console.log(`服务 ${name} 已注册`)
})
```

#### service:unregistered
服务注销时触发。

```typescript
engine.on('service:unregistered', ({ name }) => {
  console.log(`服务 ${name} 已注销`)
})
```

## 工具函数

### createEngine()

创建引擎实例的工厂函数。

```typescript
function createEngine(config: EngineConfig): Engine
```

**参数：**
- `config` (EngineConfig): 引擎配置

**返回值：**
- `Engine`: 引擎实例

**示例：**
```typescript
import { createEngine } from '@ldesign/engine'

const engine = createEngine({
  name: 'my-app',
  version: '1.0.0',
  debug: true
})
```

### isEngine()

检查对象是否为引擎实例。

```typescript
function isEngine(obj: any): obj is Engine
```

**参数：**
- `obj` (any): 要检查的对象

**返回值：**
- `boolean`: 是否为引擎实例

### version

当前 @ldesign/engine 版本。

```typescript
const version: string
```

**示例：**
```typescript
import { version } from '@ldesign/engine'
console.log('Engine 版本:', version)
```

## 类型定义

### EventListener

事件监听器类型。

```typescript
type EventListener = (...args: any[]) => void
```

### StateUpdater

状态更新器类型。

```typescript
type StateUpdater<T = any> = (state: T) => T
```

### PluginConfig

插件配置类型。

```typescript
interface PluginConfig {
  name: string
  config?: any
  enabled?: boolean
}
```

### JSONSchema

JSON Schema 类型定义。

```typescript
interface JSONSchema {
  type?: string
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
  enum?: any[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
  [key: string]: any
}
```

## 错误类型

### EngineError

引擎基础错误类。

```typescript
class EngineError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'EngineError'
  }
}
```

### PluginError

插件相关错误类。

```typescript
class PluginError extends EngineError {
  constructor(message: string, public pluginName: string, code?: string) {
    super(message, code)
    this.name = 'PluginError'
  }
}
```

### ConfigError

配置相关错误类。

```typescript
class ConfigError extends EngineError {
  constructor(message: string, public configPath?: string, code?: string) {
    super(message, code)
    this.name = 'ConfigError'
  }
}
```

### StateError

状态管理相关错误类。

```typescript
class StateError extends EngineError {
  constructor(message: string, public statePath?: string, code?: string) {
    super(message, code)
    this.name = 'StateError'
  }
}
```

## 常量

### ENGINE_EVENTS

引擎内置事件常量。

```typescript
const ENGINE_EVENTS = {
  STARTING: 'engine:starting',
  STARTED: 'engine:started',
  STOPPING: 'engine:stopping',
  STOPPED: 'engine:stopped',
  ERROR: 'engine:error'
} as const
```

### PLUGIN_EVENTS

插件相关事件常量。

```typescript
const PLUGIN_EVENTS = {
  REGISTERED: 'plugin:registered',
  INSTALLED: 'plugin:installed',
  UNINSTALLED: 'plugin:uninstalled',
  ENABLED: 'plugin:enabled',
  DISABLED: 'plugin:disabled',
  CONFIG_UPDATED: 'plugin:config-updated'
} as const
```

### STATE_EVENTS

状态管理事件常量。

```typescript
const STATE_EVENTS = {
  CHANGED: 'state:changed',
  INITIALIZED: 'state:initialized'
} as const
```

## 使用示例

### 完整的应用示例

```typescript
import { Engine, createEngine } from '@ldesign/engine'
import { myPlugin } from './plugins/my-plugin'

// 创建引擎实例
const engine = createEngine({
  name: 'my-application',
  version: '1.0.0',
  debug: true,
  logLevel: 'info',
  initialState: {
    user: null,
    theme: 'light'
  }
})

// 注册错误处理器
engine.onError((error, context) => {
  console.error('应用错误:', error.message)
  // 发送错误报告
})

// 注册生命周期事件
engine.on('engine:started', () => {
  console.log('应用已启动')
})

// 注册插件
engine.use(myPlugin, {
  apiUrl: 'https://api.example.com',
  timeout: 5000
})

// 注册服务
engine.registerService('userService', {
  async login(credentials) {
    // 登录逻辑
  },
  async logout() {
    // 登出逻辑
  }
})

// 添加中间件
engine.use(async (ctx, next) => {
  console.log('请求开始:', ctx.url)
  const start = Date.now()
  await next()
  console.log('请求耗时:', Date.now() - start, 'ms')
})

// 订阅状态变化
engine.subscribe('user', (user) => {
  if (user) {
    console.log('用户已登录:', user.name)
  } else {
    console.log('用户已登出')
  }
})

// 启动应用
engine.start().then(() => {
  console.log('应用启动完成')
}).catch((error) => {
  console.error('应用启动失败:', error)
})

// 导出引擎实例供其他模块使用
export default engine
```

这个 API 参考文档提供了 @ldesign/engine 的完整接口说明，包括所有方法、属性、事件和类型定义。开发者可以根据这个文档快速了解和使用引擎的各种功能。
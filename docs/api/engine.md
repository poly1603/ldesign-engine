# Engine API

`Engine` 类是 @ldesign/engine 的核心类，提供了插件管理、事件系统、中间件和状态管理等功能。

## 类定义

```typescript
class Engine {
  constructor(config?: EngineConfig)

  // 插件管理
  use(plugin: Plugin | PluginFunction, options?: any): this
  unuse(plugin: Plugin | string): this
  hasPlugin(plugin: Plugin | string): boolean
  getPlugin(name: string): Plugin | undefined
  getPlugins(): Plugin[]

  // 事件系统
  on(event: string, listener: EventListener): this
  off(event: string, listener?: EventListener): this
  once(event: string, listener: EventListener): this
  emit(event: string, ...args: any[]): boolean
  emitAsync(event: string, ...args: any[]): Promise<any[]>

  // 中间件
  middleware(middleware: Middleware): this
  removeMiddleware(middleware: Middleware | string): this

  // 状态管理
  setState(key: string, value: any): this
  getState(key?: string): any
  hasState(key: string): boolean
  removeState(key: string): this

  // 生命周期
  start(): Promise<void>
  stop(): Promise<void>
  restart(): Promise<void>

  // 工具方法
  destroy(): void
  isRunning(): boolean
  getVersion(): string
}
```

## 构造函数

### `new Engine(config?)`

创建一个新的 Engine 实例。

**参数：**
- `config` (可选): `EngineConfig` - 引擎配置选项

**示例：**

```typescript
import { Engine } from '@ldesign/engine'

// 使用默认配置
const engine = new Engine()

// 使用自定义配置
const engine = new Engine({
  debug: true,
  maxListeners: 20,
  errorHandler: (error) => {
    console.error('Engine error:', error)
  }
})
```

## 插件管理

### `use(plugin, options?)`

注册一个插件到引擎。

**参数：**
- `plugin`: `Plugin | PluginFunction` - 插件对象或插件函数
- `options` (可选): `any` - 传递给插件的选项

**返回值：**
- `Engine` - 返回引擎实例，支持链式调用

**示例：**

```typescript
// 注册插件对象
const myPlugin = {
  name: 'my-plugin',
  install(engine, options) {
    // 插件逻辑
  }
}

engine.use(myPlugin, { option1: 'value1' })

// 注册插件函数
function myPluginFunction(engine, options) {
  // 插件逻辑
}

engine.use(myPluginFunction, { option2: 'value2' })

// 链式调用
engine
  .use(plugin1)
  .use(plugin2)
  .use(plugin3)
```

### `unuse(plugin)`

卸载一个插件。

**参数：**
- `plugin`: `Plugin | string` - 插件对象或插件名称

**返回值：**
- `Engine` - 返回引擎实例

**示例：**

```typescript
// 通过插件对象卸载
engine.unuse(myPlugin)

// 通过插件名称卸载
engine.unuse('my-plugin')
```

### `hasPlugin(plugin)`

检查是否已注册指定插件。

**参数：**
- `plugin`: `Plugin | string` - 插件对象或插件名称

**返回值：**
- `boolean` - 如果插件已注册返回 true，否则返回 false

**示例：**

```typescript
if (engine.hasPlugin('my-plugin')) {
  console.log('插件已注册')
}
```

### `getPlugin(name)`

获取指定名称的插件。

**参数：**
- `name`: `string` - 插件名称

**返回值：**
- `Plugin | undefined` - 插件对象，如果不存在返回 undefined

**示例：**

```typescript
const plugin = engine.getPlugin('my-plugin')
if (plugin) {
  console.log('找到插件:', plugin.name)
}
```

### `getPlugins()`

获取所有已注册的插件。

**返回值：**
- `Plugin[]` - 插件数组

**示例：**

```typescript
const plugins = engine.getPlugins()
console.log('已注册插件数量:', plugins.length)

plugins.forEach((plugin) => {
  console.log('插件:', plugin.name)
})
```

## 事件系统

### `on(event, listener)`

注册事件监听器。

**参数：**
- `event`: `string` - 事件名称
- `listener`: `EventListener` - 事件监听器函数

**返回值：**
- `Engine` - 返回引擎实例

**示例：**

```typescript
// 注册事件监听器
engine.on('plugin:loaded', (plugin) => {
  console.log('插件已加载:', plugin.name)
})

// 注册多个事件
engine
  .on('start', () => console.log('引擎启动'))
  .on('stop', () => console.log('引擎停止'))
  .on('error', error => console.error('错误:', error))
```

### `off(event, listener?)`

移除事件监听器。

**参数：**
- `event`: `string` - 事件名称
- `listener` (可选): `EventListener` - 要移除的监听器函数，如果不提供则移除所有监听器

**返回值：**
- `Engine` - 返回引擎实例

**示例：**

```typescript
function myListener(data) {
  console.log('收到数据:', data)
}

// 注册监听器
engine.on('data', myListener)

// 移除特定监听器
engine.off('data', myListener)

// 移除所有监听器
engine.off('data')
```

### `once(event, listener)`

注册一次性事件监听器。

**参数：**
- `event`: `string` - 事件名称
- `listener`: `EventListener` - 事件监听器函数

**返回值：**
- `Engine` - 返回引擎实例

**示例：**

```typescript
// 只监听一次启动事件
engine.once('start', () => {
  console.log('引擎首次启动')
})
```

### `emit(event, ...args)`

同步触发事件。

**参数：**
- `event`: `string` - 事件名称
- `...args`: `any[]` - 传递给监听器的参数

**返回值：**
- `boolean` - 如果有监听器处理了事件返回 true，否则返回 false

**示例：**

```typescript
// 触发事件
const handled = engine.emit('custom-event', { data: 'hello' }, 123)

if (handled) {
  console.log('事件已被处理')
}
 else {
  console.log('没有监听器处理此事件')
}
```

### `emitAsync(event, ...args)`

异步触发事件。

**参数：**
- `event`: `string` - 事件名称
- `...args`: `any[]` - 传递给监听器的参数

**返回值：**
- `Promise<any[]>` - 返回所有监听器的执行结果

**示例：**

```typescript
// 异步触发事件
const results = await engine.emitAsync('async-event', { data: 'hello' })
console.log('监听器执行结果:', results)
```

## 中间件

### `middleware(middleware)`

注册中间件。

**参数：**
- `middleware`: `Middleware` - 中间件函数

**返回值：**
- `Engine` - 返回引擎实例

**示例：**

```typescript
// 注册中间件
engine.middleware(async (context, next) => {
  console.log('中间件执行前')
  await next()
  console.log('中间件执行后')
})

// 错误处理中间件
engine.middleware(async (context, next) => {
  try {
    await next()
  }
 catch (error) {
    console.error('中间件捕获错误:', error)
    throw error
  }
})
```

### `removeMiddleware(middleware)`

移除中间件。

**参数：**
- `middleware`: `Middleware | string` - 中间件函数或名称

**返回值：**
- `Engine` - 返回引擎实例

**示例：**

```typescript
async function myMiddleware(context, next) {
  await next()
}

// 注册中间件
engine.middleware(myMiddleware)

// 移除中间件
engine.removeMiddleware(myMiddleware)
```

## 状态管理

### `setState(key, value)`

设置状态值。

**参数：**
- `key`: `string` - 状态键名
- `value`: `any` - 状态值

**返回值：**
- `Engine` - 返回引擎实例

**示例：**

```typescript
// 设置状态
engine.setState('user', { id: 1, name: 'John' })
engine.setState('config', { theme: 'dark', language: 'zh-CN' })

// 链式设置
engine
  .setState('loading', true)
  .setState('error', null)
```

### `getState(key?)`

获取状态值。

**参数：**
- `key` (可选): `string` - 状态键名，如果不提供则返回所有状态

**返回值：**
- `any` - 状态值或所有状态对象

**示例：**

```typescript
// 获取特定状态
const user = engine.getState('user')
console.log('用户信息:', user)

// 获取所有状态
const allState = engine.getState()
console.log('所有状态:', allState)
```

### `hasState(key)`

检查是否存在指定状态。

**参数：**
- `key`: `string` - 状态键名

**返回值：**
- `boolean` - 如果状态存在返回 true，否则返回 false

**示例：**

```typescript
if (engine.hasState('user')) {
  console.log('用户状态存在')
}
```

### `removeState(key)`

移除指定状态。

**参数：**
- `key`: `string` - 状态键名

**返回值：**
- `Engine` - 返回引擎实例

**示例：**

```typescript
// 移除状态
engine.removeState('user')
engine.removeState('config')
```

## 生命周期

### `start()`

启动引擎。

**返回值：**
- `Promise<void>` - 启动完成的 Promise

**示例：**

```typescript
// 启动引擎
await engine.start()
console.log('引擎已启动')

// 监听启动事件
engine.on('start', () => {
  console.log('引擎启动完成')
})
```

### `stop()`

停止引擎。

**返回值：**
- `Promise<void>` - 停止完成的 Promise

**示例：**

```typescript
// 停止引擎
await engine.stop()
console.log('引擎已停止')

// 监听停止事件
engine.on('stop', () => {
  console.log('引擎停止完成')
})
```

### `restart()`

重启引擎。

**返回值：**
- `Promise<void>` - 重启完成的 Promise

**示例：**

```typescript
// 重启引擎
await engine.restart()
console.log('引擎已重启')
```

## 工具方法

### `destroy()`

销毁引擎实例，清理所有资源。

**示例：**

```typescript
// 销毁引擎
engine.destroy()
console.log('引擎已销毁')
```

### `isRunning()`

检查引擎是否正在运行。

**返回值：**
- `boolean` - 如果引擎正在运行返回 true，否则返回 false

**示例：**

```typescript
if (engine.isRunning()) {
  console.log('引擎正在运行')
}
 else {
  console.log('引擎已停止')
}
```

### `getVersion()`

获取引擎版本号。

**返回值：**
- `string` - 版本号字符串

**示例：**

```typescript
const version = engine.getVersion()
console.log('引擎版本:', version)
```

## 事件列表

引擎会触发以下内置事件：

### 生命周期事件

- `start` - 引擎启动时触发
- `stop` - 引擎停止时触发
- `restart` - 引擎重启时触发
- `destroy` - 引擎销毁时触发

### 插件事件

- `plugin:before-install` - 插件安装前触发
- `plugin:installed` - 插件安装后触发
- `plugin:before-uninstall` - 插件卸载前触发
- `plugin:uninstalled` - 插件卸载后触发

### 状态事件

- `state:changed` - 状态变化时触发
- `state:set` - 设置状态时触发
- `state:removed` - 移除状态时触发

### 错误事件

- `error` - 发生错误时触发
- `warning` - 发生警告时触发

## 错误处理

```typescript
// 全局错误处理
engine.on('error', (error, context) => {
  console.error('引擎错误:', error)
  console.error('错误上下文:', context)

  // 发送错误报告
  sendErrorReport(error, context)
})

// 插件错误处理
engine.on('plugin:error', (error, plugin) => {
  console.error(`插件 ${plugin.name} 发生错误:`, error)

  // 可以选择卸载有问题的插件
  engine.unuse(plugin)
})

// 中间件错误处理
engine.middleware(async (context, next) => {
  try {
    await next()
  }
 catch (error) {
    // 记录错误
    console.error('中间件错误:', error)

    // 触发错误事件
    engine.emit('error', error, context)

    // 重新抛出错误
    throw error
  }
})
```

## 最佳实践

### 1. 错误处理

```typescript
// 始终监听错误事件
engine.on('error', (error) => {
  console.error('引擎错误:', error)
})

// 在异步操作中使用 try-catch
try {
  await engine.start()
}
 catch (error) {
  console.error('启动失败:', error)
}
```

### 2. 资源清理

```typescript
// 在应用关闭时清理资源
process.on('SIGINT', async () => {
  console.log('正在关闭应用...')
  await engine.stop()
  engine.destroy()
  process.exit(0)
})
```

### 3. 插件管理

```typescript
// 检查插件是否已安装
if (!engine.hasPlugin('required-plugin')) {
  engine.use(requiredPlugin)
}

// 条件性安装插件
if (process.env.NODE_ENV === 'development') {
  engine.use(debugPlugin)
}
```

### 4. 状态管理

```typescript
// 使用命名空间组织状态
engine.setState('app.config', config)
engine.setState('app.user', user)
engine.setState('app.theme', theme)

// 监听状态变化
engine.on('state:changed', (key, value, oldValue) => {
  console.log(`状态 ${key} 从 ${oldValue} 变为 ${value}`)
})
```

## 类型定义

```typescript
interface EngineConfig {
  debug?: boolean
  maxListeners?: number
  errorHandler?: (error: Error, context?: any) => void
  plugins?: Plugin[]
  middleware?: Middleware[]
  state?: Record<string, any>
}

interface Plugin {
  name: string
  version?: string
  install: (engine: Engine, options?: any) => void | Promise<void>
  uninstall?: (engine: Engine) => void | Promise<void>
}

type PluginFunction = (engine: Engine, options?: any) => void | Promise<void>

type EventListener = (...args: any[]) => void | Promise<void>

type Middleware = (context: any, next: () => Promise<void>) => Promise<void>
```

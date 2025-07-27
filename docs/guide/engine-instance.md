# 引擎实例

引擎实例是 @ldesign/engine 的核心，它管理着整个应用程序的生命周期、插件、事件和状态。本章将详细介绍如何创建、配置和使用引擎实例。

## 创建引擎实例

### 基本创建

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-application',
  version: '1.0.0'
})
```

### 完整配置

```typescript
import { Engine, LogLevel } from '@ldesign/engine'

const engine = new Engine({
  // 基本信息
  name: 'my-application',
  version: '1.0.0',
  description: '我的应用程序',

  // 调试配置
  debug: true,
  logLevel: LogLevel.DEBUG,

  // 事件配置
  maxListeners: 100,
  eventTimeout: 5000,

  // 初始状态
  initialState: {
    theme: 'light',
    language: 'zh-CN',
    user: null
  },

  // 状态持久化
  persistence: {
    enabled: true,
    storage: 'localStorage',
    key: 'my-app-state',
    include: ['theme', 'language'],
    exclude: ['temp']
  },

  // 预注册插件
  plugins: [
    corePlugin,
    uiPlugin,
    authPlugin
  ],

  // 预注册中间件
  middleware: [
    loggingMiddleware,
    authMiddleware,
    errorHandlingMiddleware
  ],

  // 错误处理
  errorHandler: (error, context) => {
    console.error('引擎错误:', error)
    // 自定义错误处理逻辑
  },

  // 性能配置
  performance: {
    enableMetrics: true,
    metricsInterval: 1000,
    maxMemoryUsage: 100 * 1024 * 1024 // 100MB
  }
})
```

## 配置选项详解

### 基本配置

#### name (必需)
- **类型**: `string`
- **描述**: 引擎实例的唯一名称
- **示例**: `'my-application'`

#### version (必需)
- **类型**: `string`
- **描述**: 引擎实例的版本号
- **示例**: `'1.0.0'`

#### description
- **类型**: `string`
- **默认值**: `undefined`
- **描述**: 引擎实例的描述信息

### 调试配置

#### debug
- **类型**: `boolean`
- **默认值**: `false`
- **描述**: 是否启用调试模式

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  debug: process.env.NODE_ENV === 'development'
})
```

#### logLevel
- **类型**: `LogLevel`
- **默认值**: `LogLevel.INFO`
- **可选值**: `SILENT`, `ERROR`, `WARN`, `INFO`, `DEBUG`, `TRACE`

```typescript
import { LogLevel } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  logLevel: LogLevel.DEBUG
})
```

### 事件配置

#### maxListeners
- **类型**: `number`
- **默认值**: `10`
- **描述**: 单个事件的最大监听器数量

#### eventTimeout
- **类型**: `number`
- **默认值**: `5000`
- **描述**: 异步事件的超时时间（毫秒）

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  maxListeners: 50,
  eventTimeout: 10000 // 10秒超时
})
```

### 状态配置

#### initialState
- **类型**: `object`
- **默认值**: `{}`
- **描述**: 引擎的初始状态

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  initialState: {
    user: {
      id: null,
      name: '',
      isAuthenticated: false
    },
    ui: {
      theme: 'light',
      language: 'zh-CN',
      sidebarCollapsed: false
    },
    app: {
      version: '1.0.0',
      lastUpdated: Date.now()
    }
  }
})
```

#### persistence
- **类型**: `PersistenceConfig`
- **默认值**: `{ enabled: false }`
- **描述**: 状态持久化配置

```typescript
interface PersistenceConfig {
  enabled: boolean
  storage?: 'localStorage' | 'sessionStorage' | 'indexedDB'
  key?: string
  include?: string[]
  exclude?: string[]
  serializer?: {
    serialize: (state: any) => string
    deserialize: (data: string) => any
  }
}

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  persistence: {
    enabled: true,
    storage: 'localStorage',
    key: 'my-app-state',
    include: ['user', 'ui'], // 只持久化这些状态
    exclude: ['temp', 'cache'], // 排除这些状态
    serializer: {
      serialize: state => JSON.stringify(state),
      deserialize: data => JSON.parse(data)
    }
  }
})
```

### 插件和中间件配置

#### plugins
- **类型**: `Plugin[]`
- **默认值**: `[]`
- **描述**: 预注册的插件列表

#### middleware
- **类型**: `Middleware[]`
- **默认值**: `[]`
- **描述**: 预注册的中间件列表

```typescript
import { authPlugin, corePlugin, uiPlugin } from './plugins'
import { authMiddleware, loggingMiddleware } from './middleware'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  plugins: [
    corePlugin,
    uiPlugin,
    authPlugin
  ],
  middleware: [
    loggingMiddleware,
    authMiddleware
  ]
})
```

### 错误处理配置

#### errorHandler
- **类型**: `(error: Error, context?: any) => void`
- **默认值**: 内置错误处理器
- **描述**: 全局错误处理函数

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  errorHandler: (error, context) => {
    // 记录错误
    console.error('引擎错误:', error)
    console.error('错误上下文:', context)

    // 发送错误报告
    if (process.env.NODE_ENV === 'production') {
      errorReporter.report(error, {
        ...context,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }

    // 显示用户友好的错误信息
    if (error.name === 'NetworkError') {
      showNotification('网络连接失败，请检查网络设置')
    }
 else {
      showNotification('系统出现错误，请稍后重试')
    }
  }
})
```

### 性能配置

#### performance
- **类型**: `PerformanceConfig`
- **默认值**: `{ enableMetrics: false }`
- **描述**: 性能监控配置

```typescript
interface PerformanceConfig {
  enableMetrics?: boolean
  metricsInterval?: number
  maxMemoryUsage?: number
  maxEventQueueSize?: number
  enableProfiling?: boolean
}

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  performance: {
    enableMetrics: true,
    metricsInterval: 5000, // 每5秒收集一次指标
    maxMemoryUsage: 200 * 1024 * 1024, // 200MB内存限制
    maxEventQueueSize: 1000, // 最大事件队列大小
    enableProfiling: process.env.NODE_ENV === 'development'
  }
})
```

## 引擎生命周期

### 启动引擎

```typescript
// 异步启动
await engine.start()

// 或者使用 Promise
engine.start().then(() => {
  console.log('引擎启动成功')
}).catch((error) => {
  console.error('引擎启动失败:', error)
})
```

### 停止引擎

```typescript
// 优雅停止
await engine.stop()

// 强制停止
await engine.stop({ force: true })

// 带超时的停止
await engine.stop({ timeout: 5000 })
```

### 重启引擎

```typescript
// 重启引擎
await engine.restart()

// 重启并重新加载配置
await engine.restart({ reloadConfig: true })
```

### 生命周期事件

```typescript
// 监听生命周期事件
engine.on('engine:starting', () => {
  console.log('引擎正在启动...')
})

engine.on('engine:started', () => {
  console.log('引擎启动完成')
})

engine.on('engine:stopping', () => {
  console.log('引擎正在停止...')
})

engine.on('engine:stopped', () => {
  console.log('引擎已停止')
})

engine.on('engine:error', (error) => {
  console.error('引擎错误:', error)
})
```

## 引擎状态管理

### 获取引擎信息

```typescript
// 获取引擎基本信息
const info = engine.getInfo()
console.log(info)
// {
//   name: 'my-app',
//   version: '1.0.0',
//   status: 'running',
//   uptime: 12345,
//   pluginCount: 5,
//   listenerCount: 23
// }

// 获取引擎状态
const status = engine.getStatus()
console.log(status) // 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

// 检查引擎是否正在运行
if (engine.isRunning()) {
  console.log('引擎正在运行')
}
```

### 性能指标

```typescript
// 获取性能指标
const metrics = engine.getMetrics()
console.log(metrics)
// {
//   memoryUsage: { used: 45678, total: 67890 },
//   eventCount: 1234,
//   pluginCount: 5,
//   uptime: 12345,
//   averageEventTime: 2.5,
//   errorCount: 0
// }

// 监听性能指标更新
engine.on('metrics:updated', (metrics) => {
  console.log('性能指标更新:', metrics)

  // 检查内存使用情况
  if (metrics.memoryUsage.used > 100 * 1024 * 1024) {
    console.warn('内存使用过高')
  }
})
```

## 配置动态更新

### 运行时配置更新

```typescript
// 更新日志级别
engine.updateConfig({
  logLevel: LogLevel.ERROR
})

// 更新事件配置
engine.updateConfig({
  maxListeners: 20,
  eventTimeout: 8000
})

// 批量更新配置
engine.updateConfig({
  debug: false,
  logLevel: LogLevel.WARN,
  performance: {
    enableMetrics: false
  }
})
```

### 配置验证

```typescript
// 验证配置
const isValid = engine.validateConfig({
  name: 'new-name',
  version: '2.0.0'
})

if (isValid) {
  engine.updateConfig({
    name: 'new-name',
    version: '2.0.0'
  })
}
 else {
  console.error('配置无效')
}
```

## 多引擎实例

### 创建多个引擎实例

```typescript
// 主引擎
const mainEngine = new Engine({
  name: 'main-engine',
  version: '1.0.0'
})

// 工作引擎
const workerEngine = new Engine({
  name: 'worker-engine',
  version: '1.0.0'
})

// 测试引擎
const testEngine = new Engine({
  name: 'test-engine',
  version: '1.0.0',
  debug: true
})
```

### 引擎间通信

```typescript
// 引擎间事件转发
mainEngine.on('data:process', (data) => {
  // 转发给工作引擎处理
  workerEngine.emit('worker:process', data)
})

workerEngine.on('worker:complete', (result) => {
  // 结果返回给主引擎
  mainEngine.emit('data:complete', result)
})
```

### 引擎管理器

```typescript
class EngineManager {
  private engines = new Map<string, Engine>()

  createEngine(name: string, config: EngineConfig): Engine {
    const engine = new Engine({ ...config, name })
    this.engines.set(name, engine)
    return engine
  }

  getEngine(name: string): Engine | undefined {
    return this.engines.get(name)
  }

  async startAll(): Promise<void> {
    const promises = Array.from(this.engines.values()).map(engine => engine.start())
    await Promise.all(promises)
  }

  async stopAll(): Promise<void> {
    const promises = Array.from(this.engines.values()).map(engine => engine.stop())
    await Promise.all(promises)
  }

  broadcast(event: string, data?: any): void {
    this.engines.forEach((engine) => {
      engine.emit(event, data)
    })
  }
}

// 使用引擎管理器
const manager = new EngineManager()

const mainEngine = manager.createEngine('main', {
  version: '1.0.0',
  plugins: [corePlugin]
})

const workerEngine = manager.createEngine('worker', {
  version: '1.0.0',
  plugins: [workerPlugin]
})

// 启动所有引擎
await manager.startAll()

// 广播事件
manager.broadcast('app:ready')
```

## 最佳实践

### 1. 配置管理

```typescript
// 使用环境变量
// 使用配置文件
import config from './config.json'

const engine = new Engine({
  name: process.env.APP_NAME || 'my-app',
  version: process.env.APP_VERSION || '1.0.0',
  debug: process.env.NODE_ENV === 'development',
  logLevel: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO
})

const engine = new Engine(config)
```

### 2. 错误处理

```typescript
// 完善的错误处理
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  errorHandler: (error, context) => {
    // 分类处理不同类型的错误
    switch (error.name) {
      case 'PluginError':
        handlePluginError(error, context)
        break
      case 'StateError':
        handleStateError(error, context)
        break
      case 'NetworkError':
        handleNetworkError(error, context)
        break
      default:
        handleGenericError(error, context)
    }
  }
})
```

### 3. 性能优化

```typescript
// 生产环境优化配置
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  debug: false,
  logLevel: LogLevel.WARN,
  performance: {
    enableMetrics: true,
    metricsInterval: 10000, // 降低指标收集频率
    maxMemoryUsage: 150 * 1024 * 1024
  },
  // 只在生产环境启用持久化
  persistence: {
    enabled: process.env.NODE_ENV === 'production',
    storage: 'localStorage',
    include: ['user', 'settings']
  }
})
```

### 4. 测试配置

```typescript
// 测试环境配置
function createTestEngine(overrides = {}) {
  return new Engine({
    name: 'test-engine',
    version: '1.0.0',
    debug: true,
    logLevel: LogLevel.SILENT, // 测试时静默日志
    persistence: { enabled: false }, // 测试时不持久化
    ...overrides
  })
}

// 在测试中使用
const engine = createTestEngine({
  initialState: {
    user: { id: 1, name: 'Test User' }
  }
})
```

## 下一步

现在您已经掌握了引擎实例的创建和配置，可以继续学习：

- [插件系统](/guide/plugin-system) - 学习如何开发和使用插件
- [事件系统](/guide/event-system) - 掌握事件的高级用法
- [中间件](/guide/middleware) - 了解中间件的强大功能
- [状态管理](/guide/state-management) - 深入学习状态管理
- [API 参考](/api/engine) - 查看完整的 API 文档

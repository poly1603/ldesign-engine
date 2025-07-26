# 配置选项

本章详细介绍 @ldesign/engine 的所有配置选项，帮助您根据需求定制引擎行为。

## 基础配置

### 引擎配置接口

```typescript
interface EngineConfig {
  // 基本信息
  name: string                    // 引擎名称（必需）
  version: string                 // 引擎版本（必需）
  description?: string            // 引擎描述
  
  // 调试和日志
  debug?: boolean                 // 是否开启调试模式
  logLevel?: LogLevel             // 日志级别
  logger?: Logger                 // 自定义日志器
  
  // 事件系统
  maxListeners?: number           // 最大事件监听器数量
  eventTimeout?: number           // 事件超时时间（毫秒）
  
  // 插件系统
  plugins?: Plugin[]              // 预注册的插件
  pluginTimeout?: number          // 插件操作超时时间
  
  // 中间件
  middleware?: Middleware[]       // 预注册的中间件
  
  // 状态管理
  initialState?: Record<string, any>  // 初始状态
  persistence?: PersistenceConfig     // 状态持久化配置
  
  // 性能优化
  performance?: PerformanceConfig     // 性能配置
  
  // 错误处理
  errorHandler?: ErrorHandler         // 全局错误处理器
  
  // 环境配置
  env?: 'development' | 'production' | 'test'  // 运行环境
}
```

### 基本配置示例

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  // 必需配置
  name: 'my-application',
  version: '1.0.0',
  
  // 可选配置
  description: '我的应用程序',
  debug: true,
  env: 'development'
})
```

## 调试和日志配置

### 日志级别

```typescript
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  debug: true,
  logLevel: 'debug'  // 设置日志级别
})
```

### 自定义日志器

```typescript
import { Logger } from '@ldesign/engine'

// 实现自定义日志器
class CustomLogger implements Logger {
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args)
    // 发送到错误监控服务
    this.sendToErrorService('error', message, args)
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args)
  }
  
  info(message: string, ...args: any[]): void {
    console.info(`[INFO] ${message}`, ...args)
  }
  
  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }
  
  trace(message: string, ...args: any[]): void {
    console.trace(`[TRACE] ${message}`, ...args)
  }
  
  private sendToErrorService(level: string, message: string, args: any[]): void {
    // 实现错误上报逻辑
  }
}

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  logger: new CustomLogger()
})
```

## 事件系统配置

### 事件监听器限制

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  maxListeners: 50,  // 每个事件最多 50 个监听器
  eventTimeout: 5000 // 事件处理超时 5 秒
})

// 监听器数量警告
engine.on('maxListenersExceeded', (eventName, count) => {
  console.warn(`事件 ${eventName} 的监听器数量 (${count}) 超过限制`)
})
```

### 事件超时处理

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  eventTimeout: 3000  // 3秒超时
})

// 监听超时事件
engine.on('eventTimeout', (eventName, duration) => {
  console.error(`事件 ${eventName} 处理超时 (${duration}ms)`)
})
```

## 插件系统配置

### 预注册插件

```typescript
import { authPlugin, uiPlugin, analyticsPlugin } from './plugins'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  plugins: [
    authPlugin,
    uiPlugin,
    analyticsPlugin
  ],
  pluginTimeout: 10000  // 插件操作超时 10 秒
})
```

### 插件配置

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  plugins: [
    {
      plugin: authPlugin,
      config: {
        tokenExpiry: 3600000,
        autoRefresh: true,
        storage: 'localStorage'
      }
    },
    {
      plugin: uiPlugin,
      config: {
        theme: 'dark',
        animations: true
      }
    }
  ]
})
```

## 状态管理配置

### 初始状态

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  initialState: {
    user: null,
    theme: 'light',
    language: 'zh-CN',
    settings: {
      notifications: true,
      autoSave: true
    },
    cache: new Map()
  }
})
```

### 状态持久化配置

```typescript
interface PersistenceConfig {
  enabled: boolean                    // 是否启用持久化
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'custom'
  key?: string                        // 存储键名
  include?: string[]                  // 包含的状态键
  exclude?: string[]                  // 排除的状态键
  serializer?: Serializer             // 自定义序列化器
  debounceTime?: number               // 防抖时间（毫秒）
  compression?: boolean               // 是否压缩
}

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  persistence: {
    enabled: true,
    storage: 'localStorage',
    key: 'my-app-state',
    include: ['user', 'settings', 'theme'],  // 只持久化这些状态
    exclude: ['cache', 'temp'],              // 排除临时状态
    debounceTime: 1000,                      // 1秒防抖
    compression: true                        // 启用压缩
  }
})
```

### 自定义序列化器

```typescript
import { Serializer } from '@ldesign/engine'

class CustomSerializer implements Serializer {
  serialize(data: any): string {
    // 自定义序列化逻辑
    return JSON.stringify(data, (key, value) => {
      // 处理特殊类型
      if (value instanceof Map) {
        return {
          __type: 'Map',
          __data: Array.from(value.entries())
        }
      }
      if (value instanceof Set) {
        return {
          __type: 'Set',
          __data: Array.from(value)
        }
      }
      return value
    })
  }
  
  deserialize(data: string): any {
    // 自定义反序列化逻辑
    return JSON.parse(data, (key, value) => {
      if (value && typeof value === 'object' && value.__type) {
        switch (value.__type) {
          case 'Map':
            return new Map(value.__data)
          case 'Set':
            return new Set(value.__data)
        }
      }
      return value
    })
  }
}

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  persistence: {
    enabled: true,
    storage: 'localStorage',
    serializer: new CustomSerializer()
  }
})
```

## 性能配置

### 性能配置接口

```typescript
interface PerformanceConfig {
  enableMetrics?: boolean             // 启用性能指标收集
  metricsInterval?: number            // 指标收集间隔（毫秒）
  memoryThreshold?: number            // 内存使用阈值（MB）
  eventLoopThreshold?: number         // 事件循环延迟阈值（毫秒）
  gcThreshold?: number                // GC 压力阈值
  enableProfiling?: boolean           // 启用性能分析
}

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  performance: {
    enableMetrics: true,
    metricsInterval: 5000,      // 每5秒收集一次指标
    memoryThreshold: 100,       // 内存使用超过100MB时警告
    eventLoopThreshold: 100,    // 事件循环延迟超过100ms时警告
    enableProfiling: process.env.NODE_ENV === 'development'
  }
})
```

### 性能监控

```typescript
// 监听性能事件
engine.on('performance:memory-warning', (usage) => {
  console.warn('内存使用过高:', usage)
})

engine.on('performance:event-loop-lag', (lag) => {
  console.warn('事件循环延迟:', lag)
})

engine.on('performance:metrics', (metrics) => {
  console.log('性能指标:', metrics)
  // 发送到监控服务
})
```

## 错误处理配置

### 全局错误处理器

```typescript
import { ErrorHandler, EngineError } from '@ldesign/engine'

class CustomErrorHandler implements ErrorHandler {
  handleError(error: Error, context?: any): void {
    // 记录错误
    console.error('引擎错误:', error)
    
    // 根据错误类型进行不同处理
    if (error instanceof EngineError) {
      this.handleEngineError(error, context)
    } else {
      this.handleGenericError(error, context)
    }
    
    // 发送错误报告
    this.reportError(error, context)
  }
  
  private handleEngineError(error: EngineError, context?: any): void {
    switch (error.code) {
      case 'PLUGIN_LOAD_FAILED':
        console.error('插件加载失败:', error.message)
        break
      case 'EVENT_TIMEOUT':
        console.error('事件处理超时:', error.message)
        break
      default:
        console.error('引擎错误:', error.message)
    }
  }
  
  private handleGenericError(error: Error, context?: any): void {
    console.error('通用错误:', error.message)
  }
  
  private reportError(error: Error, context?: any): void {
    // 发送到错误监控服务
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now()
      })
    }).catch(console.error)
  }
}

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  errorHandler: new CustomErrorHandler()
})
```

## 环境配置

### 环境特定配置

```typescript
function createEngineConfig(env: string) {
  const baseConfig = {
    name: 'my-app',
    version: '1.0.0'
  }
  
  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        debug: true,
        logLevel: 'debug' as const,
        performance: {
          enableMetrics: true,
          enableProfiling: true
        }
      }
      
    case 'production':
      return {
        ...baseConfig,
        debug: false,
        logLevel: 'error' as const,
        performance: {
          enableMetrics: true,
          enableProfiling: false
        },
        persistence: {
          enabled: true,
          storage: 'localStorage' as const,
          compression: true
        }
      }
      
    case 'test':
      return {
        ...baseConfig,
        debug: false,
        logLevel: 'warn' as const,
        maxListeners: 1000,  // 测试时允许更多监听器
        eventTimeout: 1000   // 测试时使用较短超时
      }
      
    default:
      return baseConfig
  }
}

const engine = new Engine(createEngineConfig(process.env.NODE_ENV || 'development'))
```

### 配置文件

```typescript
// config/engine.config.ts
export const engineConfig = {
  development: {
    name: 'my-app-dev',
    version: '1.0.0',
    debug: true,
    logLevel: 'debug',
    persistence: {
      enabled: false  // 开发环境不持久化
    }
  },
  
  production: {
    name: 'my-app',
    version: '1.0.0',
    debug: false,
    logLevel: 'error',
    persistence: {
      enabled: true,
      storage: 'localStorage',
      compression: true
    },
    performance: {
      enableMetrics: true,
      metricsInterval: 30000
    }
  }
}

// main.ts
import { engineConfig } from './config/engine.config'

const env = process.env.NODE_ENV || 'development'
const config = engineConfig[env]

const engine = new Engine(config)
```

## 动态配置

### 运行时配置更新

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 更新日志级别
engine.updateConfig({
  logLevel: 'info'
})

// 更新性能配置
engine.updateConfig({
  performance: {
    enableMetrics: false
  }
})

// 监听配置变化
engine.on('config:updated', (newConfig, oldConfig) => {
  console.log('配置已更新:', { newConfig, oldConfig })
})
```

### 配置验证

```typescript
import Joi from 'joi'

// 定义配置验证模式
const configSchema = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().pattern(/^\d+\.\d+\.\d+$/).required(),
  debug: Joi.boolean().default(false),
  logLevel: Joi.string().valid('error', 'warn', 'info', 'debug', 'trace').default('info'),
  maxListeners: Joi.number().integer().min(1).max(1000).default(10),
  eventTimeout: Joi.number().integer().min(100).default(5000)
})

// 验证配置
function validateConfig(config: any) {
  const { error, value } = configSchema.validate(config)
  if (error) {
    throw new Error(`配置验证失败: ${error.message}`)
  }
  return value
}

// 使用验证后的配置
const validatedConfig = validateConfig({
  name: 'my-app',
  version: '1.0.0',
  debug: true
})

const engine = new Engine(validatedConfig)
```

## 配置最佳实践

### 1. 分层配置

```typescript
// 基础配置
const baseConfig = {
  name: 'my-app',
  version: '1.0.0'
}

// 环境配置
const envConfig = {
  development: { debug: true, logLevel: 'debug' },
  production: { debug: false, logLevel: 'error' },
  test: { debug: false, logLevel: 'warn' }
}

// 用户配置
const userConfig = {
  theme: 'dark',
  language: 'zh-CN'
}

// 合并配置
const finalConfig = {
  ...baseConfig,
  ...envConfig[process.env.NODE_ENV || 'development'],
  ...userConfig
}
```

### 2. 配置类型安全

```typescript
// 定义严格的配置类型
interface AppConfig extends EngineConfig {
  name: 'my-app'
  version: string
  features: {
    auth: boolean
    analytics: boolean
    notifications: boolean
  }
}

const config: AppConfig = {
  name: 'my-app',
  version: '1.0.0',
  features: {
    auth: true,
    analytics: false,
    notifications: true
  }
}
```

### 3. 配置文档化

```typescript
/**
 * 应用程序配置
 * @interface AppConfig
 */
interface AppConfig {
  /** 应用名称 */
  name: string
  
  /** 应用版本 */
  version: string
  
  /** 
   * 调试模式
   * @default false
   */
  debug?: boolean
  
  /**
   * 日志级别
   * @default 'info'
   */
  logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace'
}
```

## 下一步

了解了配置选项后，您可以：

- 学习 [引擎实例](/guide/engine-instance) 的详细用法
- 了解 [插件系统](/guide/plugin-system) 的配置
- 探索 [事件系统](/guide/event-system) 的高级配置
- 查看 [性能优化](/guide/performance) 的配置技巧
- 阅读 [最佳实践](/guide/best-practices) 获取配置建议
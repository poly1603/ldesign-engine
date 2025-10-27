# 核心概念

深入了解 LDesign Engine 的核心概念和设计理念。

## 引擎架构

LDesign Engine 采用模块化、插件化的架构设计，核心由以下几个部分组成：

```
┌─────────────────────────────────────────┐
│          Application Layer              │
│         (Your Vue Application)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Engine Core                    │
│  ┌────────────────────────────────────┐ │
│  │     Plugin Manager                 │ │
│  │     Middleware Manager             │ │
│  │     Event Manager                  │ │
│  │     State Manager                  │ │
│  └────────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Utility Layer                   │
│  Cache · Logger · Security · etc.       │
└─────────────────────────────────────────┘
```

## 核心管理器

### 1. 插件管理器 (Plugin Manager)

插件是扩展引擎功能的主要方式。每个插件都可以：

- **注册生命周期钩子**
- **访问引擎API**
- **与其他插件通信**
- **声明依赖关系**

```typescript
interface Plugin {
  name: string
  version?: string
  dependencies?: string[]
  install: (engine: Engine) => void | Promise<void>
  uninstall?: (engine: Engine) => void | Promise<void>
}
```

### 2. 事件管理器 (Event Manager)

基于发布-订阅模式的事件系统，支持：

- **优先级控制**：控制事件处理器的执行顺序
- **命名空间**：组织和隔离事件
- **事件防抖/节流**：优化高频事件
- **一次性监听**：自动清理的事件监听
- **异步事件**：支持异步事件处理

```typescript
// 基础事件
engine.events.on('user:login', handler)

// 优先级事件
engine.events.on('data:update', handler, { priority: 10 })

// 命名空间
const userEvents = engine.events.namespace('user')
userEvents.on('login', handler)

// 防抖事件
const debounced = engine.events.debounce('search', 300)
```

### 3. 状态管理器 (State Manager)

响应式状态管理，提供：

- **响应式数据**：基于 Vue 的响应式系统
- **模块化**：按功能划分状态模块
- **持久化**：自动保存和恢复状态
- **时间旅行**：撤销/重做功能
- **计算属性**：派生状态

```typescript
// 设置状态
engine.state.set('user.profile', { name: 'Alice' })

// 监听变化
engine.state.watch('user.profile', (newVal, oldVal) => {
  console.log('状态变化', newVal)
})

// 批量更新
engine.state.batch(() => {
  engine.state.set('user.name', 'Bob')
  engine.state.set('user.age', 30)
})

// 模块化状态
engine.state.registerModule('cart', {
  items: [],
  total: 0
})
```

### 4. 中间件管理器 (Middleware Manager)

中间件系统用于处理横切关注点：

- **请求/响应处理**
- **权限验证**
- **日志记录**
- **错误处理**
- **性能监控**

```typescript
interface Middleware {
  name: string
  handler: (context: MiddlewareContext, next: () => Promise<void>) => Promise<void>
  priority?: number
}

// 注册中间件
engine.middleware.use({
  name: 'auth',
  handler: async (context, next) => {
    if (!context.user) {
      throw new Error('未授权')
    }
    await next()
  }
})

// 执行中间件链
await engine.middleware.execute(context)
```

### 5. 缓存管理器 (Cache Manager)

智能缓存系统，特性包括：

- **多级缓存**：内存缓存 + 持久化缓存
- **LRU淘汰**：自动清理过期数据
- **命名空间**：隔离不同模块的缓存
- **TTL支持**：设置缓存过期时间
- **预热机制**：提前加载常用数据

```typescript
// 基础缓存
engine.cache.set('user:123', userData, 3600000) // 1小时

// 命名空间缓存
const apiCache = engine.cache.namespace('api')
apiCache.set('users', users)

// 缓存预热
await engine.cache.warmup([
  { key: 'config', loader: () => fetchConfig() },
  { key: 'users', loader: () => fetchUsers() }
])

// 批量操作
await engine.cache.batchSet([
  { key: 'user:1', value: user1 },
  { key: 'user:2', value: user2 }
])
```

## 生命周期

引擎和插件都有完整的生命周期：

```
┌──────────────┐
│   创建       │  createEngine()
└──────┬───────┘
       │
┌──────▼───────┐
│   初始化     │  beforeInit → init → afterInit
└──────┬───────┘
       │
┌──────▼───────┐
│   运行       │  应用正常运行
└──────┬───────┘
       │
┌──────▼───────┐
│   销毁       │  beforeDestroy → destroy → afterDestroy
└──────────────┘
```

### 生命周期钩子

```typescript
// 在初始化前
engine.lifecycle.on('beforeInit', async (context) => {
  console.log('准备初始化')
})

// 初始化完成后
engine.lifecycle.on('afterInit', async (context) => {
  console.log('初始化完成')
})

// 销毁前
engine.lifecycle.on('beforeDestroy', async (context) => {
  console.log('准备清理')
})

// 销毁完成后
engine.lifecycle.on('afterDestroy', async (context) => {
  console.log('清理完成')
})
```

## 依赖注入

引擎内置依赖注入容器，支持三种生命周期：

### 单例 (Singleton)

全局共享一个实例：

```typescript
engine.di.register('userService', UserService, 'singleton')

// 每次解析都返回同一个实例
const service1 = engine.di.resolve('userService')
const service2 = engine.di.resolve('userService')
console.log(service1 === service2) // true
```

### 瞬态 (Transient)

每次解析都创建新实例：

```typescript
engine.di.register('logger', Logger, 'transient')

const logger1 = engine.di.resolve('logger')
const logger2 = engine.di.resolve('logger')
console.log(logger1 === logger2) // false
```

### 作用域 (Scoped)

在同一作用域内共享实例：

```typescript
engine.di.register('dbConnection', DbConnection, 'scoped')

// 创建作用域
const scope = engine.di.createScope()
const conn1 = scope.resolve('dbConnection')
const conn2 = scope.resolve('dbConnection')
console.log(conn1 === conn2) // true

// 新作用域有新实例
const newScope = engine.di.createScope()
const conn3 = newScope.resolve('dbConnection')
console.log(conn1 === conn3) // false
```

## 性能优化

引擎内置多种性能优化机制：

### 1. 懒加载

按需加载功能模块，减少初始加载时间：

```typescript
// 懒加载模块
const lazyModule = () => import('./heavy-module')

engine.plugins.register({
  name: 'heavy-feature',
  install: async (engine) => {
    const module = await lazyModule()
    module.init(engine)
  }
})
```

### 2. 对象池

复用对象实例，减少GC压力：

```typescript
import { ObjectPool } from '@ldesign/engine/utils'

const pool = new ObjectPool(() => ({ data: null }))

// 获取对象
const obj = pool.acquire()
obj.data = 'some data'

// 归还对象
pool.release(obj)
```

### 3. 批处理

合并多个操作，减少重复计算：

```typescript
import { BatchProcessor } from '@ldesign/engine/utils'

const processor = new BatchProcessor({
  process: async (items) => {
    // 批量处理
    return await batchProcess(items)
  },
  delay: 50 // 等待50ms收集更多项
})

// 添加项目（自动批处理）
processor.add(item1)
processor.add(item2)
processor.add(item3)
```

### 4. 并发控制

限制并发操作数量，防止资源耗尽：

```typescript
import { ConcurrencyLimiter } from '@ldesign/engine/utils'

const limiter = new ConcurrencyLimiter(3) // 最多3个并发

// 执行操作
await limiter.run(async () => {
  // 你的异步操作
  await fetchData()
})
```

## 错误处理

完善的错误处理机制：

### 错误边界

组件级错误捕获：

```vue
<template>
  <ErrorBoundary @error="handleError">
    <YourComponent />
  </ErrorBoundary>
</template>

<script setup>
import { ErrorBoundary } from '@ldesign/engine/vue'

function handleError(error, retry) {
  console.error('组件错误:', error)
  // 可以选择重试
  retry()
}
</script>
```

### 全局错误处理

```typescript
// 设置全局错误处理器
engine.errors.setErrorHandler((error, context) => {
  console.error('全局错误:', error)
  
  // 错误上报
  reportError(error)
  
  // 用户友好提示
  engine.notifications.error('操作失败，请稍后重试')
  
  // 恢复策略
  if (error.recoverable) {
    engine.errors.recoverFromError(error.id)
  }
})
```

## 安全性

内置多层安全防护：

### XSS 防护

```typescript
// HTML清理
const result = engine.security.sanitizeHTML(userInput)
console.log(result.sanitized) // 清理后的HTML
console.log(result.threats) // 检测到的威胁

// 输入验证
const isValid = engine.security.validateInput(input, 'email')
```

### CSRF 防护

```typescript
// 生成令牌
const token = engine.security.generateCSRFToken()

// 验证令牌
const isValid = engine.security.validateCSRFToken(token.token)
```

### 内容安全策略

```typescript
engine.security.setCSP({
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:']
})
```

## 下一步

现在你已经了解了引擎的核心概念，可以：

- 📖 查看 [API 参考](/api/) 了解详细接口
- 🎯 阅读 [最佳实践](/guide/best-practices) 学习开发技巧
- 💡 浏览 [示例代码](/examples/) 获取灵感
- 🚀 开始 [构建你的应用](/guide/getting-started)



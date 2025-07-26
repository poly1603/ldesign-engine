# 中间件

中间件是 @ldesign/engine 中一个强大的功能，它允许您在特定的执行点插入自定义逻辑。中间件采用洋葱模型，可以在操作执行前后进行处理，非常适合实现横切关注点如日志记录、身份验证、性能监控等。

## 中间件基础

### 基本概念

中间件是一个函数，它接收上下文对象和 `next` 函数作为参数：

- **上下文 (Context)**：包含当前操作的相关信息
- **next 函数**：调用下一个中间件或目标操作
- **洋葱模型**：中间件按顺序执行，形成洋葱状的执行流程

### 中间件接口

```typescript
interface Middleware {
  name: string                    // 中间件名称
  priority?: number               // 执行优先级（数字越大越先执行）
  enabled?: boolean               // 是否启用
  execute: MiddlewareFunction     // 执行函数
  condition?: (context: MiddlewareContext) => boolean // 执行条件
}

type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<any>
) => Promise<any>

interface MiddlewareContext {
  operation: string               // 操作名称
  args: any[]                    // 操作参数
  metadata: Record<string, any>  // 元数据
  startTime: number              // 开始时间
  user?: any                     // 用户信息
  request?: any                  // 请求信息
  [key: string]: any             // 其他自定义属性
}
```

### 基本用法

```typescript
import { Engine, Middleware } from '@ldesign/engine'

// 创建一个简单的日志中间件
const loggingMiddleware: Middleware = {
  name: 'logging',
  priority: 100,
  
  async execute(context, next) {
    console.log(`开始执行: ${context.operation}`, context.args)
    const startTime = Date.now()
    
    try {
      // 执行下一个中间件或目标操作
      const result = await next()
      
      const duration = Date.now() - startTime
      console.log(`执行完成: ${context.operation} (${duration}ms)`, result)
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`执行失败: ${context.operation} (${duration}ms)`, error)
      throw error
    }
  }
}

// 注册中间件
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  middleware: [loggingMiddleware]
})

// 或者动态添加
engine.addMiddleware(loggingMiddleware)
```

## 中间件类型

### 1. 全局中间件

全局中间件会在所有操作中执行。

```typescript
const globalAuthMiddleware: Middleware = {
  name: 'global-auth',
  priority: 200,
  
  async execute(context, next) {
    // 检查用户是否已认证
    if (!context.user?.isAuthenticated) {
      throw new Error('用户未认证')
    }
    
    // 检查用户权限
    if (!this.hasPermission(context.user, context.operation)) {
      throw new Error('权限不足')
    }
    
    return await next()
  },
  
  hasPermission(user: any, operation: string): boolean {
    // 权限检查逻辑
    const permissions = user.permissions || []
    return permissions.includes(operation) || user.role === 'admin'
  }
}

engine.addMiddleware(globalAuthMiddleware)
```

### 2. 条件中间件

只在满足特定条件时执行的中间件。

```typescript
const apiMiddleware: Middleware = {
  name: 'api-middleware',
  priority: 150,
  
  // 只对 API 操作执行
  condition: (context) => context.operation.startsWith('api:'),
  
  async execute(context, next) {
    // 添加 API 请求头
    context.headers = {
      ...context.headers,
      'X-Request-ID': generateRequestId(),
      'X-Timestamp': Date.now().toString()
    }
    
    try {
      const result = await next()
      
      // 记录 API 调用
      this.logApiCall(context, result)
      
      return result
    } catch (error) {
      // 记录 API 错误
      this.logApiError(context, error)
      throw error
    }
  },
  
  logApiCall(context: any, result: any) {
    console.log('API 调用成功:', {
      operation: context.operation,
      requestId: context.headers['X-Request-ID'],
      duration: Date.now() - context.startTime
    })
  },
  
  logApiError(context: any, error: any) {
    console.error('API 调用失败:', {
      operation: context.operation,
      requestId: context.headers['X-Request-ID'],
      error: error.message
    })
  }
}

engine.addMiddleware(apiMiddleware)
```

### 3. 操作特定中间件

只对特定操作执行的中间件。

```typescript
const dataValidationMiddleware: Middleware = {
  name: 'data-validation',
  priority: 180,
  
  condition: (context) => {
    return ['user:create', 'user:update', 'data:save'].includes(context.operation)
  },
  
  async execute(context, next) {
    // 验证数据
    const validationResult = this.validateData(context.operation, context.args[0])
    
    if (!validationResult.valid) {
      throw new Error(`数据验证失败: ${validationResult.errors.join(', ')}`)
    }
    
    // 清理和标准化数据
    context.args[0] = this.sanitizeData(context.args[0])
    
    return await next()
  },
  
  validateData(operation: string, data: any) {
    const errors: string[] = []
    
    switch (operation) {
      case 'user:create':
      case 'user:update':
        if (!data.email) errors.push('邮箱不能为空')
        if (!data.name) errors.push('姓名不能为空')
        if (data.email && !this.isValidEmail(data.email)) {
          errors.push('邮箱格式无效')
        }
        break
      
      case 'data:save':
        if (!data.id) errors.push('ID 不能为空')
        if (!data.content) errors.push('内容不能为空')
        break
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  sanitizeData(data: any) {
    const sanitized = { ...data }
    
    // 清理字符串字段
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim()
      }
    })
    
    // 标准化邮箱
    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase()
    }
    
    return sanitized
  },
  
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

engine.addMiddleware(dataValidationMiddleware)
```

## 中间件执行流程

### 洋葱模型

```typescript
// 中间件执行顺序示例
const middleware1: Middleware = {
  name: 'middleware-1',
  priority: 100,
  async execute(context, next) {
    console.log('1: 前置处理')
    const result = await next()
    console.log('1: 后置处理')
    return result
  }
}

const middleware2: Middleware = {
  name: 'middleware-2',
  priority: 50,
  async execute(context, next) {
    console.log('2: 前置处理')
    const result = await next()
    console.log('2: 后置处理')
    return result
  }
}

const middleware3: Middleware = {
  name: 'middleware-3',
  priority: 10,
  async execute(context, next) {
    console.log('3: 前置处理')
    const result = await next()
    console.log('3: 后置处理')
    return result
  }
}

engine.addMiddleware(middleware1)
engine.addMiddleware(middleware2)
engine.addMiddleware(middleware3)

// 执行操作时的输出：
// 1: 前置处理
// 2: 前置处理
// 3: 前置处理
// [实际操作执行]
// 3: 后置处理
// 2: 后置处理
// 1: 后置处理
```

### 中间件链

```typescript
class MiddlewareChain {
  private middlewares: Middleware[] = []
  
  add(middleware: Middleware) {
    this.middlewares.push(middleware)
    // 按优先级排序
    this.middlewares.sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }
  
  async execute(context: MiddlewareContext, operation: () => Promise<any>) {
    let index = 0
    
    const next = async (): Promise<any> => {
      // 找到下一个符合条件的中间件
      while (index < this.middlewares.length) {
        const middleware = this.middlewares[index++]
        
        if (middleware.enabled !== false && 
            (!middleware.condition || middleware.condition(context))) {
          return await middleware.execute(context, next)
        }
      }
      
      // 所有中间件都执行完毕，执行实际操作
      return await operation()
    }
    
    return await next()
  }
}
```

## 常用中间件示例

### 1. 性能监控中间件

```typescript
const performanceMiddleware: Middleware = {
  name: 'performance',
  priority: 90,
  
  async execute(context, next) {
    const startTime = process.hrtime.bigint()
    const startMemory = process.memoryUsage()
    
    try {
      const result = await next()
      
      const endTime = process.hrtime.bigint()
      const endMemory = process.memoryUsage()
      
      const metrics = {
        operation: context.operation,
        duration: Number(endTime - startTime) / 1000000, // 转换为毫秒
        memoryDelta: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external
        },
        timestamp: Date.now()
      }
      
      // 发送性能指标
      context.engine.emit('performance:metrics', metrics)
      
      // 如果执行时间过长，发出警告
      if (metrics.duration > 1000) {
        context.engine.emit('performance:slow-operation', metrics)
      }
      
      return result
    } catch (error) {
      const endTime = process.hrtime.bigint()
      const duration = Number(endTime - startTime) / 1000000
      
      context.engine.emit('performance:error', {
        operation: context.operation,
        duration,
        error: error.message
      })
      
      throw error
    }
  }
}
```

### 2. 缓存中间件

```typescript
const cacheMiddleware: Middleware = {
  name: 'cache',
  priority: 70,
  
  condition: (context) => {
    // 只对读操作启用缓存
    return context.operation.includes('get') || context.operation.includes('find')
  },
  
  async execute(context, next) {
    const cacheKey = this.generateCacheKey(context)
    
    // 尝试从缓存获取
    const cached = await this.getFromCache(cacheKey)
    if (cached) {
      console.log(`缓存命中: ${cacheKey}`)
      context.engine.emit('cache:hit', { key: cacheKey, operation: context.operation })
      return cached
    }
    
    // 缓存未命中，执行操作
    console.log(`缓存未命中: ${cacheKey}`)
    context.engine.emit('cache:miss', { key: cacheKey, operation: context.operation })
    
    const result = await next()
    
    // 将结果存入缓存
    await this.setCache(cacheKey, result, this.getTTL(context.operation))
    
    return result
  },
  
  generateCacheKey(context: MiddlewareContext): string {
    const keyParts = [context.operation, ...context.args.map(arg => JSON.stringify(arg))]
    return `cache:${keyParts.join(':')}:${this.hashString(keyParts.join(''))}`
  },
  
  async getFromCache(key: string): Promise<any> {
    // 实现缓存获取逻辑（Redis、内存等）
    return null // 简化示例
  },
  
  async setCache(key: string, value: any, ttl: number): Promise<void> {
    // 实现缓存设置逻辑
    console.log(`设置缓存: ${key}, TTL: ${ttl}s`)
  },
  
  getTTL(operation: string): number {
    // 根据操作类型返回不同的 TTL
    const ttlMap: Record<string, number> = {
      'user:get': 300,      // 5分钟
      'data:find': 600,     // 10分钟
      'config:get': 3600,   // 1小时
    }
    
    return ttlMap[operation] || 60 // 默认1分钟
  },
  
  hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString(36)
  }
}
```

### 3. 重试中间件

```typescript
const retryMiddleware: Middleware = {
  name: 'retry',
  priority: 60,
  
  condition: (context) => {
    // 只对网络操作启用重试
    return context.operation.startsWith('api:') || context.operation.startsWith('network:')
  },
  
  async execute(context, next) {
    const maxRetries = this.getMaxRetries(context.operation)
    const baseDelay = this.getBaseDelay(context.operation)
    
    let lastError: Error
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(baseDelay, attempt)
          console.log(`重试 ${attempt}/${maxRetries}，延迟 ${delay}ms`)
          await this.sleep(delay)
        }
        
        const result = await next()
        
        if (attempt > 0) {
          context.engine.emit('retry:success', {
            operation: context.operation,
            attempt,
            totalAttempts: attempt + 1
          })
        }
        
        return result
      } catch (error) {
        lastError = error
        
        // 检查是否应该重试
        if (!this.shouldRetry(error, attempt, maxRetries)) {
          break
        }
        
        context.engine.emit('retry:attempt', {
          operation: context.operation,
          attempt: attempt + 1,
          error: error.message,
          willRetry: attempt < maxRetries
        })
      }
    }
    
    // 所有重试都失败了
    context.engine.emit('retry:failed', {
      operation: context.operation,
      totalAttempts: maxRetries + 1,
      finalError: lastError.message
    })
    
    throw lastError
  },
  
  getMaxRetries(operation: string): number {
    const retryMap: Record<string, number> = {
      'api:critical': 5,
      'api:normal': 3,
      'network:upload': 2,
    }
    
    return retryMap[operation] || 1
  },
  
  getBaseDelay(operation: string): number {
    const delayMap: Record<string, number> = {
      'api:critical': 1000,
      'api:normal': 500,
      'network:upload': 2000,
    }
    
    return delayMap[operation] || 1000
  },
  
  calculateDelay(baseDelay: number, attempt: number): number {
    // 指数退避 + 随机抖动
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 0.1 * exponentialDelay
    return Math.floor(exponentialDelay + jitter)
  },
  
  shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
    if (attempt >= maxRetries) {
      return false
    }
    
    // 根据错误类型决定是否重试
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ServiceUnavailableError',
      'InternalServerError'
    ]
    
    return retryableErrors.includes(error.name) || 
           error.message.includes('ECONNRESET') ||
           error.message.includes('ETIMEDOUT')
  },
  
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### 4. 数据转换中间件

```typescript
const dataTransformMiddleware: Middleware = {
  name: 'data-transform',
  priority: 40,
  
  async execute(context, next) {
    // 请求数据转换
    context.args = this.transformRequest(context.operation, context.args)
    
    const result = await next()
    
    // 响应数据转换
    return this.transformResponse(context.operation, result)
  },
  
  transformRequest(operation: string, args: any[]): any[] {
    switch (operation) {
      case 'user:create':
      case 'user:update':
        if (args[0]) {
          // 标准化用户数据
          args[0] = {
            ...args[0],
            email: args[0].email?.toLowerCase().trim(),
            name: args[0].name?.trim(),
            createdAt: args[0].createdAt || new Date().toISOString()
          }
        }
        break
      
      case 'api:request':
        if (args[0]) {
          // 添加通用请求头
          args[0].headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...args[0].headers
          }
        }
        break
    }
    
    return args
  },
  
  transformResponse(operation: string, result: any): any {
    switch (operation) {
      case 'user:get':
      case 'user:find':
        if (result) {
          // 隐藏敏感信息
          return this.sanitizeUser(result)
        }
        break
      
      case 'api:request':
        if (result?.data) {
          // 提取 API 响应数据
          return result.data
        }
        break
      
      case 'data:list':
        if (Array.isArray(result)) {
          // 添加分页信息
          return {
            items: result,
            total: result.length,
            page: 1,
            pageSize: result.length
          }
        }
        break
    }
    
    return result
  },
  
  sanitizeUser(user: any): any {
    const { password, salt, ...sanitized } = user
    return sanitized
  }
}
```

## 中间件管理

### 动态管理

```typescript
// 添加中间件
engine.addMiddleware(loggingMiddleware)

// 移除中间件
engine.removeMiddleware('logging')

// 启用/禁用中间件
engine.enableMiddleware('cache')
engine.disableMiddleware('cache')

// 获取中间件信息
const middlewareInfo = engine.getMiddleware('logging')
console.log(middlewareInfo)

// 获取所有中间件
const allMiddleware = engine.getAllMiddleware()
console.log(allMiddleware)

// 清空所有中间件
engine.clearMiddleware()
```

### 中间件组

```typescript
class MiddlewareGroup {
  private middlewares: Middleware[] = []
  
  constructor(public name: string) {}
  
  add(middleware: Middleware): this {
    this.middlewares.push(middleware)
    return this
  }
  
  remove(name: string): this {
    this.middlewares = this.middlewares.filter(m => m.name !== name)
    return this
  }
  
  enable(): this {
    this.middlewares.forEach(m => m.enabled = true)
    return this
  }
  
  disable(): this {
    this.middlewares.forEach(m => m.enabled = false)
    return this
  }
  
  getMiddlewares(): Middleware[] {
    return [...this.middlewares]
  }
}

// 创建中间件组
const authGroup = new MiddlewareGroup('auth')
  .add(authMiddleware)
  .add(permissionMiddleware)
  .add(auditMiddleware)

const apiGroup = new MiddlewareGroup('api')
  .add(rateLimitMiddleware)
  .add(apiValidationMiddleware)
  .add(apiLoggingMiddleware)

// 注册中间件组
engine.addMiddlewareGroup(authGroup)
engine.addMiddlewareGroup(apiGroup)

// 管理中间件组
engine.enableMiddlewareGroup('auth')
engine.disableMiddlewareGroup('api')
```

### 条件中间件管理

```typescript
class ConditionalMiddleware {
  constructor(
    private middleware: Middleware,
    private conditions: {
      environment?: string[]
      userRole?: string[]
      feature?: string[]
      time?: { start: string; end: string }
    }
  ) {}
  
  shouldExecute(context: MiddlewareContext): boolean {
    // 环境检查
    if (this.conditions.environment) {
      const currentEnv = process.env.NODE_ENV || 'development'
      if (!this.conditions.environment.includes(currentEnv)) {
        return false
      }
    }
    
    // 用户角色检查
    if (this.conditions.userRole && context.user) {
      if (!this.conditions.userRole.includes(context.user.role)) {
        return false
      }
    }
    
    // 功能开关检查
    if (this.conditions.feature) {
      const enabledFeatures = context.engine.getEnabledFeatures()
      if (!this.conditions.feature.some(f => enabledFeatures.includes(f))) {
        return false
      }
    }
    
    // 时间窗口检查
    if (this.conditions.time) {
      const now = new Date()
      const start = new Date(this.conditions.time.start)
      const end = new Date(this.conditions.time.end)
      if (now < start || now > end) {
        return false
      }
    }
    
    return true
  }
  
  async execute(context: MiddlewareContext, next: () => Promise<any>): Promise<any> {
    if (this.shouldExecute(context)) {
      return await this.middleware.execute(context, next)
    } else {
      return await next()
    }
  }
}

// 使用条件中间件
const conditionalLogging = new ConditionalMiddleware(loggingMiddleware, {
  environment: ['development', 'staging'],
  userRole: ['admin', 'developer']
})

engine.addMiddleware({
  name: 'conditional-logging',
  priority: 100,
  execute: conditionalLogging.execute.bind(conditionalLogging)
})
```

## 中间件测试

### 单元测试

```typescript
// middleware.test.ts
import { MiddlewareContext } from '@ldesign/engine'
import { loggingMiddleware } from '../src/middleware/logging'

describe('LoggingMiddleware', () => {
  let context: MiddlewareContext
  let nextFn: jest.Mock
  let consoleSpy: jest.SpyInstance
  
  beforeEach(() => {
    context = {
      operation: 'test:operation',
      args: ['arg1', 'arg2'],
      metadata: {},
      startTime: Date.now()
    }
    
    nextFn = jest.fn()
    consoleSpy = jest.spyOn(console, 'log').mockImplementation()
  })
  
  afterEach(() => {
    consoleSpy.mockRestore()
  })
  
  test('应该记录操作开始和结束', async () => {
    const expectedResult = 'test result'
    nextFn.mockResolvedValue(expectedResult)
    
    const result = await loggingMiddleware.execute(context, nextFn)
    
    expect(result).toBe(expectedResult)
    expect(nextFn).toHaveBeenCalledTimes(1)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('开始执行: test:operation'),
      context.args
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/执行完成: test:operation \(\d+ms\)/),
      expectedResult
    )
  })
  
  test('应该记录操作错误', async () => {
    const error = new Error('Test error')
    nextFn.mockRejectedValue(error)
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    await expect(loggingMiddleware.execute(context, nextFn)).rejects.toThrow(error)
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/执行失败: test:operation \(\d+ms\)/),
      error
    )
    
    consoleErrorSpy.mockRestore()
  })
})
```

### 集成测试

```typescript
// middleware-integration.test.ts
import { Engine } from '@ldesign/engine'
import { loggingMiddleware, authMiddleware, cacheMiddleware } from '../src/middleware'

describe('中间件集成测试', () => {
  let engine: Engine
  
  beforeEach(() => {
    engine = new Engine({
      name: 'test-engine',
      version: '1.0.0'
    })
    
    engine.addMiddleware(loggingMiddleware)
    engine.addMiddleware(authMiddleware)
    engine.addMiddleware(cacheMiddleware)
  })
  
  test('中间件应该按优先级顺序执行', async () => {
    const executionOrder: string[] = []
    
    // 修改中间件以记录执行顺序
    const trackingMiddleware1 = {
      name: 'tracking-1',
      priority: 100,
      async execute(context: any, next: any) {
        executionOrder.push('tracking-1-before')
        const result = await next()
        executionOrder.push('tracking-1-after')
        return result
      }
    }
    
    const trackingMiddleware2 = {
      name: 'tracking-2',
      priority: 50,
      async execute(context: any, next: any) {
        executionOrder.push('tracking-2-before')
        const result = await next()
        executionOrder.push('tracking-2-after')
        return result
      }
    }
    
    engine.addMiddleware(trackingMiddleware1)
    engine.addMiddleware(trackingMiddleware2)
    
    // 添加一个测试操作
    engine.addMethod('testOperation', () => {
      executionOrder.push('operation')
      return 'result'
    })
    
    await engine.testOperation()
    
    expect(executionOrder).toEqual([
      'tracking-1-before',
      'tracking-2-before',
      'operation',
      'tracking-2-after',
      'tracking-1-after'
    ])
  })
  
  test('中间件错误应该被正确处理', async () => {
    const errorMiddleware = {
      name: 'error-middleware',
      priority: 200,
      async execute(context: any, next: any) {
        throw new Error('中间件错误')
      }
    }
    
    engine.addMiddleware(errorMiddleware)
    
    engine.addMethod('testOperation', () => 'result')
    
    await expect(engine.testOperation()).rejects.toThrow('中间件错误')
  })
})
```

## 最佳实践

### 1. 中间件设计原则

```typescript
// ✅ 好的中间件设计
const goodMiddleware: Middleware = {
  name: 'good-middleware',
  priority: 100,
  
  async execute(context, next) {
    // 1. 单一职责
    // 2. 无副作用（除了日志）
    // 3. 错误处理
    // 4. 性能考虑
    
    try {
      // 前置处理
      this.preProcess(context)
      
      const result = await next()
      
      // 后置处理
      return this.postProcess(result)
    } catch (error) {
      // 错误处理
      this.handleError(error, context)
      throw error
    }
  },
  
  preProcess(context: MiddlewareContext) {
    // 轻量级的前置处理
  },
  
  postProcess(result: any) {
    // 轻量级的后置处理
    return result
  },
  
  handleError(error: Error, context: MiddlewareContext) {
    // 错误记录，不修改错误
  }
}

// ❌ 不好的中间件设计
const badMiddleware: Middleware = {
  name: 'bad-middleware',
  priority: 100,
  
  async execute(context, next) {
    // 1. 职责过多
    // 2. 有副作用
    // 3. 缺少错误处理
    // 4. 性能问题
    
    // 重型操作（应该避免）
    await this.heavyOperation()
    
    // 修改全局状态（副作用）
    global.someState = 'modified'
    
    // 没有错误处理
    const result = await next()
    
    // 修改结果（可能不合适）
    return { ...result, modified: true }
  }
}
```

### 2. 性能优化

```typescript
// 使用缓存避免重复计算
const optimizedMiddleware: Middleware = {
  name: 'optimized',
  priority: 100,
  
  private cache = new Map(),
  
  async execute(context, next) {
    const cacheKey = this.getCacheKey(context)
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }
    
    const result = await next()
    
    // 缓存结果（注意内存泄漏）
    if (this.cache.size < 1000) {
      this.cache.set(cacheKey, result)
    }
    
    return result
  }
}

// 使用节流避免频繁执行
const throttledMiddleware: Middleware = {
  name: 'throttled',
  priority: 100,
  
  private lastExecution = 0,
  private minInterval = 100, // 100ms
  
  async execute(context, next) {
    const now = Date.now()
    
    if (now - this.lastExecution < this.minInterval) {
      // 跳过执行
      return await next()
    }
    
    this.lastExecution = now
    
    // 执行中间件逻辑
    return await next()
  }
}
```

### 3. 错误恢复

```typescript
const resilientMiddleware: Middleware = {
  name: 'resilient',
  priority: 100,
  
  async execute(context, next) {
    try {
      return await next()
    } catch (error) {
      // 尝试恢复
      const recovered = await this.tryRecover(error, context)
      
      if (recovered) {
        return recovered
      }
      
      // 无法恢复，重新抛出错误
      throw error
    }
  },
  
  async tryRecover(error: Error, context: MiddlewareContext): Promise<any> {
    // 根据错误类型尝试不同的恢复策略
    switch (error.name) {
      case 'NetworkError':
        return await this.recoverFromNetworkError(context)
      
      case 'ValidationError':
        return await this.recoverFromValidationError(context)
      
      default:
        return null // 无法恢复
    }
  },
  
  async recoverFromNetworkError(context: MiddlewareContext) {
    // 使用缓存数据或默认值
    return this.getDefaultValue(context.operation)
  },
  
  async recoverFromValidationError(context: MiddlewareContext) {
    // 使用清理后的数据重试
    const cleanedArgs = this.cleanArgs(context.args)
    // 重新执行操作
    return null // 简化示例
  }
}
```

## 下一步

现在您已经掌握了中间件的使用，可以继续学习：

- [状态管理](/guide/state-management) - 学习状态管理
- [错误处理](/guide/error-handling) - 了解错误处理机制
- [性能优化](/guide/performance) - 掌握性能优化技巧
- [API 参考](/api/middleware) - 查看完整的中间件 API 文档
- [示例](/examples/middleware-patterns) - 查看更多中间件模式示例
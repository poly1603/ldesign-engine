# 中间件 API

@ldesign/engine 提供了强大的中间件系统，支持请求拦截、响应处理、错误捕获和异步操作等功能。

## 核心接口

### 中间件类型定义

```typescript
// 基础中间件函数
type Middleware<T = any> = (
  context: MiddlewareContext<T>,
  next: NextFunction
) => void | Promise<void>

// 下一步函数
type NextFunction = (error?: Error) => void | Promise<void>

// 中间件上下文
interface MiddlewareContext<T = any> {
  request: T                    // 请求数据
  response?: any               // 响应数据
  state: Record<string, any>   // 共享状态
  metadata: {
    startTime: number          // 开始时间
    middlewareIndex: number    // 当前中间件索引
    path: string[]            // 执行路径
  }
}

// 中间件配置
interface MiddlewareConfig {
  name?: string               // 中间件名称
  priority?: number          // 优先级
  condition?: (context: any) => boolean  // 执行条件
  timeout?: number           // 超时时间
  retries?: number          // 重试次数
}

// 错误中间件
type ErrorMiddleware = (
  error: Error,
  context: MiddlewareContext,
  next: NextFunction
) => void | Promise<void>
```

### 中间件管理器接口

```typescript
interface MiddlewareManager {
  // 注册中间件
  use(middleware: Middleware, config?: MiddlewareConfig): this
  use(name: string, middleware: Middleware, config?: MiddlewareConfig): this
  
  // 移除中间件
  remove(name: string): boolean
  remove(middleware: Middleware): boolean
  
  // 执行中间件链
  execute<T>(context: T): Promise<T>
  
  // 中间件信息
  list(): MiddlewareInfo[]
  has(name: string): boolean
  get(name: string): Middleware | undefined
  
  // 错误处理
  onError(handler: ErrorMiddleware): this
  
  // 清理
  clear(): this
}

interface MiddlewareInfo {
  name: string
  middleware: Middleware
  config: MiddlewareConfig
  stats: {
    executions: number
    totalTime: number
    errors: number
    lastExecution: number
  }
}
```

## 基础中间件操作

### 注册和使用中间件

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine()

// 基础中间件注册
engine.middleware((context, next) => {
  console.log('请求开始:', context.request)
  next()
})

// 带名称的中间件
engine.middleware('logger', (context, next) => {
  const start = Date.now()
  
  next()
  
  const duration = Date.now() - start
  console.log(`请求处理耗时: ${duration}ms`)
})

// 带配置的中间件
engine.middleware('auth', (context, next) => {
  const { user } = context.request
  
  if (!user || !user.token) {
    throw new Error('未授权访问')
  }
  
  // 验证token
  if (!validateToken(user.token)) {
    throw new Error('无效的访问令牌')
  }
  
  context.state.user = user
  next()
}, {
  priority: 10,
  timeout: 5000
})

// 异步中间件
engine.middleware('database', async (context, next) => {
  try {
    // 连接数据库
    const db = await connectDatabase()
    context.state.db = db
    
    await next()
    
    // 关闭连接
    await db.close()
  } catch (error) {
    console.error('数据库操作失败:', error)
    throw error
  }
})

// 条件中间件
engine.middleware('cache', (context, next) => {
  const cached = getFromCache(context.request.key)
  
  if (cached) {
    context.response = cached
    return // 不调用 next()，跳过后续中间件
  }
  
  next()
}, {
  condition: (context) => context.request.cacheable === true
})

function validateToken(token: string): boolean {
  // 实现token验证逻辑
  return token && token.length > 10
}

function connectDatabase() {
  // 实现数据库连接逻辑
  return Promise.resolve({
    query: () => Promise.resolve([]),
    close: () => Promise.resolve()
  })
}

function getFromCache(key: string) {
  // 实现缓存获取逻辑
  return null
}
```

### 中间件执行

```typescript
// 执行中间件链
async function processRequest(requestData: any) {
  try {
    const context = {
      request: requestData,
      state: {},
      metadata: {
        startTime: Date.now(),
        middlewareIndex: 0,
        path: []
      }
    }
    
    const result = await engine.executeMiddleware(context)
    
    console.log('处理结果:', result)
    return result
  } catch (error) {
    console.error('中间件执行失败:', error)
    throw error
  }
}

// 使用示例
processRequest({
  type: 'user-action',
  action: 'login',
  user: {
    id: 1,
    token: 'valid-token-12345'
  },
  cacheable: true,
  key: 'user-1-login'
})
```

### 移除中间件

```typescript
// 按名称移除
engine.removeMiddleware('logger')

// 按引用移除
const authMiddleware = (context, next) => {
  // 认证逻辑
  next()
}

engine.middleware(authMiddleware)
engine.removeMiddleware(authMiddleware)

// 清除所有中间件
engine.clearMiddleware()

// 检查中间件是否存在
if (engine.hasMiddleware('auth')) {
  console.log('认证中间件已注册')
}

// 获取中间件列表
const middlewareList = engine.getMiddlewareList()
console.log('已注册的中间件:', middlewareList.map(m => m.name))
```

## 高级中间件功能

### 中间件优先级和排序

```typescript
class PriorityMiddlewareEngine extends Engine {
  private middlewares: Array<{
    name: string
    middleware: Middleware
    config: MiddlewareConfig
  }> = []
  
  middleware(
    nameOrMiddleware: string | Middleware,
    middlewareOrConfig?: Middleware | MiddlewareConfig,
    config?: MiddlewareConfig
  ): this {
    let name: string
    let middleware: Middleware
    let finalConfig: MiddlewareConfig = {}
    
    if (typeof nameOrMiddleware === 'string') {
      name = nameOrMiddleware
      middleware = middlewareOrConfig as Middleware
      finalConfig = config || {}
    } else {
      name = `middleware_${this.middlewares.length}`
      middleware = nameOrMiddleware
      finalConfig = (middlewareOrConfig as MiddlewareConfig) || {}
    }
    
    this.middlewares.push({
      name,
      middleware,
      config: { priority: 0, ...finalConfig }
    })
    
    // 按优先级排序（高优先级先执行）
    this.middlewares.sort((a, b) => 
      (b.config.priority || 0) - (a.config.priority || 0)
    )
    
    return this
  }
  
  async executeMiddleware(context: any): Promise<any> {
    let index = 0
    
    const next = async (error?: Error): Promise<void> => {
      if (error) {
        throw error
      }
      
      if (index >= this.middlewares.length) {
        return
      }
      
      const { middleware, config } = this.middlewares[index++]
      
      // 检查执行条件
      if (config.condition && !config.condition(context)) {
        return next()
      }
      
      // 设置超时
      if (config.timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`中间件 ${config.name} 执行超时`))
          }, config.timeout)
        })
        
        await Promise.race([
          middleware(context, next),
          timeoutPromise
        ])
      } else {
        await middleware(context, next)
      }
    }
    
    await next()
    return context
  }
}

// 使用优先级中间件
const engine = new PriorityMiddlewareEngine()

// 高优先级中间件（先执行）
engine.middleware('security', (context, next) => {
  console.log('1. 安全检查')
  next()
}, { priority: 100 })

// 中等优先级中间件
engine.middleware('auth', (context, next) => {
  console.log('2. 身份验证')
  next()
}, { priority: 50 })

// 低优先级中间件（后执行）
engine.middleware('logging', (context, next) => {
  console.log('3. 日志记录')
  next()
}, { priority: 10 })

// 默认优先级中间件
engine.middleware('business', (context, next) => {
  console.log('4. 业务逻辑')
  next()
})
```

### 条件中间件

```typescript
class ConditionalMiddlewareEngine extends Engine {
  // 基于路径的条件中间件
  middlewareForPath(path: string, middleware: Middleware): this {
    return this.middleware(middleware, {
      condition: (context) => context.request.path === path
    })
  }
  
  // 基于方法的条件中间件
  middlewareForMethod(method: string, middleware: Middleware): this {
    return this.middleware(middleware, {
      condition: (context) => context.request.method === method
    })
  }
  
  // 基于用户角色的条件中间件
  middlewareForRole(role: string, middleware: Middleware): this {
    return this.middleware(middleware, {
      condition: (context) => {
        const user = context.state.user || context.request.user
        return user && user.role === role
      }
    })
  }
  
  // 基于环境的条件中间件
  middlewareForEnv(env: string, middleware: Middleware): this {
    return this.middleware(middleware, {
      condition: () => process.env.NODE_ENV === env
    })
  }
  
  // 复合条件中间件
  middlewareWhen(
    condition: (context: any) => boolean,
    middleware: Middleware
  ): this {
    return this.middleware(middleware, { condition })
  }
}

// 使用条件中间件
const engine = new ConditionalMiddlewareEngine()

// 只在特定路径执行
engine.middlewareForPath('/api/users', (context, next) => {
  console.log('用户API中间件')
  next()
})

// 只在POST请求时执行
engine.middlewareForMethod('POST', (context, next) => {
  console.log('POST请求验证')
  next()
})

// 只对管理员执行
engine.middlewareForRole('admin', (context, next) => {
  console.log('管理员权限检查')
  next()
})

// 只在开发环境执行
engine.middlewareForEnv('development', (context, next) => {
  console.log('开发环境调试信息')
  next()
})

// 复合条件
engine.middlewareWhen(
  (context) => {
    return context.request.path.startsWith('/api/') && 
           context.request.method === 'POST' &&
           context.state.user?.role === 'admin'
  },
  (context, next) => {
    console.log('管理员API POST请求')
    next()
  }
)
```

### 中间件组合和管道

```typescript
class MiddlewarePipeline {
  private middlewares: Middleware[] = []
  
  // 添加中间件到管道
  pipe(middleware: Middleware): this {
    this.middlewares.push(middleware)
    return this
  }
  
  // 组合多个中间件
  compose(...middlewares: Middleware[]): Middleware {
    return async (context, next) => {
      let index = 0
      
      const dispatch = async (): Promise<void> => {
        if (index >= middlewares.length) {
          return next()
        }
        
        const middleware = middlewares[index++]
        await middleware(context, dispatch)
      }
      
      await dispatch()
    }
  }
  
  // 并行执行中间件
  parallel(...middlewares: Middleware[]): Middleware {
    return async (context, next) => {
      await Promise.all(
        middlewares.map(middleware => 
          middleware(context, () => Promise.resolve())
        )
      )
      
      await next()
    }
  }
  
  // 条件分支中间件
  branch(
    condition: (context: any) => boolean,
    trueBranch: Middleware,
    falseBranch?: Middleware
  ): Middleware {
    return async (context, next) => {
      if (condition(context)) {
        await trueBranch(context, next)
      } else if (falseBranch) {
        await falseBranch(context, next)
      } else {
        await next()
      }
    }
  }
  
  // 重试中间件
  retry(middleware: Middleware, maxRetries: number = 3): Middleware {
    return async (context, next) => {
      let attempts = 0
      
      while (attempts <= maxRetries) {
        try {
          await middleware(context, next)
          return
        } catch (error) {
          attempts++
          
          if (attempts > maxRetries) {
            throw error
          }
          
          console.log(`中间件重试 ${attempts}/${maxRetries}`)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }
    }
  }
  
  // 执行管道
  async execute(context: any): Promise<any> {
    const composedMiddleware = this.compose(...this.middlewares)
    
    await composedMiddleware(context, () => Promise.resolve())
    return context
  }
}

// 使用中间件管道
const pipeline = new MiddlewarePipeline()

// 创建基础中间件
const authMiddleware: Middleware = (context, next) => {
  console.log('身份验证')
  context.state.authenticated = true
  next()
}

const validationMiddleware: Middleware = (context, next) => {
  console.log('数据验证')
  if (!context.request.data) {
    throw new Error('缺少数据')
  }
  next()
}

const businessMiddleware: Middleware = (context, next) => {
  console.log('业务逻辑处理')
  context.response = { success: true }
  next()
}

// 构建管道
pipeline
  .pipe(authMiddleware)
  .pipe(validationMiddleware)
  .pipe(businessMiddleware)

// 创建组合中间件
const securityPipeline = pipeline.compose(
  authMiddleware,
  pipeline.branch(
    (context) => context.state.authenticated,
    validationMiddleware,
    (context, next) => {
      throw new Error('未授权访问')
    }
  )
)

// 创建并行中间件
const parallelMiddleware = pipeline.parallel(
  (context, next) => {
    console.log('并行任务1')
    next()
  },
  (context, next) => {
    console.log('并行任务2')
    next()
  },
  (context, next) => {
    console.log('并行任务3')
    next()
  }
)

// 创建重试中间件
const retryableMiddleware = pipeline.retry(
  (context, next) => {
    if (Math.random() < 0.7) {
      throw new Error('随机失败')
    }
    console.log('操作成功')
    next()
  },
  3
)
```

### 中间件缓存和性能优化

```typescript
class CachedMiddlewareEngine extends Engine {
  private middlewareCache = new Map<string, any>()
  private performanceStats = new Map<string, {
    executions: number
    totalTime: number
    averageTime: number
    errors: number
  }>()
  
  // 缓存中间件
  cachedMiddleware(
    name: string,
    middleware: Middleware,
    cacheKey: (context: any) => string,
    ttl: number = 60000
  ): this {
    return this.middleware(name, async (context, next) => {
      const key = `${name}:${cacheKey(context)}`
      const cached = this.middlewareCache.get(key)
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        console.log(`缓存命中: ${key}`)
        Object.assign(context, cached.context)
        return next()
      }
      
      const originalContext = JSON.parse(JSON.stringify(context))
      await middleware(context, next)
      
      // 缓存结果
      this.middlewareCache.set(key, {
        context: JSON.parse(JSON.stringify(context)),
        timestamp: Date.now()
      })
      
      console.log(`缓存更新: ${key}`)
    })
  }
  
  // 性能监控中间件
  performanceMiddleware(name: string, middleware: Middleware): this {
    return this.middleware(name, async (context, next) => {
      const startTime = Date.now()
      
      try {
        await middleware(context, next)
        
        const duration = Date.now() - startTime
        this.updatePerformanceStats(name, duration, false)
      } catch (error) {
        const duration = Date.now() - startTime
        this.updatePerformanceStats(name, duration, true)
        throw error
      }
    })
  }
  
  private updatePerformanceStats(
    name: string, 
    duration: number, 
    isError: boolean
  ): void {
    const stats = this.performanceStats.get(name) || {
      executions: 0,
      totalTime: 0,
      averageTime: 0,
      errors: 0
    }
    
    stats.executions++
    stats.totalTime += duration
    stats.averageTime = stats.totalTime / stats.executions
    
    if (isError) {
      stats.errors++
    }
    
    this.performanceStats.set(name, stats)
  }
  
  // 获取性能统计
  getPerformanceStats(): Map<string, any> {
    return new Map(this.performanceStats)
  }
  
  // 清理缓存
  clearCache(): void {
    this.middlewareCache.clear()
  }
  
  // 获取缓存统计
  getCacheStats(): any {
    return {
      size: this.middlewareCache.size,
      keys: Array.from(this.middlewareCache.keys())
    }
  }
}

// 使用缓存和性能监控
const engine = new CachedMiddlewareEngine()

// 注册缓存中间件
engine.cachedMiddleware(
  'user-data',
  async (context, next) => {
    console.log('获取用户数据...')
    // 模拟数据库查询
    await new Promise(resolve => setTimeout(resolve, 100))
    context.state.userData = { id: 1, name: 'John' }
    next()
  },
  (context) => `user-${context.request.userId}`,
  30000 // 30秒缓存
)

// 注册性能监控中间件
engine.performanceMiddleware('validation', (context, next) => {
  console.log('数据验证...')
  // 模拟验证逻辑
  if (!context.request.data) {
    throw new Error('数据验证失败')
  }
  next()
})

// 定期输出性能统计
setInterval(() => {
  const stats = engine.getPerformanceStats()
  console.log('性能统计:', Object.fromEntries(stats))
}, 10000)
```

## 错误处理中间件

### 全局错误处理

```typescript
class ErrorHandlingEngine extends Engine {
  private errorHandlers: ErrorMiddleware[] = []
  
  // 注册错误处理中间件
  onError(handler: ErrorMiddleware): this {
    this.errorHandlers.push(handler)
    return this
  }
  
  // 执行中间件链（带错误处理）
  async executeMiddleware(context: any): Promise<any> {
    try {
      return await super.executeMiddleware(context)
    } catch (error) {
      await this.handleError(error, context)
      throw error
    }
  }
  
  private async handleError(error: Error, context: any): Promise<void> {
    for (const handler of this.errorHandlers) {
      try {
        await handler(error, context, () => Promise.resolve())
      } catch (handlerError) {
        console.error('错误处理器本身发生错误:', handlerError)
      }
    }
  }
}

// 使用错误处理
const engine = new ErrorHandlingEngine()

// 注册全局错误处理器
engine.onError(async (error, context, next) => {
  console.error('全局错误处理:', error.message)
  
  // 记录错误日志
  await logError({
    error: error.message,
    stack: error.stack,
    context: context.request,
    timestamp: new Date().toISOString()
  })
  
  next()
})

// 注册错误恢复处理器
engine.onError(async (error, context, next) => {
  if (error.message.includes('网络')) {
    console.log('尝试错误恢复...')
    
    // 重试逻辑
    try {
      await retryOperation(context)
      console.log('错误恢复成功')
    } catch (retryError) {
      console.error('错误恢复失败:', retryError)
    }
  }
  
  next()
})

// 注册错误通知处理器
engine.onError(async (error, context, next) => {
  if (error.message.includes('严重')) {
    await sendErrorNotification({
      error: error.message,
      context: context.request,
      severity: 'high'
    })
  }
  
  next()
})

async function logError(errorInfo: any): Promise<void> {
  // 实现错误日志记录
  console.log('记录错误:', errorInfo)
}

async function retryOperation(context: any): Promise<void> {
  // 实现重试逻辑
  console.log('重试操作:', context.request)
}

async function sendErrorNotification(notification: any): Promise<void> {
  // 实现错误通知
  console.log('发送错误通知:', notification)
}
```

### 特定错误类型处理

```typescript
// 自定义错误类型
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

class NetworkError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'NetworkError'
  }
}

// 错误类型处理器
class TypedErrorEngine extends ErrorHandlingEngine {
  // 处理验证错误
  onValidationError(handler: (error: ValidationError, context: any) => void): this {
    return this.onError((error, context, next) => {
      if (error instanceof ValidationError) {
        handler(error, context)
      }
      next()
    })
  }
  
  // 处理认证错误
  onAuthenticationError(handler: (error: AuthenticationError, context: any) => void): this {
    return this.onError((error, context, next) => {
      if (error instanceof AuthenticationError) {
        handler(error, context)
      }
      next()
    })
  }
  
  // 处理网络错误
  onNetworkError(handler: (error: NetworkError, context: any) => void): this {
    return this.onError((error, context, next) => {
      if (error instanceof NetworkError) {
        handler(error, context)
      }
      next()
    })
  }
}

// 使用类型化错误处理
const engine = new TypedErrorEngine()

// 处理验证错误
engine.onValidationError((error, context) => {
  console.error(`验证错误 - 字段: ${error.field}, 消息: ${error.message}`)
  
  context.response = {
    error: 'validation_failed',
    field: error.field,
    message: error.message
  }
})

// 处理认证错误
engine.onAuthenticationError((error, context) => {
  console.error(`认证错误: ${error.message}`)
  
  context.response = {
    error: 'authentication_failed',
    message: '请重新登录'
  }
})

// 处理网络错误
engine.onNetworkError((error, context) => {
  console.error(`网络错误 - 状态码: ${error.statusCode}, 消息: ${error.message}`)
  
  context.response = {
    error: 'network_error',
    statusCode: error.statusCode,
    message: '网络连接失败，请稍后重试'
  }
})

// 注册可能抛出不同错误的中间件
engine.middleware('validation', (context, next) => {
  const { data } = context.request
  
  if (!data.email) {
    throw new ValidationError('邮箱不能为空', 'email')
  }
  
  if (!data.password) {
    throw new ValidationError('密码不能为空', 'password')
  }
  
  next()
})

engine.middleware('auth', (context, next) => {
  const { token } = context.request
  
  if (!token) {
    throw new AuthenticationError('缺少访问令牌')
  }
  
  if (!validateToken(token)) {
    throw new AuthenticationError('无效的访问令牌')
  }
  
  next()
})

engine.middleware('api-call', async (context, next) => {
  try {
    const response = await fetch('/api/data')
    
    if (!response.ok) {
      throw new NetworkError('API调用失败', response.status)
    }
    
    context.state.apiData = await response.json()
    next()
  } catch (error) {
    if (error instanceof TypeError) {
      throw new NetworkError('网络连接失败', 0)
    }
    throw error
  }
})
```

## 中间件测试

### 单元测试

```typescript
// 中间件测试工具
class MiddlewareTestRunner {
  static async runMiddleware(
    middleware: Middleware,
    context: any,
    expectNext: boolean = true
  ): Promise<{ context: any; nextCalled: boolean; error?: Error }> {
    let nextCalled = false
    let thrownError: Error | undefined
    
    const next = () => {
      nextCalled = true
    }
    
    try {
      await middleware(context, next)
    } catch (error) {
      thrownError = error as Error
    }
    
    return {
      context,
      nextCalled,
      error: thrownError
    }
  }
  
  static createMockContext(overrides: any = {}): any {
    return {
      request: {},
      response: undefined,
      state: {},
      metadata: {
        startTime: Date.now(),
        middlewareIndex: 0,
        path: []
      },
      ...overrides
    }
  }
}

// 测试示例
describe('中间件测试', () => {
  test('认证中间件 - 有效token', async () => {
    const authMiddleware: Middleware = (context, next) => {
      const { token } = context.request
      
      if (!token || !validateToken(token)) {
        throw new Error('认证失败')
      }
      
      context.state.user = { id: 1, name: 'John' }
      next()
    }
    
    const context = MiddlewareTestRunner.createMockContext({
      request: { token: 'valid-token-12345' }
    })
    
    const result = await MiddlewareTestRunner.runMiddleware(
      authMiddleware,
      context
    )
    
    expect(result.nextCalled).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.context.state.user).toEqual({ id: 1, name: 'John' })
  })
  
  test('认证中间件 - 无效token', async () => {
    const authMiddleware: Middleware = (context, next) => {
      const { token } = context.request
      
      if (!token || !validateToken(token)) {
        throw new Error('认证失败')
      }
      
      context.state.user = { id: 1, name: 'John' }
      next()
    }
    
    const context = MiddlewareTestRunner.createMockContext({
      request: { token: 'invalid' }
    })
    
    const result = await MiddlewareTestRunner.runMiddleware(
      authMiddleware,
      context
    )
    
    expect(result.nextCalled).toBe(false)
    expect(result.error).toBeDefined()
    expect(result.error?.message).toBe('认证失败')
  })
  
  test('缓存中间件', async () => {
    const cache = new Map()
    
    const cacheMiddleware: Middleware = (context, next) => {
      const key = context.request.key
      
      if (cache.has(key)) {
        context.response = cache.get(key)
        return // 不调用 next()
      }
      
      next()
      
      if (context.response) {
        cache.set(key, context.response)
      }
    }
    
    // 第一次调用 - 缓存未命中
    const context1 = MiddlewareTestRunner.createMockContext({
      request: { key: 'test-key' }
    })
    
    const result1 = await MiddlewareTestRunner.runMiddleware(
      cacheMiddleware,
      context1
    )
    
    expect(result1.nextCalled).toBe(true)
    
    // 模拟后续中间件设置响应
    context1.response = { data: 'test-data' }
    
    // 第二次调用 - 缓存命中
    const context2 = MiddlewareTestRunner.createMockContext({
      request: { key: 'test-key' }
    })
    
    const result2 = await MiddlewareTestRunner.runMiddleware(
      cacheMiddleware,
      context2
    )
    
    expect(result2.nextCalled).toBe(false)
    expect(result2.context.response).toEqual({ data: 'test-data' })
  })
})
```

### 集成测试

```typescript
// 中间件链集成测试
class MiddlewareChainTester {
  private engine: Engine
  
  constructor() {
    this.engine = new Engine()
  }
  
  addMiddleware(name: string, middleware: Middleware): this {
    this.engine.middleware(name, middleware)
    return this
  }
  
  async test(request: any): Promise<any> {
    const context = {
      request,
      state: {},
      metadata: {
        startTime: Date.now(),
        middlewareIndex: 0,
        path: []
      }
    }
    
    return await this.engine.executeMiddleware(context)
  }
}

// 集成测试示例
describe('中间件链集成测试', () => {
  test('完整的请求处理流程', async () => {
    const tester = new MiddlewareChainTester()
    
    // 添加中间件链
    tester
      .addMiddleware('cors', (context, next) => {
        context.state.corsEnabled = true
        next()
      })
      .addMiddleware('auth', (context, next) => {
        if (!context.request.token) {
          throw new Error('未授权')
        }
        context.state.user = { id: 1 }
        next()
      })
      .addMiddleware('validation', (context, next) => {
        if (!context.request.data) {
          throw new Error('数据验证失败')
        }
        next()
      })
      .addMiddleware('business', (context, next) => {
        context.response = {
          success: true,
          data: context.request.data,
          user: context.state.user
        }
        next()
      })
    
    // 测试成功流程
    const successResult = await tester.test({
      token: 'valid-token',
      data: { name: 'test' }
    })
    
    expect(successResult.state.corsEnabled).toBe(true)
    expect(successResult.state.user).toEqual({ id: 1 })
    expect(successResult.response.success).toBe(true)
    
    // 测试失败流程
    try {
      await tester.test({
        data: { name: 'test' }
        // 缺少 token
      })
      fail('应该抛出错误')
    } catch (error) {
      expect(error.message).toBe('未授权')
    }
  })
})
```

这个中间件 API 文档提供了完整的中间件系统功能，包括基础操作、高级功能、错误处理、性能优化和测试等方面的详细说明和示例代码。
# 中间件使用示例

本文档详细介绍了 @ldesign/engine 中中间件系统的各种使用方式，包括基础中间件、异步中间件、条件中间件、错误处理中间件等高级功能。

## 基础中间件使用

### 简单中间件示例

```typescript
import { Engine, MiddlewareContext, MiddlewareNext } from '@ldesign/engine'

const engine = new Engine({
  name: 'MiddlewareExample',
  debug: true
})

// 日志中间件
engine.middleware('logger', (context: MiddlewareContext, next: MiddlewareNext) => {
  const start = Date.now()
  const { request } = context
  
  console.log(`📝 [${new Date().toISOString()}] ${request.method} ${request.url} - 开始处理`)
  
  // 调用下一个中间件
  next()
  
  const duration = Date.now() - start
  const { response } = context
  
  console.log(`📝 [${new Date().toISOString()}] ${request.method} ${request.url} - 完成 (${duration}ms) - 状态: ${response?.status || 'N/A'}`)
})

// 认证中间件
engine.middleware('auth', (context: MiddlewareContext, next: MiddlewareNext) => {
  const { request } = context
  const token = request.headers?.authorization
  
  console.log('🔐 检查认证...')
  
  if (!token) {
    context.response = {
      status: 401,
      error: '缺少认证令牌'
    }
    return // 不调用 next()，中断中间件链
  }
  
  // 简单的令牌验证
  if (token !== 'Bearer valid-token') {
    context.response = {
      status: 401,
      error: '无效的认证令牌'
    }
    return
  }
  
  // 设置用户信息
  context.state.user = {
    id: 1,
    name: 'John Doe',
    role: 'user'
  }
  
  console.log('✅ 认证成功:', context.state.user.name)
  next()
})

// 业务逻辑中间件
engine.middleware('business', (context: MiddlewareContext, next: MiddlewareNext) => {
  const { request, state } = context
  
  console.log('💼 处理业务逻辑...')
  
  switch (request.action) {
    case 'getUserInfo':
      context.response = {
        status: 200,
        data: state.user
      }
      break
      
    case 'updateProfile':
      const updatedUser = { ...state.user, ...request.data }
      context.response = {
        status: 200,
        data: updatedUser,
        message: '用户信息更新成功'
      }
      break
      
    default:
      context.response = {
        status: 400,
        error: '未知的操作类型'
      }
  }
  
  next()
})

// 响应处理中间件
engine.middleware('response', (context: MiddlewareContext, next: MiddlewareNext) => {
  const { response } = context
  
  if (response) {
    // 添加通用响应头
    response.headers = {
      'Content-Type': 'application/json',
      'X-Powered-By': '@ldesign/engine',
      'X-Request-ID': context.requestId || 'unknown'
    }
    
    // 添加时间戳
    response.timestamp = new Date().toISOString()
    
    console.log('📤 响应处理完成')
  }
  
  next()
})

// 处理请求的函数
async function processRequest(request: any) {
  const context: MiddlewareContext = {
    request,
    response: null,
    state: {},
    requestId: 'req_' + Date.now()
  }
  
  try {
    await engine.executeMiddleware(context)
    return context.response
  } catch (error) {
    return {
      status: 500,
      error: error.message
    }
  }
}

// 测试基础中间件
engine.start().then(async () => {
  console.log('=== 测试基础中间件 ===')
  
  // 1. 成功的请求
  console.log('\n1. 成功的请求')
  const result1 = await processRequest({
    method: 'GET',
    url: '/api/user',
    action: 'getUserInfo',
    headers: {
      authorization: 'Bearer valid-token'
    }
  })
  console.log('结果:', result1)
  
  // 2. 缺少认证的请求
  console.log('\n2. 缺少认证的请求')
  const result2 = await processRequest({
    method: 'GET',
    url: '/api/user',
    action: 'getUserInfo'
  })
  console.log('结果:', result2)
  
  // 3. 更新用户信息
  console.log('\n3. 更新用户信息')
  const result3 = await processRequest({
    method: 'PUT',
    url: '/api/user',
    action: 'updateProfile',
    headers: {
      authorization: 'Bearer valid-token'
    },
    data: {
      name: 'John Smith',
      email: 'john.smith@example.com'
    }
  })
  console.log('结果:', result3)
})
```

## 异步中间件

### 异步处理中间件

```typescript
import { Engine, MiddlewareContext, MiddlewareNext } from '@ldesign/engine'

const engine = new Engine({ name: 'AsyncMiddlewareExample' })

// 数据库中间件（异步）
engine.middleware('database', async (context: MiddlewareContext, next: MiddlewareNext) => {
  console.log('🗄️ 连接数据库...')
  
  try {
    // 模拟数据库连接
    await new Promise(resolve => setTimeout(resolve, 100))
    
    context.state.db = {
      connected: true,
      connectionId: 'conn_' + Math.random().toString(36).substr(2, 9),
      
      async query(sql: string, params?: any[]) {
        console.log(`📊 执行查询: ${sql}`, params)
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
        
        // 模拟查询结果
        if (sql.includes('SELECT')) {
          return {
            rows: [
              { id: 1, name: 'John Doe', email: 'john@example.com' },
              { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
            ],
            count: 2
          }
        } else if (sql.includes('INSERT') || sql.includes('UPDATE')) {
          return {
            affectedRows: 1,
            insertId: Math.floor(Math.random() * 1000)
          }
        }
        
        return { success: true }
      },
      
      async close() {
        console.log('🔌 关闭数据库连接')
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }
    
    console.log('✅ 数据库连接成功:', context.state.db.connectionId)
    
    await next()
    
    // 清理资源
    await context.state.db.close()
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    context.response = {
      status: 500,
      error: '数据库连接失败'
    }
  }
})

// 缓存中间件（异步）
engine.middleware('cache', async (context: MiddlewareContext, next: MiddlewareNext) => {
  const { request } = context
  const cacheKey = `${request.method}:${request.url}:${JSON.stringify(request.params || {})}`
  
  console.log('🗂️ 检查缓存:', cacheKey)
  
  // 模拟缓存查询
  await new Promise(resolve => setTimeout(resolve, 20))
  
  // 简单的内存缓存
  const cache = context.state.cache || new Map()
  context.state.cache = cache
  
  const cachedData = cache.get(cacheKey)
  
  if (cachedData && Date.now() - cachedData.timestamp < 60000) { // 1分钟缓存
    console.log('🎯 缓存命中')
    context.response = {
      status: 200,
      data: cachedData.data,
      cached: true,
      cacheTime: cachedData.timestamp
    }
    return // 直接返回缓存结果，不继续执行
  }
  
  console.log('❌ 缓存未命中，继续处理')
  
  await next()
  
  // 缓存响应结果
  if (context.response && context.response.status === 200) {
    console.log('💾 缓存响应结果')
    cache.set(cacheKey, {
      data: context.response.data,
      timestamp: Date.now()
    })
  }
})

// 数据验证中间件（异步）
engine.middleware('validation', async (context: MiddlewareContext, next: MiddlewareNext) => {
  const { request } = context
  
  console.log('✅ 验证请求数据...')
  
  // 模拟异步验证
  await new Promise(resolve => setTimeout(resolve, 30))
  
  const errors: string[] = []
  
  // 验证规则
  if (request.action === 'createUser') {
    if (!request.data?.name) {
      errors.push('用户名不能为空')
    }
    
    if (!request.data?.email) {
      errors.push('邮箱不能为空')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.data.email)) {
      errors.push('邮箱格式不正确')
    }
    
    if (!request.data?.password || request.data.password.length < 6) {
      errors.push('密码长度至少6位')
    }
  }
  
  if (errors.length > 0) {
    console.log('❌ 验证失败:', errors)
    context.response = {
      status: 400,
      error: '数据验证失败',
      details: errors
    }
    return
  }
  
  console.log('✅ 验证通过')
  await next()
})

// 业务逻辑中间件（异步）
engine.middleware('asyncBusiness', async (context: MiddlewareContext, next: MiddlewareNext) => {
  const { request, state } = context
  const { db } = state
  
  console.log('💼 处理异步业务逻辑...')
  
  try {
    switch (request.action) {
      case 'getUsers':
        const users = await db.query('SELECT * FROM users')
        context.response = {
          status: 200,
          data: users.rows,
          count: users.count
        }
        break
        
      case 'createUser':
        const result = await db.query(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [request.data.name, request.data.email, request.data.password]
        )
        
        context.response = {
          status: 201,
          data: {
            id: result.insertId,
            ...request.data,
            password: undefined // 不返回密码
          },
          message: '用户创建成功'
        }
        break
        
      case 'updateUser':
        await db.query(
          'UPDATE users SET name = ?, email = ? WHERE id = ?',
          [request.data.name, request.data.email, request.params.id]
        )
        
        context.response = {
          status: 200,
          data: {
            id: request.params.id,
            ...request.data
          },
          message: '用户更新成功'
        }
        break
        
      default:
        context.response = {
          status: 400,
          error: '未知的操作类型'
        }
    }
  } catch (error) {
    console.error('💥 业务逻辑处理失败:', error.message)
    context.response = {
      status: 500,
      error: '服务器内部错误'
    }
  }
  
  await next()
})

// 处理异步请求
async function processAsyncRequest(request: any) {
  const context: MiddlewareContext = {
    request,
    response: null,
    state: {},
    requestId: 'async_req_' + Date.now()
  }
  
  try {
    await engine.executeMiddleware(context)
    return context.response
  } catch (error) {
    return {
      status: 500,
      error: error.message
    }
  }
}

// 测试异步中间件
engine.start().then(async () => {
  console.log('=== 测试异步中间件 ===')
  
  // 1. 获取用户列表（第一次，无缓存）
  console.log('\n1. 获取用户列表（第一次）')
  const result1 = await processAsyncRequest({
    method: 'GET',
    url: '/api/users',
    action: 'getUsers'
  })
  console.log('结果:', result1)
  
  // 2. 再次获取用户列表（应该命中缓存）
  console.log('\n2. 再次获取用户列表（缓存）')
  const result2 = await processAsyncRequest({
    method: 'GET',
    url: '/api/users',
    action: 'getUsers'
  })
  console.log('结果:', result2)
  
  // 3. 创建用户（验证失败）
  console.log('\n3. 创建用户（验证失败）')
  const result3 = await processAsyncRequest({
    method: 'POST',
    url: '/api/users',
    action: 'createUser',
    data: {
      name: '',
      email: 'invalid-email',
      password: '123'
    }
  })
  console.log('结果:', result3)
  
  // 4. 创建用户（成功）
  console.log('\n4. 创建用户（成功）')
  const result4 = await processAsyncRequest({
    method: 'POST',
    url: '/api/users',
    action: 'createUser',
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123'
    }
  })
  console.log('结果:', result4)
})
```

## 条件中间件

### 条件执行中间件

```typescript
import { Engine, MiddlewareContext, MiddlewareNext } from '@ldesign/engine'

const engine = new Engine({ name: 'ConditionalMiddlewareExample' })

// 条件中间件工厂函数
function conditionalMiddleware(
  condition: (context: MiddlewareContext) => boolean,
  middleware: (context: MiddlewareContext, next: MiddlewareNext) => void | Promise<void>
) {
  return async (context: MiddlewareContext, next: MiddlewareNext) => {
    if (condition(context)) {
      await middleware(context, next)
    } else {
      await next()
    }
  }
}

// 仅对 API 请求执行的中间件
engine.middleware('apiOnly', conditionalMiddleware(
  (context) => context.request.url?.startsWith('/api/'),
  (context, next) => {
    console.log('🔗 这是一个 API 请求')
    context.state.isApiRequest = true
    next()
  }
))

// 仅对管理员执行的中间件
engine.middleware('adminOnly', conditionalMiddleware(
  (context) => context.state.user?.role === 'admin',
  (context, next) => {
    console.log('👑 管理员权限验证通过')
    context.state.hasAdminAccess = true
    next()
  }
))

// 仅对 POST 请求执行的中间件
engine.middleware('postOnly', conditionalMiddleware(
  (context) => context.request.method === 'POST',
  async (context, next) => {
    console.log('📝 POST 请求特殊处理')
    
    // 记录请求体大小
    const bodySize = JSON.stringify(context.request.data || {}).length
    context.state.requestBodySize = bodySize
    
    if (bodySize > 1024 * 1024) { // 1MB
      context.response = {
        status: 413,
        error: '请求体过大'
      }
      return
    }
    
    await next()
  }
))

// 基于时间的条件中间件
engine.middleware('businessHours', conditionalMiddleware(
  (context) => {
    const hour = new Date().getHours()
    return hour >= 9 && hour <= 17 // 工作时间 9:00-17:00
  },
  (context, next) => {
    console.log('🕘 工作时间内的请求')
    context.state.duringBusinessHours = true
    next()
  }
))

// 基于用户类型的条件中间件
engine.middleware('premiumFeatures', conditionalMiddleware(
  (context) => context.state.user?.subscription === 'premium',
  (context, next) => {
    console.log('💎 高级用户功能访问')
    context.state.hasPremiumAccess = true
    next()
  }
))

// 基于请求频率的条件中间件
const requestCounts = new Map<string, { count: number, resetTime: number }>()

engine.middleware('rateLimiting', conditionalMiddleware(
  (context) => {
    const clientId = context.request.headers?.['x-client-id'] || 'anonymous'
    const now = Date.now()
    const windowSize = 60000 // 1分钟窗口
    
    const clientData = requestCounts.get(clientId)
    
    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientId, { count: 1, resetTime: now + windowSize })
      return false // 不需要限流
    }
    
    clientData.count++
    return clientData.count > 10 // 每分钟最多10个请求
  },
  (context, next) => {
    console.log('🚫 请求频率过高，触发限流')
    context.response = {
      status: 429,
      error: '请求过于频繁，请稍后再试'
    }
    // 不调用 next()，中断处理
  }
))

// 用户认证中间件
engine.middleware('userAuth', (context: MiddlewareContext, next: MiddlewareNext) => {
  const token = context.request.headers?.authorization
  
  if (token === 'Bearer admin-token') {
    context.state.user = {
      id: 1,
      name: 'Admin User',
      role: 'admin',
      subscription: 'premium'
    }
  } else if (token === 'Bearer user-token') {
    context.state.user = {
      id: 2,
      name: 'Regular User',
      role: 'user',
      subscription: 'basic'
    }
  } else if (token === 'Bearer premium-token') {
    context.state.user = {
      id: 3,
      name: 'Premium User',
      role: 'user',
      subscription: 'premium'
    }
  }
  
  next()
})

// 业务逻辑中间件
engine.middleware('conditionalBusiness', (context: MiddlewareContext, next: MiddlewareNext) => {
  const { request, state } = context
  
  console.log('💼 处理条件业务逻辑...')
  console.log('状态:', {
    isApiRequest: state.isApiRequest,
    hasAdminAccess: state.hasAdminAccess,
    duringBusinessHours: state.duringBusinessHours,
    hasPremiumAccess: state.hasPremiumAccess,
    requestBodySize: state.requestBodySize
  })
  
  switch (request.action) {
    case 'adminOperation':
      if (!state.hasAdminAccess) {
        context.response = {
          status: 403,
          error: '需要管理员权限'
        }
        return
      }
      
      context.response = {
        status: 200,
        data: { message: '管理员操作执行成功' }
      }
      break
      
    case 'premiumFeature':
      if (!state.hasPremiumAccess) {
        context.response = {
          status: 402,
          error: '需要高级订阅'
        }
        return
      }
      
      context.response = {
        status: 200,
        data: { message: '高级功能访问成功' }
      }
      break
      
    case 'businessHoursOnly':
      if (!state.duringBusinessHours) {
        context.response = {
          status: 503,
          error: '此功能仅在工作时间（9:00-17:00）可用'
        }
        return
      }
      
      context.response = {
        status: 200,
        data: { message: '工作时间功能访问成功' }
      }
      break
      
    default:
      context.response = {
        status: 200,
        data: { message: '普通操作执行成功' }
      }
  }
  
  next()
})

// 处理条件请求
async function processConditionalRequest(request: any) {
  const context: MiddlewareContext = {
    request,
    response: null,
    state: {},
    requestId: 'cond_req_' + Date.now()
  }
  
  try {
    await engine.executeMiddleware(context)
    return context.response
  } catch (error) {
    return {
      status: 500,
      error: error.message
    }
  }
}

// 测试条件中间件
engine.start().then(async () => {
  console.log('=== 测试条件中间件 ===')
  
  // 1. 管理员 API 请求
  console.log('\n1. 管理员 API 请求')
  const result1 = await processConditionalRequest({
    method: 'GET',
    url: '/api/admin/users',
    action: 'adminOperation',
    headers: {
      authorization: 'Bearer admin-token'
    }
  })
  console.log('结果:', result1)
  
  // 2. 普通用户尝试管理员操作
  console.log('\n2. 普通用户尝试管理员操作')
  const result2 = await processConditionalRequest({
    method: 'GET',
    url: '/api/admin/users',
    action: 'adminOperation',
    headers: {
      authorization: 'Bearer user-token'
    }
  })
  console.log('结果:', result2)
  
  // 3. 高级用户访问高级功能
  console.log('\n3. 高级用户访问高级功能')
  const result3 = await processConditionalRequest({
    method: 'GET',
    url: '/api/premium/feature',
    action: 'premiumFeature',
    headers: {
      authorization: 'Bearer premium-token'
    }
  })
  console.log('结果:', result3)
  
  // 4. 基础用户尝试高级功能
  console.log('\n4. 基础用户尝试高级功能')
  const result4 = await processConditionalRequest({
    method: 'GET',
    url: '/api/premium/feature',
    action: 'premiumFeature',
    headers: {
      authorization: 'Bearer user-token'
    }
  })
  console.log('结果:', result4)
  
  // 5. 大请求体的 POST 请求
  console.log('\n5. 大请求体的 POST 请求')
  const largeData = 'x'.repeat(2 * 1024 * 1024) // 2MB 数据
  const result5 = await processConditionalRequest({
    method: 'POST',
    url: '/api/upload',
    action: 'upload',
    data: { content: largeData },
    headers: {
      authorization: 'Bearer user-token'
    }
  })
  console.log('结果:', result5)
  
  // 6. 测试频率限制
  console.log('\n6. 测试频率限制')
  for (let i = 1; i <= 12; i++) {
    const result = await processConditionalRequest({
      method: 'GET',
      url: '/api/test',
      action: 'test',
      headers: {
        'x-client-id': 'test-client',
        authorization: 'Bearer user-token'
      }
    })
    
    console.log(`请求 ${i}:`, result.status === 429 ? '被限流' : '成功')
    
    if (i === 12) break
    await new Promise(resolve => setTimeout(resolve, 100))
  }
})
```

## 错误处理中间件

### 全局错误处理

```typescript
import { Engine, MiddlewareContext, MiddlewareNext } from '@ldesign/engine'

const engine = new Engine({ name: 'ErrorHandlingExample' })

// 全局错误捕获中间件（应该放在最前面）
engine.middleware('globalErrorHandler', async (context: MiddlewareContext, next: MiddlewareNext) => {
  try {
    await next()
  } catch (error) {
    console.error('🚨 全局错误捕获:', error)
    
    // 记录错误日志
    const errorLog = {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      request: {
        method: context.request.method,
        url: context.request.url,
        action: context.request.action
      },
      user: context.state.user?.id || 'anonymous'
    }
    
    // 这里可以发送到日志服务
    console.log('📝 错误日志:', errorLog)
    
    // 根据错误类型返回不同的响应
    if (error.name === 'ValidationError') {
      context.response = {
        status: 400,
        error: '数据验证失败',
        details: error.details || []
      }
    } else if (error.name === 'AuthenticationError') {
      context.response = {
        status: 401,
        error: '认证失败'
      }
    } else if (error.name === 'AuthorizationError') {
      context.response = {
        status: 403,
        error: '权限不足'
      }
    } else if (error.name === 'NotFoundError') {
      context.response = {
        status: 404,
        error: '资源不存在'
      }
    } else if (error.name === 'RateLimitError') {
      context.response = {
        status: 429,
        error: '请求过于频繁'
      }
    } else {
      // 未知错误，返回通用错误信息
      context.response = {
        status: 500,
        error: '服务器内部错误',
        requestId: context.requestId
      }
    }
    
    // 触发错误事件
    engine.emit('middleware:error', {
      error,
      context,
      errorLog
    })
  }
})

// 自定义错误类
class ValidationError extends Error {
  name = 'ValidationError'
  details: string[]
  
  constructor(message: string, details: string[] = []) {
    super(message)
    this.details = details
  }
}

class AuthenticationError extends Error {
  name = 'AuthenticationError'
}

class AuthorizationError extends Error {
  name = 'AuthorizationError'
}

class NotFoundError extends Error {
  name = 'NotFoundError'
}

class RateLimitError extends Error {
  name = 'RateLimitError'
}

// 认证中间件（可能抛出认证错误）
engine.middleware('authWithErrors', (context: MiddlewareContext, next: MiddlewareNext) => {
  const token = context.request.headers?.authorization
  
  if (!token) {
    throw new AuthenticationError('缺少认证令牌')
  }
  
  if (token === 'Bearer invalid-token') {
    throw new AuthenticationError('无效的认证令牌')
  }
  
  if (token === 'Bearer valid-token') {
    context.state.user = {
      id: 1,
      name: 'John Doe',
      role: 'user'
    }
  } else if (token === 'Bearer admin-token') {
    context.state.user = {
      id: 2,
      name: 'Admin User',
      role: 'admin'
    }
  } else {
    throw new AuthenticationError('未知的认证令牌')
  }
  
  next()
})

// 权限检查中间件（可能抛出权限错误）
engine.middleware('authzWithErrors', (context: MiddlewareContext, next: MiddlewareNext) => {
  const { request, state } = context
  
  // 检查是否需要管理员权限
  if (request.action?.startsWith('admin:') && state.user?.role !== 'admin') {
    throw new AuthorizationError('需要管理员权限')
  }
  
  next()
})

// 数据验证中间件（可能抛出验证错误）
engine.middleware('validationWithErrors', (context: MiddlewareContext, next: MiddlewareNext) => {
  const { request } = context
  
  if (request.action === 'createUser') {
    const errors: string[] = []
    const { data } = request
    
    if (!data?.name || data.name.trim().length === 0) {
      errors.push('用户名不能为空')
    }
    
    if (!data?.email) {
      errors.push('邮箱不能为空')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('邮箱格式不正确')
    }
    
    if (!data?.password || data.password.length < 6) {
      errors.push('密码长度至少6位')
    }
    
    if (errors.length > 0) {
      throw new ValidationError('数据验证失败', errors)
    }
  }
  
  next()
})

// 业务逻辑中间件（可能抛出各种错误）
engine.middleware('businessWithErrors', async (context: MiddlewareContext, next: MiddlewareNext) => {
  const { request } = context
  
  switch (request.action) {
    case 'getUser':
      const userId = request.params?.id
      if (!userId) {
        throw new ValidationError('缺少用户ID')
      }
      
      // 模拟用户不存在
      if (userId === '999') {
        throw new NotFoundError('用户不存在')
      }
      
      context.response = {
        status: 200,
        data: {
          id: userId,
          name: `User ${userId}`,
          email: `user${userId}@example.com`
        }
      }
      break
      
    case 'createUser':
      // 模拟数据库错误
      if (Math.random() < 0.3) {
        throw new Error('数据库连接失败')
      }
      
      context.response = {
        status: 201,
        data: {
          id: Math.floor(Math.random() * 1000),
          ...request.data,
          password: undefined
        },
        message: '用户创建成功'
      }
      break
      
    case 'admin:deleteUser':
      const deleteUserId = request.params?.id
      if (!deleteUserId) {
        throw new ValidationError('缺少用户ID')
      }
      
      // 模拟删除不存在的用户
      if (deleteUserId === '999') {
        throw new NotFoundError('要删除的用户不存在')
      }
      
      context.response = {
        status: 200,
        message: '用户删除成功'
      }
      break
      
    case 'triggerError':
      // 故意触发错误用于测试
      const errorType = request.params?.type
      
      switch (errorType) {
        case 'validation':
          throw new ValidationError('测试验证错误', ['字段1错误', '字段2错误'])
        case 'auth':
          throw new AuthenticationError('测试认证错误')
        case 'authz':
          throw new AuthorizationError('测试权限错误')
        case 'notfound':
          throw new NotFoundError('测试资源不存在错误')
        case 'ratelimit':
          throw new RateLimitError('测试频率限制错误')
        default:
          throw new Error('测试未知错误')
      }
      
    default:
      context.response = {
        status: 200,
        data: { message: '操作成功' }
      }
  }
  
  next()
})

// 监听错误事件
engine.on('middleware:error', (data) => {
  console.log('📧 错误事件触发，可以发送通知或记录到外部系统')
  
  // 这里可以:
  // 1. 发送错误通知给开发团队
  // 2. 记录到错误监控系统（如 Sentry）
  // 3. 更新错误统计
  // 4. 触发自动恢复机制
})

// 处理可能出错的请求
async function processErrorProneRequest(request: any) {
  const context: MiddlewareContext = {
    request,
    response: null,
    state: {},
    requestId: 'error_req_' + Date.now()
  }
  
  await engine.executeMiddleware(context)
  return context.response
}

// 测试错误处理中间件
engine.start().then(async () => {
  console.log('=== 测试错误处理中间件 ===')
  
  // 1. 成功的请求
  console.log('\n1. 成功的请求')
  const result1 = await processErrorProneRequest({
    method: 'GET',
    url: '/api/user/123',
    action: 'getUser',
    params: { id: '123' },
    headers: {
      authorization: 'Bearer valid-token'
    }
  })
  console.log('结果:', result1)
  
  // 2. 认证错误
  console.log('\n2. 认证错误')
  const result2 = await processErrorProneRequest({
    method: 'GET',
    url: '/api/user/123',
    action: 'getUser',
    params: { id: '123' }
    // 缺少认证头
  })
  console.log('结果:', result2)
  
  // 3. 权限错误
  console.log('\n3. 权限错误')
  const result3 = await processErrorProneRequest({
    method: 'DELETE',
    url: '/api/admin/user/123',
    action: 'admin:deleteUser',
    params: { id: '123' },
    headers: {
      authorization: 'Bearer valid-token' // 普通用户令牌
    }
  })
  console.log('结果:', result3)
  
  // 4. 验证错误
  console.log('\n4. 验证错误')
  const result4 = await processErrorProneRequest({
    method: 'POST',
    url: '/api/users',
    action: 'createUser',
    data: {
      name: '',
      email: 'invalid-email',
      password: '123'
    },
    headers: {
      authorization: 'Bearer valid-token'
    }
  })
  console.log('结果:', result4)
  
  // 5. 资源不存在错误
  console.log('\n5. 资源不存在错误')
  const result5 = await processErrorProneRequest({
    method: 'GET',
    url: '/api/user/999',
    action: 'getUser',
    params: { id: '999' },
    headers: {
      authorization: 'Bearer valid-token'
    }
  })
  console.log('结果:', result5)
  
  // 6. 测试各种错误类型
  console.log('\n6. 测试各种错误类型')
  const errorTypes = ['validation', 'auth', 'authz', 'notfound', 'ratelimit', 'unknown']
  
  for (const errorType of errorTypes) {
    console.log(`\n测试 ${errorType} 错误:`)
    const result = await processErrorProneRequest({
      method: 'POST',
      url: '/api/test/error',
      action: 'triggerError',
      params: { type: errorType },
      headers: {
        authorization: 'Bearer valid-token'
      }
    })
    console.log('结果:', result)
  }
})
```

## 总结

这些中间件使用示例展示了 @ldesign/engine 中间件系统的强大功能：

1. **基础中间件** - 日志记录、认证、业务逻辑处理
2. **异步中间件** - 数据库操作、缓存处理、数据验证
3. **条件中间件** - 基于条件的中间件执行
4. **错误处理中间件** - 全局错误捕获和处理

中间件系统的优势：
- **模块化** - 每个中间件专注单一职责
- **可组合** - 中间件可以灵活组合
- **可重用** - 中间件可以在不同场景下重用
- **可测试** - 每个中间件可以独立测试
- **可扩展** - 容易添加新的中间件

通过这些示例，您可以学习如何创建和使用各种类型的中间件，构建健壮、可维护的应用程序。
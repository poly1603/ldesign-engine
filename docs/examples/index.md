# 示例

本章提供了 @ldesign/engine 的实际使用示例，涵盖从基础用法到高级应用场景的各种案例。

## 基础示例

### 简单的应用

最基本的引擎使用示例：

```typescript
import { Engine } from '@ldesign/engine'

// 创建引擎实例
const engine = new Engine({
  name: 'hello-world',
  version: '1.0.0'
})

// 添加一个简单的方法
engine.addMethod('greet', (name: string) => {
  return `Hello, ${name}!`
})

// 启动引擎
engine.start().then(() => {
  console.log('引擎已启动')

  // 使用添加的方法
  const greeting = engine.greet('World')
  console.log(greeting) // "Hello, World!"
})
```

### 带配置的应用

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'configured-app',
  version: '1.0.0',
  debug: true,
  logLevel: 'info',
  initialState: {
    counter: 0,
    user: null
  }
})

// 添加计数器方法
engine.addMethod('increment', () => {
  const current = engine.getState('counter')
  engine.setState('counter', current + 1)
  engine.emit('counter:changed', current + 1)
})

engine.addMethod('decrement', () => {
  const current = engine.getState('counter')
  engine.setState('counter', current - 1)
  engine.emit('counter:changed', current - 1)
})

// 监听计数器变化
engine.on('counter:changed', (value) => {
  console.log('计数器值:', value)
})

// 启动并测试
engine.start().then(() => {
  engine.increment() // 计数器值: 1
  engine.increment() // 计数器值: 2
  engine.decrement() // 计数器值: 1
})
```

## 插件示例

### 创建简单插件

```typescript
// logger-plugin.ts
import { LoggerPlugin } from './logger-plugin'
import { Engine, Plugin } from '@ldesign/engine'

// 使用插件
import { Engine } from '@ldesign/engine'

export class LoggerPlugin implements Plugin {
  name = 'logger'
  version = '1.0.0'
  description = '日志记录插件'

  config = {
    level: 'info',
    format: 'json'
  }

  private logLevel: string = 'info'

  install(engine: Engine) {
    const config = engine.getPluginConfig(this.name)
    this.logLevel = config.level || 'info'

    // 添加日志方法
    engine.addMethod('log', this.log.bind(this))
    engine.addMethod('error', this.error.bind(this))
    engine.addMethod('warn', this.warn.bind(this))
    engine.addMethod('info', this.info.bind(this))
    engine.addMethod('debug', this.debug.bind(this))

    console.log('Logger Plugin 已安装')
  }

  uninstall(engine: Engine) {
    engine.removeMethod('log')
    engine.removeMethod('error')
    engine.removeMethod('warn')
    engine.removeMethod('info')
    engine.removeMethod('debug')

    console.log('Logger Plugin 已卸载')
  }

  private log(level: string, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      args
    }

    if (this.shouldLog(level)) {
      console.log(JSON.stringify(logEntry))
    }
  }

  private error(message: string, ...args: any[]) {
    this.log('error', message, ...args)
  }

  private warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args)
  }

  private info(message: string, ...args: any[]) {
    this.log('info', message, ...args)
  }

  private debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args)
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex <= currentLevelIndex
  }
}

const engine = new Engine({
  name: 'logger-app',
  version: '1.0.0'
})

const loggerPlugin = new LoggerPlugin()

engine.use(loggerPlugin, {
  level: 'debug',
  format: 'json'
})

engine.start().then(() => {
  engine.info('应用已启动')
  engine.debug('调试信息', { userId: 123 })
  engine.warn('这是一个警告')
  engine.error('这是一个错误', new Error('测试错误'))
})
```

### HTTP 客户端插件

```typescript
// http-client-plugin.ts
import { HttpClientPlugin } from './http-client-plugin'
import { Engine, Plugin } from '@ldesign/engine'

// 使用示例
import { Engine } from '@ldesign/engine'

interface HttpConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  retries?: number
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

export class HttpClientPlugin implements Plugin {
  name = 'http-client'
  version = '1.0.0'
  description = 'HTTP 客户端插件'

  config: HttpConfig = {
    timeout: 5000,
    retries: 3
  }

  private httpConfig!: HttpConfig

  install(engine: Engine) {
    this.httpConfig = { ...this.config, ...engine.getPluginConfig(this.name) }

    // 注册 HTTP 服务
    engine.registerService('http', {
      get: this.get.bind(this),
      post: this.post.bind(this),
      put: this.put.bind(this),
      delete: this.delete.bind(this),
      patch: this.patch.bind(this),
      request: this.request.bind(this)
    })

    // 添加便捷方法
    engine.addMethod('get', this.get.bind(this))
    engine.addMethod('post', this.post.bind(this))
    engine.addMethod('put', this.put.bind(this))
    engine.addMethod('delete', this.delete.bind(this))
    engine.addMethod('patch', this.patch.bind(this))

    console.log('HTTP Client Plugin 已安装')
  }

  uninstall(engine: Engine) {
    engine.unregisterService('http')
    engine.removeMethod('get')
    engine.removeMethod('post')
    engine.removeMethod('put')
    engine.removeMethod('delete')
    engine.removeMethod('patch')

    console.log('HTTP Client Plugin 已卸载')
  }

  private async get(url: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request(url, { ...options, method: 'GET' })
  }

  private async post(url: string, body?: any, options?: Omit<RequestOptions, 'method'>) {
    return this.request(url, { ...options, method: 'POST', body })
  }

  private async put(url: string, body?: any, options?: Omit<RequestOptions, 'method'>) {
    return this.request(url, { ...options, method: 'PUT', body })
  }

  private async delete(url: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    return this.request(url, { ...options, method: 'DELETE' })
  }

  private async patch(url: string, body?: any, options?: Omit<RequestOptions, 'method'>) {
    return this.request(url, { ...options, method: 'PATCH', body })
  }

  private async request(url: string, options: RequestOptions = {}): Promise<any> {
    const fullUrl = this.httpConfig.baseURL ? `${this.httpConfig.baseURL}${url}` : url
    const timeout = options.timeout || this.httpConfig.timeout || 5000

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.httpConfig.headers,
        ...options.headers
      }
    }

    if (options.body) {
      requestOptions.body = typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)
    }

    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    requestOptions.signal = controller.signal

    try {
      const response = await this.fetchWithRetry(fullUrl, requestOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
 else {
        return await response.text()
      }
    }
 catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = this.httpConfig.retries || 3): Promise<Response> {
    try {
      return await fetch(url, options)
    }
 catch (error) {
      if (retries > 0) {
        console.warn(`请求失败，剩余重试次数: ${retries}`, error)
        await this.delay(1000) // 等待 1 秒后重试
        return this.fetchWithRetry(url, options, retries - 1)
      }
      throw error
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

const engine = new Engine({
  name: 'http-app',
  version: '1.0.0'
})

engine.use(new HttpClientPlugin(), {
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 10000,
  headers: {
    Authorization: 'Bearer your-token'
  }
})

engine.start().then(async () => {
  try {
    // 使用便捷方法
    const users = await engine.get('/users')
    console.log('用户列表:', users)

    // 使用服务
    const httpService = engine.getService('http')
    const user = await httpService.get('/users/1')
    console.log('用户详情:', user)

    // 创建新用户
    const newUser = await engine.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    })
    console.log('新用户:', newUser)
  }
 catch (error) {
    console.error('HTTP 请求失败:', error)
  }
})
```

## 中间件示例

### 认证中间件

```typescript
import { Engine } from '@ldesign/engine'

// 认证中间件
async function authMiddleware(ctx: any, next: () => Promise<void>) {
  console.log('检查认证状态...')

  const token = ctx.headers?.authorization
  if (!token) {
    ctx.status = 401
    ctx.body = { error: '未提供认证令牌' }
    return
  }

  try {
    // 验证令牌（这里是模拟）
    const user = await validateToken(token)
    ctx.user = user
    console.log('用户已认证:', user.name)
    await next()
  }
 catch (error) {
    ctx.status = 401
    ctx.body = { error: '无效的认证令牌' }
  }
}

// 日志中间件
async function loggingMiddleware(ctx: any, next: () => Promise<void>) {
  const start = Date.now()
  console.log(`${ctx.method} ${ctx.url} - 开始`)

  await next()

  const duration = Date.now() - start
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${duration}ms`)
}

// 错误处理中间件
async function errorHandlingMiddleware(ctx: any, next: () => Promise<void>) {
  try {
    await next()
  }
 catch (error) {
    console.error('中间件错误:', error)
    ctx.status = 500
    ctx.body = { error: '内部服务器错误' }
  }
}

// 模拟令牌验证函数
async function validateToken(token: string) {
  // 这里应该是真实的令牌验证逻辑
  if (token === 'Bearer valid-token') {
    return { id: 1, name: 'John Doe', role: 'user' }
  }
  throw new Error('Invalid token')
}

// 使用中间件
const engine = new Engine({
  name: 'middleware-app',
  version: '1.0.0'
})

// 注册中间件（顺序很重要）
engine.use([
  errorHandlingMiddleware, // 错误处理应该在最外层
  loggingMiddleware, // 日志记录
  authMiddleware // 认证检查
])

// 添加路由处理
engine.addMethod('handleRequest', async (ctx: any) => {
  await engine.execute(ctx)
})

engine.start().then(() => {
  // 模拟请求处理
  const mockRequest = {
    method: 'GET',
    url: '/api/users',
    headers: {
      authorization: 'Bearer valid-token'
    },
    status: 200,
    body: null
  }

  engine.handleRequest(mockRequest)
})
```

### 缓存中间件

```typescript
import { Engine } from '@ldesign/engine'

// 缓存中间件
class CacheMiddleware {
  private cache = new Map<string, { data: any, expiry: number }>()
  private defaultTTL = 5 * 60 * 1000 // 5分钟

  middleware = async (ctx: any, next: () => Promise<void>) => {
    const cacheKey = this.generateCacheKey(ctx)

    // 检查缓存
    const cached = this.get(cacheKey)
    if (cached) {
      console.log('缓存命中:', cacheKey)
      ctx.body = cached
      ctx.fromCache = true
      return
    }

    // 执行下一个中间件
    await next()

    // 缓存响应（只缓存成功的响应）
    if (ctx.status === 200 && ctx.body) {
      console.log('缓存响应:', cacheKey)
      this.set(cacheKey, ctx.body, ctx.cacheTTL || this.defaultTTL)
    }
  }

  private generateCacheKey(ctx: any): string {
    return `${ctx.method}:${ctx.url}:${JSON.stringify(ctx.query || {})}`
  }

  private get(key: string): any {
    const item = this.cache.get(key)
    if (!item)
return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  private set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// 使用缓存中间件
const engine = new Engine({
  name: 'cache-app',
  version: '1.0.0'
})

const cacheMiddleware = new CacheMiddleware()

engine.use([
  cacheMiddleware.middleware,
  async (ctx: any, next: () => Promise<void>) => {
    // 模拟数据获取
    console.log('获取数据...')
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟延迟

    ctx.status = 200
    ctx.body = {
      data: `数据获取时间: ${new Date().toISOString()}`,
      timestamp: Date.now()
    }
    ctx.cacheTTL = 10000 // 缓存10秒
  }
])

engine.start().then(async () => {
  const mockRequest = {
    method: 'GET',
    url: '/api/data',
    query: { page: 1 },
    status: 200,
    body: null
  }

  // 第一次请求
  console.log('=== 第一次请求 ===')
  await engine.execute(mockRequest)
  console.log('响应:', mockRequest.body)

  // 第二次请求（应该命中缓存）
  console.log('\n=== 第二次请求 ===')
  const mockRequest2 = { ...mockRequest, body: null }
  await engine.execute(mockRequest2)
  console.log('响应:', mockRequest2.body)
  console.log('来自缓存:', mockRequest2.fromCache)
})
```

## 状态管理示例

### 用户状态管理

```typescript
import { Engine } from '@ldesign/engine'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AppState {
  user: User | null
  isLoading: boolean
  error: string | null
  theme: 'light' | 'dark'
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    message: string
    timestamp: number
  }>
}

const engine = new Engine({
  name: 'state-app',
  version: '1.0.0',
  initialState: {
    user: null,
    isLoading: false,
    error: null,
    theme: 'light',
    notifications: []
  } as AppState
})

// 用户相关操作
engine.addMethod('login', async (credentials: { email: string, password: string }) => {
  engine.setState('isLoading', true)
  engine.setState('error', null)

  try {
    // 模拟登录请求
    await new Promise(resolve => setTimeout(resolve, 1000))

    const user: User = {
      id: 1,
      name: 'John Doe',
      email: credentials.email,
      role: 'user'
    }

    engine.setState('user', user)
    engine.setState('isLoading', false)

    // 添加成功通知
    engine.addNotification({
      type: 'success',
      message: '登录成功'
    })

    engine.emit('user:login', user)

    return user
  }
 catch (error) {
    engine.setState('isLoading', false)
    engine.setState('error', '登录失败')

    engine.addNotification({
      type: 'error',
      message: '登录失败，请检查您的凭据'
    })

    throw error
  }
})

engine.addMethod('logout', () => {
  const user = engine.getState('user')
  engine.setState('user', null)

  engine.addNotification({
    type: 'info',
    message: '您已成功登出'
  })

  engine.emit('user:logout', user)
})

// 主题切换
engine.addMethod('toggleTheme', () => {
  const currentTheme = engine.getState('theme')
  const newTheme = currentTheme === 'light' ? 'dark' : 'light'
  engine.setState('theme', newTheme)

  engine.emit('theme:changed', newTheme)
})

// 通知管理
engine.addMethod('addNotification', (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => {
  const newNotification = {
    ...notification,
    id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  }

  const notifications = engine.getState('notifications')
  engine.setState('notifications', [...notifications, newNotification])

  // 自动移除通知
  setTimeout(() => {
    engine.removeNotification(newNotification.id)
  }, 5000)

  return newNotification.id
})

engine.addMethod('removeNotification', (id: string) => {
  const notifications = engine.getState('notifications')
  engine.setState('notifications', notifications.filter(n => n.id !== id))
})

engine.addMethod('clearNotifications', () => {
  engine.setState('notifications', [])
})

// 状态订阅
engine.subscribe('user', (user) => {
  console.log('用户状态变化:', user ? `${user.name} (${user.email})` : '未登录')
})

engine.subscribe('theme', (theme) => {
  console.log('主题变化:', theme)
  document.body.className = `theme-${theme}`
})

engine.subscribe('notifications', (notifications) => {
  console.log('通知数量:', notifications.length)
  if (notifications.length > 0) {
    const latest = notifications[notifications.length - 1]
    console.log('最新通知:', latest.message)
  }
})

// 事件监听
engine.on('user:login', (user) => {
  console.log('用户登录事件:', user.name)
  // 可以在这里执行其他登录后的操作
})

engine.on('user:logout', (user) => {
  console.log('用户登出事件:', user?.name)
  // 清理用户相关数据
})

// 启动应用并测试
engine.start().then(async () => {
  console.log('应用已启动')
  console.log('初始状态:', engine.getState())

  // 测试登录
  try {
    await engine.login({ email: 'john@example.com', password: 'password' })
  }
 catch (error) {
    console.error('登录失败:', error)
  }

  // 切换主题
  setTimeout(() => {
    engine.toggleTheme()
  }, 2000)

  // 登出
  setTimeout(() => {
    engine.logout()
  }, 4000)
})
```

## 服务示例

### 数据服务

```typescript
import { Engine } from '@ldesign/engine'

// 数据服务接口
interface DataService {
  get: <T>(key: string) => Promise<T | null>
  set: <T>(key: string, value: T) => Promise<void>
  delete: (key: string) => Promise<void>
  exists: (key: string) => Promise<boolean>
  clear: () => Promise<void>
  keys: () => Promise<string[]>
}

// 内存数据服务实现
class MemoryDataService implements DataService {
  private data = new Map<string, any>()

  async get<T>(key: string): Promise<T | null> {
    return this.data.get(key) || null
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    return this.data.has(key)
  }

  async clear(): Promise<void> {
    this.data.clear()
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys())
  }
}

// LocalStorage 数据服务实现
class LocalStorageDataService implements DataService {
  private prefix: string

  constructor(prefix = 'app:') {
    this.prefix = prefix
  }

  async get<T>(key: string): Promise<T | null> {
    const item = localStorage.getItem(this.prefix + key)
    return item ? JSON.parse(item) : null
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(this.prefix + key, JSON.stringify(value))
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key)
  }

  async exists(key: string): Promise<boolean> {
    return localStorage.getItem(this.prefix + key) !== null
  }

  async clear(): Promise<void> {
    const keys = await this.keys()
    keys.forEach(key => localStorage.removeItem(this.prefix + key))
  }

  async keys(): Promise<string[]> {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length))
      }
    }
    return keys
  }
}

// 用户服务
interface UserService {
  getCurrentUser: () => Promise<User | null>
  updateProfile: (updates: Partial<User>) => Promise<User>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  getPreferences: () => Promise<any>
  updatePreferences: (preferences: any) => Promise<void>
}

class UserServiceImpl implements UserService {
  constructor(private dataService: DataService) {}

  async getCurrentUser(): Promise<User | null> {
    return await this.dataService.get<User>('current-user')
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      throw new Error('用户未登录')
    }

    const updatedUser = { ...currentUser, ...updates }
    await this.dataService.set('current-user', updatedUser)
    return updatedUser
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    // 这里应该调用后端 API
    console.log('密码已更改')
  }

  async getPreferences(): Promise<any> {
    return await this.dataService.get('user-preferences') || {
      theme: 'light',
      language: 'zh-CN',
      notifications: true
    }
  }

  async updatePreferences(preferences: any): Promise<void> {
    await this.dataService.set('user-preferences', preferences)
  }
}

// 使用服务
const engine = new Engine({
  name: 'service-app',
  version: '1.0.0'
})

// 注册数据服务
const dataService = new LocalStorageDataService('myapp:')
engine.registerService('dataService', dataService)

// 注册用户服务
const userService = new UserServiceImpl(dataService)
engine.registerService('userService', userService)

// 添加便捷方法
engine.addMethod('saveData', async (key: string, value: any) => {
  const dataService = engine.getService<DataService>('dataService')
  await dataService.set(key, value)
  engine.emit('data:saved', { key, value })
})

engine.addMethod('loadData', async (key: string) => {
  const dataService = engine.getService<DataService>('dataService')
  const value = await dataService.get(key)
  engine.emit('data:loaded', { key, value })
  return value
})

engine.addMethod('updateUserProfile', async (updates: Partial<User>) => {
  const userService = engine.getService<UserService>('userService')
  const updatedUser = await userService.updateProfile(updates)
  engine.setState('user', updatedUser)
  engine.emit('user:profile-updated', updatedUser)
  return updatedUser
})

// 启动应用并测试
engine.start().then(async () => {
  console.log('服务应用已启动')

  // 测试数据服务
  await engine.saveData('test-key', { message: 'Hello World', timestamp: Date.now() })
  const data = await engine.loadData('test-key')
  console.log('加载的数据:', data)

  // 测试用户服务
  const userService = engine.getService<UserService>('userService')

  // 模拟用户登录
  await engine.saveData('current-user', {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  })

  const currentUser = await userService.getCurrentUser()
  console.log('当前用户:', currentUser)

  // 更新用户资料
  if (currentUser) {
    const updatedUser = await engine.updateUserProfile({
      name: 'John Smith'
    })
    console.log('更新后的用户:', updatedUser)
  }

  // 获取用户偏好
  const preferences = await userService.getPreferences()
  console.log('用户偏好:', preferences)
})
```

## 错误处理示例

### 全局错误处理

```typescript
import { Engine } from '@ldesign/engine'

// 自定义错误类
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

class ValidationError extends AppError {
  constructor(message: string, public field: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} 未找到`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

// 错误处理器
class ErrorHandler {
  private errorCounts = new Map<string, number>()
  private maxRetries = 3

  handle(error: Error, context?: any): void {
    console.error('错误处理器:', error.message)

    if (error instanceof AppError) {
      this.handleAppError(error, context)
    }
 else if (error instanceof TypeError) {
      this.handleTypeError(error, context)
    }
 else if (error instanceof ReferenceError) {
      this.handleReferenceError(error, context)
    }
 else {
      this.handleUnknownError(error, context)
    }

    // 记录错误统计
    this.recordError(error)

    // 发送错误报告
    this.reportError(error, context)
  }

  private handleAppError(error: AppError, context?: any): void {
    console.error(`应用错误 [${error.code}]:`, error.message)

    if (error instanceof ValidationError) {
      console.error('验证字段:', error.field)
    }

    if (error.details) {
      console.error('错误详情:', error.details)
    }
  }

  private handleTypeError(error: TypeError, context?: any): void {
    console.error('类型错误:', error.message)
    console.error('可能的原因: 变量未定义或类型不匹配')
  }

  private handleReferenceError(error: ReferenceError, context?: any): void {
    console.error('引用错误:', error.message)
    console.error('可能的原因: 变量未声明')
  }

  private handleUnknownError(error: Error, context?: any): void {
    console.error('未知错误:', error.message)
    console.error('错误堆栈:', error.stack)
  }

  private recordError(error: Error): void {
    const errorKey = `${error.name}:${error.message}`
    const count = this.errorCounts.get(errorKey) || 0
    this.errorCounts.set(errorKey, count + 1)
  }

  private reportError(error: Error, context?: any): void {
    // 这里可以发送错误报告到监控服务
    const errorReport = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.log('错误报告:', errorReport)
    // 实际应用中可以发送到错误监控服务
    // errorReportingService.send(errorReport)
  }

  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts)
  }

  clearErrorStats(): void {
    this.errorCounts.clear()
  }
}

// 重试机制
class RetryManager {
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      }
 catch (error) {
        lastError = error as Error
        console.warn(`操作失败 (尝试 ${attempt}/${maxRetries}):`, error.message)

        if (attempt < maxRetries) {
          await this.delay(delay * attempt) // 指数退避
        }
      }
    }

    throw new AppError(
      `操作在 ${maxRetries} 次尝试后仍然失败`,
      'MAX_RETRIES_EXCEEDED',
      500,
      { originalError: lastError }
    )
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 使用错误处理
const engine = new Engine({
  name: 'error-handling-app',
  version: '1.0.0'
})

const errorHandler = new ErrorHandler()
const retryManager = new RetryManager()

// 注册全局错误处理器
engine.onError((error, context) => {
  errorHandler.handle(error, context)
})

// 注册服务
engine.registerService('errorHandler', errorHandler)
engine.registerService('retryManager', retryManager)

// 添加带错误处理的方法
engine.addMethod('validateUser', (user: any) => {
  if (!user) {
    throw new ValidationError('用户对象不能为空', 'user')
  }

  if (!user.email) {
    throw new ValidationError('邮箱不能为空', 'email')
  }

  if (!user.email.includes('@')) {
    throw new ValidationError('邮箱格式不正确', 'email', {
      provided: user.email,
      expected: 'email@example.com'
    })
  }

  return true
})

engine.addMethod('fetchUserData', async (userId: number) => {
  return await retryManager.withRetry(async () => {
    // 模拟可能失败的网络请求
    if (Math.random() < 0.7) {
      throw new Error('网络请求失败')
    }

    if (userId === 404) {
      throw new NotFoundError('用户')
    }

    return {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com'
    }
  }, 3, 1000)
})

engine.addMethod('secureOperation', (token: string) => {
  if (!token) {
    throw new UnauthorizedError('访问令牌不能为空')
  }

  if (token !== 'valid-token') {
    throw new UnauthorizedError('无效的访问令牌')
  }

  return { success: true, message: '操作成功' }
})

// 启动应用并测试错误处理
engine.start().then(async () => {
  console.log('错误处理应用已启动')

  // 测试验证错误
  try {
    engine.validateUser(null)
  }
 catch (error) {
    console.log('捕获到验证错误')
  }

  try {
    engine.validateUser({ name: 'John' }) // 缺少邮箱
  }
 catch (error) {
    console.log('捕获到邮箱验证错误')
  }

  try {
    engine.validateUser({ email: 'invalid-email' }) // 邮箱格式错误
  }
 catch (error) {
    console.log('捕获到邮箱格式错误')
  }

  // 测试重试机制
  try {
    const userData = await engine.fetchUserData(123)
    console.log('获取用户数据成功:', userData)
  }
 catch (error) {
    console.log('获取用户数据失败')
  }

  // 测试未找到错误
  try {
    await engine.fetchUserData(404)
  }
 catch (error) {
    console.log('捕获到未找到错误')
  }

  // 测试授权错误
  try {
    engine.secureOperation('')
  }
 catch (error) {
    console.log('捕获到授权错误')
  }

  // 显示错误统计
  setTimeout(() => {
    console.log('错误统计:', errorHandler.getErrorStats())
  }, 2000)
})
```

## 性能优化示例

### 性能监控

```typescript
import { Engine } from '@ldesign/engine'

// 性能监控器
class PerformanceMonitor {
  private metrics = new Map<string, number[]>()
  private observers = new Map<string, PerformanceObserver>()

  constructor() {
    this.setupObservers()
  }

  private setupObservers(): void {
    // 监控导航性能
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordMetric('navigation', entry.duration)
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.set('navigation', navObserver)

      // 监控资源加载
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordMetric('resource', entry.duration)
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', resourceObserver)
    }
  }

  startTiming(name: string): () => number {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
      return duration
    }
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(value)
  }

  getMetrics(name: string): {
    count: number
    min: number
    max: number
    avg: number
    p95: number
  } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0)
return null

    const sorted = [...values].sort((a, b) => a - b)
    const count = sorted.length
    const min = sorted[0]
    const max = sorted[count - 1]
    const avg = sorted.reduce((sum, val) => sum + val, 0) / count
    const p95Index = Math.floor(count * 0.95)
    const p95 = sorted[p95Index]

    return { count, min, max, avg, p95 }
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name)
    }
    return result
  }

  clearMetrics(): void {
    this.metrics.clear()
  }

  destroy(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect()
    }
    this.observers.clear()
    this.metrics.clear()
  }
}

// 缓存管理器
class CacheManager {
  private cache = new Map<string, { data: any, expiry: number, hits: number }>()
  private maxSize = 100
  private defaultTTL = 5 * 60 * 1000 // 5分钟

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item)
return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    item.hits++
    return item.data
  }

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    // 如果缓存已满，移除最少使用的项
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      hits: 0
    })
  }

  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let leastHits = Infinity

    for (const [key, item] of this.cache) {
      if (item.hits < leastHits) {
        leastHits = item.hits
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  clear(): void {
    this.cache.clear()
  }

  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    totalHits: number
  } {
    let totalHits = 0
    let totalRequests = 0

    for (const item of this.cache.values()) {
      totalHits += item.hits
      totalRequests += item.hits + 1 // +1 for the initial set
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalHits
    }
  }
}

// 防抖和节流工具
class ThrottleDebounce {
  private debounceTimers = new Map<string, NodeJS.Timeout>()
  private throttleTimers = new Map<string, { timer: NodeJS.Timeout, lastCall: number }>()

  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key = 'default'
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        func.apply(this, args)
        this.debounceTimers.delete(key)
      }, delay)

      this.debounceTimers.set(key, timer)
    }
  }

  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key = 'default'
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const now = Date.now()
      const throttleInfo = this.throttleTimers.get(key)

      if (!throttleInfo || now - throttleInfo.lastCall >= delay) {
        func.apply(this, args)

        if (throttleInfo) {
          clearTimeout(throttleInfo.timer)
        }

        this.throttleTimers.set(key, {
          timer: setTimeout(() => {
            this.throttleTimers.delete(key)
          }, delay),
          lastCall: now
        })
      }
    }
  }

  clear(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()

    for (const { timer } of this.throttleTimers.values()) {
      clearTimeout(timer)
    }
    this.throttleTimers.clear()
  }
}

// 使用性能优化
const engine = new Engine({
  name: 'performance-app',
  version: '1.0.0'
})

const performanceMonitor = new PerformanceMonitor()
const cacheManager = new CacheManager()
const throttleDebounce = new ThrottleDebounce()

// 注册服务
engine.registerService('performanceMonitor', performanceMonitor)
engine.registerService('cacheManager', cacheManager)
engine.registerService('throttleDebounce', throttleDebounce)

// 添加性能监控的方法
engine.addMethod('measurePerformance', (name: string, operation: () => any) => {
  const endTiming = performanceMonitor.startTiming(name)
  const result = operation()
  const duration = endTiming()
  console.log(`操作 ${name} 耗时: ${duration.toFixed(2)}ms`)
  return result
})

engine.addMethod('measureAsyncPerformance', async (name: string, operation: () => Promise<any>) => {
  const endTiming = performanceMonitor.startTiming(name)
  const result = await operation()
  const duration = endTiming()
  console.log(`异步操作 ${name} 耗时: ${duration.toFixed(2)}ms`)
  return result
})

// 添加缓存方法
engine.addMethod('cachedFetch', async (url: string, options?: RequestInit) => {
  const cacheKey = `fetch:${url}:${JSON.stringify(options || {})}`

  // 尝试从缓存获取
  const cached = cacheManager.get(cacheKey)
  if (cached) {
    console.log('缓存命中:', url)
    return cached
  }

  // 执行请求并缓存结果
  console.log('执行请求:', url)
  const response = await fetch(url, options)
  const data = await response.json()

  cacheManager.set(cacheKey, data, 5 * 60 * 1000) // 缓存5分钟
  return data
})

// 添加防抖搜索方法
engine.addMethod('search', throttleDebounce.debounce(async (query: string) => {
  console.log('执行搜索:', query)

  return await engine.measureAsyncPerformance('search', async () => {
    // 模拟搜索请求
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      query,
      results: [
        { id: 1, title: `结果1 for ${query}` },
        { id: 2, title: `结果2 for ${query}` },
        { id: 3, title: `结果3 for ${query}` }
      ],
      timestamp: Date.now()
    }
  })
}, 300, 'search'))

// 添加节流滚动处理
engine.addMethod('handleScroll', throttleDebounce.throttle((event: Event) => {
  console.log('处理滚动事件:', window.scrollY)

  engine.measurePerformance('scroll-handler', () => {
    // 模拟滚动处理逻辑
    const scrollTop = window.scrollY
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100

    // 更新滚动进度
    engine.setState('scrollProgress', Math.round(scrollPercentage))
  })
}, 100, 'scroll'))

// 性能报告
engine.addMethod('getPerformanceReport', () => {
  return {
    metrics: performanceMonitor.getAllMetrics(),
    cache: cacheManager.getStats(),
    memory: {
      used: (performance as any).memory?.usedJSHeapSize || 0,
      total: (performance as any).memory?.totalJSHeapSize || 0,
      limit: (performance as any).memory?.jsHeapSizeLimit || 0
    },
    timing: performance.timing
  }
})

// 启动应用并测试性能优化
engine.start().then(async () => {
  console.log('性能优化应用已启动')

  // 测试性能监控
  engine.measurePerformance('sync-operation', () => {
    // 模拟同步操作
    let sum = 0
    for (let i = 0; i < 1000000; i++) {
      sum += i
    }
    return sum
  })

  // 测试异步性能监控
  await engine.measureAsyncPerformance('async-operation', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return 'async result'
  })

  // 测试缓存
  console.log('\n=== 测试缓存 ===')
  const url = 'https://jsonplaceholder.typicode.com/posts/1'

  // 第一次请求
  await engine.cachedFetch(url)

  // 第二次请求（应该命中缓存）
  await engine.cachedFetch(url)

  // 测试防抖搜索
  console.log('\n=== 测试防抖搜索 ===')
  engine.search('test1')
  engine.search('test2')
  engine.search('test3') // 只有这个会执行

  // 添加滚动监听
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', engine.handleScroll)
  }

  // 定期输出性能报告
  setInterval(() => {
    const report = engine.getPerformanceReport()
    console.log('\n=== 性能报告 ===')
    console.log('指标:', report.metrics)
    console.log('缓存:', report.cache)
    if (report.memory.used > 0) {
      console.log('内存使用:', {
        used: `${(report.memory.used / 1024 / 1024).toFixed(2)} MB`,
        total: `${(report.memory.total / 1024 / 1024).toFixed(2)} MB`
      })
    }
  }, 10000) // 每10秒输出一次
})

// 清理资源
window.addEventListener('beforeunload', () => {
  performanceMonitor.destroy()
  throttleDebounce.clear()
})
```

这些示例展示了 @ldesign/engine 在各种实际场景中的应用，包括基础用法、插件开发、中间件使用、状态管理、服务架构、错误处理和性能优化。每个示例都提供了完整的代码和详细的注释，帮助开发者理解和应用这些概念。

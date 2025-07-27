# 最佳实践

本章提供使用 @ldesign/engine 的最佳实践指南，帮助您构建高质量、可维护的应用程序。

## 架构设计原则

### 1. 单一职责原则

每个插件和服务都应该有明确的单一职责。

```typescript
// ❌ 不好的做法 - 插件职责过多
class MegaPlugin implements Plugin {
  name = 'mega-plugin'

  install(engine: Engine) {
    // 用户管理
    engine.addMethod('login', this.login)
    engine.addMethod('logout', this.logout)

    // 数据存储
    engine.addMethod('saveData', this.saveData)
    engine.addMethod('loadData', this.loadData)

    // 网络请求
    engine.addMethod('httpGet', this.httpGet)
    engine.addMethod('httpPost', this.httpPost)

    // 通知系统
    engine.addMethod('notify', this.notify)
  }
}

// ✅ 好的做法 - 职责分离
class AuthPlugin implements Plugin {
  name = 'auth-plugin'

  install(engine: Engine) {
    engine.addMethod('login', this.login)
    engine.addMethod('logout', this.logout)
    engine.addMethod('getCurrentUser', this.getCurrentUser)
  }
}

class StoragePlugin implements Plugin {
  name = 'storage-plugin'

  install(engine: Engine) {
    engine.addMethod('saveData', this.saveData)
    engine.addMethod('loadData', this.loadData)
    engine.addMethod('removeData', this.removeData)
  }
}

class HttpPlugin implements Plugin {
  name = 'http-plugin'

  install(engine: Engine) {
    engine.registerService('http', new HttpService())
  }
}
```

### 2. 依赖注入

使用依赖注入来管理组件间的依赖关系。

```typescript
// ✅ 好的做法 - 使用依赖注入
class UserService {
  constructor(
    private httpService: HttpService,
    private storageService: StorageService,
    private logger: Logger
  ) {}

  async getUser(id: string): Promise<User> {
    this.logger.info(`获取用户: ${id}`)

    // 先尝试从缓存获取
    const cached = await this.storageService.get(`user:${id}`)
    if (cached) {
      return cached
    }

    // 从服务器获取
    const user = await this.httpService.get(`/users/${id}`)

    // 缓存结果
    await this.storageService.set(`user:${id}`, user, 300000)

    return user
  }
}

// 在插件中注册服务
class UserPlugin implements Plugin {
  name = 'user-plugin'
  dependencies = ['http-plugin', 'storage-plugin', 'logger-plugin']

  install(engine: Engine) {
    const httpService = engine.getService('http')
    const storageService = engine.getService('storage')
    const logger = engine.getService('logger')

    const userService = new UserService(httpService, storageService, logger)
    engine.registerService('userService', userService)
  }
}
```

### 3. 事件驱动架构

使用事件来实现组件间的松耦合通信。

```typescript
// ✅ 好的做法 - 事件驱动
class AuthPlugin implements Plugin {
  name = 'auth-plugin'

  install(engine: Engine) {
    engine.addMethod('login', async (credentials) => {
      const user = await this.authenticate(credentials)

      // 触发登录成功事件
      engine.emit('user:login', user)

      return user
    })

    engine.addMethod('logout', () => {
      const user = engine.getState('currentUser')
      engine.setState('currentUser', null)

      // 触发登出事件
      engine.emit('user:logout', user)
    })
  }
}

// 其他插件监听事件
class AnalyticsPlugin implements Plugin {
  name = 'analytics-plugin'

  install(engine: Engine) {
    // 监听用户行为事件
    engine.on('user:login', (user) => {
      this.trackEvent('user_login', { userId: user.id })
    })

    engine.on('user:logout', (user) => {
      this.trackEvent('user_logout', { userId: user?.id })
    })
  }
}

class NotificationPlugin implements Plugin {
  name = 'notification-plugin'

  install(engine: Engine) {
    engine.on('user:login', (user) => {
      engine.notify({
        type: 'success',
        title: '登录成功',
        message: `欢迎回来，${user.name}！`
      })
    })
  }
}
```

## 插件开发最佳实践

### 1. 插件生命周期管理

正确实现插件的生命周期方法。

```typescript
class WellDesignedPlugin implements Plugin {
  name = 'well-designed-plugin'
  version = '1.0.0'

  private resources: any[] = []
  private eventListeners: Array<{ event: string, handler: Function }> = []
  private timers: NodeJS.Timeout[] = []

  async install(engine: Engine): Promise<void> {
    try {
      // 初始化资源
      await this.initializeResources()

      // 注册事件监听器
      this.registerEventListeners(engine)

      // 注册服务和方法
      this.registerServices(engine)

      // 启动定时任务
      this.startTimers()

      console.log(`${this.name} 安装成功`)
    }
 catch (error) {
      console.error(`${this.name} 安装失败:`, error)
      // 清理已创建的资源
      await this.cleanup()
      throw error
    }
  }

  async uninstall(engine: Engine): Promise<void> {
    try {
      // 清理定时器
      this.clearTimers()

      // 移除事件监听器
      this.removeEventListeners(engine)

      // 注销服务
      this.unregisterServices(engine)

      // 清理资源
      await this.cleanup()

      console.log(`${this.name} 卸载成功`)
    }
 catch (error) {
      console.error(`${this.name} 卸载失败:`, error)
      throw error
    }
  }

  async enable(engine: Engine): Promise<void> {
    // 启用插件功能
    this.startTimers()
    console.log(`${this.name} 已启用`)
  }

  async disable(engine: Engine): Promise<void> {
    // 禁用插件功能
    this.clearTimers()
    console.log(`${this.name} 已禁用`)
  }

  private async initializeResources(): Promise<void> {
    // 初始化数据库连接、文件句柄等
  }

  private registerEventListeners(engine: Engine): void {
    const handlers = [
      { event: 'app:start', handler: this.onAppStart.bind(this) },
      { event: 'app:stop', handler: this.onAppStop.bind(this) }
    ]

    handlers.forEach(({ event, handler }) => {
      engine.on(event, handler)
      this.eventListeners.push({ event, handler })
    })
  }

  private removeEventListeners(engine: Engine): void {
    this.eventListeners.forEach(({ event, handler }) => {
      engine.off(event, handler)
    })
    this.eventListeners = []
  }

  private registerServices(engine: Engine): void {
    // 注册服务
  }

  private unregisterServices(engine: Engine): void {
    // 注销服务
  }

  private startTimers(): void {
    // 启动定时任务
  }

  private clearTimers(): void {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers = []
  }

  private async cleanup(): Promise<void> {
    // 清理所有资源
    for (const resource of this.resources) {
      if (resource.close) {
        await resource.close()
      }
    }
    this.resources = []
  }

  private onAppStart(): void {
    // 应用启动处理
  }

  private onAppStop(): void {
    // 应用停止处理
  }
}
```

### 2. 配置验证

为插件提供配置验证机制。

```typescript
interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  timeout?: number
}

class DatabasePlugin implements Plugin {
  name = 'database-plugin'
  version = '1.0.0'

  // 默认配置
  config: DatabaseConfig = {
    host: 'localhost',
    port: 5432,
    database: 'myapp',
    username: 'user',
    password: 'password',
    ssl: false,
    timeout: 30000
  }

  // 配置验证模式
  schema = {
    type: 'object',
    properties: {
      host: { type: 'string', minLength: 1 },
      port: { type: 'number', minimum: 1, maximum: 65535 },
      database: { type: 'string', minLength: 1 },
      username: { type: 'string', minLength: 1 },
      password: { type: 'string', minLength: 1 },
      ssl: { type: 'boolean' },
      timeout: { type: 'number', minimum: 1000 }
    },
    required: ['host', 'port', 'database', 'username', 'password']
  }

  install(engine: Engine) {
    const config = this.validateConfig(engine.getPluginConfig(this.name))

    // 使用验证后的配置
    const database = new Database(config)
    engine.registerService('database', database)
  }

  private validateConfig(userConfig: any): DatabaseConfig {
    const config = { ...this.config, ...userConfig }

    // 这里可以使用 JSON Schema 验证库
    // 例如：ajv, joi 等
    if (!config.host) {
      throw new Error('数据库主机地址不能为空')
    }

    if (config.port < 1 || config.port > 65535) {
      throw new Error('数据库端口必须在 1-65535 之间')
    }

    return config
  }
}
```

### 3. 错误处理

实现健壮的错误处理机制。

```typescript
class RobustPlugin implements Plugin {
  name = 'robust-plugin'
  version = '1.0.0'

  async install(engine: Engine): Promise<void> {
    try {
      await this.initializePlugin(engine)
    }
 catch (error) {
      // 记录错误
      console.error(`插件 ${this.name} 初始化失败:`, error)

      // 触发错误事件
      engine.emit('plugin:error', {
        plugin: this.name,
        phase: 'install',
        error
      })

      // 清理部分初始化的资源
      await this.cleanup()

      // 重新抛出错误
      throw new PluginError(`插件 ${this.name} 安装失败`, this.name, error)
    }
  }

  private async initializePlugin(engine: Engine): Promise<void> {
    // 添加带错误处理的方法
    engine.addMethod('safeOperation', async (data: any) => {
      try {
        return await this.performOperation(data)
      }
 catch (error) {
        // 记录错误
        console.error('操作失败:', error)

        // 触发错误事件
        engine.emit('operation:error', {
          operation: 'safeOperation',
          data,
          error
        })

        // 返回错误结果而不是抛出异常
        return {
          success: false,
          error: error.message
        }
      }
    })

    // 添加重试机制
    engine.addMethod('operationWithRetry', async (data: any, maxRetries = 3) => {
      let lastError: Error

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await this.performOperation(data)
        }
 catch (error) {
          lastError = error as Error
          console.warn(`操作失败 (尝试 ${attempt}/${maxRetries}):`, error.message)

          if (attempt < maxRetries) {
            // 指数退避
            await this.delay(2 ** attempt * 1000)
          }
        }
      }

      throw new Error(`操作在 ${maxRetries} 次尝试后仍然失败: ${lastError.message}`)
    })
  }

  private async performOperation(data: any): Promise<any> {
    // 模拟可能失败的操作
    if (Math.random() < 0.3) {
      throw new Error('随机操作失败')
    }
    return { success: true, data }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async cleanup(): Promise<void> {
    // 清理资源
  }
}

// 自定义错误类
class PluginError extends Error {
  constructor(
    message: string,
    public pluginName: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'PluginError'
  }
}
```

## 状态管理最佳实践

### 1. 状态结构设计

设计清晰、可维护的状态结构。

```typescript
// ✅ 好的状态结构
interface AppState {
  // 用户相关状态
  auth: {
    user: User | null
    isLoading: boolean
    error: string | null
  }

  // UI 状态
  ui: {
    theme: 'light' | 'dark'
    language: string
    sidebarOpen: boolean
    notifications: Notification[]
  }

  // 数据状态
  data: {
    users: {
      items: User[]
      loading: boolean
      error: string | null
      lastUpdated: number | null
    }
    posts: {
      items: Post[]
      loading: boolean
      error: string | null
      pagination: {
        page: number
        limit: number
        total: number
      }
    }
  }

  // 应用配置
  config: {
    apiUrl: string
    features: {
      enableAnalytics: boolean
      enableNotifications: boolean
    }
  }
}

// 初始化状态
const initialState: AppState = {
  auth: {
    user: null,
    isLoading: false,
    error: null
  },
  ui: {
    theme: 'light',
    language: 'zh-CN',
    sidebarOpen: false,
    notifications: []
  },
  data: {
    users: {
      items: [],
      loading: false,
      error: null,
      lastUpdated: null
    },
    posts: {
      items: [],
      loading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0
      }
    }
  },
  config: {
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    features: {
      enableAnalytics: true,
      enableNotifications: true
    }
  }
}
```

### 2. 状态更新模式

使用不可变更新模式。

```typescript
class StateManager {
  constructor(private engine: Engine) {}

  // ✅ 好的做法 - 不可变更新
  updateUser(userId: string, updates: Partial<User>): void {
    const users = this.engine.getState('data.users.items')
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, ...updates } : user
    )

    this.engine.setState('data.users.items', updatedUsers)
    this.engine.setState('data.users.lastUpdated', Date.now())
  }

  // ✅ 好的做法 - 批量更新
  setLoadingState(resource: string, loading: boolean, error: string | null = null): void {
    this.engine.setState(state => ({
      ...state,
      data: {
        ...state.data,
        [resource]: {
          ...state.data[resource],
          loading,
          error
        }
      }
    }))
  }

  // ✅ 好的做法 - 原子操作
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now()
    }

    this.engine.setState(state => ({
      ...state,
      ui: {
        ...state.ui,
        notifications: [...state.ui.notifications, newNotification]
      }
    }))

    return id
  }

  removeNotification(id: string): void {
    this.engine.setState(state => ({
      ...state,
      ui: {
        ...state.ui,
        notifications: state.ui.notifications.filter(n => n.id !== id)
      }
    }))
  }
}
```

### 3. 状态订阅优化

优化状态订阅以避免不必要的更新。

```typescript
class OptimizedSubscriptions {
  constructor(private engine: Engine) {
    this.setupSubscriptions()
  }

  private setupSubscriptions(): void {
    // ✅ 订阅特定路径而不是整个状态
    this.engine.subscribe('auth.user', (user) => {
      this.onUserChange(user)
    })

    // ✅ 使用防抖避免频繁更新
    this.engine.subscribe('ui.notifications', this.debounce((notifications) => {
      this.updateNotificationUI(notifications)
    }, 100))

    // ✅ 条件订阅
    this.engine.subscribe('data.users.items', (users) => {
      // 只在用户列表不为空时处理
      if (users.length > 0) {
        this.processUsers(users)
      }
    })
  }

  private onUserChange(user: User | null): void {
    if (user) {
      console.log('用户已登录:', user.name)
      this.loadUserPreferences(user.id)
    }
 else {
      console.log('用户已登出')
      this.clearUserData()
    }
  }

  private updateNotificationUI(notifications: Notification[]): void {
    // 更新通知 UI
    const container = document.getElementById('notifications')
    if (container) {
      container.innerHTML = notifications.map(n =>
        `<div class="notification notification-${n.type}">${n.message}</div>`
      ).join('')
    }
  }

  private processUsers(users: User[]): void {
    // 处理用户列表
  }

  private loadUserPreferences(userId: string): void {
    // 加载用户偏好
  }

  private clearUserData(): void {
    // 清理用户数据
  }

  private debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  }
}
```

## 性能优化最佳实践

### 1. 懒加载和代码分割

```typescript
// ✅ 懒加载插件
class PluginLoader {
  private loadedPlugins = new Map<string, Plugin>()

  async loadPlugin(name: string): Promise<Plugin> {
    if (this.loadedPlugins.has(name)) {
      return this.loadedPlugins.get(name)!
    }

    let plugin: Plugin

    switch (name) {
      case 'analytics':
        const { AnalyticsPlugin } = await import('./plugins/analytics')
        plugin = new AnalyticsPlugin()
        break
      case 'charts':
        const { ChartsPlugin } = await import('./plugins/charts')
        plugin = new ChartsPlugin()
        break
      default:
        throw new Error(`未知插件: ${name}`)
    }

    this.loadedPlugins.set(name, plugin)
    return plugin
  }
}

// 使用懒加载
const engine = new Engine({ name: 'app', version: '1.0.0' })
const pluginLoader = new PluginLoader()

// 只在需要时加载插件
engine.addMethod('enableAnalytics', async () => {
  const analyticsPlugin = await pluginLoader.loadPlugin('analytics')
  engine.use(analyticsPlugin)
})
```

### 2. 缓存策略

```typescript
class CacheStrategy {
  private memoryCache = new Map<string, { data: any, expiry: number }>()
  private persistentCache = new Map<string, any>()

  // 多级缓存
  async get(key: string): Promise<any> {
    // 1. 检查内存缓存
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem && Date.now() < memoryItem.expiry) {
      return memoryItem.data
    }

    // 2. 检查持久化缓存
    if (this.persistentCache.has(key)) {
      const data = this.persistentCache.get(key)
      // 重新放入内存缓存
      this.setMemoryCache(key, data, 5 * 60 * 1000) // 5分钟
      return data
    }

    return null
  }

  set(key: string, data: any, memoryTTL = 5 * 60 * 1000, persistent = false): void {
    this.setMemoryCache(key, data, memoryTTL)

    if (persistent) {
      this.persistentCache.set(key, data)
    }
  }

  private setMemoryCache(key: string, data: any, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  clear(): void {
    this.memoryCache.clear()
    this.persistentCache.clear()
  }
}
```

### 3. 批处理和防抖

```typescript
class BatchProcessor {
  private batches = new Map<string, any[]>()
  private timers = new Map<string, NodeJS.Timeout>()

  // 批处理操作
  addToBatch(batchKey: string, item: any, processor: (items: any[]) => void, delay = 100): void {
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, [])
    }

    this.batches.get(batchKey)!.push(item)

    // 清除之前的定时器
    const existingTimer = this.timers.get(batchKey)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的定时器
    const timer = setTimeout(() => {
      const items = this.batches.get(batchKey) || []
      if (items.length > 0) {
        processor(items)
        this.batches.set(batchKey, [])
      }
      this.timers.delete(batchKey)
    }, delay)

    this.timers.set(batchKey, timer)
  }

  // 防抖函数
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key = 'default'
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.timers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(() => {
        func.apply(this, args)
        this.timers.delete(key)
      }, delay)

      this.timers.set(key, timer)
    }
  }
}

// 使用示例
const batchProcessor = new BatchProcessor()

// 批处理日志
function logBatch(logs: string[]) {
  console.log('批量日志:', logs)
}

// 添加日志到批处理
batchProcessor.addToBatch('logs', 'Log message 1', logBatch)
batchProcessor.addToBatch('logs', 'Log message 2', logBatch)
batchProcessor.addToBatch('logs', 'Log message 3', logBatch)
// 100ms 后会批量处理这些日志
```

## 测试最佳实践

### 1. 单元测试

```typescript
// 插件单元测试
describe('UserPlugin', () => {
  let engine: Engine
  let userPlugin: UserPlugin

  beforeEach(() => {
    engine = new Engine({ name: 'test', version: '1.0.0' })
    userPlugin = new UserPlugin()
  })

  afterEach(async () => {
    if (engine.hasPlugin(userPlugin.name)) {
      await engine.uninstallPlugin(userPlugin.name)
    }
  })

  test('应该正确安装插件', async () => {
    await engine.registerPlugin(userPlugin)
    await engine.installPlugin(userPlugin.name)

    expect(engine.hasPlugin(userPlugin.name)).toBe(true)
    expect(engine.hasMethod('login')).toBe(true)
    expect(engine.hasMethod('logout')).toBe(true)
  })

  test('应该能够登录用户', async () => {
    await engine.registerPlugin(userPlugin)
    await engine.installPlugin(userPlugin.name)

    const mockUser = { id: 1, name: 'John', email: 'john@example.com' }

    // 模拟登录
    const result = await engine.login({
      email: 'john@example.com',
      password: 'password'
    })

    expect(result).toEqual(mockUser)
    expect(engine.getState('auth.user')).toEqual(mockUser)
  })

  test('应该触发登录事件', async () => {
    await engine.registerPlugin(userPlugin)
    await engine.installPlugin(userPlugin.name)

    const loginHandler = jest.fn()
    engine.on('user:login', loginHandler)

    await engine.login({
      email: 'john@example.com',
      password: 'password'
    })

    expect(loginHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'john@example.com'
      })
    )
  })
})
```

### 2. 集成测试

```typescript
// 多插件集成测试
describe('插件集成测试', () => {
  let engine: Engine

  beforeEach(() => {
    engine = new Engine({ name: 'integration-test', version: '1.0.0' })
  })

  test('多个插件应该能够协同工作', async () => {
    const authPlugin = new AuthPlugin()
    const analyticsPlugin = new AnalyticsPlugin()
    const notificationPlugin = new NotificationPlugin()

    // 注册插件
    await engine.registerPlugins([
      authPlugin,
      analyticsPlugin,
      notificationPlugin
    ])

    // 安装插件
    await engine.installPlugin('auth-plugin')
    await engine.installPlugin('analytics-plugin')
    await engine.installPlugin('notification-plugin')

    // 测试插件间通信
    const analyticsTrackSpy = jest.spyOn(analyticsPlugin, 'track')
    const notificationShowSpy = jest.spyOn(notificationPlugin, 'show')

    // 执行登录
    await engine.login({ email: 'test@example.com', password: 'password' })

    // 验证分析插件记录了登录事件
    expect(analyticsTrackSpy).toHaveBeenCalledWith('user_login', expect.any(Object))

    // 验证通知插件显示了登录通知
    expect(notificationShowSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        message: expect.stringContaining('登录成功')
      })
    )
  })
})
```

### 3. 端到端测试

```typescript
// E2E 测试
describe('应用端到端测试', () => {
  let engine: Engine

  beforeEach(async () => {
    // 设置完整的应用环境
    engine = new Engine({
      name: 'e2e-test',
      version: '1.0.0',
      initialState: {
        auth: { user: null, isLoading: false, error: null },
        ui: { theme: 'light', notifications: [] }
      }
    })

    // 注册所有必要的插件
    await engine.use([
      new AuthPlugin(),
      new HttpPlugin(),
      new StoragePlugin(),
      new NotificationPlugin()
    ])

    await engine.start()
  })

  afterEach(async () => {
    await engine.stop()
  })

  test('完整的用户登录流程', async () => {
    // 1. 初始状态检查
    expect(engine.getState('auth.user')).toBeNull()

    // 2. 开始登录
    const loginPromise = engine.login({
      email: 'test@example.com',
      password: 'password'
    })

    // 3. 检查加载状态
    expect(engine.getState('auth.isLoading')).toBe(true)

    // 4. 等待登录完成
    const user = await loginPromise

    // 5. 验证最终状态
    expect(engine.getState('auth.user')).toEqual(user)
    expect(engine.getState('auth.isLoading')).toBe(false)
    expect(engine.getState('auth.error')).toBeNull()

    // 6. 验证通知
    const notifications = engine.getState('ui.notifications')
    expect(notifications).toHaveLength(1)
    expect(notifications[0].type).toBe('success')
  })
})
```

## 部署和监控最佳实践

### 1. 环境配置

```typescript
// 环境配置管理
class EnvironmentConfig {
  private config: any

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): any {
    const env = process.env.NODE_ENV || 'development'

    const baseConfig = {
      app: {
        name: 'MyApp',
        version: '1.0.0'
      },
      api: {
        timeout: 30000,
        retries: 3
      },
      cache: {
        ttl: 5 * 60 * 1000
      }
    }

    const envConfigs = {
      development: {
        api: {
          baseUrl: 'http://localhost:3000/api',
          timeout: 10000
        },
        debug: true,
        logLevel: 'debug'
      },
      production: {
        api: {
          baseUrl: 'https://api.myapp.com',
          timeout: 30000
        },
        debug: false,
        logLevel: 'error',
        analytics: {
          enabled: true,
          trackingId: 'GA-XXXXXXXX'
        }
      },
      test: {
        api: {
          baseUrl: 'http://localhost:3001/api',
          timeout: 5000
        },
        debug: false,
        logLevel: 'warn'
      }
    }

    return {
      ...baseConfig,
      ...envConfigs[env],
      env
    }
  }

  get(path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config)
  }

  isDevelopment(): boolean {
    return this.config.env === 'development'
  }

  isProduction(): boolean {
    return this.config.env === 'production'
  }

  isTest(): boolean {
    return this.config.env === 'test'
  }
}
```

### 2. 错误监控

```typescript
// 错误监控和报告
class ErrorMonitoring {
  private errorQueue: any[] = []
  private isOnline = navigator.onLine

  constructor(private config: { apiUrl: string, apiKey: string }) {
    this.setupErrorHandlers()
    this.setupNetworkMonitoring()
    this.startErrorReporting()
  }

  private setupErrorHandlers(): void {
    // 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'unhandledrejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      })
    })

    // 捕获未捕获的异常
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      })
    })
  }

  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushErrorQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  reportError(error: any): void {
    const errorReport = {
      ...error,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId()
    }

    if (this.isOnline) {
      this.sendErrorReport(errorReport)
    }
 else {
      this.errorQueue.push(errorReport)
    }
  }

  private async sendErrorReport(error: any): Promise<void> {
    try {
      await fetch(`${this.config.apiUrl}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(error)
      })
    }
 catch (err) {
      console.error('Failed to send error report:', err)
      this.errorQueue.push(error)
    }
  }

  private flushErrorQueue(): void {
    while (this.errorQueue.length > 0) {
      const error = this.errorQueue.shift()
      this.sendErrorReport(error)
    }
  }

  private startErrorReporting(): void {
    // 定期发送错误报告
    setInterval(() => {
      if (this.isOnline && this.errorQueue.length > 0) {
        this.flushErrorQueue()
      }
    }, 30000) // 每30秒尝试一次
  }

  private getCurrentUserId(): string | null {
    // 获取当前用户ID
    return localStorage.getItem('userId')
  }

  private getSessionId(): string {
    // 获取会话ID
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }
}
```

### 3. 性能监控

```typescript
// 性能监控
class PerformanceMonitoring {
  private metrics: any[] = []

  constructor() {
    this.setupPerformanceObservers()
    this.startMetricsCollection()
  }

  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // 监控页面加载性能
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('navigation', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType
          })
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })

      // 监控资源加载
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('resource', {
            name: entry.name,
            duration: entry.duration,
            size: (entry as any).transferSize,
            type: entry.entryType
          })
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })

      // 监控长任务
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('longtask', {
            duration: entry.duration,
            startTime: entry.startTime
          })
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
    }
  }

  recordMetric(type: string, data: any): void {
    this.metrics.push({
      type,
      data,
      timestamp: Date.now()
    })
  }

  private startMetricsCollection(): void {
    // 定期收集和发送性能指标
    setInterval(() => {
      this.sendMetrics()
    }, 60000) // 每分钟发送一次
  }

  private async sendMetrics(): Promise<void> {
    if (this.metrics.length === 0)
return

    const metricsToSend = [...this.metrics]
    this.metrics = []

    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics: metricsToSend,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      })
    }
 catch (error) {
      console.error('Failed to send metrics:', error)
      // 重新加入队列
      this.metrics.unshift(...metricsToSend)
    }
  }
}
```

## 总结

遵循这些最佳实践可以帮助您：

1. **构建可维护的代码**：通过单一职责原则和清晰的架构设计
2. **提高应用性能**：通过缓存、懒加载和批处理优化
3. **增强错误处理**：通过健壮的错误处理和监控机制
4. **确保代码质量**：通过全面的测试策略
5. **优化部署和运维**：通过环境配置和监控系统

记住，最佳实践是指导原则，应该根据具体的项目需求和团队情况进行调整。重要的是保持代码的一致性、可读性和可维护性。

# @ldesign/engine API 参考文档

## 📚 目录

- [核心API](#核心api)
- [状态管理](#状态管理)
- [事件系统](#事件系统)
- [缓存管理](#缓存管理)
- [插件系统](#插件系统)
- [工具函数](#工具函数)
- [开发者工具](#开发者工具)

## 核心API

### createEngine()

创建引擎实例

```typescript
function createEngine(config?: EngineConfig): Engine
```

**参数**：
- `config` - 引擎配置对象（可选）

**返回值**：
- `Engine` - 引擎实例

**示例**：
```typescript
const engine = createEngine({
  debug: true,
  logger: { level: 'debug' },
  cache: { maxSize: 100 },
  performance: { enabled: true }
})
```

### createEngineApp()

创建并配置引擎应用

```typescript
function createEngineApp(options: EngineAppOptions): Promise<Engine>
```

**参数**：
- `options.rootComponent` - 根组件
- `options.mountElement` - 挂载元素
- `options.config` - 引擎配置
- `options.plugins` - 插件列表

**示例**：
```typescript
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: { debug: true },
  plugins: [routerPlugin, storePlugin]
})
```

### Engine.install()

将引擎安装到Vue应用

```typescript
install(app: App): void
```

**示例**：
```typescript
const app = createApp(App)
engine.install(app)
app.mount('#app')
```

### Engine.destroy()

销毁引擎并清理所有资源

```typescript
async destroy(): Promise<void>
```

**示例**：
```typescript
onBeforeUnmount(async () => {
  await engine.destroy()
})
```

## 状态管理

### state.get()

获取状态值

```typescript
get<T>(key: string): T | undefined
```

**参数**：
- `key` - 状态键，支持嵌套路径（如 `'user.profile.name'`）

**返回值**：
- 状态值或 `undefined`

**示例**：
```typescript
// 单层访问
const user = engine.state.get('user')

// 嵌套访问
const name = engine.state.get<string>('user.profile.name')
```

### state.set()

设置状态值

```typescript
set<T>(key: string, value: T): void
```

**参数**：
- `key` - 状态键
- `value` - 状态值

**示例**：
```typescript
engine.state.set('user', { name: 'Alice', age: 30 })
engine.state.set('user.profile.name', 'Bob')
```

### state.watch()

监听状态变化

```typescript
watch<T>(
  key: string,
  callback: (newValue: T, oldValue: T) => void
): () => void
```

**参数**：
- `key` - 要监听的状态键
- `callback` - 变化回调函数

**返回值**：
- 取消监听的函数

**示例**：
```typescript
const unwatch = engine.state.watch('user.profile', (newValue, oldValue) => {
  console.log('用户信息变更:', newValue)
})

// 取消监听
unwatch()
```

### state.batchSet()

批量设置状态（性能优化）

```typescript
batchSet(updates: Record<string, unknown>, triggerWatchers?: boolean): void
```

**示例**：
```typescript
// 批量设置，只触发一次监听器
engine.state.batchSet({
  'user.name': 'Alice',
  'user.age': 30,
  'user.email': 'alice@example.com'
})
```

### state.transaction()

事务操作（失败自动回滚）

```typescript
transaction<T>(operation: () => T): T
```

**示例**：
```typescript
try {
  engine.state.transaction(() => {
    engine.state.set('balance', 100)
    engine.state.set('status', 'active')
    if (error) throw new Error('rollback')
  })
} catch (error) {
  // 状态已自动回滚
}
```

### state.undo()

撤销最后一次状态变更

```typescript
undo(): boolean
```

**返回值**：
- `true` - 撤销成功
- `false` - 没有可撤销的变更

## 事件系统

### events.on()

监听事件

```typescript
on<K extends keyof EventMap>(
  event: K,
  handler: (data: EventMap[K]) => void,
  priority?: number
): void
```

**参数**：
- `event` - 事件名称
- `handler` - 事件处理函数
- `priority` - 优先级（可选，默认0，数值越大优先级越高）

**示例**：
```typescript
// 默认优先级
engine.events.on('user:login', (user) => {
  console.log('用户登录:', user)
})

// 高优先级（先执行）
engine.events.on('app:ready', handler, 100)
```

### events.emit()

触发事件

```typescript
emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void
```

**示例**：
```typescript
engine.events.emit('user:login', {
  id: 1,
  name: 'Alice',
  timestamp: Date.now()
})
```

### events.once()

一次性事件监听

```typescript
once<K extends keyof EventMap>(
  event: K,
  handler: (data: EventMap[K]) => void,
  priority?: number
): void
```

**示例**：
```typescript
engine.events.once('app:ready', () => {
  console.log('应用已准备就绪（只触发一次）')
})
```

### events.off()

移除事件监听

```typescript
off<K extends keyof EventMap>(
  event: K,
  handler?: (data: EventMap[K]) => void
): void
```

**示例**：
```typescript
// 移除特定监听器
engine.events.off('user:login', handler)

// 移除所有监听器
engine.events.off('user:login')
```

### events.namespace()

创建事件命名空间

```typescript
namespace(name: string): EventNamespace
```

**示例**：
```typescript
const userEvents = engine.events.namespace('user')
userEvents.on('login', handler)  // 实际事件：'user:login'
userEvents.emit('logout', data)  // 实际事件：'user:logout'
```

## 缓存管理

### cache.set()

设置缓存

```typescript
async set<T>(
  key: string,
  value: T,
  ttl?: number,
  metadata?: Record<string, unknown>
): Promise<void>
```

**参数**：
- `key` - 缓存键
- `value` - 缓存值
- `ttl` - 过期时间（毫秒，可选）
- `metadata` - 元数据（可选）

**示例**：
```typescript
// 设置缓存，1分钟后过期
await engine.cache.set('user:123', userData, 60000)

// 永久缓存
await engine.cache.set('config', configData)
```

### cache.get()

获取缓存

```typescript
async get<T>(key: string): Promise<T | undefined>
```

**示例**：
```typescript
const user = await engine.cache.get('user:123')
if (user) {
  console.log('缓存命中:', user)
}
```

### cache.warmup()

缓存预热

```typescript
async warmup<K extends string>(
  warmupData: Array<{
    key: K
    loader: () => Promise<T> | T
    ttl?: number
  }>
): Promise<void>
```

**示例**：
```typescript
await engine.cache.warmup([
  { key: 'config', loader: () => fetchConfig() },
  { key: 'user', loader: () => fetchCurrentUser(), ttl: 300000 }
])
```

### cache.namespace()

创建缓存命名空间

```typescript
namespace(name: string): NamespacedCache<T>
```

**示例**：
```typescript
const userCache = engine.cache.namespace('users')
await userCache.set('123', userData)  // 实际键：'users:123'
await userCache.clear()  // 清理整个命名空间
```

## 插件系统

### plugins.register()

注册插件

```typescript
async register(plugin: Plugin): Promise<void>
```

**参数**：
- `plugin.name` - 插件名称（必需）
- `plugin.version` - 版本号（可选）
- `plugin.dependencies` - 依赖列表（可选）
- `plugin.install` - 安装函数（必需）
- `plugin.uninstall` - 卸载函数（可选）

**示例**：
```typescript
await engine.plugins.register({
  name: 'my-plugin',
  version: '1.0.0',
  dependencies: ['base-plugin'],
  install: async (context) => {
    context.logger.info('插件安装')
    context.events.on('app:ready', () => {
      // 插件逻辑
    })
  },
  uninstall: async (context) => {
    context.logger.info('插件卸载')
  }
})
```

### plugins.unregister()

卸载插件

```typescript
async unregister(name: string): Promise<void>
```

**示例**：
```typescript
await engine.plugins.unregister('my-plugin')
```

## 工具函数

### debounce()

防抖函数

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void
```

**示例**：
```typescript
const debouncedSearch = debounce((query: string) => {
  api.search(query)
}, 300)

input.addEventListener('input', (e) => {
  debouncedSearch(e.target.value)
})
```

### throttle()

节流函数

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void
```

**示例**：
```typescript
const throttledScroll = throttle(() => {
  console.log('滚动位置:', window.scrollY)
}, 200)

window.addEventListener('scroll', throttledScroll)
```

### createLRUCache()

创建LRU缓存

```typescript
function createLRUCache<T>(options: LRUCacheOptions): LRUCache<T>
```

**示例**：
```typescript
const cache = createLRUCache<User>({
  maxSize: 100,
  onEvict: (key, value) => {
    console.log('缓存淘汰:', key)
  }
})

cache.set('user:1', userData)
const user = cache.get('user:1')
```

## 新增工具函数

### 数据处理

#### createValidator()

创建数据验证器

```typescript
const validator = createValidator()

// 链式验证
const result = validator
  .required()
  .minLength(3)
  .maxLength(20)
  .pattern(/^[a-zA-Z0-9]+$/)
  .validate('username')

if (!result.valid) {
  console.error('验证失败:', result.errors)
}
```

#### createTransformer()

创建数据转换器

```typescript
const transformer = createTransformer()

const num = transformer.toNumber('123', 0)
const bool = transformer.toBoolean('true')
const snake = transformer.camelToSnake('userName')  // 'user_name'
```

#### createNormalizer()

创建数据规范化器

```typescript
const normalizer = createNormalizer()

const phone = normalizer.normalizePhone('+86 138-0000-0000')  // '13800000000'
const email = normalizer.normalizeEmail('USER@EXAMPLE.COM')    // 'user@example.com'
```

### 异步工具

#### createPromiseQueue()

创建Promise队列

```typescript
const queue = createPromiseQueue()

queue.add(() => api.fetchUser(1))
queue.add(() => api.fetchUser(2))
queue.add(() => api.fetchUser(3))

// 按顺序执行
```

#### createParallelExecutor()

创建并行执行器

```typescript
const executor = createParallelExecutor(3) // 最多3个并发

const tasks = users.map(user => 
  () => api.fetchUserData(user.id)
)

const results = await executor.execute(tasks)
```

#### withTimeout()

添加超时控制

```typescript
try {
  const data = await withTimeout(
    api.fetchData(),
    3000,
    '请求超时'
  )
} catch (error) {
  console.error(error) // '请求超时'
}
```

#### retryWithBackoff()

带指数退避的重试

```typescript
const data = await retryWithBackoff(
  () => api.unstableEndpoint(),
  {
    maxRetries: 3,
    initialDelay: 1000,
    backoffFactor: 2,
    onRetry: (attempt, error) => {
      console.log(`重试第${attempt}次:`, error)
    }
  }
)
```

#### waitUntil()

等待条件满足

```typescript
await waitUntil(
  () => document.querySelector('#app') !== null,
  { timeout: 5000, interval: 100 }
)
```

### 安全工具

#### createTokenManager()

创建Token管理器

```typescript
const tokenManager = createTokenManager()

// 设置Token
tokenManager.setToken('eyJhbGc...', 3600, 'refresh_token')

// 获取有效Token（自动刷新）
const token = await tokenManager.getValidToken()

// 检查是否过期
if (tokenManager.isExpired()) {
  await tokenManager.refresh()
}
```

#### generateUUID()

生成UUID

```typescript
const id = generateUUID()
// 'a3b5c7d9-e1f3-4a5b-8c9d-0e1f2a3b4c5d'
```

#### checkPasswordStrength()

检查密码强度

```typescript
const result = checkPasswordStrength('MyP@ssw0rd123')
console.log(result.strength)  // 'very-strong'
console.log(result.score)     // 4
console.log(result.feedback)  // ['密码强度很好']
```

## 依赖注入

### createDIContainer()

创建依赖注入容器

```typescript
const container = createDIContainer()

// 注册服务
container.register('Logger', Logger, 'singleton')
container.register('UserService', UserService, 'transient', ['Logger'])

// 解析服务
const userService = container.resolve<UserService>('UserService')
```

### Injectable装饰器

标记可注入的类

```typescript
@Injectable('singleton')
class UserService {
  constructor(private logger: Logger) {}
  
  getUser() {
    this.logger.log('Getting user...')
  }
}
```

### Inject装饰器

标记注入的依赖

```typescript
class UserService {
  constructor(
    @Inject('Logger') private logger: any,
    @Inject('Database') private db: any
  ) {}
}
```

## 增强日志

### createAdvancedLogger()

创建增强日志器

```typescript
const logger = createAdvancedLogger()

// 添加传输器
logger.addTransport(new ConsoleTransport())
logger.addTransport(new RemoteTransport('https://api.example.com/logs'))

// 记录日志
logger.info('应用启动', { version: '1.0.0' }, 'App')
logger.error('发生错误', error, 'UserService')
logger.performance('fetchUser', 150, { userId: 123 }, 'API')
```

### 日志格式化器

```typescript
// JSON格式
const jsonFormatter = new JSONFormatter()

// Pretty格式（彩色输出）
const prettyFormatter = new PrettyFormatter()

// Compact格式（节省空间）
const compactFormatter = new CompactFormatter()

const logger = createAdvancedLogger()
logger.addTransport(new ConsoleTransport(prettyFormatter))
```

### 远程日志上传

```typescript
const remoteTransport = new RemoteTransport('https://api.example.com/logs', {
  batchSize: 10,        // 10条批量上传
  flushInterval: 5000,  // 5秒刷新一次
  headers: {
    'Authorization': 'Bearer token'
  }
})

logger.addTransport(remoteTransport)
```

## 错误边界

### createErrorBoundary()

创建错误边界组件

```typescript
const ErrorBoundary = createErrorBoundary({
  strategy: 'fallback',
  maxRetries: 3,
  fallbackComponent: ErrorFallback,
  onError: (error) => {
    console.error('组件错误:', error)
  }
})
```

**使用**：
```vue
<template>
  <ErrorBoundary strategy="fallback">
    <MyComponent />
  </ErrorBoundary>
</template>
```

### createErrorRecoveryManager()

创建错误恢复管理器

```typescript
const recovery = createErrorRecoveryManager()

// 设置恢复策略
recovery.setStrategy('NetworkError', 'retry')
recovery.setStrategy('ValidationError', 'fallback')
recovery.setStrategy('AuthError', 'propagate')

// 获取策略
const strategy = recovery.getStrategy('NetworkError')
```

### createDegradationHandler()

创建降级处理器

```typescript
const degradation = createDegradationHandler()

// 注册降级方案
degradation.register('advanced-search', () => {
  return basicSearch() // 降级到基础搜索
})

// 尝试执行，失败则降级
const result = await degradation.tryOrFallback(
  'advanced-search',
  () => advancedSearch(query)
)
```

## 开发者工具

### createFlamegraph()

创建性能火焰图

```typescript
const flamegraph = createFlamegraph()

// 开始记录
flamegraph.start()

// 标记函数调用
flamegraph.enter('fetchUser')
await api.fetchUser()
flamegraph.exit()

// 生成火焰图
const data = flamegraph.stop()
flamegraph.exportJSON('flamegraph.json')
```

### createMemoryTimeline()

创建内存时间线

```typescript
const timeline = createMemoryTimeline()

// 开始监控（每秒采样）
timeline.start(1000)

// 运行应用...

// 分析趋势
const trend = timeline.analyzeTrend()
console.log('增长率:', trend.growthRate, '%/s')
console.log('预警级别:', trend.warning)

// 检测泄漏
const leak = timeline.detectLeaks()
if (leak.suspected) {
  console.warn('可疑内存泄漏:', leak.reason)
}

// 停止监控
timeline.stop()
```

### createEventFlowVisualizer()

创建事件流可视化器

```typescript
const visualizer = createEventFlowVisualizer()

// 开始记录
visualizer.start()

// 事件触发会自动记录...

// 生成Mermaid图表
const diagram = visualizer.generateMermaidDiagram()
console.log(diagram)

// 获取统计
const stats = visualizer.getStats()
```

## Vue组合式API

### useEngine()

在组件中使用引擎

```typescript
import { useEngine } from '@ldesign/engine/vue'

export default {
  setup() {
    const engine = useEngine()
    
    const user = computed(() => engine.state.get('user'))
    
    function login() {
      engine.events.emit('user:login', userData)
    }
    
    return { user, login }
  }
}
```

### useCache()

使用缓存

```typescript
import { useCache } from '@ldesign/engine/vue'

const { get, set, clear } = useCache()

await set('key', 'value', 60000)
const value = await get('key')
```

### useEvents()

使用事件系统

```typescript
import { useEvents } from '@ldesign/engine/vue'

const { on, emit, off } = useEvents()

on('user:login', (user) => {
  console.log('用户登录:', user)
})

emit('user:login', userData)
```

## 性能监控

### performance.mark()

添加性能标记

```typescript
engine.performance.mark('operation-start')
```

### performance.measure()

测量性能

```typescript
engine.performance.mark('fetch-start')
await fetchData()
engine.performance.mark('fetch-end')

const duration = engine.performance.measure(
  'fetch-duration',
  'fetch-start',
  'fetch-end'
)
console.log('耗时:', duration, 'ms')
```

### performance.getMetrics()

获取性能指标

```typescript
const metrics = engine.performance.getMetrics()
console.log('内存使用:', metrics.memory)
console.log('FPS:', metrics.rendering?.fps)
```

## 类型定义

### Engine

```typescript
interface Engine {
  // 核心管理器
  config: ConfigManager
  logger: Logger
  environment: EnvironmentManager
  lifecycle: LifecycleManager
  
  // 懒加载管理器
  events: EventManager
  state: StateManager
  plugins: PluginManager
  cache: CacheManager
  performance: PerformanceManager
  security: SecurityManager
  
  // 方法
  install(app: App): void
  createApp(component: Component): App
  mount(selector: string | Element): Promise<void>
  unmount(): Promise<void>
  destroy(): Promise<void>
}
```

### EngineConfig

```typescript
interface EngineConfig {
  debug?: boolean
  logger?: {
    level?: LogLevel
  }
  cache?: {
    maxSize?: number
    strategy?: 'lru' | 'lfu' | 'fifo' | 'ttl'
    defaultTTL?: number
  }
  performance?: {
    enabled?: boolean
    budgets?: Record<string, number>
  }
}
```

### Plugin

```typescript
interface Plugin {
  name: string
  version?: string
  dependencies?: string[]
  install: (context: PluginContext) => void | Promise<void>
  uninstall?: (context: PluginContext) => void | Promise<void>
}
```

## 常量

### ENGINE_EVENTS

预定义的引擎事件常量

```typescript
const ENGINE_EVENTS = {
  CREATED: 'engine:created',
  INSTALLED: 'engine:installed',
  MOUNTED: 'engine:mounted',
  UNMOUNTED: 'engine:unmounted',
  DESTROYED: 'engine:destroy',
  ERROR: 'engine:error',
  
  PLUGIN_REGISTERED: 'plugin:registered',
  PLUGIN_UNREGISTERED: 'plugin:unregistered',
  
  STATE_CHANGED: 'state:changed',
  CONFIG_CHANGED: 'config:changed',
  ROUTE_CHANGED: 'route:changed',
  THEME_CHANGED: 'theme:changed',
  LOCALE_CHANGED: 'locale:changed'
}
```

**使用**：
```typescript
import { ENGINE_EVENTS } from '@ldesign/engine'

engine.events.on(ENGINE_EVENTS.PLUGIN_REGISTERED, (data) => {
  console.log('插件已注册:', data.name)
})
```

## 高级用法

### 自定义管理器

```typescript
class MyCustomManager {
  constructor(private engine: Engine) {}
  
  myMethod() {
    // 使用引擎功能
    this.engine.state.set('custom', 'value')
    this.engine.events.emit('custom:event', data)
  }
}

// 注册到引擎
engine.custom = new MyCustomManager(engine)
```

### 插件间通信

```typescript
// 插件A
const pluginA = {
  name: 'plugin-a',
  install: (context) => {
    context.events.on('plugin-b:ready', (data) => {
      console.log('插件B已就绪:', data)
    })
  }
}

// 插件B
const pluginB = {
  name: 'plugin-b',
  dependencies: ['plugin-a'],
  install: (context) => {
    context.events.emit('plugin-b:ready', { version: '1.0.0' })
  }
}
```

### 性能分析

```typescript
// 使用Profile装饰器
class UserService {
  @Profile('fetchUser')
  async fetchUser(id: number) {
    return await api.getUser(id)
  }
}

// 自动输出：[Profile] UserService.fetchUser: 150.23ms
```

---

**版本**: v0.3.1  
**最后更新**: 2025-01-XX  
**相关文档**: [架构文档](./ARCHITECTURE.md) | [快速开始](../README.md)

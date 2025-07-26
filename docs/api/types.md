# 类型定义 API

@ldesign/engine 提供了完整的 TypeScript 类型定义，确保类型安全和良好的开发体验。

## 核心类型

### Engine 核心类型

```typescript
// 引擎配置
interface EngineConfig {
  // 基础配置
  name?: string                    // 引擎名称
  version?: string                 // 引擎版本
  debug?: boolean                  // 调试模式
  
  // 插件配置
  plugins?: PluginConfig[]         // 预加载插件
  autoStart?: boolean              // 自动启动
  
  // 事件配置
  maxListeners?: number            // 最大监听器数量
  eventTimeout?: number            // 事件超时时间
  
  // 中间件配置
  middlewareTimeout?: number       // 中间件超时时间
  
  // 状态配置
  initialState?: Record<string, any>  // 初始状态
  
  // 性能配置
  performanceMonitoring?: boolean  // 性能监控
  memoryLimit?: number            // 内存限制
  
  // 错误处理
  errorHandling?: {
    global?: boolean               // 全局错误处理
    retry?: number                 // 重试次数
    timeout?: number               // 错误超时
  }
}

// 引擎状态
type EngineState = 'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

// 引擎信息
interface EngineInfo {
  name: string
  version: string
  state: EngineState
  uptime: number
  plugins: PluginInfo[]
  events: string[]
  middleware: MiddlewareInfo[]
  performance: PerformanceInfo
}

// 性能信息
interface PerformanceInfo {
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    time: number
  }
  events: {
    total: number
    rate: number
    errors: number
  }
  plugins: {
    active: number
    total: number
    errors: number
  }
}
```

### 插件系统类型

```typescript
// 插件接口
interface Plugin {
  // 基础信息
  name: string
  version: string
  description?: string
  author?: string
  
  // 依赖关系
  dependencies?: string[]          // 依赖的插件
  optionalDependencies?: string[]  // 可选依赖
  conflicts?: string[]             // 冲突的插件
  
  // 生命周期钩子
  install?(engine: Engine, config?: any): void | Promise<void>
  uninstall?(engine: Engine): void | Promise<void>
  start?(engine: Engine): void | Promise<void>
  stop?(engine: Engine): void | Promise<void>
  
  // 配置
  config?: PluginConfig
  
  // 元数据
  metadata?: PluginMetadata
}

// 插件配置
interface PluginConfig {
  enabled?: boolean                // 是否启用
  priority?: number               // 优先级
  lazy?: boolean                  // 懒加载
  singleton?: boolean             // 单例模式
  
  // 自定义配置
  [key: string]: any
}

// 插件元数据
interface PluginMetadata {
  tags?: string[]                 // 标签
  category?: string               // 分类
  homepage?: string               // 主页
  repository?: string             // 仓库地址
  license?: string                // 许可证
  
  // 兼容性
  engineVersion?: string          // 引擎版本要求
  nodeVersion?: string            // Node.js版本要求
  
  // 资源
  assets?: string[]               // 资源文件
  styles?: string[]               // 样式文件
  scripts?: string[]              // 脚本文件
}

// 插件信息
interface PluginInfo {
  name: string
  version: string
  state: PluginState
  config: PluginConfig
  metadata: PluginMetadata
  dependencies: PluginDependency[]
  performance: PluginPerformance
}

// 插件状态
type PluginState = 'uninstalled' | 'installed' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

// 插件依赖
interface PluginDependency {
  name: string
  version: string
  required: boolean
  satisfied: boolean
}

// 插件性能
interface PluginPerformance {
  installTime: number
  startTime: number
  executionTime: number
  memoryUsage: number
  errorCount: number
}

// 插件工厂
type PluginFactory<T = any> = (config?: T) => Plugin

// 插件构造器
type PluginConstructor<T = any> = new (config?: T) => Plugin

// 插件定义
type PluginDefinition<T = any> = Plugin | PluginFactory<T> | PluginConstructor<T>
```

### 事件系统类型

```typescript
// 事件监听器
type EventListener<T = any> = (...args: T[]) => void | Promise<void>

// 事件监听器配置
interface EventListenerConfig {
  once?: boolean                  // 只执行一次
  priority?: number               // 优先级
  timeout?: number                // 超时时间
  condition?: (...args: any[]) => boolean  // 执行条件
}

// 事件上下文
interface EventContext<T = any> {
  event: string                   // 事件名称
  args: T[]                      // 事件参数
  timestamp: number              // 时间戳
  source?: any                   // 事件源
  target?: any                   // 事件目标
  
  // 控制标志
  cancelled?: boolean            // 是否取消
  stopped?: boolean              // 是否停止传播
  
  // 元数据
  metadata?: EventMetadata
}

// 事件元数据
interface EventMetadata {
  id?: string                    // 事件ID
  correlationId?: string         // 关联ID
  userId?: string                // 用户ID
  sessionId?: string             // 会话ID
  
  // 追踪信息
  trace?: {
    spanId: string
    traceId: string
    parentSpanId?: string
  }
  
  // 自定义数据
  [key: string]: any
}

// 事件拦截器
type EventInterceptor<T = any> = (
  context: EventContext<T>,
  next: () => void | Promise<void>
) => void | Promise<void>

// 事件过滤器
type EventFilter<T = any> = (
  event: string,
  ...args: T[]
) => boolean | Promise<boolean>

// 事件转换器
type EventTransformer<T = any, R = any> = (
  event: string,
  args: T[]
) => { event: string; args: R[] } | Promise<{ event: string; args: R[] }>

// 事件发射器选项
interface EventEmitterOptions {
  maxListeners?: number          // 最大监听器数量
  captureRejections?: boolean    // 捕获Promise拒绝
  wildcard?: boolean             // 支持通配符
  delimiter?: string             // 事件分隔符
  newListener?: boolean          // 新监听器事件
  removeListener?: boolean       // 移除监听器事件
  verboseMemoryLeak?: boolean    // 详细内存泄漏警告
}

// 事件统计
interface EventStats {
  totalEvents: number            // 总事件数
  eventTypes: Map<string, number>  // 事件类型统计
  listeners: Map<string, number>   // 监听器统计
  errors: number                 // 错误数量
  performance: {
    averageTime: number          // 平均执行时间
    totalTime: number            // 总执行时间
    slowestEvent: string         // 最慢事件
    fastestEvent: string         // 最快事件
  }
}
```

### 中间件系统类型

```typescript
// 中间件函数
type Middleware<T = any> = (
  context: MiddlewareContext<T>,
  next: NextFunction
) => void | Promise<void>

// 下一步函数
type NextFunction = (error?: Error) => void | Promise<void>

// 中间件上下文
interface MiddlewareContext<T = any> {
  request: T                     // 请求数据
  response?: any                 // 响应数据
  state: Record<string, any>     // 共享状态
  
  // 元数据
  metadata: {
    startTime: number            // 开始时间
    middlewareIndex: number      // 中间件索引
    path: string[]              // 执行路径
    correlationId?: string       // 关联ID
  }
  
  // 工具方法
  set(key: string, value: any): void
  get(key: string): any
  has(key: string): boolean
  delete(key: string): boolean
}

// 中间件配置
interface MiddlewareConfig {
  name?: string                  // 中间件名称
  priority?: number              // 优先级
  timeout?: number               // 超时时间
  retries?: number               // 重试次数
  
  // 执行条件
  condition?: (context: any) => boolean | Promise<boolean>
  
  // 错误处理
  errorHandler?: (error: Error, context: any) => void | Promise<void>
  
  // 缓存配置
  cache?: {
    enabled: boolean
    ttl: number
    key: (context: any) => string
  }
}

// 错误中间件
type ErrorMiddleware<T = any> = (
  error: Error,
  context: MiddlewareContext<T>,
  next: NextFunction
) => void | Promise<void>

// 中间件信息
interface MiddlewareInfo {
  name: string
  middleware: Middleware
  config: MiddlewareConfig
  
  // 统计信息
  stats: {
    executions: number           // 执行次数
    totalTime: number            // 总执行时间
    averageTime: number          // 平均执行时间
    errors: number               // 错误次数
    lastExecution: number        // 最后执行时间
  }
}

// 中间件管道
interface MiddlewarePipeline<T = any> {
  use(middleware: Middleware<T>, config?: MiddlewareConfig): this
  remove(name: string): boolean
  execute(context: T): Promise<T>
  clear(): this
}
```

### 状态管理类型

```typescript
// 状态值类型
type StateValue = any

// 状态变化监听器
type StateChangeListener<T = StateValue> = (
  newValue: T,
  oldValue: T,
  key: string
) => void

// 状态验证器
type StateValidator<T = StateValue> = (value: T, key: string) => boolean | string

// 状态转换器
type StateTransformer<T = StateValue, R = StateValue> = (
  value: T,
  key: string
) => R

// 状态配置
interface StateConfig<T = StateValue> {
  // 验证
  validator?: StateValidator<T>
  
  // 转换
  transformer?: StateTransformer<T>
  
  // 持久化
  persistent?: boolean
  
  // 只读
  readonly?: boolean
  
  // 默认值
  defaultValue?: T
  
  // 元数据
  metadata?: {
    description?: string
    tags?: string[]
    category?: string
  }
}

// 状态管理器接口
interface StateManager {
  // 基础操作
  set<T = StateValue>(key: string, value: T, config?: StateConfig<T>): void
  get<T = StateValue>(key: string): T | undefined
  has(key: string): boolean
  delete(key: string): boolean
  clear(): void
  
  // 批量操作
  setMany(states: Record<string, StateValue>): void
  getMany(keys: string[]): Record<string, StateValue>
  deleteMany(keys: string[]): void
  
  // 监听
  watch<T = StateValue>(key: string, listener: StateChangeListener<T>): () => void
  unwatch(key: string, listener?: StateChangeListener): void
  
  // 计算属性
  computed<T = StateValue>(
    key: string,
    dependencies: string[],
    computer: (...values: any[]) => T
  ): () => void
  
  // 状态快照
  snapshot(): Record<string, StateValue>
  restore(snapshot: Record<string, StateValue>): void
  
  // 状态历史
  history(key: string): StateValue[]
  undo(key: string): boolean
  redo(key: string): boolean
}

// 状态变化事件
interface StateChangeEvent<T = StateValue> {
  type: 'set' | 'delete' | 'clear'
  key: string
  newValue?: T
  oldValue?: T
  timestamp: number
  source?: string
}
```

### 依赖注入类型

```typescript
// 依赖标识符
type DependencyIdentifier = string | symbol | Function

// 依赖作用域
type DependencyScope = 'singleton' | 'transient' | 'scoped'

// 依赖工厂
type DependencyFactory<T = any> = (container: Container) => T

// 依赖配置
interface DependencyConfig<T = any> {
  scope?: DependencyScope        // 作用域
  factory?: DependencyFactory<T> // 工厂函数
  value?: T                      // 直接值
  lazy?: boolean                 // 懒加载
  
  // 生命周期
  onCreate?: (instance: T) => void
  onDestroy?: (instance: T) => void
  
  // 元数据
  metadata?: {
    description?: string
    tags?: string[]
    version?: string
  }
}

// 容器接口
interface Container {
  // 注册
  register<T>(
    identifier: DependencyIdentifier,
    config: DependencyConfig<T>
  ): void
  
  register<T>(
    identifier: DependencyIdentifier,
    factory: DependencyFactory<T>,
    scope?: DependencyScope
  ): void
  
  register<T>(
    identifier: DependencyIdentifier,
    value: T
  ): void
  
  // 解析
  resolve<T>(identifier: DependencyIdentifier): T
  resolveAll<T>(identifier: DependencyIdentifier): T[]
  
  // 检查
  has(identifier: DependencyIdentifier): boolean
  
  // 移除
  unregister(identifier: DependencyIdentifier): boolean
  
  // 清理
  clear(): void
  
  // 子容器
  createChild(): Container
}

// 注入装饰器
type InjectDecorator = (identifier: DependencyIdentifier) => PropertyDecorator

// 可注入装饰器
type InjectableDecorator = (config?: DependencyConfig) => ClassDecorator
```

### 错误处理类型

```typescript
// 引擎错误基类
abstract class EngineError extends Error {
  abstract readonly code: string
  abstract readonly category: ErrorCategory
  
  constructor(
    message: string,
    public readonly context?: any,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

// 错误分类
type ErrorCategory = 
  | 'plugin'
  | 'event'
  | 'middleware'
  | 'state'
  | 'dependency'
  | 'configuration'
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'system'

// 插件错误
class PluginError extends EngineError {
  readonly code = 'PLUGIN_ERROR'
  readonly category = 'plugin' as const
  
  constructor(
    message: string,
    public readonly pluginName: string,
    context?: any,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

// 事件错误
class EventError extends EngineError {
  readonly code = 'EVENT_ERROR'
  readonly category = 'event' as const
  
  constructor(
    message: string,
    public readonly eventName: string,
    context?: any,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

// 中间件错误
class MiddlewareError extends EngineError {
  readonly code = 'MIDDLEWARE_ERROR'
  readonly category = 'middleware' as const
  
  constructor(
    message: string,
    public readonly middlewareName: string,
    context?: any,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

// 状态错误
class StateError extends EngineError {
  readonly code = 'STATE_ERROR'
  readonly category = 'state' as const
  
  constructor(
    message: string,
    public readonly stateKey: string,
    context?: any,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

// 验证错误
class ValidationError extends EngineError {
  readonly code = 'VALIDATION_ERROR'
  readonly category = 'validation' as const
  
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any,
    context?: any,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

// 配置错误
class ConfigurationError extends EngineError {
  readonly code = 'CONFIGURATION_ERROR'
  readonly category = 'configuration' as const
  
  constructor(
    message: string,
    public readonly configKey: string,
    context?: any,
    cause?: Error
  ) {
    super(message, context, cause)
  }
}

// 错误处理器
type ErrorHandler = (error: EngineError, context?: any) => void | Promise<void>

// 错误恢复策略
type ErrorRecoveryStrategy = (
  error: EngineError,
  context?: any
) => boolean | Promise<boolean>

// 错误报告
interface ErrorReport {
  error: EngineError
  timestamp: number
  context?: any
  stackTrace: string
  
  // 环境信息
  environment: {
    nodeVersion: string
    engineVersion: string
    platform: string
    memory: number
    uptime: number
  }
  
  // 相关信息
  related?: {
    events: string[]
    plugins: string[]
    middleware: string[]
    state: Record<string, any>
  }
}
```

### 工具类型

```typescript
// 深度只读
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// 深度部分
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 可选键
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

// 必需键
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

// 函数参数
type FunctionArgs<T> = T extends (...args: infer A) => any ? A : never

// 函数返回值
type FunctionReturn<T> = T extends (...args: any[]) => infer R ? R : never

// Promise值
type PromiseValue<T> = T extends Promise<infer V> ? V : T

// 数组元素
type ArrayElement<T> = T extends (infer E)[] ? E : never

// 键值对
type KeyValuePair<T> = {
  [K in keyof T]: {
    key: K
    value: T[K]
  }
}[keyof T]

// 联合转交集
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

// 排除空值
type NonNullable<T> = T extends null | undefined ? never : T

// 提取方法
type Methods<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T]

// 提取属性
type Properties<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]
```

### 配置类型

```typescript
// 日志级别
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

// 日志配置
interface LogConfig {
  level: LogLevel
  format?: 'json' | 'text'
  output?: 'console' | 'file' | 'both'
  file?: {
    path: string
    maxSize: number
    maxFiles: number
    compress: boolean
  }
  
  // 过滤器
  filters?: {
    include?: string[]
    exclude?: string[]
  }
  
  // 格式化
  formatter?: (log: LogEntry) => string
}

// 日志条目
interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  context?: any
  
  // 元数据
  metadata?: {
    source?: string
    category?: string
    correlationId?: string
    userId?: string
    sessionId?: string
  }
}

// 缓存配置
interface CacheConfig {
  // 基础配置
  ttl?: number                   // 生存时间
  maxSize?: number               // 最大大小
  maxAge?: number                // 最大年龄
  
  // 策略
  strategy?: 'lru' | 'lfu' | 'fifo' | 'lifo'
  
  // 存储
  storage?: 'memory' | 'redis' | 'file'
  
  // 序列化
  serializer?: {
    serialize: (value: any) => string
    deserialize: (value: string) => any
  }
  
  // 事件
  onHit?: (key: string, value: any) => void
  onMiss?: (key: string) => void
  onExpire?: (key: string, value: any) => void
}

// 网络配置
interface NetworkConfig {
  // 超时
  timeout?: number
  
  // 重试
  retry?: {
    attempts: number
    delay: number
    backoff: 'linear' | 'exponential'
  }
  
  // 代理
  proxy?: {
    host: string
    port: number
    auth?: {
      username: string
      password: string
    }
  }
  
  // 头部
  headers?: Record<string, string>
  
  // 拦截器
  interceptors?: {
    request?: (config: any) => any
    response?: (response: any) => any
    error?: (error: any) => any
  }
}

// 安全配置
interface SecurityConfig {
  // 认证
  authentication?: {
    type: 'jwt' | 'oauth' | 'basic' | 'custom'
    config: any
  }
  
  // 授权
  authorization?: {
    roles: string[]
    permissions: string[]
    rules: AuthorizationRule[]
  }
  
  // 加密
  encryption?: {
    algorithm: string
    key: string
    iv?: string
  }
  
  // CORS
  cors?: {
    origin: string | string[]
    methods: string[]
    headers: string[]
    credentials: boolean
  }
  
  // CSP
  csp?: {
    directives: Record<string, string[]>
  }
}

// 授权规则
interface AuthorizationRule {
  resource: string
  action: string
  condition?: (context: any) => boolean
}
```

### 扩展类型

```typescript
// 模块声明扩展
declare module '@ldesign/engine' {
  interface Engine {
    // 自定义方法
    customMethod?(): void
  }
  
  interface EngineConfig {
    // 自定义配置
    customConfig?: any
  }
  
  interface Plugin {
    // 自定义插件属性
    customProperty?: any
  }
}

// 全局类型扩展
declare global {
  namespace LDesignEngine {
    interface CustomEvents {
      'custom:event': [data: any]
    }
    
    interface CustomState {
      customKey: any
    }
    
    interface CustomMiddleware {
      customMiddleware: any
    }
  }
}

// 类型守卫
type TypeGuard<T> = (value: any) => value is T

// 常用类型守卫
const isString: TypeGuard<string> = (value): value is string => 
  typeof value === 'string'

const isNumber: TypeGuard<number> = (value): value is number => 
  typeof value === 'number' && !isNaN(value)

const isObject: TypeGuard<object> = (value): value is object => 
  value !== null && typeof value === 'object'

const isArray: TypeGuard<any[]> = (value): value is any[] => 
  Array.isArray(value)

const isFunction: TypeGuard<Function> = (value): value is Function => 
  typeof value === 'function'

const isPromise: TypeGuard<Promise<any>> = (value): value is Promise<any> => 
  value && typeof value.then === 'function'

// 类型断言
type TypeAssertion<T> = (value: any, message?: string) => asserts value is T

// 常用类型断言
const assertString: TypeAssertion<string> = (value, message = 'Expected string') => {
  if (!isString(value)) {
    throw new TypeError(message)
  }
}

const assertNumber: TypeAssertion<number> = (value, message = 'Expected number') => {
  if (!isNumber(value)) {
    throw new TypeError(message)
  }
}

const assertObject: TypeAssertion<object> = (value, message = 'Expected object') => {
  if (!isObject(value)) {
    throw new TypeError(message)
  }
}
```

### 使用示例

```typescript
// 创建类型安全的引擎
const engine = new Engine<{
  // 自定义事件类型
  events: {
    'user:login': [user: { id: number; name: string }]
    'data:update': [data: any, source: string]
    'error:occurred': [error: Error, context: any]
  }
  
  // 自定义状态类型
  state: {
    user: { id: number; name: string } | null
    settings: Record<string, any>
    cache: Map<string, any>
  }
  
  // 自定义中间件上下文
  middleware: {
    request: {
      path: string
      method: string
      headers: Record<string, string>
      body?: any
    }
    response: {
      status: number
      headers: Record<string, string>
      body?: any
    }
  }
}>({
  name: 'MyEngine',
  version: '1.0.0',
  debug: true
})

// 类型安全的事件监听
engine.on('user:login', (user) => {
  // user 类型为 { id: number; name: string }
  console.log(`用户 ${user.name} 已登录`)
})

// 类型安全的状态管理
engine.setState('user', { id: 1, name: 'John' })
const user = engine.getState('user') // 类型为 { id: number; name: string } | null

// 类型安全的中间件
engine.middleware((context, next) => {
  // context.request 类型已知
  console.log(`${context.request.method} ${context.request.path}`)
  next()
})

// 类型安全的插件
const myPlugin: Plugin = {
  name: 'MyPlugin',
  version: '1.0.0',
  
  install(engine) {
    // engine 类型已知
    engine.on('user:login', (user) => {
      console.log('插件处理用户登录:', user.name)
    })
  }
}

engine.use(myPlugin)
```

这个类型定义文档提供了 @ldesign/engine 的完整 TypeScript 类型系统，确保开发者能够享受到完整的类型安全和智能提示功能。
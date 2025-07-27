# 事件系统 API

@ldesign/engine 提供了强大的事件系统，支持同步和异步事件处理、事件拦截、优先级控制和错误处理等高级功能。

## 核心接口

### EventEmitter 接口

```typescript
interface EventEmitter {
  // 基础事件方法
  on: (event: string, listener: EventListener) => this
  off: (event: string, listener?: EventListener) => this
  once: (event: string, listener: EventListener) => this
  emit: (event: string, ...args: any[]) => boolean
  emitAsync: (event: string, ...args: any[]) => Promise<any[]>

  // 高级事件方法
  prependListener: (event: string, listener: EventListener) => this
  prependOnceListener: (event: string, listener: EventListener) => this
  removeAllListeners: (event?: string) => this

  // 事件信息
  listeners: (event: string) => EventListener[]
  listenerCount: (event: string) => number
  eventNames: () => string[]

  // 配置方法
  setMaxListeners: (n: number) => this
  getMaxListeners: () => number
}
```

### 事件监听器类型

```typescript
// 基础监听器
type EventListener = (...args: any[]) => void | Promise<void>

// 带优先级的监听器
interface PriorityEventListener {
  listener: EventListener
  priority: number
  once?: boolean
}

// 事件拦截器
type EventInterceptor = (
  event: string,
  args: any[],
  next: () => void
) => void | Promise<void>

// 事件过滤器
type EventFilter = (event: string, ...args: any[]) => boolean
```

### 事件上下文

```typescript
interface EventContext {
  event: string // 事件名称
  args: any[] // 事件参数
  timestamp: number // 触发时间戳
  source?: any // 事件源
  target?: any // 事件目标
  cancelled?: boolean // 是否已取消
  stopped?: boolean // 是否停止传播
}
```

## 基础事件操作

### 注册事件监听器

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine()

// 基础事件监听
engine.on('user:login', (user) => {
  console.log('用户登录:', user.name)
})

// 异步事件监听
engine.on('data:save', async (data) => {
  await saveToDatabase(data)
  console.log('数据已保存')
})

// 一次性事件监听
engine.once('app:ready', () => {
  console.log('应用已准备就绪')
})

// 多个事件监听
const events = ['user:login', 'user:logout', 'user:update']
events.forEach((event) => {
  engine.on(event, (user) => {
    console.log(`用户事件: ${event}`, user)
  })
})

// 使用箭头函数
engine.on('error', (error) => {
  console.error('发生错误:', error.message)
})
```

### 触发事件

```typescript
// 同步触发事件
const handled = engine.emit('user:login', {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
})

if (handled) {
  console.log('登录事件已被处理')
}

// 异步触发事件
const results = await engine.emitAsync('data:process', {
  type: 'user-data',
  payload: userData
})

console.log('处理结果:', results)

// 触发多个参数的事件
engine.emit('notification:send', 'Hello', 'World', { urgent: true })

// 条件性触发事件
if (user.isActive) {
  engine.emit('user:active', user)
}
```

### 移除事件监听器

```typescript
// 定义监听器函数
function userLoginHandler(user) {
  console.log('用户登录处理:', user.name)
}

// 注册监听器
engine.on('user:login', userLoginHandler)

// 移除特定监听器
engine.off('user:login', userLoginHandler)

// 移除所有监听器
engine.off('user:login')

// 移除所有事件的监听器
engine.removeAllListeners()

// 移除特定事件的所有监听器
engine.removeAllListeners('user:login')
```

## 高级事件功能

### 事件优先级

```typescript
// 扩展引擎以支持优先级
class PriorityEventEngine extends Engine {
  private priorityListeners = new Map<string, PriorityEventListener[]>()

  onWithPriority(
    event: string,
    listener: EventListener,
    priority: number = 0
  ): this {
    if (!this.priorityListeners.has(event)) {
      this.priorityListeners.set(event, [])
    }

    const listeners = this.priorityListeners.get(event)!
    listeners.push({ listener, priority })

    // 按优先级排序（高优先级先执行）
    listeners.sort((a, b) => b.priority - a.priority)

    return this
  }

  emit(event: string, ...args: any[]): boolean {
    const priorityListeners = this.priorityListeners.get(event)

    if (priorityListeners) {
      for (const { listener } of priorityListeners) {
        try {
          listener(...args)
        }
 catch (error) {
          this.emit('error', error, { event, args })
        }
      }
    }

    // 调用父类方法处理普通监听器
    return super.emit(event, ...args)
  }
}

// 使用优先级事件
const engine = new PriorityEventEngine()

// 高优先级监听器（先执行）
engine.onWithPriority('data:process', (data) => {
  console.log('高优先级处理:', data)
}, 10)

// 普通优先级监听器
engine.onWithPriority('data:process', (data) => {
  console.log('普通处理:', data)
}, 0)

// 低优先级监听器（后执行）
engine.onWithPriority('data:process', (data) => {
  console.log('低优先级处理:', data)
}, -10)
```

### 事件拦截和修改

```typescript
class InterceptableEventEngine extends Engine {
  private interceptors = new Map<string, EventInterceptor[]>()

  intercept(event: string, interceptor: EventInterceptor): this {
    if (!this.interceptors.has(event)) {
      this.interceptors.set(event, [])
    }

    this.interceptors.get(event)!.push(interceptor)
    return this
  }

  async emit(event: string, ...args: any[]): Promise<boolean> {
    const interceptors = this.interceptors.get(event) || []

    // 创建事件上下文
    const context: EventContext = {
      event,
      args,
      timestamp: Date.now(),
      cancelled: false,
      stopped: false
    }

    // 执行拦截器
    for (const interceptor of interceptors) {
      if (context.cancelled)
break

      await new Promise<void>((resolve) => {
        interceptor(event, context.args, resolve)
      })
    }

    // 如果事件被取消，不继续执行
    if (context.cancelled) {
      return false
    }

    // 使用可能被修改的参数触发事件
    return super.emit(event, ...context.args)
  }
}

// 使用事件拦截
const engine = new InterceptableEventEngine()

// 数据验证拦截器
engine.intercept('user:create', (event, args, next) => {
  const [userData] = args

  // 验证用户数据
  if (!userData.email || !userData.name) {
    console.error('用户数据验证失败')
    return // 不调用 next()，阻止事件继续
  }

  // 数据清理
  userData.email = userData.email.toLowerCase().trim()
  userData.name = userData.name.trim()

  console.log('用户数据验证通过')
  next() // 继续执行
})

// 日志拦截器
engine.intercept('user:create', (event, args, next) => {
  console.log(`事件拦截: ${event}`, args)
  next()
})
```

### 事件命名空间

```typescript
class NamespacedEventEngine extends Engine {
  private namespaces = new Map<string, Set<string>>()

  // 注册命名空间事件
  onNamespace(namespace: string, event: string, listener: EventListener): this {
    const fullEvent = `${namespace}:${event}`

    if (!this.namespaces.has(namespace)) {
      this.namespaces.set(namespace, new Set())
    }

    this.namespaces.get(namespace)!.add(fullEvent)
    return this.on(fullEvent, listener)
  }

  // 触发命名空间事件
  emitNamespace(namespace: string, event: string, ...args: any[]): boolean {
    return this.emit(`${namespace}:${event}`, ...args)
  }

  // 移除命名空间的所有事件
  removeNamespace(namespace: string): this {
    const events = this.namespaces.get(namespace)
    if (events) {
      events.forEach(event => this.removeAllListeners(event))
      this.namespaces.delete(namespace)
    }
    return this
  }

  // 获取命名空间的所有事件
  getNamespaceEvents(namespace: string): string[] {
    const events = this.namespaces.get(namespace)
    return events ? Array.from(events) : []
  }
}

// 使用命名空间事件
const engine = new NamespacedEventEngine()

// 用户相关事件
engine.onNamespace('user', 'login', (user) => {
  console.log('用户登录:', user)
})

engine.onNamespace('user', 'logout', (user) => {
  console.log('用户登出:', user)
})

// 系统相关事件
engine.onNamespace('system', 'start', () => {
  console.log('系统启动')
})

engine.onNamespace('system', 'stop', () => {
  console.log('系统停止')
})

// 触发命名空间事件
engine.emitNamespace('user', 'login', { id: 1, name: 'John' })
engine.emitNamespace('system', 'start')

// 移除整个命名空间
engine.removeNamespace('user')
```

### 事件过滤

```typescript
class FilterableEventEngine extends Engine {
  private filters = new Map<string, EventFilter[]>()

  // 添加事件过滤器
  filter(event: string, filter: EventFilter): this {
    if (!this.filters.has(event)) {
      this.filters.set(event, [])
    }

    this.filters.get(event)!.push(filter)
    return this
  }

  emit(event: string, ...args: any[]): boolean {
    const filters = this.filters.get(event) || []

    // 检查所有过滤器
    for (const filter of filters) {
      if (!filter(event, ...args)) {
        console.log(`事件 ${event} 被过滤器阻止`)
        return false
      }
    }

    return super.emit(event, ...args)
  }
}

// 使用事件过滤
const engine = new FilterableEventEngine()

// 添加用户权限过滤器
engine.filter('admin:action', (event, action, user) => {
  return user && user.role === 'admin'
})

// 添加时间过滤器
engine.filter('business:operation', (event, data) => {
  const now = new Date()
  const hour = now.getHours()
  return hour >= 9 && hour <= 17 // 只在工作时间执行
})

// 添加数据验证过滤器
engine.filter('data:save', (event, data) => {
  return data && typeof data === 'object' && Object.keys(data).length > 0
})

// 监听事件
engine.on('admin:action', (action, user) => {
  console.log(`管理员操作: ${action}`, user)
})

// 触发事件（会被过滤）
engine.emit('admin:action', 'delete-user', { role: 'user' }) // 被阻止
engine.emit('admin:action', 'delete-user', { role: 'admin' }) // 通过
```

## 事件模式和最佳实践

### 事件聚合器模式

```typescript
class EventAggregator {
  private engine: Engine
  private subscriptions = new Map<string, Set<EventListener>>()

  constructor(engine: Engine) {
    this.engine = engine
  }

  // 订阅事件
  subscribe(event: string, handler: EventListener): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set())

      // 首次订阅时注册引擎监听器
      this.engine.on(event, this.createAggregateHandler(event))
    }

    this.subscriptions.get(event)!.add(handler)

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(event, handler)
    }
  }

  // 取消订阅
  unsubscribe(event: string, handler: EventListener): void {
    const handlers = this.subscriptions.get(event)
    if (handlers) {
      handlers.delete(handler)

      // 如果没有订阅者了，移除引擎监听器
      if (handlers.size === 0) {
        this.subscriptions.delete(event)
        this.engine.off(event)
      }
    }
  }

  // 发布事件
  publish(event: string, ...args: any[]): void {
    this.engine.emit(event, ...args)
  }

  private createAggregateHandler(event: string) {
    return (...args: any[]) => {
      const handlers = this.subscriptions.get(event)
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(...args)
          }
 catch (error) {
            console.error(`事件处理器错误 (${event}):`, error)
          }
        })
      }
    }
  }
}

// 使用事件聚合器
const engine = new Engine()
const aggregator = new EventAggregator(engine)

// 订阅事件
const unsubscribe1 = aggregator.subscribe('user:login', (user) => {
  console.log('处理器1: 用户登录', user)
})

const unsubscribe2 = aggregator.subscribe('user:login', (user) => {
  console.log('处理器2: 用户登录', user)
})

// 发布事件
aggregator.publish('user:login', { id: 1, name: 'John' })

// 取消订阅
unsubscribe1()
unsubscribe2()
```

### 事件总线模式

```typescript
class EventBus {
  private static instance: EventBus
  private engine: Engine

  private constructor() {
    this.engine = new Engine()
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  // 注册模块
  registerModule(moduleName: string, module: any): void {
    // 自动注册模块的事件处理器
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(module))

    methods.forEach((method) => {
      if (method.startsWith('on') && typeof module[method] === 'function') {
        const eventName = this.methodToEventName(method)
        this.engine.on(`${moduleName}:${eventName}`, module[method].bind(module))
      }
    })
  }

  // 发送消息
  send(target: string, event: string, ...args: any[]): void {
    this.engine.emit(`${target}:${event}`, ...args)
  }

  // 广播消息
  broadcast(event: string, ...args: any[]): void {
    this.engine.emit(`broadcast:${event}`, ...args)
  }

  private methodToEventName(methodName: string): string {
    // 将 onUserLogin 转换为 user-login
    return methodName
      .slice(2) // 移除 'on'
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .slice(1) // 移除开头的 '-'
  }
}

// 定义模块
class UserModule {
  onUserLogin(user: any) {
    console.log('用户模块: 用户登录', user)
  }

  onUserLogout(user: any) {
    console.log('用户模块: 用户登出', user)
  }
}

class NotificationModule {
  onUserLogin(user: any) {
    console.log('通知模块: 发送登录通知', user)
  }

  onBroadcastMessage(message: string) {
    console.log('通知模块: 广播消息', message)
  }
}

// 使用事件总线
const eventBus = EventBus.getInstance()
const userModule = new UserModule()
const notificationModule = new NotificationModule()

// 注册模块
eventBus.registerModule('user', userModule)
eventBus.registerModule('notification', notificationModule)

// 发送消息
eventBus.send('user', 'user-login', { id: 1, name: 'John' })
eventBus.send('notification', 'user-login', { id: 1, name: 'John' })

// 广播消息
eventBus.broadcast('message', 'Hello everyone!')
```

### 事件重放和历史

```typescript
class EventHistory {
  private events: Array<{
    event: string
    args: any[]
    timestamp: number
    id: string
  }> = []

  private maxEvents = 1000

  record(event: string, args: any[]): string {
    const id = this.generateId()

    this.events.push({
      event,
      args,
      timestamp: Date.now(),
      id
    })

    // 保持历史记录在限制范围内
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    return id
  }

  replay(engine: Engine, filter?: (event: any) => boolean): void {
    const eventsToReplay = filter ? this.events.filter(filter) : this.events

    eventsToReplay.forEach(({ event, args }) => {
      engine.emit(event, ...args)
    })
  }

  getEvents(since?: number): any[] {
    if (since) {
      return this.events.filter(e => e.timestamp >= since)
    }
    return [...this.events]
  }

  clear(): void {
    this.events = []
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}

class ReplayableEventEngine extends Engine {
  private history = new EventHistory()

  emit(event: string, ...args: any[]): boolean {
    // 记录事件
    this.history.record(event, args)

    // 触发事件
    return super.emit(event, ...args)
  }

  replay(filter?: (event: any) => boolean): void {
    this.history.replay(this, filter)
  }

  getEventHistory(since?: number): any[] {
    return this.history.getEvents(since)
  }

  clearHistory(): void {
    this.history.clear()
  }
}

// 使用事件重放
const engine = new ReplayableEventEngine()

// 注册监听器
engine.on('user:action', (action, user) => {
  console.log(`用户操作: ${action}`, user)
})

// 触发一些事件
engine.emit('user:action', 'login', { id: 1, name: 'John' })
engine.emit('user:action', 'view-page', { id: 1, name: 'John' })
engine.emit('user:action', 'logout', { id: 1, name: 'John' })

// 重放所有事件
console.log('重放所有事件:')
engine.replay()

// 重放特定事件
console.log('重放登录事件:')
engine.replay(event => event.args[0] === 'login')

// 获取事件历史
const history = engine.getEventHistory()
console.log('事件历史:', history)
```

## 错误处理和调试

### 事件错误处理

```typescript
class RobustEventEngine extends Engine {
  private errorHandlers = new Map<string, Array<(error: Error, context: any) => void>>()

  // 注册错误处理器
  onError(event: string, handler: (error: Error, context: any) => void): this {
    if (!this.errorHandlers.has(event)) {
      this.errorHandlers.set(event, [])
    }

    this.errorHandlers.get(event)!.push(handler)
    return this
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.listeners(event)

    if (listeners.length === 0) {
      return false
    }

    let hasError = false

    listeners.forEach((listener) => {
      try {
        listener(...args)
      }
 catch (error) {
        hasError = true
        this.handleEventError(event, error, { args, listener })
      }
    })

    return !hasError
  }

  private handleEventError(event: string, error: Error, context: any): void {
    // 触发通用错误事件
    super.emit('error', error, { event, ...context })

    // 触发特定事件的错误处理器
    const handlers = this.errorHandlers.get(event) || []
    handlers.forEach((handler) => {
      try {
        handler(error, context)
      }
 catch (handlerError) {
        console.error('错误处理器本身发生错误:', handlerError)
      }
    })
  }
}

// 使用错误处理
const engine = new RobustEventEngine()

// 注册全局错误处理
engine.on('error', (error, context) => {
  console.error('全局错误处理:', error.message)
  console.error('错误上下文:', context)
})

// 注册特定事件的错误处理
engine.onError('data:process', (error, context) => {
  console.error('数据处理错误:', error.message)
  // 可以进行错误恢复或重试
})

// 注册可能出错的监听器
engine.on('data:process', (data) => {
  if (!data) {
    throw new Error('数据不能为空')
  }
  // 处理数据
})

// 触发事件
engine.emit('data:process', null) // 会触发错误
```

### 事件调试工具

```typescript
class DebuggableEventEngine extends Engine {
  private debug = false
  private eventLog: Array<{
    type: 'emit' | 'listen' | 'unlisten'
    event: string
    timestamp: number
    details?: any
  }> = []

  enableDebug(): this {
    this.debug = true
    return this
  }

  disableDebug(): this {
    this.debug = false
    return this
  }

  on(event: string, listener: EventListener): this {
    if (this.debug) {
      this.log('listen', event, { listenerCount: this.listenerCount(event) + 1 })
    }

    return super.on(event, listener)
  }

  off(event: string, listener?: EventListener): this {
    if (this.debug) {
      this.log('unlisten', event, {
        listenerCount: listener ? this.listenerCount(event) - 1 : 0
      })
    }

    return super.off(event, listener)
  }

  emit(event: string, ...args: any[]): boolean {
    if (this.debug) {
      this.log('emit', event, {
        args,
        listenerCount: this.listenerCount(event)
      })
    }

    return super.emit(event, ...args)
  }

  private log(type: string, event: string, details?: any): void {
    const logEntry = {
      type: type as 'emit' | 'listen' | 'unlisten',
      event,
      timestamp: Date.now(),
      details
    }

    this.eventLog.push(logEntry)

    console.log(`[EventDebug] ${type.toUpperCase()}: ${event}`, details)
  }

  getEventLog(): any[] {
    return [...this.eventLog]
  }

  clearEventLog(): void {
    this.eventLog = []
  }

  // 事件统计
  getEventStats(): any {
    const stats = {
      totalEvents: this.eventLog.length,
      eventTypes: new Map<string, number>(),
      mostActiveEvents: new Map<string, number>()
    }

    this.eventLog.forEach((log) => {
      // 统计操作类型
      const count = stats.eventTypes.get(log.type) || 0
      stats.eventTypes.set(log.type, count + 1)

      // 统计事件频率
      if (log.type === 'emit') {
        const eventCount = stats.mostActiveEvents.get(log.event) || 0
        stats.mostActiveEvents.set(log.event, eventCount + 1)
      }
    })

    return stats
  }
}

// 使用调试功能
const engine = new DebuggableEventEngine()
engine.enableDebug()

// 注册监听器
engine.on('test:event', (data) => {
  console.log('处理测试事件:', data)
})

// 触发事件
engine.emit('test:event', { message: 'Hello' })
engine.emit('test:event', { message: 'World' })

// 查看统计信息
console.log('事件统计:', engine.getEventStats())

// 查看事件日志
console.log('事件日志:', engine.getEventLog())
```

## 性能优化

### 事件池化

```typescript
class PooledEventEngine extends Engine {
  private eventPool: any[] = []
  private maxPoolSize = 100

  emit(event: string, ...args: any[]): boolean {
    // 从池中获取事件对象
    const eventObj = this.getEventFromPool()
    eventObj.name = event
    eventObj.args = args
    eventObj.timestamp = Date.now()

    const result = this.processEvent(eventObj)

    // 将事件对象返回池中
    this.returnEventToPool(eventObj)

    return result
  }

  private getEventFromPool(): any {
    if (this.eventPool.length > 0) {
      return this.eventPool.pop()
    }

    return {
      name: '',
      args: [],
      timestamp: 0
    }
  }

  private returnEventToPool(eventObj: any): void {
    if (this.eventPool.length < this.maxPoolSize) {
      // 清理对象
      eventObj.name = ''
      eventObj.args = []
      eventObj.timestamp = 0

      this.eventPool.push(eventObj)
    }
  }

  private processEvent(eventObj: any): boolean {
    return super.emit(eventObj.name, ...eventObj.args)
  }
}
```

### 批量事件处理

```typescript
class BatchEventEngine extends Engine {
  private batchQueue: Array<{ event: string, args: any[] }> = []
  private batchSize = 10
  private batchTimeout = 100
  private batchTimer: NodeJS.Timeout | null = null

  emitBatch(event: string, ...args: any[]): void {
    this.batchQueue.push({ event, args })

    if (this.batchQueue.length >= this.batchSize) {
      this.processBatch()
    }
 else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch()
      }, this.batchTimeout)
    }
  }

  private processBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    const batch = this.batchQueue.splice(0)

    if (batch.length > 0) {
      // 触发批量处理事件
      this.emit('batch:process', batch)

      // 逐个处理事件
      batch.forEach(({ event, args }) => {
        this.emit(event, ...args)
      })
    }
  }

  flushBatch(): void {
    this.processBatch()
  }
}

// 使用批量处理
const engine = new BatchEventEngine()

// 监听批量处理事件
engine.on('batch:process', (batch) => {
  console.log(`处理批量事件，数量: ${batch.length}`)
})

// 监听单个事件
engine.on('user:action', (action, user) => {
  console.log(`用户操作: ${action}`, user)
})

// 批量发送事件
for (let i = 0; i < 15; i++) {
  engine.emitBatch('user:action', 'click', { id: i })
}

// 手动刷新批量
engine.flushBatch()
```

这个事件系统 API 文档提供了完整的事件处理功能，包括基础操作、高级功能、设计模式、错误处理和性能优化等方面的详细说明和示例代码。

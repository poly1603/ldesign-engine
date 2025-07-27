# 事件系统

事件系统是 @ldesign/engine 的核心通信机制，它提供了一种松耦合的方式让不同组件之间进行交互。本章将详细介绍事件系统的使用方法和最佳实践。

## 事件基础

### 基本概念

事件系统基于发布-订阅模式，包含以下核心概念：

- **事件发布者 (Publisher)**：发布事件的组件
- **事件订阅者 (Subscriber)**：监听和处理事件的组件
- **事件 (Event)**：包含事件名称和数据的消息
- **事件总线 (Event Bus)**：管理事件分发的中心组件

### 基本用法

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 监听事件
engine.on('user:login', (userData) => {
  console.log('用户登录:', userData)
})

// 发布事件
engine.emit('user:login', {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com'
})
```

## 事件类型

### 1. 同步事件

同步事件会立即执行所有监听器，适用于简单的通知场景。

```typescript
// 发布同步事件
engine.emit('data:updated', { id: 1, value: 'new value' })

// 监听同步事件
engine.on('data:updated', (data) => {
  console.log('数据更新:', data)
  updateUI(data)
})

// 一次性监听
engine.once('app:ready', () => {
  console.log('应用已准备就绪')
  initializeFeatures()
})
```

### 2. 异步事件

异步事件允许监听器返回 Promise，适用于需要等待异步操作完成的场景。

```typescript
// 发布异步事件
await engine.emitAsync('file:upload', fileData)

// 监听异步事件
engine.on('file:upload', async (fileData) => {
  console.log('开始上传文件:', fileData.name)

  try {
    const result = await uploadToServer(fileData)
    console.log('文件上传成功:', result)
    return result
  }
 catch (error) {
    console.error('文件上传失败:', error)
    throw error
  }
})

// 处理异步事件结果
try {
  const results = await engine.emitAsync('file:upload', fileData)
  console.log('所有上传操作完成:', results)
}
 catch (error) {
  console.error('上传过程中出现错误:', error)
}
```

### 3. 可拦截事件

可拦截事件允许监听器修改事件数据或阻止事件继续传播。

```typescript
// 拦截并修改事件数据
engine.intercept('message:send', (message) => {
  // 添加时间戳
  return {
    ...message,
    timestamp: Date.now(),
    id: generateId()
  }
})

// 拦截并验证数据
engine.intercept('user:create', (userData) => {
  if (!userData.email || !userData.name) {
    throw new Error('用户数据不完整')
  }

  // 数据清理
  return {
    ...userData,
    email: userData.email.toLowerCase().trim(),
    name: userData.name.trim()
  }
})

// 发布可拦截事件
try {
  const processedMessage = await engine.emitInterceptable('message:send', {
    content: 'Hello World',
    recipient: 'user@example.com'
  })

  console.log('处理后的消息:', processedMessage)
  // { content: 'Hello World', recipient: 'user@example.com', timestamp: 1234567890, id: 'msg_123' }
}
 catch (error) {
  console.error('消息处理失败:', error)
}
```

### 4. 条件事件

条件事件只在满足特定条件时才会触发监听器。

```typescript
// 条件监听
engine.onIf('user:action', actionData => actionData.type === 'important', // 条件
  (actionData) => {
    console.log('重要操作:', actionData)
    logImportantAction(actionData)
  })

// 发布事件
engine.emit('user:action', { type: 'normal', action: 'click' }) // 不会触发
engine.emit('user:action', { type: 'important', action: 'delete' }) // 会触发
```

## 事件监听器管理

### 添加监听器

```typescript
// 基本监听
engine.on('event:name', handler)

// 一次性监听
engine.once('event:name', handler)

// 带选项的监听
engine.on('event:name', handler, {
  priority: 100, // 优先级（数字越大越先执行）
  once: false, // 是否只执行一次
  async: true, // 是否异步执行
  timeout: 5000, // 超时时间（毫秒）
  context: this, // 执行上下文
  filter: data => data.important // 过滤条件
})

// 使用装饰器（如果支持）
class MyComponent {
  @EventListener('user:login')
  onUserLogin(userData: UserData) {
    console.log('用户登录:', userData)
  }

  @EventListener('data:update', { priority: 50 })
  onDataUpdate(data: any) {
    this.updateView(data)
  }
}
```

### 移除监听器

```typescript
// 移除特定监听器
const handler = data => console.log(data)
engine.on('event:name', handler)
engine.off('event:name', handler)

// 移除所有监听器
engine.removeAllListeners('event:name')

// 移除所有事件的所有监听器
engine.removeAllListeners()

// 使用监听器 ID
const listenerId = engine.on('event:name', handler)
engine.removeListener(listenerId)
```

### 监听器优先级

```typescript
// 高优先级监听器（先执行）
engine.on('data:validate', validateData, { priority: 100 })

// 中等优先级监听器
engine.on('data:validate', processData, { priority: 50 })

// 低优先级监听器（后执行）
engine.on('data:validate', logData, { priority: 10 })

// 发布事件时，执行顺序为：validateData -> processData -> logData
engine.emit('data:validate', someData)
```

## 事件命名规范

### 推荐的命名约定

```typescript
// 命名空间:动作
engine.emit('user:login', userData)
engine.emit('user:logout', userData)
engine.emit('user:update', userData)

// 组件:事件
engine.emit('modal:open', modalData)
engine.emit('modal:close', modalData)
engine.emit('form:submit', formData)
engine.emit('form:validate', formData)

// 生命周期:阶段
engine.emit('app:start', appData)
engine.emit('app:ready', appData)
engine.emit('plugin:install', pluginData)
engine.emit('plugin:enable', pluginData)

// 数据:操作
engine.emit('data:create', data)
engine.emit('data:read', data)
engine.emit('data:update', data)
engine.emit('data:delete', data)

// 错误:类型
engine.emit('error:network', errorData)
engine.emit('error:validation', errorData)
engine.emit('error:permission', errorData)
```

### 事件分类

```typescript
// 系统事件（engine: 前缀）
engine.emit('engine:start')
engine.emit('engine:stop')
engine.emit('engine:error', error)

// 应用事件（app: 前缀）
engine.emit('app:ready')
engine.emit('app:config-changed', config)

// 用户事件（user: 前缀）
engine.emit('user:login', user)
engine.emit('user:action', action)

// 数据事件（data: 前缀）
engine.emit('data:loaded', data)
engine.emit('data:saved', data)

// UI 事件（ui: 前缀）
engine.emit('ui:theme-changed', theme)
engine.emit('ui:language-changed', language)
```

## 高级事件功能

### 事件过滤

```typescript
// 基于数据过滤
engine.on('user:action', handler, {
  filter: actionData => actionData.userId === currentUserId
})

// 基于时间过滤
engine.on('api:request', handler, {
  filter: (requestData) => {
    const now = Date.now()
    return now - requestData.timestamp < 5000 // 只处理5秒内的请求
  }
})

// 复合过滤条件
engine.on('message:received', handler, {
  filter: (message) => {
    return message.type === 'important'
      && message.priority > 5
      && !message.processed
  }
})
```

### 事件转换

```typescript
// 事件数据转换
engine.transform('raw:data', 'processed:data', (rawData) => {
  return {
    id: rawData.id,
    name: rawData.name.toUpperCase(),
    timestamp: Date.now(),
    processed: true
  }
})

// 发布原始数据
engine.emit('raw:data', { id: 1, name: 'alice' })
// 自动触发 'processed:data' 事件，数据为 { id: 1, name: 'ALICE', timestamp: ..., processed: true }
```

### 事件聚合

```typescript
// 聚合多个事件
engine.aggregate(['user:login', 'user:profile-loaded', 'user:permissions-loaded'], 'user:ready', (loginData, profileData, permissionsData) => {
    return {
      user: loginData.user,
      profile: profileData,
      permissions: permissionsData,
      readyAt: Date.now()
    }
  }, { timeout: 10000 } // 10秒超时
)

// 当所有三个事件都触发后，会自动触发 'user:ready' 事件
```

### 事件缓冲

```typescript
// 缓冲事件，批量处理
engine.buffer('data:item-added', {
  size: 10, // 缓冲区大小
  timeout: 1000, // 超时时间
  handler: (items) => {
    console.log('批量处理项目:', items)
    batchProcessItems(items)
  }
})

// 多次发布事件
for (let i = 0; i < 15; i++) {
  engine.emit('data:item-added', { id: i, data: `item-${i}` })
}
// 会触发两次批量处理：第一次10个项目，第二次5个项目
```

### 事件重试

```typescript
// 带重试的事件处理
engine.on('api:request', async (requestData) => {
  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      const result = await makeApiRequest(requestData)
      engine.emit('api:success', result)
      return result
    }
 catch (error) {
      attempt++
      console.log(`API 请求失败，重试 ${attempt}/${maxRetries}:`, error)

      if (attempt >= maxRetries) {
        engine.emit('api:failed', { requestData, error, attempts: attempt })
        throw error
      }

      // 指数退避
      await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 1000))
    }
  }
})
```

## 事件调试和监控

### 事件日志

```typescript
// 启用事件日志
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  debug: true,
  eventLogging: {
    enabled: true,
    level: 'all', // 'all' | 'emit' | 'listen' | 'error'
    filter: eventName => !eventName.startsWith('internal:'),
    formatter: (event) => {
      return `[${new Date().toISOString()}] ${event.name}: ${JSON.stringify(event.data)}`
    }
  }
})

// 手动记录事件
engine.on('*', (eventName, data) => {
  console.log(`事件触发: ${eventName}`, data)
})
```

### 性能监控

```typescript
// 监控事件性能
engine.on('performance:event', (metrics) => {
  console.log('事件性能指标:', metrics)
  // {
  //   eventName: 'user:login',
  //   listenerCount: 5,
  //   executionTime: 23.5,
  //   memoryUsage: 1024,
  //   errors: 0
  // }
})

// 获取事件统计
const stats = engine.getEventStats()
console.log('事件统计:', stats)
// {
//   totalEvents: 1234,
//   totalListeners: 56,
//   averageExecutionTime: 12.3,
//   errorRate: 0.02,
//   topEvents: ['user:action', 'data:update', 'ui:render']
// }
```

### 事件可视化

```typescript
// 生成事件流图
const eventFlow = engine.getEventFlow({
  timeRange: { start: Date.now() - 3600000, end: Date.now() }, // 最近1小时
  includeData: false,
  groupBy: 'namespace'
})

console.log('事件流:', eventFlow)
// [
//   { time: 1234567890, event: 'user:login', listeners: 3 },
//   { time: 1234567891, event: 'data:load', listeners: 2 },
//   { time: 1234567892, event: 'ui:update', listeners: 1 }
// ]
```

## 错误处理

### 事件错误处理

```typescript
// 全局事件错误处理
engine.on('error:event', (error, context) => {
  console.error('事件处理错误:', error)
  console.error('错误上下文:', context)

  // 发送错误报告
  errorReporter.report(error, {
    eventName: context.eventName,
    eventData: context.eventData,
    listenerName: context.listenerName
  })
})

// 监听器错误隔离
engine.on('user:action', (actionData) => {
  try {
    processUserAction(actionData)
  }
 catch (error) {
    console.error('处理用户操作失败:', error)
    engine.emit('error:user-action', { error, actionData })
    // 不抛出错误，避免影响其他监听器
  }
})

// 异步错误处理
engine.on('async:operation', async (data) => {
  try {
    await performAsyncOperation(data)
  }
 catch (error) {
    engine.emit('error:async-operation', { error, data })
    throw error // 重新抛出，让 emitAsync 能捕获
  }
})
```

### 超时处理

```typescript
// 设置事件超时
engine.on('long:operation', handler, {
  timeout: 5000, // 5秒超时
  onTimeout: (eventData) => {
    console.warn('事件处理超时:', eventData)
    engine.emit('error:timeout', { eventName: 'long:operation', data: eventData })
  }
})

// 异步事件超时
try {
  await engine.emitAsync('slow:operation', data, { timeout: 10000 })
}
 catch (error) {
  if (error.name === 'TimeoutError') {
    console.error('操作超时')
  }
}
```

## 事件模式

### 请求-响应模式

```typescript
// 请求处理器
engine.on('request:user-data', async (request) => {
  try {
    const userData = await fetchUserData(request.userId)
    engine.emit(`response:${request.id}`, {
      success: true,
      data: userData
    })
  }
 catch (error) {
    engine.emit(`response:${request.id}`, {
      success: false,
      error: error.message
    })
  }
})

// 发送请求
function requestUserData(userId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = generateId()

    // 监听响应
    engine.once(`response:${requestId}`, (response) => {
      if (response.success) {
        resolve(response.data)
      }
 else {
        reject(new Error(response.error))
      }
    })

    // 发送请求
    engine.emit('request:user-data', { id: requestId, userId })

    // 设置超时
    setTimeout(() => {
      engine.removeAllListeners(`response:${requestId}`)
      reject(new Error('请求超时'))
    }, 5000)
  })
}

// 使用
const userData = await requestUserData('user123')
```

### 状态机模式

```typescript
class StateMachine {
  private currentState = 'idle'

  constructor(private engine: Engine) {
    this.setupTransitions()
  }

  private setupTransitions() {
    // 状态转换监听器
    this.engine.on('state:transition', (transition) => {
      if (this.canTransition(transition.from, transition.to)) {
        this.currentState = transition.to
        this.engine.emit(`state:entered:${transition.to}`, transition.data)
      }
 else {
        this.engine.emit('state:transition-failed', transition)
      }
    })
  }

  private canTransition(from: string, to: string): boolean {
    const validTransitions = {
      idle: ['loading', 'error'],
      loading: ['loaded', 'error'],
      loaded: ['idle', 'updating'],
      updating: ['loaded', 'error'],
      error: ['idle']
    }

    return validTransitions[from]?.includes(to) || false
  }

  transition(to: string, data?: any) {
    this.engine.emit('state:transition', {
      from: this.currentState,
      to,
      data
    })
  }
}

// 使用状态机
const stateMachine = new StateMachine(engine)

engine.on('state:entered:loading', () => {
  console.log('开始加载...')
})

engine.on('state:entered:loaded', (data) => {
  console.log('加载完成:', data)
})

stateMachine.transition('loading')
```

### 工作流模式

```typescript
class Workflow {
  private steps: string[] = []
  private currentStep = 0

  constructor(private engine: Engine, steps: string[]) {
    this.steps = steps
    this.setupWorkflow()
  }

  private setupWorkflow() {
    this.engine.on('workflow:next', () => {
      this.nextStep()
    })

    this.engine.on('workflow:previous', () => {
      this.previousStep()
    })

    this.engine.on('workflow:goto', (step) => {
      this.gotoStep(step)
    })
  }

  start() {
    this.currentStep = 0
    this.engine.emit('workflow:started', this.getCurrentStep())
    this.executeCurrentStep()
  }

  private nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++
      this.executeCurrentStep()
    }
 else {
      this.engine.emit('workflow:completed')
    }
  }

  private previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--
      this.executeCurrentStep()
    }
  }

  private gotoStep(stepName: string) {
    const index = this.steps.indexOf(stepName)
    if (index !== -1) {
      this.currentStep = index
      this.executeCurrentStep()
    }
  }

  private executeCurrentStep() {
    const step = this.getCurrentStep()
    this.engine.emit('workflow:step-entered', step)
    this.engine.emit(`workflow:step:${step.name}`, step)
  }

  private getCurrentStep() {
    return {
      name: this.steps[this.currentStep],
      index: this.currentStep,
      total: this.steps.length,
      isFirst: this.currentStep === 0,
      isLast: this.currentStep === this.steps.length - 1
    }
  }
}

// 使用工作流
const workflow = new Workflow(engine, [
  'validate-input',
  'process-data',
  'save-result',
  'send-notification'
])

// 监听工作流步骤
engine.on('workflow:step:validate-input', (step) => {
  console.log('验证输入...', step)
  // 验证完成后继续下一步
  engine.emit('workflow:next')
})

engine.on('workflow:step:process-data', (step) => {
  console.log('处理数据...', step)
  // 处理完成后继续
  engine.emit('workflow:next')
})

workflow.start()
```

## 最佳实践

### 1. 事件命名

```typescript
// ✅ 好的命名
engine.emit('user:login-success', userData)
engine.emit('file:upload-progress', { progress: 50 })
engine.emit('api:request-failed', { error, url })

// ❌ 不好的命名
engine.emit('login', userData) // 缺少命名空间
engine.emit('userLoginSuccess', userData) // 驼峰命名不一致
engine.emit('event1', userData) // 无意义的名称
```

### 2. 事件数据结构

```typescript
// ✅ 结构化的事件数据
engine.emit('user:action', {
  userId: 'user123',
  action: 'click',
  target: 'button',
  timestamp: Date.now(),
  metadata: {
    page: '/dashboard',
    sessionId: 'session456'
  }
})

// ❌ 不结构化的数据
engine.emit('user:action', 'user123', 'click', 'button', Date.now())
```

### 3. 错误处理

```typescript
// ✅ 完善的错误处理
engine.on('data:process', async (data) => {
  try {
    const result = await processData(data)
    engine.emit('data:process-success', result)
    return result
  }
 catch (error) {
    engine.emit('data:process-failed', { data, error })
    // 不重新抛出错误，避免影响其他监听器
  }
})

// ❌ 缺少错误处理
engine.on('data:process', async (data) => {
  const result = await processData(data) // 可能抛出错误
  return result
})
```

### 4. 内存管理

```typescript
// ✅ 正确的监听器管理
class Component {
  private listeners: string[] = []

  constructor(private engine: Engine) {
    this.setupListeners()
  }

  private setupListeners() {
    const id1 = this.engine.on('data:update', this.onDataUpdate.bind(this))
    const id2 = this.engine.on('user:action', this.onUserAction.bind(this))

    this.listeners.push(id1, id2)
  }

  destroy() {
    // 清理监听器
    this.listeners.forEach(id => this.engine.removeListener(id))
    this.listeners = []
  }

  private onDataUpdate(data: any) {
    // 处理数据更新
  }

  private onUserAction(action: any) {
    // 处理用户操作
  }
}
```

### 5. 性能优化

```typescript
// ✅ 使用事件过滤减少不必要的处理
engine.on('mouse:move', handler, {
  filter: event => event.buttons > 0, // 只处理拖拽事件
  throttle: 16 // 60fps 节流
})

// ✅ 使用事件缓冲批量处理
engine.buffer('log:entry', {
  size: 100,
  timeout: 1000,
  handler: (entries) => {
    batchSendLogs(entries)
  }
})

// ✅ 避免在热路径上创建大量事件
const throttledEmit = throttle((data) => {
  engine.emit('scroll:position', data)
}, 16)

window.addEventListener('scroll', () => {
  throttledEmit({ x: window.scrollX, y: window.scrollY })
})
```

## 下一步

现在您已经掌握了事件系统的使用，可以继续学习：

- [中间件](/guide/middleware) - 了解中间件的强大功能
- [状态管理](/guide/state-management) - 学习状态管理
- [插件开发](/guide/plugin-development) - 在插件中使用事件
- [API 参考](/api/events) - 查看完整的事件 API 文档
- [示例](/examples/event-patterns) - 查看更多事件模式示例

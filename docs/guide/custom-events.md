# 自定义事件

@ldesign/engine 提供了强大的事件系统，允许您创建和管理自定义事件。本章将详细介绍如何定义、发布和监听自定义事件。

## 事件命名规范

### 推荐的命名约定

```typescript
// 格式：namespace:action
'user:login'        // 用户登录
'user:logout'       // 用户登出
'file:upload'       // 文件上传
'file:download'     // 文件下载
'data:received'     // 数据接收
'data:processed'    // 数据处理完成

// 格式：component:event
'modal:open'        // 模态框打开
'modal:close'       // 模态框关闭
'form:submit'       // 表单提交
'form:validate'     // 表单验证

// 格式：lifecycle:stage
'app:start'         // 应用启动
'app:ready'         // 应用就绪
'plugin:install'    // 插件安装
'plugin:uninstall'  // 插件卸载
```

### 事件命名最佳实践

1. **使用小写字母和连字符**
2. **保持简洁明了**
3. **使用动词的现在时或过去时**
4. **避免使用缩写**
5. **保持一致性**

## 创建自定义事件

### 基本事件定义

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 定义事件类型
interface CustomEvents {
  'user:profile-updated': { userId: number; changes: Record<string, any> }
  'notification:show': { message: string; type: 'info' | 'warning' | 'error' | 'success' }
  'task:completed': { taskId: string; result: any; duration: number }
  'system:maintenance': { startTime: Date; estimatedDuration: number }
}

// 扩展引擎类型
declare module '@ldesign/engine' {
  interface EngineEvents extends CustomEvents {}
}
```

### 事件数据结构

```typescript
// 定义事件数据接口
interface UserLoginEvent {
  user: {
    id: number
    name: string
    email: string
    role: string
  }
  timestamp: Date
  ip: string
  userAgent: string
}

interface FileUploadEvent {
  file: {
    name: string
    size: number
    type: string
    path: string
  }
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  error?: string
}

// 使用类型化事件
engine.on('user:login', (data: UserLoginEvent) => {
  console.log(`用户 ${data.user.name} 已登录`)
  console.log(`登录时间: ${data.timestamp}`)
  console.log(`IP地址: ${data.ip}`)
})

engine.on('file:upload', (data: FileUploadEvent) => {
  console.log(`文件 ${data.file.name} 上传进度: ${data.progress}%`)
  if (data.status === 'completed') {
    console.log('文件上传完成')
  }
})
```

## 发布自定义事件

### 同步事件发布

```typescript
// 发布简单事件
engine.emit('user:login', {
  user: {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin'
  },
  timestamp: new Date(),
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...'
})

// 发布通知事件
engine.emit('notification:show', {
  message: '欢迎回来！',
  type: 'success'
})

// 发布任务完成事件
engine.emit('task:completed', {
  taskId: 'task-123',
  result: { processed: 100, errors: 0 },
  duration: 5000
})
```

### 异步事件发布

```typescript
// 异步事件处理
engine.on('data:process', async (data) => {
  console.log('开始处理数据...')
  
  try {
    const result = await processLargeDataSet(data)
    
    // 发布处理完成事件
    engine.emit('data:processed', {
      originalData: data,
      result,
      timestamp: new Date()
    })
  } catch (error) {
    // 发布处理失败事件
    engine.emit('data:process-failed', {
      originalData: data,
      error: error.message,
      timestamp: new Date()
    })
  }
})

// 使用 emitAsync 等待所有监听器完成
const results = await engine.emitAsync('data:validate', largeDataSet)
console.log('所有验证器执行完成:', results)
```

### 条件事件发布

```typescript
// 带条件的事件发布
class ConditionalEventEmitter {
  constructor(private engine: Engine) {}
  
  emitUserAction(action: string, user: any, condition?: () => boolean) {
    if (condition && !condition()) {
      console.log('条件不满足，跳过事件发布')
      return
    }
    
    this.engine.emit('user:action', {
      action,
      user,
      timestamp: new Date()
    })
  }
}

const emitter = new ConditionalEventEmitter(engine)

// 只在用户已认证时发布事件
emitter.emitUserAction('profile-update', user, () => user.isAuthenticated)
```

## 监听自定义事件

### 基本事件监听

```typescript
// 监听用户登录事件
engine.on('user:login', (data) => {
  console.log('用户登录事件:', data)
  
  // 更新用户状态
  engine.setState('currentUser', data.user)
  
  // 记录登录日志
  logUserActivity('login', data)
  
  // 发送欢迎通知
  engine.emit('notification:show', {
    message: `欢迎回来，${data.user.name}！`,
    type: 'success'
  })
})

// 监听文件上传事件
engine.on('file:upload', (data) => {
  if (data.status === 'completed') {
    console.log(`文件 ${data.file.name} 上传完成`)
    
    // 更新文件列表
    const files = engine.getState('uploadedFiles') || []
    engine.setState('uploadedFiles', [...files, data.file])
    
    // 发布文件处理事件
    engine.emit('file:process', data.file)
  }
})
```

### 一次性事件监听

```typescript
// 只监听一次的事件
engine.once('app:ready', () => {
  console.log('应用已准备就绪，执行初始化操作')
  
  // 加载用户配置
  loadUserPreferences()
  
  // 启动后台任务
  startBackgroundTasks()
  
  // 显示欢迎界面
  showWelcomeScreen()
})

// 等待特定条件的一次性事件
engine.once('user:first-login', (user) => {
  console.log('用户首次登录，显示引导教程')
  showOnboardingTutorial(user)
})
```

### 带优先级的事件监听

```typescript
// 高优先级监听器（先执行）
engine.on('data:validate', (data) => {
  console.log('高优先级验证器')
  if (!data || typeof data !== 'object') {
    throw new Error('数据格式无效')
  }
}, { priority: 100 })

// 中等优先级监听器
engine.on('data:validate', (data) => {
  console.log('中等优先级验证器')
  validateBusinessRules(data)
}, { priority: 50 })

// 低优先级监听器（后执行）
engine.on('data:validate', (data) => {
  console.log('低优先级日志记录')
  logValidationAttempt(data)
}, { priority: 10 })
```

## 事件拦截和修改

### 事件拦截器

```typescript
// 拦截并修改事件数据
engine.intercept('message:send', (message) => {
  console.log('拦截消息发送事件')
  
  // 添加时间戳
  const modifiedMessage = {
    ...message,
    timestamp: new Date().toISOString(),
    id: generateMessageId()
  }
  
  // 内容过滤
  if (containsInappropriateContent(modifiedMessage.content)) {
    modifiedMessage.content = filterContent(modifiedMessage.content)
    modifiedMessage.filtered = true
  }
  
  // 加密敏感信息
  if (modifiedMessage.sensitive) {
    modifiedMessage.content = encrypt(modifiedMessage.content)
    modifiedMessage.encrypted = true
  }
  
  return modifiedMessage
})

// 条件拦截
engine.intercept('user:action', (action) => {
  // 只拦截特定用户的操作
  if (action.user.role === 'guest') {
    console.log('拦截访客用户操作')
    return {
      ...action,
      restricted: true,
      allowedActions: ['view', 'read']
    }
  }
  
  return action
})
```

### 事件取消

```typescript
// 取消事件的传播
engine.intercept('file:delete', (fileInfo) => {
  // 检查文件是否可以删除
  if (fileInfo.protected || fileInfo.inUse) {
    console.log('文件受保护或正在使用，取消删除操作')
    
    // 发布错误事件
    engine.emit('file:delete-failed', {
      file: fileInfo,
      reason: fileInfo.protected ? 'protected' : 'in-use'
    })
    
    // 返回 null 取消事件
    return null
  }
  
  return fileInfo
})

// 带确认的事件取消
engine.intercept('app:shutdown', async (shutdownInfo) => {
  const hasUnsavedChanges = await checkUnsavedChanges()
  
  if (hasUnsavedChanges) {
    const confirmed = await showConfirmDialog(
      '有未保存的更改，确定要退出吗？'
    )
    
    if (!confirmed) {
      console.log('用户取消了关闭操作')
      return null // 取消关闭
    }
  }
  
  return shutdownInfo
})
```

## 事件组合和链式处理

### 事件链

```typescript
// 创建事件处理链
class EventChain {
  constructor(private engine: Engine) {
    this.setupEventChain()
  }
  
  private setupEventChain() {
    // 步骤1：数据接收
    this.engine.on('data:received', (data) => {
      console.log('步骤1：数据接收')
      this.engine.emit('data:validate', data)
    })
    
    // 步骤2：数据验证
    this.engine.on('data:validate', (data) => {
      console.log('步骤2：数据验证')
      if (this.isValidData(data)) {
        this.engine.emit('data:transform', data)
      } else {
        this.engine.emit('data:validation-failed', data)
      }
    })
    
    // 步骤3：数据转换
    this.engine.on('data:transform', (data) => {
      console.log('步骤3：数据转换')
      const transformedData = this.transformData(data)
      this.engine.emit('data:save', transformedData)
    })
    
    // 步骤4：数据保存
    this.engine.on('data:save', async (data) => {
      console.log('步骤4：数据保存')
      try {
        await this.saveData(data)
        this.engine.emit('data:saved', data)
      } catch (error) {
        this.engine.emit('data:save-failed', { data, error })
      }
    })
    
    // 步骤5：完成处理
    this.engine.on('data:saved', (data) => {
      console.log('步骤5：处理完成')
      this.engine.emit('process:completed', {
        data,
        timestamp: new Date()
      })
    })
  }
  
  private isValidData(data: any): boolean {
    return data && typeof data === 'object' && data.id
  }
  
  private transformData(data: any): any {
    return {
      ...data,
      processed: true,
      processedAt: new Date()
    }
  }
  
  private async saveData(data: any): Promise<void> {
    // 模拟数据保存
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

const eventChain = new EventChain(engine)

// 启动处理链
engine.emit('data:received', {
  id: 1,
  content: 'Hello World',
  source: 'api'
})
```

### 并行事件处理

```typescript
// 并行处理多个事件
class ParallelEventProcessor {
  constructor(private engine: Engine) {
    this.setupParallelProcessing()
  }
  
  private setupParallelProcessing() {
    this.engine.on('batch:process', async (batch) => {
      console.log(`开始并行处理 ${batch.items.length} 个项目`)
      
      // 并行处理所有项目
      const promises = batch.items.map(item => 
        this.processItem(item)
      )
      
      try {
        const results = await Promise.all(promises)
        
        this.engine.emit('batch:completed', {
          batch,
          results,
          successCount: results.filter(r => r.success).length,
          failureCount: results.filter(r => !r.success).length
        })
      } catch (error) {
        this.engine.emit('batch:failed', {
          batch,
          error: error.message
        })
      }
    })
  }
  
  private async processItem(item: any): Promise<any> {
    try {
      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000))
      
      // 发布单个项目完成事件
      this.engine.emit('item:processed', {
        item,
        result: `处理结果: ${item.id}`,
        timestamp: new Date()
      })
      
      return { success: true, item, result: `处理结果: ${item.id}` }
    } catch (error) {
      this.engine.emit('item:failed', {
        item,
        error: error.message
      })
      
      return { success: false, item, error: error.message }
    }
  }
}

const parallelProcessor = new ParallelEventProcessor(engine)

// 启动批量处理
engine.emit('batch:process', {
  id: 'batch-001',
  items: [
    { id: 1, data: 'item1' },
    { id: 2, data: 'item2' },
    { id: 3, data: 'item3' }
  ]
})
```

## 事件调试和监控

### 事件日志记录

```typescript
// 事件日志记录器
class EventLogger {
  private logs: Array<{
    event: string
    data: any
    timestamp: Date
    listeners: number
  }> = []
  
  constructor(private engine: Engine) {
    this.setupLogging()
  }
  
  private setupLogging() {
    // 拦截所有事件进行日志记录
    const originalEmit = this.engine.emit.bind(this.engine)
    
    this.engine.emit = (event: string, data?: any) => {
      const listenerCount = this.engine.listenerCount(event)
      
      this.logs.push({
        event,
        data,
        timestamp: new Date(),
        listeners: listenerCount
      })
      
      console.log(`[EVENT] ${event}`, {
        data,
        listeners: listenerCount,
        timestamp: new Date().toISOString()
      })
      
      return originalEmit(event, data)
    }
  }
  
  getLogs(filter?: {
    event?: string
    since?: Date
    limit?: number
  }): typeof this.logs {
    let filteredLogs = this.logs
    
    if (filter?.event) {
      filteredLogs = filteredLogs.filter(log => 
        log.event.includes(filter.event!)
      )
    }
    
    if (filter?.since) {
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp >= filter.since!
      )
    }
    
    if (filter?.limit) {
      filteredLogs = filteredLogs.slice(-filter.limit)
    }
    
    return filteredLogs
  }
  
  getEventStats(): Record<string, {
    count: number
    lastEmitted: Date
    avgListeners: number
  }> {
    const stats: Record<string, any> = {}
    
    this.logs.forEach(log => {
      if (!stats[log.event]) {
        stats[log.event] = {
          count: 0,
          lastEmitted: log.timestamp,
          totalListeners: 0
        }
      }
      
      stats[log.event].count++
      stats[log.event].lastEmitted = log.timestamp
      stats[log.event].totalListeners += log.listeners
    })
    
    // 计算平均监听器数量
    Object.keys(stats).forEach(event => {
      stats[event].avgListeners = 
        stats[event].totalListeners / stats[event].count
      delete stats[event].totalListeners
    })
    
    return stats
  }
}

const eventLogger = new EventLogger(engine)

// 查看事件日志
setInterval(() => {
  const recentLogs = eventLogger.getLogs({
    since: new Date(Date.now() - 60000), // 最近1分钟
    limit: 10
  })
  
  if (recentLogs.length > 0) {
    console.log('最近的事件:', recentLogs)
  }
}, 60000)

// 查看事件统计
setInterval(() => {
  const stats = eventLogger.getEventStats()
  console.log('事件统计:', stats)
}, 300000) // 每5分钟
```

### 性能监控

```typescript
// 事件性能监控
class EventPerformanceMonitor {
  private metrics: Map<string, {
    totalTime: number
    count: number
    maxTime: number
    minTime: number
  }> = new Map()
  
  constructor(private engine: Engine) {
    this.setupMonitoring()
  }
  
  private setupMonitoring() {
    // 监控事件处理时间
    const originalOn = this.engine.on.bind(this.engine)
    
    this.engine.on = (event: string, listener: Function, options?: any) => {
      const wrappedListener = async (...args: any[]) => {
        const startTime = performance.now()
        
        try {
          const result = await listener(...args)
          const endTime = performance.now()
          const duration = endTime - startTime
          
          this.recordMetric(event, duration)
          
          return result
        } catch (error) {
          const endTime = performance.now()
          const duration = endTime - startTime
          
          this.recordMetric(event, duration)
          throw error
        }
      }
      
      return originalOn(event, wrappedListener, options)
    }
  }
  
  private recordMetric(event: string, duration: number) {
    if (!this.metrics.has(event)) {
      this.metrics.set(event, {
        totalTime: 0,
        count: 0,
        maxTime: 0,
        minTime: Infinity
      })
    }
    
    const metric = this.metrics.get(event)!
    metric.totalTime += duration
    metric.count++
    metric.maxTime = Math.max(metric.maxTime, duration)
    metric.minTime = Math.min(metric.minTime, duration)
  }
  
  getPerformanceReport(): Record<string, {
    avgTime: number
    maxTime: number
    minTime: number
    count: number
    totalTime: number
  }> {
    const report: Record<string, any> = {}
    
    this.metrics.forEach((metric, event) => {
      report[event] = {
        avgTime: metric.totalTime / metric.count,
        maxTime: metric.maxTime,
        minTime: metric.minTime === Infinity ? 0 : metric.minTime,
        count: metric.count,
        totalTime: metric.totalTime
      }
    })
    
    return report
  }
  
  getSlowEvents(threshold: number = 100): string[] {
    const report = this.getPerformanceReport()
    
    return Object.keys(report).filter(event => 
      report[event].avgTime > threshold
    )
  }
}

const performanceMonitor = new EventPerformanceMonitor(engine)

// 定期检查性能
setInterval(() => {
  const slowEvents = performanceMonitor.getSlowEvents(50) // 50ms阈值
  
  if (slowEvents.length > 0) {
    console.warn('检测到慢事件:', slowEvents)
    const report = performanceMonitor.getPerformanceReport()
    slowEvents.forEach(event => {
      console.warn(`事件 ${event}:`, report[event])
    })
  }
}, 60000)
```

## 最佳实践

### 1. 事件设计原则

```typescript
// ✅ 好的事件设计
interface WellDesignedEvent {
  // 包含足够的上下文信息
  id: string
  timestamp: Date
  source: string
  
  // 具体的业务数据
  payload: {
    userId: number
    action: string
    details: Record<string, any>
  }
  
  // 元数据
  metadata: {
    version: string
    correlationId: string
    sessionId?: string
  }
}

// ❌ 避免的事件设计
interface PoorEvent {
  data: any // 太模糊
  // 缺少上下文信息
}
```

### 2. 错误处理

```typescript
// 事件错误处理
engine.on('error', (error, context) => {
  console.error('事件处理错误:', error)
  console.error('错误上下文:', context)
  
  // 发送错误报告
  engine.emit('error:report', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    context,
    timestamp: new Date()
  })
})

// 优雅的错误恢复
engine.on('data:process-failed', (failureInfo) => {
  console.log('数据处理失败，尝试恢复...')
  
  // 重试逻辑
  setTimeout(() => {
    engine.emit('data:retry', {
      originalData: failureInfo.data,
      attempt: (failureInfo.attempt || 0) + 1,
      maxAttempts: 3
    })
  }, 1000)
})
```

### 3. 内存管理

```typescript
// 自动清理事件监听器
class AutoCleanupEventManager {
  private listeners: Array<{
    event: string
    listener: Function
    cleanup: () => void
  }> = []
  
  constructor(private engine: Engine) {}
  
  addListener(event: string, listener: Function, options?: {
    once?: boolean
    timeout?: number
  }) {
    const cleanup = () => {
      this.engine.off(event, listener)
      this.listeners = this.listeners.filter(l => l.listener !== listener)
    }
    
    this.listeners.push({ event, listener, cleanup })
    
    if (options?.once) {
      this.engine.once(event, listener)
    } else {
      this.engine.on(event, listener)
    }
    
    // 设置超时清理
    if (options?.timeout) {
      setTimeout(cleanup, options.timeout)
    }
    
    return cleanup
  }
  
  cleanup() {
    this.listeners.forEach(({ cleanup }) => cleanup())
    this.listeners = []
  }
}

const eventManager = new AutoCleanupEventManager(engine)

// 使用自动清理
const cleanup = eventManager.addListener('user:action', (action) => {
  console.log('用户操作:', action)
}, { timeout: 60000 }) // 1分钟后自动清理

// 手动清理
// cleanup()
```

## 总结

自定义事件是 @ldesign/engine 中实现组件间通信的核心机制。通过合理设计事件结构、使用适当的监听模式和实施有效的错误处理，您可以构建出健壮、可维护的事件驱动应用程序。

### 关键要点

1. **遵循命名规范**：使用清晰、一致的事件命名
2. **设计良好的事件结构**：包含足够的上下文信息
3. **合理使用事件拦截**：在需要时修改或取消事件
4. **实施性能监控**：监控事件处理性能
5. **处理错误情况**：优雅地处理事件错误
6. **管理内存使用**：及时清理不需要的监听器

通过掌握这些技巧，您可以充分发挥 @ldesign/engine 事件系统的强大功能。
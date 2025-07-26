# 事件处理示例

本文档详细介绍了 @ldesign/engine 中事件系统的各种使用方式，包括基础事件处理、高级事件模式、事件拦截、异步事件处理等功能。

## 基础事件处理

### 简单事件监听和触发

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'EventExample',
  debug: true
})

// 基础事件监听
engine.on('user:login', (user) => {
  console.log('用户登录:', user.name)
})

engine.on('user:logout', (user) => {
  console.log('用户登出:', user.name)
})

// 一次性事件监听
engine.once('app:initialized', () => {
  console.log('应用初始化完成')
})

// 触发事件
engine.emit('user:login', {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
})

engine.emit('app:initialized')
engine.emit('app:initialized') // 这次不会触发，因为是 once 监听

engine.emit('user:logout', {
  id: 1,
  name: 'John Doe'
})
```

### 事件监听器管理

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({ name: 'ListenerManagement' })

// 命名监听器（便于管理）
const userLoginHandler = (user) => {
  console.log('处理用户登录:', user.name)
}

const userLogoutHandler = (user) => {
  console.log('处理用户登出:', user.name)
}

// 注册监听器
engine.on('user:login', userLoginHandler)
engine.on('user:logout', userLogoutHandler)

// 多个监听器监听同一事件
engine.on('user:login', (user) => {
  console.log('记录登录日志:', user.id)
})

engine.on('user:login', (user) => {
  console.log('更新用户状态:', user.id)
})

// 触发事件（所有监听器都会执行）
engine.emit('user:login', {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com'
})

// 移除特定监听器
engine.off('user:login', userLoginHandler)

// 移除事件的所有监听器
engine.off('user:logout')

// 再次触发事件（只有剩余的监听器会执行）
engine.emit('user:login', {
  id: 2,
  name: 'Bob',
  email: 'bob@example.com'
})
```

## 高级事件模式

### 事件命名空间

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({ name: 'NamespaceExample' })

// 用户相关事件
engine.on('user:auth:login', (data) => {
  console.log('用户认证登录:', data)
})

engine.on('user:auth:logout', (data) => {
  console.log('用户认证登出:', data)
})

engine.on('user:profile:update', (data) => {
  console.log('用户资料更新:', data)
})

// 订单相关事件
engine.on('order:created', (order) => {
  console.log('订单创建:', order.id)
})

engine.on('order:payment:success', (payment) => {
  console.log('订单支付成功:', payment.orderId)
})

engine.on('order:payment:failed', (payment) => {
  console.log('订单支付失败:', payment.orderId, payment.error)
})

// 通配符监听（监听所有用户事件）
engine.on('user:*', (data, eventName) => {
  console.log(`用户事件触发: ${eventName}`, data)
})

// 监听所有认证相关事件
engine.on('*:auth:*', (data, eventName) => {
  console.log(`认证事件: ${eventName}`, data)
})

// 触发事件
engine.emit('user:auth:login', { userId: 1, token: 'abc123' })
engine.emit('user:profile:update', { userId: 1, name: 'New Name' })
engine.emit('order:created', { id: 'order123', userId: 1, amount: 99.99 })
engine.emit('order:payment:success', { orderId: 'order123', amount: 99.99 })
```

### 事件优先级

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({ name: 'PriorityExample' })

// 高优先级监听器（先执行）
engine.on('data:process', (data) => {
  console.log('🔥 高优先级处理:', data.id)
}, { priority: 100 })

// 普通优先级监听器
engine.on('data:process', (data) => {
  console.log('📝 普通处理:', data.id)
}, { priority: 50 })

// 低优先级监听器（后执行）
engine.on('data:process', (data) => {
  console.log('🔚 低优先级处理:', data.id)
}, { priority: 10 })

// 默认优先级（50）
engine.on('data:process', (data) => {
  console.log('⚡ 默认处理:', data.id)
})

// 触发事件（按优先级顺序执行）
engine.emit('data:process', { id: 'data123', content: 'test data' })
```

### 事件拦截和修改

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({ name: 'InterceptExample' })

// 事件拦截器（可以修改事件数据）
engine.intercept('user:register', (data, context) => {
  console.log('拦截用户注册事件，进行数据验证...')
  
  // 数据验证
  if (!data.email || !data.email.includes('@')) {
    context.preventDefault() // 阻止事件继续传播
    throw new Error('邮箱格式不正确')
  }
  
  // 数据清理和增强
  const cleanedData = {
    ...data,
    email: data.email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
    id: 'user_' + Date.now()
  }
  
  console.log('数据验证通过，已清理数据')
  return cleanedData // 返回修改后的数据
})

// 另一个拦截器（权限检查）
engine.intercept('user:delete', (data, context) => {
  console.log('检查删除权限...')
  
  const currentUser = engine.getState('currentUser')
  
  // 权限检查
  if (!currentUser || currentUser.role !== 'admin') {
    context.preventDefault()
    throw new Error('权限不足，无法删除用户')
  }
  
  // 添加操作者信息
  return {
    ...data,
    deletedBy: currentUser.id,
    deletedAt: new Date().toISOString()
  }
})

// 正常的事件监听器
engine.on('user:register', (userData) => {
  console.log('用户注册成功:', userData)
})

engine.on('user:delete', (deleteData) => {
  console.log('用户删除成功:', deleteData)
})

// 错误处理
engine.on('error', (error, context) => {
  console.error('事件处理错误:', error.message)
  console.error('错误上下文:', context)
})

// 测试事件拦截
engine.start().then(() => {
  console.log('=== 测试事件拦截 ===')
  
  // 设置当前用户
  engine.setState('currentUser', {
    id: 'admin1',
    role: 'admin',
    name: 'Admin User'
  })
  
  // 1. 正常的用户注册
  console.log('\n1. 正常用户注册')
  try {
    engine.emit('user:register', {
      name: 'John Doe',
      email: '  JOHN@EXAMPLE.COM  ',
      password: 'password123'
    })
  } catch (error) {
    console.error('注册失败:', error.message)
  }
  
  // 2. 无效邮箱的用户注册
  console.log('\n2. 无效邮箱注册')
  try {
    engine.emit('user:register', {
      name: 'Jane Doe',
      email: 'invalid-email',
      password: 'password123'
    })
  } catch (error) {
    console.error('注册失败:', error.message)
  }
  
  // 3. 管理员删除用户
  console.log('\n3. 管理员删除用户')
  try {
    engine.emit('user:delete', {
      userId: 'user123',
      reason: '违规行为'
    })
  } catch (error) {
    console.error('删除失败:', error.message)
  }
  
  // 4. 普通用户尝试删除
  console.log('\n4. 普通用户尝试删除')
  engine.setState('currentUser', {
    id: 'user1',
    role: 'user',
    name: 'Regular User'
  })
  
  try {
    engine.emit('user:delete', {
      userId: 'user456',
      reason: '测试删除'
    })
  } catch (error) {
    console.error('删除失败:', error.message)
  }
})
```

## 异步事件处理

### 异步事件监听器

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({ name: 'AsyncEventExample' })

// 异步事件处理器
engine.on('file:upload', async (fileData) => {
  console.log('开始上传文件:', fileData.name)
  
  try {
    // 模拟文件上传
    await uploadFile(fileData)
    
    console.log('文件上传成功:', fileData.name)
    engine.emit('file:upload:success', {
      ...fileData,
      uploadedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('文件上传失败:', error.message)
    engine.emit('file:upload:error', {
      ...fileData,
      error: error.message
    })
  }
})

// 批量处理异步事件
engine.on('batch:process', async (items) => {
  console.log(`开始批量处理 ${items.length} 个项目`)
  
  const results = []
  
  // 串行处理
  for (const item of items) {
    try {
      console.log(`处理项目: ${item.id}`)
      const result = await processItem(item)
      results.push({ ...item, result, status: 'success' })
    } catch (error) {
      console.error(`处理失败: ${item.id}`, error.message)
      results.push({ ...item, error: error.message, status: 'error' })
    }
  }
  
  console.log('批量处理完成')
  engine.emit('batch:process:complete', results)
})

// 并行处理异步事件
engine.on('parallel:process', async (items) => {
  console.log(`开始并行处理 ${items.length} 个项目`)
  
  const promises = items.map(async (item) => {
    try {
      console.log(`并行处理: ${item.id}`)
      const result = await processItem(item)
      return { ...item, result, status: 'success' }
    } catch (error) {
      console.error(`并行处理失败: ${item.id}`, error.message)
      return { ...item, error: error.message, status: 'error' }
    }
  })
  
  const results = await Promise.all(promises)
  
  console.log('并行处理完成')
  engine.emit('parallel:process:complete', results)
})

// 使用 emitAsync 等待所有异步监听器完成
engine.on('data:sync', async (data) => {
  console.log('同步数据到数据库:', data.id)
  await syncToDatabase(data)
  console.log('数据库同步完成:', data.id)
})

engine.on('data:sync', async (data) => {
  console.log('同步数据到缓存:', data.id)
  await syncToCache(data)
  console.log('缓存同步完成:', data.id)
})

engine.on('data:sync', async (data) => {
  console.log('发送通知:', data.id)
  await sendNotification(data)
  console.log('通知发送完成:', data.id)
})

// 工具函数
async function uploadFile(fileData) {
  // 模拟上传延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  // 模拟随机失败
  if (Math.random() < 0.2) {
    throw new Error('网络错误')
  }
  
  return {
    url: `https://cdn.example.com/${fileData.name}`,
    size: fileData.size
  }
}

async function processItem(item) {
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  
  // 模拟随机失败
  if (Math.random() < 0.1) {
    throw new Error('处理错误')
  }
  
  return {
    processedAt: new Date().toISOString(),
    result: `processed_${item.id}`
  }
}

async function syncToDatabase(data) {
  await new Promise(resolve => setTimeout(resolve, 800))
}

async function syncToCache(data) {
  await new Promise(resolve => setTimeout(resolve, 300))
}

async function sendNotification(data) {
  await new Promise(resolve => setTimeout(resolve, 500))
}

// 测试异步事件
engine.start().then(async () => {
  console.log('=== 测试异步事件处理 ===')
  
  // 1. 文件上传
  console.log('\n1. 文件上传测试')
  engine.emit('file:upload', {
    name: 'document.pdf',
    size: 1024000,
    type: 'application/pdf'
  })
  
  engine.emit('file:upload', {
    name: 'image.jpg',
    size: 512000,
    type: 'image/jpeg'
  })
  
  await delay(3000)
  
  // 2. 批量串行处理
  console.log('\n2. 批量串行处理')
  const batchItems = Array.from({ length: 5 }, (_, i) => ({
    id: `item_${i + 1}`,
    data: `data_${i + 1}`
  }))
  
  engine.emit('batch:process', batchItems)
  
  await delay(8000)
  
  // 3. 批量并行处理
  console.log('\n3. 批量并行处理')
  const parallelItems = Array.from({ length: 5 }, (_, i) => ({
    id: `parallel_${i + 1}`,
    data: `parallel_data_${i + 1}`
  }))
  
  engine.emit('parallel:process', parallelItems)
  
  await delay(3000)
  
  // 4. 使用 emitAsync 等待所有异步处理完成
  console.log('\n4. 同步数据（等待所有异步操作完成）')
  
  try {
    await engine.emitAsync('data:sync', {
      id: 'sync_data_1',
      content: 'important data'
    })
    
    console.log('✅ 所有同步操作已完成')
  } catch (error) {
    console.error('❌ 同步操作失败:', error.message)
  }
})

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

## 事件流和管道

### 事件流处理

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({ name: 'EventStreamExample' })

// 创建事件流处理器
class EventStream {
  private engine: Engine
  private filters: Array<(data: any) => boolean> = []
  private transformers: Array<(data: any) => any> = []
  private handlers: Array<(data: any) => void> = []
  
  constructor(engine: Engine, eventName: string) {
    this.engine = engine
    
    // 监听原始事件
    engine.on(eventName, (data) => {
      this.process(data)
    })
  }
  
  // 添加过滤器
  filter(predicate: (data: any) => boolean) {
    this.filters.push(predicate)
    return this
  }
  
  // 添加转换器
  map(transformer: (data: any) => any) {
    this.transformers.push(transformer)
    return this
  }
  
  // 添加处理器
  subscribe(handler: (data: any) => void) {
    this.handlers.push(handler)
    return this
  }
  
  // 处理数据流
  private process(data: any) {
    let processedData = data
    
    // 应用过滤器
    for (const filter of this.filters) {
      if (!filter(processedData)) {
        return // 数据被过滤掉
      }
    }
    
    // 应用转换器
    for (const transformer of this.transformers) {
      processedData = transformer(processedData)
    }
    
    // 调用处理器
    for (const handler of this.handlers) {
      try {
        handler(processedData)
      } catch (error) {
        console.error('事件流处理错误:', error)
      }
    }
  }
}

// 创建用户活动事件流
const userActivityStream = new EventStream(engine, 'user:activity')
  .filter(activity => activity.userId !== null) // 过滤掉无用户ID的活动
  .filter(activity => activity.type !== 'heartbeat') // 过滤掉心跳活动
  .map(activity => ({ // 添加时间戳和会话ID
    ...activity,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId()
  }))
  .map(activity => ({ // 添加用户信息
    ...activity,
    userInfo: getUserInfo(activity.userId)
  }))
  .subscribe(activity => {
    console.log('📊 用户活动记录:', activity)
  })
  .subscribe(activity => {
    // 发送到分析服务
    sendToAnalytics(activity)
  })

// 创建错误事件流
const errorStream = new EventStream(engine, 'error')
  .filter(error => error.level === 'critical') // 只处理严重错误
  .map(error => ({ // 添加错误上下文
    ...error,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  }))
  .subscribe(error => {
    console.error('🚨 严重错误:', error)
  })
  .subscribe(error => {
    // 发送错误报告
    sendErrorReport(error)
  })
  .subscribe(error => {
    // 显示用户通知
    showErrorNotification(error)
  })

// 创建数据处理管道
class DataPipeline {
  private stages: Array<(data: any) => Promise<any>> = []
  
  addStage(processor: (data: any) => Promise<any>) {
    this.stages.push(processor)
    return this
  }
  
  async process(data: any) {
    let result = data
    
    for (let i = 0; i < this.stages.length; i++) {
      try {
        console.log(`执行管道阶段 ${i + 1}/${this.stages.length}`)
        result = await this.stages[i](result)
      } catch (error) {
        console.error(`管道阶段 ${i + 1} 失败:`, error.message)
        throw error
      }
    }
    
    return result
  }
}

// 创建数据处理管道
const dataPipeline = new DataPipeline()
  .addStage(async (data) => {
    console.log('阶段1: 数据验证')
    if (!data || typeof data !== 'object') {
      throw new Error('无效的数据格式')
    }
    return data
  })
  .addStage(async (data) => {
    console.log('阶段2: 数据清理')
    await delay(500)
    return {
      ...data,
      cleanedAt: new Date().toISOString(),
      // 移除敏感信息
      password: undefined,
      ssn: undefined
    }
  })
  .addStage(async (data) => {
    console.log('阶段3: 数据增强')
    await delay(300)
    return {
      ...data,
      id: data.id || generateId(),
      version: '1.0',
      metadata: {
        processedBy: 'DataPipeline',
        processedAt: new Date().toISOString()
      }
    }
  })
  .addStage(async (data) => {
    console.log('阶段4: 数据保存')
    await delay(800)
    // 模拟保存到数据库
    console.log('数据已保存到数据库')
    return {
      ...data,
      saved: true,
      savedAt: new Date().toISOString()
    }
  })

// 注册管道处理事件
engine.on('data:pipeline', async (data) => {
  try {
    console.log('🔄 开始数据管道处理')
    const result = await dataPipeline.process(data)
    
    console.log('✅ 数据管道处理完成')
    engine.emit('data:pipeline:success', result)
  } catch (error) {
    console.error('❌ 数据管道处理失败:', error.message)
    engine.emit('data:pipeline:error', { data, error: error.message })
  }
})

// 工具函数
function getSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9)
}

function getUserInfo(userId: string) {
  return {
    id: userId,
    name: `User ${userId}`,
    role: 'user'
  }
}

function sendToAnalytics(activity: any) {
  console.log('📈 发送到分析服务:', activity.type)
}

function sendErrorReport(error: any) {
  console.log('📧 发送错误报告:', error.message)
}

function showErrorNotification(error: any) {
  console.log('🔔 显示错误通知:', error.message)
}

function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 测试事件流和管道
engine.start().then(async () => {
  console.log('=== 测试事件流和管道 ===')
  
  // 1. 测试用户活动流
  console.log('\n1. 测试用户活动流')
  
  engine.emit('user:activity', {
    userId: 'user123',
    type: 'page_view',
    page: '/dashboard'
  })
  
  engine.emit('user:activity', {
    userId: 'user123',
    type: 'heartbeat' // 这个会被过滤掉
  })
  
  engine.emit('user:activity', {
    userId: null, // 这个会被过滤掉
    type: 'click',
    element: 'button'
  })
  
  engine.emit('user:activity', {
    userId: 'user456',
    type: 'click',
    element: 'link',
    url: '/products'
  })
  
  await delay(1000)
  
  // 2. 测试错误流
  console.log('\n2. 测试错误流')
  
  engine.emit('error', {
    level: 'warning',
    message: '这是一个警告' // 这个会被过滤掉
  })
  
  engine.emit('error', {
    level: 'critical',
    message: '严重错误：数据库连接失败',
    stack: 'Error stack trace...'
  })
  
  await delay(1000)
  
  // 3. 测试数据管道
  console.log('\n3. 测试数据管道')
  
  engine.emit('data:pipeline', {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secret123', // 这个会被清理掉
    ssn: '123-45-6789' // 这个也会被清理掉
  })
  
  await delay(3000)
  
  // 4. 测试管道错误处理
  console.log('\n4. 测试管道错误处理')
  
  engine.emit('data:pipeline', null) // 这会导致验证失败
})
```

## 事件调试和监控

### 事件调试工具

```typescript
import { Engine } from '@ldesign/engine'

// 事件调试器
class EventDebugger {
  private engine: Engine
  private eventLog: Array<{
    timestamp: string
    event: string
    data: any
    listeners: number
    duration?: number
  }> = []
  private isEnabled = false
  
  constructor(engine: Engine) {
    this.engine = engine
    this.setupInterceptors()
  }
  
  enable() {
    this.isEnabled = true
    console.log('🐛 事件调试器已启用')
  }
  
  disable() {
    this.isEnabled = false
    console.log('🐛 事件调试器已禁用')
  }
  
  private setupInterceptors() {
    // 拦截 emit 方法
    const originalEmit = this.engine.emit.bind(this.engine)
    
    this.engine.emit = (event: string, data?: any) => {
      if (this.isEnabled) {
        const startTime = performance.now()
        const listeners = this.engine.listenerCount(event)
        
        console.group(`🎯 事件触发: ${event}`)
        console.log('📊 监听器数量:', listeners)
        console.log('📦 事件数据:', data)
        
        const result = originalEmit(event, data)
        
        const duration = performance.now() - startTime
        console.log(`⏱️ 执行时间: ${duration.toFixed(2)}ms`)
        console.groupEnd()
        
        // 记录事件日志
        this.eventLog.push({
          timestamp: new Date().toISOString(),
          event,
          data,
          listeners,
          duration
        })
        
        return result
      }
      
      return originalEmit(event, data)
    }
    
    // 拦截 on 方法
    const originalOn = this.engine.on.bind(this.engine)
    
    this.engine.on = (event: string, listener: Function, options?: any) => {
      if (this.isEnabled) {
        console.log(`👂 注册监听器: ${event}`, options)
      }
      
      return originalOn(event, listener, options)
    }
    
    // 拦截 off 方法
    const originalOff = this.engine.off.bind(this.engine)
    
    this.engine.off = (event: string, listener?: Function) => {
      if (this.isEnabled) {
        console.log(`🚫 移除监听器: ${event}`)
      }
      
      return originalOff(event, listener)
    }
  }
  
  // 获取事件统计
  getStats() {
    const stats = {
      totalEvents: this.eventLog.length,
      eventTypes: {} as Record<string, number>,
      averageDuration: 0,
      slowestEvents: [] as any[]
    }
    
    let totalDuration = 0
    
    this.eventLog.forEach(log => {
      // 统计事件类型
      stats.eventTypes[log.event] = (stats.eventTypes[log.event] || 0) + 1
      
      // 计算平均执行时间
      if (log.duration) {
        totalDuration += log.duration
      }
    })
    
    stats.averageDuration = totalDuration / this.eventLog.length
    
    // 找出最慢的事件
    stats.slowestEvents = this.eventLog
      .filter(log => log.duration)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5)
    
    return stats
  }
  
  // 清空日志
  clearLog() {
    this.eventLog = []
    console.log('🧹 事件日志已清空')
  }
  
  // 导出日志
  exportLog() {
    return JSON.stringify(this.eventLog, null, 2)
  }
  
  // 搜索事件
  searchEvents(pattern: string | RegExp) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
    
    return this.eventLog.filter(log => 
      regex.test(log.event) || 
      regex.test(JSON.stringify(log.data))
    )
  }
}

// 性能监控器
class PerformanceMonitor {
  private engine: Engine
  private metrics: Map<string, {
    count: number
    totalTime: number
    minTime: number
    maxTime: number
    lastTime: number
  }> = new Map()
  
  constructor(engine: Engine) {
    this.engine = engine
    this.setupMonitoring()
  }
  
  private setupMonitoring() {
    // 监控所有事件的性能
    const originalEmit = this.engine.emit.bind(this.engine)
    
    this.engine.emit = (event: string, data?: any) => {
      const startTime = performance.now()
      const result = originalEmit(event, data)
      const duration = performance.now() - startTime
      
      this.recordMetric(event, duration)
      
      // 如果执行时间超过阈值，发出警告
      if (duration > 100) {
        console.warn(`⚠️ 慢事件警告: ${event} 执行时间 ${duration.toFixed(2)}ms`)
      }
      
      return result
    }
  }
  
  private recordMetric(event: string, duration: number) {
    const existing = this.metrics.get(event)
    
    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.minTime = Math.min(existing.minTime, duration)
      existing.maxTime = Math.max(existing.maxTime, duration)
      existing.lastTime = duration
    } else {
      this.metrics.set(event, {
        count: 1,
        totalTime: duration,
        minTime: duration,
        maxTime: duration,
        lastTime: duration
      })
    }
  }
  
  getReport() {
    const report = Array.from(this.metrics.entries()).map(([event, metrics]) => ({
      event,
      count: metrics.count,
      averageTime: metrics.totalTime / metrics.count,
      minTime: metrics.minTime,
      maxTime: metrics.maxTime,
      lastTime: metrics.lastTime,
      totalTime: metrics.totalTime
    }))
    
    // 按平均执行时间排序
    report.sort((a, b) => b.averageTime - a.averageTime)
    
    return report
  }
  
  printReport() {
    const report = this.getReport()
    
    console.table(report.map(item => ({
      '事件': item.event,
      '调用次数': item.count,
      '平均时间(ms)': item.averageTime.toFixed(2),
      '最小时间(ms)': item.minTime.toFixed(2),
      '最大时间(ms)': item.maxTime.toFixed(2),
      '最后时间(ms)': item.lastTime.toFixed(2)
    })))
  }
}

// 测试调试和监控
const engine = new Engine({ name: 'DebugExample' })
const debugger = new EventDebugger(engine)
const monitor = new PerformanceMonitor(engine)

// 注册一些测试事件
engine.on('fast:event', () => {
  // 快速事件
})

engine.on('slow:event', async () => {
  // 慢事件
  await new Promise(resolve => setTimeout(resolve, 150))
})

engine.on('user:action', (action) => {
  console.log('用户操作:', action)
})

engine.on('data:process', async (data) => {
  // 模拟数据处理
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
  console.log('数据处理完成:', data.id)
})

// 测试调试功能
engine.start().then(async () => {
  console.log('=== 测试事件调试和监控 ===')
  
  // 启用调试器
  debugger.enable()
  
  // 触发各种事件
  console.log('\n触发测试事件...')
  
  for (let i = 0; i < 10; i++) {
    engine.emit('fast:event')
    engine.emit('user:action', { type: 'click', target: `button_${i}` })
    
    if (i % 3 === 0) {
      engine.emit('slow:event')
    }
    
    engine.emit('data:process', { id: `data_${i}`, content: `content_${i}` })
    
    await delay(100)
  }
  
  await delay(2000)
  
  // 显示调试统计
  console.log('\n=== 调试统计 ===')
  const stats = debugger.getStats()
  console.log('事件统计:', stats)
  
  // 显示性能报告
  console.log('\n=== 性能报告 ===')
  monitor.printReport()
  
  // 搜索特定事件
  console.log('\n=== 搜索用户相关事件 ===')
  const userEvents = debugger.searchEvents('user')
  console.log('用户事件:', userEvents)
  
  // 禁用调试器
  debugger.disable()
})

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

## 总结

这些事件处理示例展示了 @ldesign/engine 事件系统的强大功能：

1. **基础事件处理** - 事件的注册、触发和管理
2. **高级事件模式** - 命名空间、优先级、通配符监听
3. **事件拦截** - 事件数据的验证、修改和拦截
4. **异步事件处理** - 异步监听器和批量处理
5. **事件流处理** - 函数式的事件流和数据管道
6. **调试和监控** - 事件调试工具和性能监控

通过这些示例，您可以充分利用 @ldesign/engine 的事件系统来构建响应式、可维护的应用程序。
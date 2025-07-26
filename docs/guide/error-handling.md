# 错误处理

错误处理是构建健壮应用程序的关键部分。@ldesign/engine 提供了完善的错误处理机制，包括错误捕获、错误恢复、错误报告和错误预防等功能。本章将详细介绍如何在引擎中处理各种类型的错误。

## 错误类型

### 内置错误类型

@ldesign/engine 定义了多种内置错误类型：

```typescript
// 引擎错误基类
class EngineError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message)
    this.name = 'EngineError'
  }
}

// 插件错误
class PluginError extends EngineError {
  constructor(
    message: string,
    public pluginName: string,
    context?: any
  ) {
    super(message, 'PLUGIN_ERROR', context)
    this.name = 'PluginError'
  }
}

// 状态错误
class StateError extends EngineError {
  constructor(
    message: string,
    public statePath: string,
    context?: any
  ) {
    super(message, 'STATE_ERROR', context)
    this.name = 'StateError'
  }
}

// 事件错误
class EventError extends EngineError {
  constructor(
    message: string,
    public eventName: string,
    context?: any
  ) {
    super(message, 'EVENT_ERROR', context)
    this.name = 'EventError'
  }
}

// 中间件错误
class MiddlewareError extends EngineError {
  constructor(
    message: string,
    public middlewareName: string,
    context?: any
  ) {
    super(message, 'MIDDLEWARE_ERROR', context)
    this.name = 'MiddlewareError'
  }
}

// 验证错误
class ValidationError extends EngineError {
  constructor(
    message: string,
    public field: string,
    public value: any,
    context?: any
  ) {
    super(message, 'VALIDATION_ERROR', context)
    this.name = 'ValidationError'
  }
}
```

### 自定义错误类型

```typescript
// 定义自定义错误类型
class BusinessError extends EngineError {
  constructor(
    message: string,
    public businessCode: string,
    context?: any
  ) {
    super(message, 'BUSINESS_ERROR', context)
    this.name = 'BusinessError'
  }
}

class NetworkError extends EngineError {
  constructor(
    message: string,
    public url: string,
    public status?: number,
    context?: any
  ) {
    super(message, 'NETWORK_ERROR', context)
    this.name = 'NetworkError'
  }
}

class AuthenticationError extends EngineError {
  constructor(
    message: string,
    public reason: string,
    context?: any
  ) {
    super(message, 'AUTH_ERROR', context)
    this.name = 'AuthenticationError'
  }
}

// 注册自定义错误类型
engine.registerErrorType('BusinessError', BusinessError)
engine.registerErrorType('NetworkError', NetworkError)
engine.registerErrorType('AuthenticationError', AuthenticationError)
```

## 错误捕获

### 全局错误处理

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  errorHandling: {
    // 启用全局错误捕获
    global: true,
    
    // 错误处理策略
    strategy: 'continue', // 'continue' | 'stop' | 'restart'
    
    // 最大重试次数
    maxRetries: 3,
    
    // 重试延迟（毫秒）
    retryDelay: 1000,
    
    // 错误报告
    reporting: {
      enabled: true,
      endpoint: '/api/errors',
      includeStackTrace: true,
      includeContext: true
    }
  }
})

// 全局错误处理器
engine.onError((error, context) => {
  console.error('全局错误:', error)
  console.error('错误上下文:', context)
  
  // 根据错误类型进行不同处理
  if (error instanceof NetworkError) {
    handleNetworkError(error)
  } else if (error instanceof AuthenticationError) {
    handleAuthError(error)
  } else if (error instanceof ValidationError) {
    handleValidationError(error)
  } else {
    handleGenericError(error)
  }
})

// 未捕获错误处理
engine.onUnhandledError((error, context) => {
  console.error('未处理的错误:', error)
  
  // 发送错误报告
  sendErrorReport(error, context)
  
  // 显示用户友好的错误消息
  showErrorNotification('发生了意外错误，请稍后重试')
})
```

### 特定类型错误处理

```typescript
// 插件错误处理
engine.onPluginError((error, pluginName, context) => {
  console.error(`插件 ${pluginName} 发生错误:`, error)
  
  // 禁用有问题的插件
  engine.disablePlugin(pluginName)
  
  // 通知用户
  showNotification(`插件 ${pluginName} 已被禁用`, 'warning')
})

// 状态错误处理
engine.onStateError((error, statePath, context) => {
  console.error(`状态 ${statePath} 发生错误:`, error)
  
  // 恢复到上一个有效状态
  engine.undoState(statePath)
  
  // 记录错误
  logStateError(statePath, error, context)
})

// 事件错误处理
engine.onEventError((error, eventName, context) => {
  console.error(`事件 ${eventName} 处理错误:`, error)
  
  // 移除有问题的事件监听器
  if (context.listenerId) {
    engine.off(eventName, context.listenerId)
  }
})

// 中间件错误处理
engine.onMiddlewareError((error, middlewareName, context) => {
  console.error(`中间件 ${middlewareName} 发生错误:`, error)
  
  // 跳过有问题的中间件
  engine.skipMiddleware(middlewareName)
})
```

### 异步错误处理

```typescript
// Promise 错误处理
engine.onPromiseRejection((reason, promise, context) => {
  console.error('Promise 被拒绝:', reason)
  console.error('Promise:', promise)
  console.error('上下文:', context)
  
  // 处理特定类型的 Promise 错误
  if (reason instanceof NetworkError) {
    // 网络错误重试
    retryNetworkRequest(context.originalRequest)
  } else if (reason instanceof ValidationError) {
    // 验证错误显示给用户
    showValidationError(reason.field, reason.message)
  }
})

// 异步操作错误处理
engine.onAsyncError(async (error, operation, context) => {
  console.error(`异步操作 ${operation} 发生错误:`, error)
  
  try {
    // 尝试恢复操作
    await recoverAsyncOperation(operation, context)
  } catch (recoveryError) {
    console.error('恢复操作失败:', recoveryError)
    
    // 记录严重错误
    await logCriticalError(error, recoveryError, context)
  }
})
```

## 错误恢复

### 自动错误恢复

```typescript
// 配置自动恢复策略
engine.configureErrorRecovery({
  // 插件错误恢复
  plugin: {
    strategy: 'restart', // 'restart' | 'disable' | 'ignore'
    maxAttempts: 3,
    backoffDelay: 1000
  },
  
  // 状态错误恢复
  state: {
    strategy: 'rollback', // 'rollback' | 'reset' | 'ignore'
    preserveHistory: true,
    maxRollbacks: 5
  },
  
  // 事件错误恢复
  event: {
    strategy: 'retry', // 'retry' | 'skip' | 'stop'
    maxRetries: 3,
    retryDelay: 500
  },
  
  // 网络错误恢复
  network: {
    strategy: 'exponential-backoff',
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000
  }
})

// 自定义恢复处理器
engine.addRecoveryHandler('plugin', async (error, context) => {
  const { pluginName } = context
  
  try {
    // 尝试重新初始化插件
    await engine.reinitializePlugin(pluginName)
    console.log(`插件 ${pluginName} 恢复成功`)
    return true
  } catch (recoveryError) {
    console.error(`插件 ${pluginName} 恢复失败:`, recoveryError)
    
    // 降级处理：禁用插件
    engine.disablePlugin(pluginName)
    return false
  }
})

engine.addRecoveryHandler('state', async (error, context) => {
  const { statePath } = context
  
  try {
    // 尝试从持久化存储恢复状态
    const persistedState = await engine.loadPersistedState(statePath)
    if (persistedState) {
      engine.setState(statePath, persistedState)
      console.log(`状态 ${statePath} 从持久化存储恢复成功`)
      return true
    }
    
    // 回滚到上一个有效状态
    engine.undoState(statePath)
    console.log(`状态 ${statePath} 回滚成功`)
    return true
  } catch (recoveryError) {
    console.error(`状态 ${statePath} 恢复失败:`, recoveryError)
    
    // 重置为默认值
    engine.resetState(statePath)
    return false
  }
})
```

### 手动错误恢复

```typescript
// 手动恢复操作
class ErrorRecoveryManager {
  constructor(private engine: Engine) {}
  
  async recoverFromError(error: Error, context: any): Promise<boolean> {
    console.log('开始错误恢复:', error.message)
    
    try {
      // 根据错误类型选择恢复策略
      if (error instanceof PluginError) {
        return await this.recoverPluginError(error, context)
      } else if (error instanceof StateError) {
        return await this.recoverStateError(error, context)
      } else if (error instanceof NetworkError) {
        return await this.recoverNetworkError(error, context)
      } else {
        return await this.recoverGenericError(error, context)
      }
    } catch (recoveryError) {
      console.error('恢复过程中发生错误:', recoveryError)
      return false
    }
  }
  
  private async recoverPluginError(error: PluginError, context: any): Promise<boolean> {
    const { pluginName } = error
    
    // 1. 尝试重启插件
    try {
      await this.engine.restartPlugin(pluginName)
      return true
    } catch {}
    
    // 2. 尝试重新加载插件
    try {
      await this.engine.reloadPlugin(pluginName)
      return true
    } catch {}
    
    // 3. 禁用插件
    this.engine.disablePlugin(pluginName)
    return false
  }
  
  private async recoverStateError(error: StateError, context: any): Promise<boolean> {
    const { statePath } = error
    
    // 1. 尝试回滚状态
    try {
      this.engine.undoState(statePath)
      return true
    } catch {}
    
    // 2. 尝试从备份恢复
    try {
      const backup = await this.engine.getStateBackup(statePath)
      if (backup) {
        this.engine.setState(statePath, backup)
        return true
      }
    } catch {}
    
    // 3. 重置为默认值
    this.engine.resetState(statePath)
    return false
  }
  
  private async recoverNetworkError(error: NetworkError, context: any): Promise<boolean> {
    const { url, status } = error
    
    // 根据状态码选择恢复策略
    if (status === 401) {
      // 认证错误：刷新令牌
      try {
        await this.refreshAuthToken()
        return true
      } catch {}
    } else if (status >= 500) {
      // 服务器错误：重试请求
      try {
        await this.retryRequest(context.originalRequest)
        return true
      } catch {}
    }
    
    return false
  }
  
  private async recoverGenericError(error: Error, context: any): Promise<boolean> {
    // 通用恢复策略
    console.log('执行通用错误恢复')
    
    // 清理可能的损坏状态
    this.engine.clearTempState()
    
    // 重新初始化关键组件
    await this.engine.reinitializeCoreComponents()
    
    return true
  }
  
  private async refreshAuthToken(): Promise<void> {
    // 刷新认证令牌的实现
  }
  
  private async retryRequest(request: any): Promise<void> {
    // 重试网络请求的实现
  }
}

// 使用错误恢复管理器
const recoveryManager = new ErrorRecoveryManager(engine)

engine.onError(async (error, context) => {
  const recovered = await recoveryManager.recoverFromError(error, context)
  
  if (recovered) {
    console.log('错误恢复成功')
    showNotification('系统已自动恢复', 'success')
  } else {
    console.error('错误恢复失败')
    showNotification('系统恢复失败，请刷新页面', 'error')
  }
})
```

## 错误报告

### 错误日志记录

```typescript
// 配置错误日志
engine.configureErrorLogging({
  level: 'error', // 'debug' | 'info' | 'warn' | 'error'
  format: 'json', // 'json' | 'text'
  includeStackTrace: true,
  includeContext: true,
  includeUserAgent: true,
  includeTimestamp: true,
  
  // 日志输出目标
  targets: [
    {
      type: 'console',
      level: 'error'
    },
    {
      type: 'file',
      level: 'warn',
      filename: 'app-errors.log',
      maxSize: '10MB',
      maxFiles: 5
    },
    {
      type: 'remote',
      level: 'error',
      endpoint: '/api/logs',
      batchSize: 10,
      flushInterval: 5000
    }
  ]
})

// 自定义日志格式化器
engine.setErrorLogFormatter((error, context) => {
  return {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    stack: error.stack,
    code: error.code,
    type: error.constructor.name,
    context: {
      userId: context.userId,
      sessionId: context.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      engineVersion: engine.version,
      pluginVersions: engine.getPluginVersions()
    },
    metadata: {
      severity: getSeverityLevel(error),
      category: getErrorCategory(error),
      tags: getErrorTags(error, context)
    }
  }
})
```

### 错误报告服务

```typescript
// 错误报告服务
class ErrorReportingService {
  private queue: ErrorReport[] = []
  private isOnline = navigator.onLine
  
  constructor(private engine: Engine) {
    this.setupNetworkListeners()
    this.setupPeriodicFlush()
  }
  
  async reportError(error: Error, context: any): Promise<void> {
    const report = this.createErrorReport(error, context)
    
    // 添加到队列
    this.queue.push(report)
    
    // 立即发送严重错误
    if (report.severity === 'critical') {
      await this.flushQueue()
    }
  }
  
  private createErrorReport(error: Error, context: any): ErrorReport {
    return {
      id: generateId(),
      timestamp: Date.now(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      },
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      environment: {
        engineVersion: this.engine.version,
        pluginVersions: this.engine.getPluginVersions(),
        browserInfo: getBrowserInfo(),
        deviceInfo: getDeviceInfo()
      },
      severity: this.calculateSeverity(error),
      category: this.categorizeError(error),
      tags: this.generateTags(error, context)
    }
  }
  
  private async flushQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) {
      return
    }
    
    const reports = this.queue.splice(0, 10) // 批量发送
    
    try {
      await fetch('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reports })
      })
      
      console.log(`成功发送 ${reports.length} 个错误报告`)
    } catch (error) {
      console.error('发送错误报告失败:', error)
      
      // 重新添加到队列
      this.queue.unshift(...reports)
    }
  }
  
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushQueue()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }
  
  private setupPeriodicFlush(): void {
    setInterval(() => {
      this.flushQueue()
    }, 30000) // 每30秒发送一次
  }
  
  private calculateSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    if (error instanceof AuthenticationError) return 'high'
    if (error instanceof NetworkError) return 'medium'
    if (error instanceof ValidationError) return 'low'
    if (error instanceof PluginError) return 'medium'
    if (error instanceof StateError) return 'high'
    return 'medium'
  }
  
  private categorizeError(error: Error): string {
    if (error instanceof NetworkError) return 'network'
    if (error instanceof AuthenticationError) return 'auth'
    if (error instanceof ValidationError) return 'validation'
    if (error instanceof PluginError) return 'plugin'
    if (error instanceof StateError) return 'state'
    return 'general'
  }
  
  private generateTags(error: Error, context: any): string[] {
    const tags = []
    
    if (error.name) tags.push(`error:${error.name}`)
    if (context.pluginName) tags.push(`plugin:${context.pluginName}`)
    if (context.statePath) tags.push(`state:${context.statePath}`)
    if (context.eventName) tags.push(`event:${context.eventName}`)
    
    return tags
  }
}

// 使用错误报告服务
const errorReporting = new ErrorReportingService(engine)

engine.onError((error, context) => {
  errorReporting.reportError(error, context)
})
```

### 错误分析和监控

```typescript
// 错误分析服务
class ErrorAnalyticsService {
  private errorStats = new Map<string, ErrorStats>()
  private errorTrends: ErrorTrend[] = []
  
  constructor(private engine: Engine) {
    this.setupErrorTracking()
  }
  
  private setupErrorTracking(): void {
    this.engine.onError((error, context) => {
      this.trackError(error, context)
      this.updateErrorStats(error)
      this.detectErrorPatterns(error, context)
    })
  }
  
  private trackError(error: Error, context: any): void {
    const errorKey = `${error.name}:${error.message}`
    const stats = this.errorStats.get(errorKey) || {
      count: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      contexts: []
    }
    
    stats.count++
    stats.lastSeen = Date.now()
    stats.contexts.push({
      timestamp: Date.now(),
      ...context
    })
    
    // 只保留最近的100个上下文
    if (stats.contexts.length > 100) {
      stats.contexts = stats.contexts.slice(-100)
    }
    
    this.errorStats.set(errorKey, stats)
  }
  
  private updateErrorStats(error: Error): void {
    const now = Date.now()
    const hourKey = Math.floor(now / (1000 * 60 * 60))
    
    const trend = this.errorTrends.find(t => t.hour === hourKey) || {
      hour: hourKey,
      total: 0,
      byType: new Map<string, number>()
    }
    
    trend.total++
    trend.byType.set(error.name, (trend.byType.get(error.name) || 0) + 1)
    
    if (!this.errorTrends.find(t => t.hour === hourKey)) {
      this.errorTrends.push(trend)
    }
    
    // 只保留最近24小时的数据
    this.errorTrends = this.errorTrends.filter(t => t.hour > hourKey - 24)
  }
  
  private detectErrorPatterns(error: Error, context: any): void {
    const errorKey = `${error.name}:${error.message}`
    const stats = this.errorStats.get(errorKey)
    
    if (!stats) return
    
    // 检测错误激增
    if (stats.count > 10) {
      const recentErrors = stats.contexts.filter(
        c => c.timestamp > Date.now() - 5 * 60 * 1000 // 最近5分钟
      )
      
      if (recentErrors.length > 5) {
        this.engine.emit('error:spike-detected', {
          error: errorKey,
          count: recentErrors.length,
          timeWindow: '5m'
        })
      }
    }
    
    // 检测错误循环
    if (stats.contexts.length >= 3) {
      const lastThree = stats.contexts.slice(-3)
      const timeDiffs = [
        lastThree[1].timestamp - lastThree[0].timestamp,
        lastThree[2].timestamp - lastThree[1].timestamp
      ]
      
      if (timeDiffs.every(diff => diff < 1000)) { // 1秒内重复
        this.engine.emit('error:loop-detected', {
          error: errorKey,
          frequency: timeDiffs
        })
      }
    }
  }
  
  getErrorReport(): ErrorReport {
    const now = Date.now()
    const last24h = now - 24 * 60 * 60 * 1000
    
    const recentErrors = Array.from(this.errorStats.entries())
      .filter(([_, stats]) => stats.lastSeen > last24h)
      .sort(([_, a], [__, b]) => b.count - a.count)
    
    return {
      summary: {
        totalErrors: recentErrors.reduce((sum, [_, stats]) => sum + stats.count, 0),
        uniqueErrors: recentErrors.length,
        timeRange: '24h'
      },
      topErrors: recentErrors.slice(0, 10).map(([key, stats]) => ({
        error: key,
        count: stats.count,
        firstSeen: stats.firstSeen,
        lastSeen: stats.lastSeen
      })),
      trends: this.errorTrends,
      patterns: this.detectCurrentPatterns()
    }
  }
  
  private detectCurrentPatterns(): ErrorPattern[] {
    // 实现错误模式检测逻辑
    return []
  }
}

// 使用错误分析服务
const errorAnalytics = new ErrorAnalyticsService(engine)

// 监听错误模式
engine.on('error:spike-detected', (data) => {
  console.warn('检测到错误激增:', data)
  showNotification(`错误 ${data.error} 在 ${data.timeWindow} 内发生了 ${data.count} 次`, 'warning')
})

engine.on('error:loop-detected', (data) => {
  console.error('检测到错误循环:', data)
  showNotification('检测到错误循环，系统可能存在问题', 'error')
})

// 定期生成错误报告
setInterval(() => {
  const report = errorAnalytics.getErrorReport()
  console.log('错误报告:', report)
  
  // 发送到监控服务
  sendToMonitoring(report)
}, 60 * 60 * 1000) // 每小时
```

## 错误预防

### 输入验证

```typescript
// 参数验证装饰器
function validateParams(schema: any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      try {
        // 验证参数
        validateSchema(args, schema)
        return originalMethod.apply(this, args)
      } catch (error) {
        throw new ValidationError(
          `参数验证失败: ${error.message}`,
          propertyKey,
          args
        )
      }
    }
    
    return descriptor
  }
}

// 使用参数验证
class UserService {
  @validateParams({
    type: 'array',
    items: [
      { type: 'string', minLength: 1 }, // name
      { type: 'string', format: 'email' }, // email
      { type: 'number', minimum: 0 } // age
    ]
  })
  createUser(name: string, email: string, age: number) {
    // 创建用户逻辑
  }
  
  @validateParams({
    type: 'array',
    items: [
      { type: 'number', minimum: 1 } // userId
    ]
  })
  deleteUser(userId: number) {
    // 删除用户逻辑
  }
}
```

### 防御性编程

```typescript
// 安全的状态访问
function safeGetState<T>(engine: Engine, path: string, defaultValue?: T): T {
  try {
    const value = engine.getState(path)
    return value !== undefined ? value : defaultValue
  } catch (error) {
    console.warn(`获取状态 ${path} 失败:`, error)
    return defaultValue
  }
}

// 安全的状态设置
function safeSetState(engine: Engine, path: string, value: any): boolean {
  try {
    engine.setState(path, value)
    return true
  } catch (error) {
    console.error(`设置状态 ${path} 失败:`, error)
    return false
  }
}

// 安全的插件调用
function safeCallPlugin<T>(
  engine: Engine,
  pluginName: string,
  method: string,
  ...args: any[]
): T | null {
  try {
    const plugin = engine.getPlugin(pluginName)
    if (!plugin || !plugin[method]) {
      throw new Error(`插件方法 ${pluginName}.${method} 不存在`)
    }
    
    return plugin[method](...args)
  } catch (error) {
    console.error(`调用插件方法 ${pluginName}.${method} 失败:`, error)
    return null
  }
}

// 安全的异步操作
async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  fallback?: T,
  timeout = 5000
): Promise<T | undefined> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('操作超时')), timeout)
    })
    
    const result = await Promise.race([operation(), timeoutPromise])
    return result
  } catch (error) {
    console.error('异步操作失败:', error)
    return fallback
  }
}
```

### 错误边界

```typescript
// 插件错误边界
class PluginErrorBoundary {
  private failedPlugins = new Set<string>()
  
  constructor(private engine: Engine) {
    this.setupErrorBoundary()
  }
  
  private setupErrorBoundary(): void {
    // 包装插件方法
    this.engine.onPluginRegister((plugin) => {
      this.wrapPluginMethods(plugin)
    })
  }
  
  private wrapPluginMethods(plugin: any): void {
    const pluginName = plugin.name
    
    Object.getOwnPropertyNames(plugin)
      .filter(prop => typeof plugin[prop] === 'function')
      .forEach(methodName => {
        const originalMethod = plugin[methodName]
        
        plugin[methodName] = (...args: any[]) => {
          try {
            // 检查插件是否已失败
            if (this.failedPlugins.has(pluginName)) {
              console.warn(`插件 ${pluginName} 已被禁用，跳过方法 ${methodName}`)
              return
            }
            
            return originalMethod.apply(plugin, args)
          } catch (error) {
            console.error(`插件 ${pluginName} 方法 ${methodName} 发生错误:`, error)
            
            // 标记插件为失败
            this.failedPlugins.add(pluginName)
            
            // 触发插件错误事件
            this.engine.emit('plugin:error', {
              pluginName,
              methodName,
              error,
              args
            })
            
            throw new PluginError(
              `插件 ${pluginName} 方法 ${methodName} 执行失败`,
              pluginName,
              { methodName, error, args }
            )
          }
        }
      })
  }
  
  recoverPlugin(pluginName: string): boolean {
    try {
      // 重新初始化插件
      this.engine.reinitializePlugin(pluginName)
      
      // 从失败列表中移除
      this.failedPlugins.delete(pluginName)
      
      console.log(`插件 ${pluginName} 恢复成功`)
      return true
    } catch (error) {
      console.error(`插件 ${pluginName} 恢复失败:`, error)
      return false
    }
  }
}

// 使用插件错误边界
const pluginErrorBoundary = new PluginErrorBoundary(engine)

// 监听插件错误并尝试恢复
engine.on('plugin:error', async ({ pluginName }) => {
  console.log(`尝试恢复插件 ${pluginName}`)
  
  // 等待一段时间后尝试恢复
  setTimeout(() => {
    const recovered = pluginErrorBoundary.recoverPlugin(pluginName)
    if (recovered) {
      showNotification(`插件 ${pluginName} 已恢复`, 'success')
    } else {
      showNotification(`插件 ${pluginName} 恢复失败`, 'error')
    }
  }, 5000)
})
```

## 最佳实践

### 1. 错误分类和优先级

```typescript
// 定义错误严重程度
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 错误分类器
class ErrorClassifier {
  static classify(error: Error): { severity: ErrorSeverity; category: string } {
    // 关键错误
    if (error instanceof AuthenticationError) {
      return { severity: ErrorSeverity.HIGH, category: 'security' }
    }
    
    // 数据错误
    if (error instanceof StateError) {
      return { severity: ErrorSeverity.HIGH, category: 'data' }
    }
    
    // 网络错误
    if (error instanceof NetworkError) {
      const networkError = error as NetworkError
      if (networkError.status >= 500) {
        return { severity: ErrorSeverity.HIGH, category: 'network' }
      } else {
        return { severity: ErrorSeverity.MEDIUM, category: 'network' }
      }
    }
    
    // 验证错误
    if (error instanceof ValidationError) {
      return { severity: ErrorSeverity.LOW, category: 'validation' }
    }
    
    // 插件错误
    if (error instanceof PluginError) {
      return { severity: ErrorSeverity.MEDIUM, category: 'plugin' }
    }
    
    // 默认分类
    return { severity: ErrorSeverity.MEDIUM, category: 'general' }
  }
}
```

### 2. 用户友好的错误消息

```typescript
// 错误消息映射
const ERROR_MESSAGES = {
  'NETWORK_ERROR': {
    user: '网络连接出现问题，请检查您的网络设置',
    developer: 'Network request failed'
  },
  'AUTH_ERROR': {
    user: '登录已过期，请重新登录',
    developer: 'Authentication token expired'
  },
  'VALIDATION_ERROR': {
    user: '输入的信息格式不正确，请检查后重试',
    developer: 'Input validation failed'
  },
  'PLUGIN_ERROR': {
    user: '某个功能模块出现问题，已自动禁用',
    developer: 'Plugin execution failed'
  }
}

// 错误消息处理器
class ErrorMessageHandler {
  static getUserMessage(error: Error): string {
    const errorCode = (error as any).code || 'UNKNOWN_ERROR'
    const mapping = ERROR_MESSAGES[errorCode]
    
    if (mapping) {
      return mapping.user
    }
    
    // 默认用户消息
    return '系统出现了一个问题，我们正在努力修复'
  }
  
  static getDeveloperMessage(error: Error): string {
    const errorCode = (error as any).code || 'UNKNOWN_ERROR'
    const mapping = ERROR_MESSAGES[errorCode]
    
    if (mapping) {
      return mapping.developer
    }
    
    return error.message
  }
}

// 使用错误消息处理器
engine.onError((error, context) => {
  const userMessage = ErrorMessageHandler.getUserMessage(error)
  const developerMessage = ErrorMessageHandler.getDeveloperMessage(error)
  
  // 显示用户友好消息
  showNotification(userMessage, 'error')
  
  // 记录开发者消息
  console.error('开发者错误信息:', developerMessage, error)
})
```

### 3. 错误处理策略

```typescript
// 错误处理策略配置
const ERROR_HANDLING_STRATEGIES = {
  development: {
    logLevel: 'debug',
    showStackTrace: true,
    enableRecovery: true,
    reportToService: false
  },
  staging: {
    logLevel: 'warn',
    showStackTrace: true,
    enableRecovery: true,
    reportToService: true
  },
  production: {
    logLevel: 'error',
    showStackTrace: false,
    enableRecovery: true,
    reportToService: true
  }
}

// 根据环境配置错误处理
const environment = process.env.NODE_ENV || 'development'
const strategy = ERROR_HANDLING_STRATEGIES[environment]

engine.configureErrorHandling({
  logLevel: strategy.logLevel,
  includeStackTrace: strategy.showStackTrace,
  enableAutoRecovery: strategy.enableRecovery,
  reporting: {
    enabled: strategy.reportToService,
    endpoint: '/api/errors'
  }
})
```

## 下一步

现在您已经掌握了错误处理的使用，可以继续学习：

- [性能优化](/guide/performance) - 了解性能优化技巧
- [测试](/guide/testing) - 学习如何测试错误处理
- [部署](/guide/deployment) - 掌握生产环境部署
- [API 参考](/api/error-handling) - 查看完整的错误处理 API 文档
- [示例](/examples/error-patterns) - 查看更多错误处理模式示例
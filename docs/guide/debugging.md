# 调试技巧

本章将介绍在使用 @ldesign/engine 开发过程中的各种调试技巧和工具，帮助您快速定位和解决问题。

## 开启调试模式

### 基本调试配置

```typescript
import { Engine } from '@ldesign/engine'

// 开启调试模式
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  debug: true, // 开启调试模式
  logLevel: 'debug' // 设置日志级别
})

// 或者通过环境变量
process.env.DEBUG = 'ldesign:*'
process.env.LOG_LEVEL = 'debug'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})
```

### 详细调试配置

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  debug: {
    enabled: true,
    events: true,        // 调试事件
    plugins: true,       // 调试插件
    middleware: true,    // 调试中间件
    state: true,         // 调试状态管理
    performance: true,   // 性能调试
    memory: true         // 内存调试
  },
  logger: {
    level: 'debug',
    format: 'detailed',
    timestamp: true,
    colors: true
  }
})
```

## 事件调试

### 事件监听器调试

```typescript
// 调试事件监听器
class EventDebugger {
  constructor(private engine: Engine) {
    this.setupEventDebugging()
  }
  
  private setupEventDebugging() {
    // 拦截所有事件
    const originalEmit = this.engine.emit.bind(this.engine)
    const originalOn = this.engine.on.bind(this.engine)
    const originalOff = this.engine.off.bind(this.engine)
    
    // 调试事件发布
    this.engine.emit = (event: string, data?: any) => {
      const listeners = this.engine.listenerCount(event)
      
      console.group(`🚀 [EVENT EMIT] ${event}`)
      console.log('📊 监听器数量:', listeners)
      console.log('📦 事件数据:', data)
      console.log('⏰ 时间戳:', new Date().toISOString())
      
      if (listeners === 0) {
        console.warn('⚠️ 没有监听器处理此事件')
      }
      
      const result = originalEmit(event, data)
      console.groupEnd()
      
      return result
    }
    
    // 调试事件监听
    this.engine.on = (event: string, listener: Function, options?: any) => {
      console.log(`👂 [EVENT LISTEN] 注册监听器: ${event}`, {
        options,
        listenerName: listener.name || 'anonymous',
        stackTrace: new Error().stack?.split('\n').slice(1, 4)
      })
      
      return originalOn(event, listener, options)
    }
    
    // 调试事件移除
    this.engine.off = (event: string, listener?: Function) => {
      console.log(`🔇 [EVENT UNLISTEN] 移除监听器: ${event}`, {
        listenerName: listener?.name || 'all listeners'
      })
      
      return originalOff(event, listener)
    }
  }
  
  // 获取事件监听器信息
  getListenerInfo(): Record<string, {
    count: number
    listeners: Array<{
      name: string
      source: string
    }>
  }> {
    const events = this.engine.eventNames()
    const info: Record<string, any> = {}
    
    events.forEach(event => {
      const listeners = this.engine.listeners(event)
      info[event] = {
        count: listeners.length,
        listeners: listeners.map(listener => ({
          name: listener.name || 'anonymous',
          source: this.getFunctionSource(listener)
        }))
      }
    })
    
    return info
  }
  
  private getFunctionSource(fn: Function): string {
    const source = fn.toString()
    const lines = source.split('\n')
    return lines.length > 1 ? `${lines[0]}...` : source
  }
}

const eventDebugger = new EventDebugger(engine)

// 查看监听器信息
console.log('事件监听器信息:', eventDebugger.getListenerInfo())
```

### 事件流追踪

```typescript
// 事件流追踪器
class EventFlowTracer {
  private traces: Array<{
    id: string
    event: string
    timestamp: Date
    data: any
    parentId?: string
    children: string[]
  }> = []
  
  constructor(private engine: Engine) {
    this.setupTracing()
  }
  
  private setupTracing() {
    const originalEmit = this.engine.emit.bind(this.engine)
    
    this.engine.emit = (event: string, data?: any) => {
      const traceId = this.generateTraceId()
      const parentId = this.getCurrentTraceId()
      
      const trace = {
        id: traceId,
        event,
        timestamp: new Date(),
        data,
        parentId,
        children: []
      }
      
      this.traces.push(trace)
      
      // 更新父级追踪
      if (parentId) {
        const parent = this.traces.find(t => t.id === parentId)
        if (parent) {
          parent.children.push(traceId)
        }
      }
      
      // 设置当前追踪上下文
      this.setCurrentTraceId(traceId)
      
      try {
        const result = originalEmit(event, data)
        return result
      } finally {
        this.clearCurrentTraceId()
      }
    }
  }
  
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private getCurrentTraceId(): string | undefined {
    return (globalThis as any).__currentTraceId
  }
  
  private setCurrentTraceId(id: string) {
    (globalThis as any).__currentTraceId = id
  }
  
  private clearCurrentTraceId() {
    delete (globalThis as any).__currentTraceId
  }
  
  // 获取事件流图
  getEventFlow(rootEvent?: string): any {
    const roots = this.traces.filter(t => 
      !t.parentId && (!rootEvent || t.event === rootEvent)
    )
    
    return roots.map(root => this.buildTraceTree(root))
  }
  
  private buildTraceTree(trace: any): any {
    const children = trace.children.map((childId: string) => {
      const child = this.traces.find(t => t.id === childId)
      return child ? this.buildTraceTree(child) : null
    }).filter(Boolean)
    
    return {
      id: trace.id,
      event: trace.event,
      timestamp: trace.timestamp,
      duration: this.calculateDuration(trace),
      children
    }
  }
  
  private calculateDuration(trace: any): number {
    if (trace.children.length === 0) return 0
    
    const lastChild = trace.children
      .map((id: string) => this.traces.find(t => t.id === id))
      .filter(Boolean)
      .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    
    return lastChild ? lastChild.timestamp.getTime() - trace.timestamp.getTime() : 0
  }
  
  // 可视化事件流
  visualizeEventFlow(rootEvent?: string) {
    const flow = this.getEventFlow(rootEvent)
    
    console.log('📊 事件流追踪:')
    flow.forEach(root => this.printTraceTree(root, 0))
  }
  
  private printTraceTree(trace: any, depth: number) {
    const indent = '  '.repeat(depth)
    const duration = trace.duration > 0 ? ` (${trace.duration}ms)` : ''
    
    console.log(`${indent}${depth === 0 ? '🌳' : '├─'} ${trace.event}${duration}`)
    
    trace.children.forEach((child: any) => {
      this.printTraceTree(child, depth + 1)
    })
  }
}

const eventTracer = new EventFlowTracer(engine)

// 查看事件流
setTimeout(() => {
  eventTracer.visualizeEventFlow()
}, 5000)
```

## 插件调试

### 插件生命周期调试

```typescript
// 插件调试器
class PluginDebugger {
  private pluginStates: Map<string, {
    status: 'installing' | 'installed' | 'starting' | 'started' | 'stopping' | 'stopped' | 'error'
    startTime?: Date
    endTime?: Date
    error?: Error
    dependencies: string[]
    dependents: string[]
  }> = new Map()
  
  constructor(private engine: Engine) {
    this.setupPluginDebugging()
  }
  
  private setupPluginDebugging() {
    // 监听插件生命周期事件
    this.engine.on('plugin:installing', (plugin) => {
      console.log(`🔧 [PLUGIN] 正在安装: ${plugin.name}`)
      
      this.pluginStates.set(plugin.name, {
        status: 'installing',
        startTime: new Date(),
        dependencies: plugin.dependencies || [],
        dependents: []
      })
    })
    
    this.engine.on('plugin:installed', (plugin) => {
      console.log(`✅ [PLUGIN] 安装完成: ${plugin.name}`)
      
      const state = this.pluginStates.get(plugin.name)
      if (state) {
        state.status = 'installed'
        state.endTime = new Date()
      }
    })
    
    this.engine.on('plugin:starting', (plugin) => {
      console.log(`🚀 [PLUGIN] 正在启动: ${plugin.name}`)
      
      const state = this.pluginStates.get(plugin.name)
      if (state) {
        state.status = 'starting'
        state.startTime = new Date()
      }
    })
    
    this.engine.on('plugin:started', (plugin) => {
      console.log(`🟢 [PLUGIN] 启动完成: ${plugin.name}`)
      
      const state = this.pluginStates.get(plugin.name)
      if (state) {
        state.status = 'started'
        state.endTime = new Date()
      }
    })
    
    this.engine.on('plugin:error', (plugin, error) => {
      console.error(`❌ [PLUGIN] 错误: ${plugin.name}`, error)
      
      const state = this.pluginStates.get(plugin.name)
      if (state) {
        state.status = 'error'
        state.error = error
        state.endTime = new Date()
      }
    })
  }
  
  // 获取插件状态报告
  getPluginReport(): Record<string, any> {
    const report: Record<string, any> = {}
    
    this.pluginStates.forEach((state, name) => {
      const duration = state.startTime && state.endTime 
        ? state.endTime.getTime() - state.startTime.getTime()
        : undefined
      
      report[name] = {
        status: state.status,
        duration,
        dependencies: state.dependencies,
        dependents: state.dependents,
        error: state.error?.message
      }
    })
    
    return report
  }
  
  // 检查插件依赖
  checkDependencies(): {
    missing: string[]
    circular: string[][]
    conflicts: Array<{
      plugin: string
      conflict: string
      reason: string
    }>
  } {
    const missing: string[] = []
    const circular: string[][] = []
    const conflicts: Array<any> = []
    
    // 检查缺失依赖
    this.pluginStates.forEach((state, name) => {
      state.dependencies.forEach(dep => {
        if (!this.pluginStates.has(dep)) {
          missing.push(`${name} -> ${dep}`)
        }
      })
    })
    
    // 检查循环依赖
    this.pluginStates.forEach((state, name) => {
      const visited = new Set<string>()
      const path: string[] = []
      
      const checkCircular = (current: string): boolean => {
        if (path.includes(current)) {
          const cycle = path.slice(path.indexOf(current))
          cycle.push(current)
          circular.push(cycle)
          return true
        }
        
        if (visited.has(current)) return false
        
        visited.add(current)
        path.push(current)
        
        const currentState = this.pluginStates.get(current)
        if (currentState) {
          for (const dep of currentState.dependencies) {
            if (checkCircular(dep)) return true
          }
        }
        
        path.pop()
        return false
      }
      
      checkCircular(name)
    })
    
    return { missing, circular, conflicts }
  }
  
  // 可视化插件依赖图
  visualizeDependencies() {
    console.log('📊 插件依赖关系:')
    
    this.pluginStates.forEach((state, name) => {
      const status = this.getStatusIcon(state.status)
      console.log(`${status} ${name}`)
      
      if (state.dependencies.length > 0) {
        state.dependencies.forEach(dep => {
          const depState = this.pluginStates.get(dep)
          const depStatus = depState ? this.getStatusIcon(depState.status) : '❓'
          console.log(`  ├─ 依赖: ${depStatus} ${dep}`)
        })
      }
      
      if (state.dependents.length > 0) {
        state.dependents.forEach(dependent => {
          const depState = this.pluginStates.get(dependent)
          const depStatus = depState ? this.getStatusIcon(depState.status) : '❓'
          console.log(`  └─ 被依赖: ${depStatus} ${dependent}`)
        })
      }
    })
  }
  
  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'installing': '🔧',
      'installed': '📦',
      'starting': '🚀',
      'started': '🟢',
      'stopping': '🛑',
      'stopped': '⭕',
      'error': '❌'
    }
    
    return icons[status] || '❓'
  }
}

const pluginDebugger = new PluginDebugger(engine)

// 查看插件报告
setTimeout(() => {
  console.log('插件状态报告:', pluginDebugger.getPluginReport())
  console.log('依赖检查:', pluginDebugger.checkDependencies())
  pluginDebugger.visualizeDependencies()
}, 3000)
```

### 插件通信调试

```typescript
// 插件通信调试器
class PluginCommunicationDebugger {
  private communications: Array<{
    from: string
    to: string
    method: string
    data: any
    timestamp: Date
    duration?: number
    error?: Error
  }> = []
  
  constructor(private engine: Engine) {
    this.setupCommunicationDebugging()
  }
  
  private setupCommunicationDebugging() {
    // 拦截插件间通信
    const originalGetPlugin = this.engine.getPlugin.bind(this.engine)
    
    this.engine.getPlugin = (name: string) => {
      const plugin = originalGetPlugin(name)
      
      if (plugin) {
        return this.wrapPluginMethods(plugin, name)
      }
      
      return plugin
    }
  }
  
  private wrapPluginMethods(plugin: any, pluginName: string): any {
    const wrapped = { ...plugin }
    
    // 包装所有方法
    Object.keys(plugin).forEach(key => {
      if (typeof plugin[key] === 'function') {
        wrapped[key] = (...args: any[]) => {
          const startTime = performance.now()
          
          const communication = {
            from: 'external',
            to: pluginName,
            method: key,
            data: args,
            timestamp: new Date()
          }
          
          console.log(`📞 [PLUGIN CALL] ${pluginName}.${key}`, args)
          
          try {
            const result = plugin[key](...args)
            
            const endTime = performance.now()
            communication.duration = endTime - startTime
            
            this.communications.push(communication)
            
            console.log(`✅ [PLUGIN RESULT] ${pluginName}.${key}`, {
              result,
              duration: communication.duration
            })
            
            return result
          } catch (error) {
            communication.error = error as Error
            this.communications.push(communication)
            
            console.error(`❌ [PLUGIN ERROR] ${pluginName}.${key}`, error)
            throw error
          }
        }
      }
    })
    
    return wrapped
  }
  
  // 获取通信统计
  getCommunicationStats(): Record<string, {
    totalCalls: number
    avgDuration: number
    errorRate: number
    lastCall: Date
  }> {
    const stats: Record<string, any> = {}
    
    this.communications.forEach(comm => {
      const key = `${comm.to}.${comm.method}`
      
      if (!stats[key]) {
        stats[key] = {
          totalCalls: 0,
          totalDuration: 0,
          errors: 0,
          lastCall: comm.timestamp
        }
      }
      
      stats[key].totalCalls++
      if (comm.duration) {
        stats[key].totalDuration += comm.duration
      }
      if (comm.error) {
        stats[key].errors++
      }
      if (comm.timestamp > stats[key].lastCall) {
        stats[key].lastCall = comm.timestamp
      }
    })
    
    // 计算平均值和错误率
    Object.keys(stats).forEach(key => {
      const stat = stats[key]
      stat.avgDuration = stat.totalDuration / stat.totalCalls
      stat.errorRate = stat.errors / stat.totalCalls
      delete stat.totalDuration
      delete stat.errors
    })
    
    return stats
  }
  
  // 获取慢调用
  getSlowCalls(threshold: number = 100): typeof this.communications {
    return this.communications.filter(comm => 
      comm.duration && comm.duration > threshold
    )
  }
  
  // 获取错误调用
  getErrorCalls(): typeof this.communications {
    return this.communications.filter(comm => comm.error)
  }
}

const commDebugger = new PluginCommunicationDebugger(engine)

// 定期检查通信状态
setInterval(() => {
  const stats = commDebugger.getCommunicationStats()
  const slowCalls = commDebugger.getSlowCalls(50)
  const errorCalls = commDebugger.getErrorCalls()
  
  if (Object.keys(stats).length > 0) {
    console.log('📊 插件通信统计:', stats)
  }
  
  if (slowCalls.length > 0) {
    console.warn('🐌 慢调用:', slowCalls)
  }
  
  if (errorCalls.length > 0) {
    console.error('❌ 错误调用:', errorCalls)
  }
}, 30000)
```

## 状态调试

### 状态变化追踪

```typescript
// 状态调试器
class StateDebugger {
  private stateHistory: Array<{
    key: string
    oldValue: any
    newValue: any
    timestamp: Date
    stackTrace: string[]
  }> = []
  
  constructor(private engine: Engine) {
    this.setupStateDebugging()
  }
  
  private setupStateDebugging() {
    // 拦截状态设置
    const originalSetState = this.engine.setState.bind(this.engine)
    
    this.engine.setState = (key: string, value: any) => {
      const oldValue = this.engine.getState(key)
      
      // 记录状态变化
      const change = {
        key,
        oldValue: this.deepClone(oldValue),
        newValue: this.deepClone(value),
        timestamp: new Date(),
        stackTrace: new Error().stack?.split('\n').slice(2, 8) || []
      }
      
      this.stateHistory.push(change)
      
      console.group(`🔄 [STATE CHANGE] ${key}`)
      console.log('📊 旧值:', oldValue)
      console.log('📈 新值:', value)
      console.log('⏰ 时间:', change.timestamp.toISOString())
      console.log('📍 调用栈:', change.stackTrace)
      console.groupEnd()
      
      return originalSetState(key, value)
    }
  }
  
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj)
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    if (typeof obj === 'object') {
      const cloned: any = {}
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key])
      })
      return cloned
    }
    return obj
  }
  
  // 获取状态变化历史
  getStateHistory(key?: string): typeof this.stateHistory {
    if (key) {
      return this.stateHistory.filter(change => change.key === key)
    }
    return this.stateHistory
  }
  
  // 获取状态快照
  getStateSnapshot(): Record<string, any> {
    const snapshot: Record<string, any> = {}
    const state = this.engine.getState()
    
    Object.keys(state).forEach(key => {
      snapshot[key] = this.deepClone(state[key])
    })
    
    return snapshot
  }
  
  // 比较状态快照
  compareSnapshots(snapshot1: Record<string, any>, snapshot2: Record<string, any>): {
    added: string[]
    removed: string[]
    changed: Array<{
      key: string
      oldValue: any
      newValue: any
    }>
  } {
    const keys1 = Object.keys(snapshot1)
    const keys2 = Object.keys(snapshot2)
    
    const added = keys2.filter(key => !keys1.includes(key))
    const removed = keys1.filter(key => !keys2.includes(key))
    const changed: Array<any> = []
    
    keys1.forEach(key => {
      if (keys2.includes(key) && !this.deepEqual(snapshot1[key], snapshot2[key])) {
        changed.push({
          key,
          oldValue: snapshot1[key],
          newValue: snapshot2[key]
        })
      }
    })
    
    return { added, removed, changed }
  }
  
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true
    
    if (obj1 == null || obj2 == null) return obj1 === obj2
    
    if (typeof obj1 !== typeof obj2) return false
    
    if (typeof obj1 !== 'object') return obj1 === obj2
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false
    
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    
    if (keys1.length !== keys2.length) return false
    
    return keys1.every(key => 
      keys2.includes(key) && this.deepEqual(obj1[key], obj2[key])
    )
  }
  
  // 可视化状态变化
  visualizeStateChanges(key?: string) {
    const history = this.getStateHistory(key)
    
    console.log(`📊 状态变化历史${key ? ` (${key})` : ''}:`)
    
    history.forEach((change, index) => {
      console.log(`${index + 1}. [${change.timestamp.toISOString()}] ${change.key}`)
      console.log(`   📊 ${JSON.stringify(change.oldValue)} → 📈 ${JSON.stringify(change.newValue)}`)
    })
  }
}

const stateDebugger = new StateDebugger(engine)

// 定期保存状态快照
let lastSnapshot = stateDebugger.getStateSnapshot()

setInterval(() => {
  const currentSnapshot = stateDebugger.getStateSnapshot()
  const diff = stateDebugger.compareSnapshots(lastSnapshot, currentSnapshot)
  
  if (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0) {
    console.log('📊 状态变化检测:', diff)
  }
  
  lastSnapshot = currentSnapshot
}, 5000)
```

## 性能调试

### 性能监控器

```typescript
// 性能监控器
class PerformanceMonitor {
  private metrics: Map<string, {
    count: number
    totalTime: number
    maxTime: number
    minTime: number
    avgTime: number
    lastExecution: Date
  }> = new Map()
  
  private memoryUsage: Array<{
    timestamp: Date
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }> = []
  
  constructor(private engine: Engine) {
    this.setupPerformanceMonitoring()
    this.startMemoryMonitoring()
  }
  
  private setupPerformanceMonitoring() {
    // 监控事件处理性能
    const originalEmit = this.engine.emit.bind(this.engine)
    
    this.engine.emit = (event: string, data?: any) => {
      const startTime = performance.now()
      
      const result = originalEmit(event, data)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.recordMetric(`event:${event}`, duration)
      
      return result
    }
    
    // 监控插件方法性能
    const originalGetPlugin = this.engine.getPlugin.bind(this.engine)
    
    this.engine.getPlugin = (name: string) => {
      const plugin = originalGetPlugin(name)
      
      if (plugin) {
        return this.wrapPluginForPerformance(plugin, name)
      }
      
      return plugin
    }
  }
  
  private wrapPluginForPerformance(plugin: any, pluginName: string): any {
    const wrapped = { ...plugin }
    
    Object.keys(plugin).forEach(key => {
      if (typeof plugin[key] === 'function') {
        wrapped[key] = (...args: any[]) => {
          const startTime = performance.now()
          
          try {
            const result = plugin[key](...args)
            
            const endTime = performance.now()
            const duration = endTime - startTime
            
            this.recordMetric(`plugin:${pluginName}.${key}`, duration)
            
            return result
          } catch (error) {
            const endTime = performance.now()
            const duration = endTime - startTime
            
            this.recordMetric(`plugin:${pluginName}.${key}`, duration)
            throw error
          }
        }
      }
    })
    
    return wrapped
  }
  
  private recordMetric(name: string, duration: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity,
        avgTime: 0,
        lastExecution: new Date()
      })
    }
    
    const metric = this.metrics.get(name)!
    metric.count++
    metric.totalTime += duration
    metric.maxTime = Math.max(metric.maxTime, duration)
    metric.minTime = Math.min(metric.minTime, duration)
    metric.avgTime = metric.totalTime / metric.count
    metric.lastExecution = new Date()
  }
  
  private startMemoryMonitoring() {
    setInterval(() => {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage()
        
        this.memoryUsage.push({
          timestamp: new Date(),
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          external: usage.external,
          rss: usage.rss
        })
        
        // 保留最近1000条记录
        if (this.memoryUsage.length > 1000) {
          this.memoryUsage = this.memoryUsage.slice(-1000)
        }
      }
    }, 1000)
  }
  
  // 获取性能报告
  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {}
    
    this.metrics.forEach((metric, name) => {
      report[name] = {
        count: metric.count,
        avgTime: Math.round(metric.avgTime * 100) / 100,
        maxTime: Math.round(metric.maxTime * 100) / 100,
        minTime: metric.minTime === Infinity ? 0 : Math.round(metric.minTime * 100) / 100,
        totalTime: Math.round(metric.totalTime * 100) / 100,
        lastExecution: metric.lastExecution
      }
    })
    
    return report
  }
  
  // 获取慢操作
  getSlowOperations(threshold: number = 100): Array<{
    name: string
    avgTime: number
    maxTime: number
    count: number
  }> {
    const slowOps: Array<any> = []
    
    this.metrics.forEach((metric, name) => {
      if (metric.avgTime > threshold || metric.maxTime > threshold * 2) {
        slowOps.push({
          name,
          avgTime: metric.avgTime,
          maxTime: metric.maxTime,
          count: metric.count
        })
      }
    })
    
    return slowOps.sort((a, b) => b.avgTime - a.avgTime)
  }
  
  // 获取内存使用趋势
  getMemoryTrend(minutes: number = 10): {
    trend: 'increasing' | 'decreasing' | 'stable'
    current: number
    peak: number
    average: number
  } {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    const recentUsage = this.memoryUsage.filter(usage => usage.timestamp >= cutoff)
    
    if (recentUsage.length < 2) {
      return {
        trend: 'stable',
        current: 0,
        peak: 0,
        average: 0
      }
    }
    
    const heapUsages = recentUsage.map(usage => usage.heapUsed)
    const current = heapUsages[heapUsages.length - 1]
    const peak = Math.max(...heapUsages)
    const average = heapUsages.reduce((sum, usage) => sum + usage, 0) / heapUsages.length
    
    // 计算趋势
    const firstHalf = heapUsages.slice(0, Math.floor(heapUsages.length / 2))
    const secondHalf = heapUsages.slice(Math.floor(heapUsages.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, usage) => sum + usage, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, usage) => sum + usage, 0) / secondHalf.length
    
    const diff = secondAvg - firstAvg
    const threshold = average * 0.05 // 5% 阈值
    
    let trend: 'increasing' | 'decreasing' | 'stable'
    if (diff > threshold) {
      trend = 'increasing'
    } else if (diff < -threshold) {
      trend = 'decreasing'
    } else {
      trend = 'stable'
    }
    
    return {
      trend,
      current: Math.round(current / 1024 / 1024 * 100) / 100, // MB
      peak: Math.round(peak / 1024 / 1024 * 100) / 100, // MB
      average: Math.round(average / 1024 / 1024 * 100) / 100 // MB
    }
  }
  
  // 生成性能报告
  generateReport(): string {
    const perfReport = this.getPerformanceReport()
    const slowOps = this.getSlowOperations(50)
    const memoryTrend = this.getMemoryTrend()
    
    let report = '📊 性能调试报告\n'
    report += '='.repeat(50) + '\n\n'
    
    // 内存使用情况
    report += '💾 内存使用情况:\n'
    report += `   当前: ${memoryTrend.current} MB\n`
    report += `   峰值: ${memoryTrend.peak} MB\n`
    report += `   平均: ${memoryTrend.average} MB\n`
    report += `   趋势: ${memoryTrend.trend}\n\n`
    
    // 慢操作
    if (slowOps.length > 0) {
      report += '🐌 慢操作 (>50ms):\n'
      slowOps.forEach(op => {
        report += `   ${op.name}: 平均 ${op.avgTime}ms, 最大 ${op.maxTime}ms (${op.count} 次)\n`
      })
      report += '\n'
    }
    
    // 性能统计
    report += '⚡ 性能统计:\n'
    Object.keys(perfReport).forEach(name => {
      const metric = perfReport[name]
      report += `   ${name}: 平均 ${metric.avgTime}ms (${metric.count} 次)\n`
    })
    
    return report
  }
}

const perfMonitor = new PerformanceMonitor(engine)

// 定期生成性能报告
setInterval(() => {
  const slowOps = perfMonitor.getSlowOperations()
  const memoryTrend = perfMonitor.getMemoryTrend()
  
  if (slowOps.length > 0) {
    console.warn('🐌 检测到慢操作:', slowOps)
  }
  
  if (memoryTrend.trend === 'increasing') {
    console.warn('📈 内存使用量持续增长:', memoryTrend)
  }
}, 60000)

// 生成完整报告
setInterval(() => {
  console.log(perfMonitor.generateReport())
}, 300000) // 每5分钟
```

## 错误调试

### 错误追踪器

```typescript
// 错误追踪器
class ErrorTracker {
  private errors: Array<{
    id: string
    error: Error
    context: any
    timestamp: Date
    stackTrace: string[]
    resolved: boolean
    resolution?: string
  }> = []
  
  constructor(private engine: Engine) {
    this.setupErrorTracking()
  }
  
  private setupErrorTracking() {
    // 监听引擎错误
    this.engine.on('error', (error, context) => {
      this.trackError(error, context)
    })
    
    // 全局错误处理
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError(event.error, {
          type: 'global',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      })
      
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(new Error(event.reason), {
          type: 'unhandled-promise-rejection',
          reason: event.reason
        })
      })
    }
    
    // Node.js 错误处理
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.trackError(error, { type: 'uncaught-exception' })
      })
      
      process.on('unhandledRejection', (reason, promise) => {
        this.trackError(new Error(String(reason)), {
          type: 'unhandled-rejection',
          promise
        })
      })
    }
  }
  
  private trackError(error: Error, context: any) {
    const errorId = this.generateErrorId()
    
    const trackedError = {
      id: errorId,
      error,
      context,
      timestamp: new Date(),
      stackTrace: error.stack?.split('\n') || [],
      resolved: false
    }
    
    this.errors.push(trackedError)
    
    console.group(`❌ [ERROR TRACKED] ${errorId}`)
    console.error('错误:', error.message)
    console.log('上下文:', context)
    console.log('堆栈:', error.stack)
    console.log('时间:', trackedError.timestamp.toISOString())
    console.groupEnd()
    
    // 尝试自动恢复
    this.attemptAutoRecovery(trackedError)
  }
  
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private attemptAutoRecovery(trackedError: any) {
    const { error, context } = trackedError
    
    // 根据错误类型尝试恢复
    if (error.message.includes('plugin')) {
      console.log('🔧 尝试重新加载插件...')
      // 插件相关错误的恢复逻辑
    } else if (error.message.includes('network')) {
      console.log('🌐 尝试重新连接网络...')
      // 网络相关错误的恢复逻辑
    } else if (error.message.includes('state')) {
      console.log('🔄 尝试重置状态...')
      // 状态相关错误的恢复逻辑
    }
  }
  
  // 获取错误统计
  getErrorStats(): {
    total: number
    resolved: number
    unresolved: number
    byType: Record<string, number>
    recent: number
  } {
    const total = this.errors.length
    const resolved = this.errors.filter(e => e.resolved).length
    const unresolved = total - resolved
    
    // 按类型分组
    const byType: Record<string, number> = {}
    this.errors.forEach(error => {
      const type = error.context?.type || 'unknown'
      byType[type] = (byType[type] || 0) + 1
    })
    
    // 最近1小时的错误
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recent = this.errors.filter(e => e.timestamp >= oneHourAgo).length
    
    return {
      total,
      resolved,
      unresolved,
      byType,
      recent
    }
  }
  
  // 获取错误模式
  getErrorPatterns(): Array<{
    pattern: string
    count: number
    examples: string[]
  }> {
    const patterns: Record<string, { count: number; examples: string[] }> = {}
    
    this.errors.forEach(error => {
      // 简化错误消息以识别模式
      const pattern = this.simplifyErrorMessage(error.error.message)
      
      if (!patterns[pattern]) {
        patterns[pattern] = { count: 0, examples: [] }
      }
      
      patterns[pattern].count++
      if (patterns[pattern].examples.length < 3) {
        patterns[pattern].examples.push(error.error.message)
      }
    })
    
    return Object.keys(patterns)
      .map(pattern => ({
        pattern,
        count: patterns[pattern].count,
        examples: patterns[pattern].examples
      }))
      .sort((a, b) => b.count - a.count)
  }
  
  private simplifyErrorMessage(message: string): string {
    // 移除具体的数值、ID等，保留错误模式
    return message
      .replace(/\d+/g, 'N')
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
      .replace(/\b\w+_\d+\b/g, 'ID')
      .toLowerCase()
  }
  
  // 标记错误为已解决
  resolveError(errorId: string, resolution: string) {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      error.resolution = resolution
      
      console.log(`✅ [ERROR RESOLVED] ${errorId}: ${resolution}`)
    }
  }
  
  // 生成错误报告
  generateErrorReport(): string {
    const stats = this.getErrorStats()
    const patterns = this.getErrorPatterns()
    
    let report = '🚨 错误调试报告\n'
    report += '='.repeat(50) + '\n\n'
    
    // 错误统计
    report += '📊 错误统计:\n'
    report += `   总计: ${stats.total}\n`
    report += `   已解决: ${stats.resolved}\n`
    report += `   未解决: ${stats.unresolved}\n`
    report += `   最近1小时: ${stats.recent}\n\n`
    
    // 错误类型分布
    report += '📈 错误类型分布:\n'
    Object.keys(stats.byType).forEach(type => {
      report += `   ${type}: ${stats.byType[type]}\n`
    })
    report += '\n'
    
    // 错误模式
    if (patterns.length > 0) {
      report += '🔍 常见错误模式:\n'
      patterns.slice(0, 5).forEach(pattern => {
        report += `   ${pattern.pattern} (${pattern.count} 次)\n`
        pattern.examples.forEach(example => {
          report += `     - ${example}\n`
        })
      })
    }
    
    return report
  }
}

const errorTracker = new ErrorTracker(engine)

// 定期检查错误状态
setInterval(() => {
  const stats = errorTracker.getErrorStats()
  
  if (stats.recent > 5) {
    console.warn('🚨 最近1小时错误频发:', stats)
    console.log(errorTracker.generateErrorReport())
  }
}, 300000) // 每5分钟检查
```

## 调试工具集成

### 浏览器开发者工具集成

```typescript
// 浏览器调试工具
class BrowserDebugTools {
  constructor(private engine: Engine) {
    this.setupBrowserIntegration()
  }
  
  private setupBrowserIntegration() {
    if (typeof window === 'undefined') return
    
    // 将引擎暴露到全局
    (window as any).__LDESIGN_ENGINE__ = this.engine
    
    // 添加调试方法到控制台
    (window as any).__LDESIGN_DEBUG__ = {
      engine: this.engine,
      getState: () => this.engine.getState(),
      getPlugins: () => this.engine.getPlugins(),
      getEvents: () => this.engine.eventNames(),
      emit: (event: string, data?: any) => this.engine.emit(event, data),
      inspect: this.inspect.bind(this),
      trace: this.trace.bind(this),
      profile: this.profile.bind(this)
    }
    
    console.log('🔧 LDesign Engine 调试工具已加载')
    console.log('使用 __LDESIGN_DEBUG__ 访问调试功能')
    console.log('使用 __LDESIGN_ENGINE__ 访问引擎实例')
  }
  
  private inspect(target: any) {
    console.group('🔍 对象检查')
    console.log('类型:', typeof target)
    console.log('构造函数:', target?.constructor?.name)
    console.log('属性:', Object.keys(target || {}))
    console.log('值:', target)
    console.groupEnd()
  }
  
  private trace(event: string) {
    console.log(`🔍 开始追踪事件: ${event}`)
    
    const originalEmit = this.engine.emit.bind(this.engine)
    
    this.engine.emit = (eventName: string, data?: any) => {
      if (eventName === event) {
        console.group(`📍 事件追踪: ${event}`)
        console.log('数据:', data)
        console.trace('调用栈')
        console.groupEnd()
      }
      
      return originalEmit(eventName, data)
    }
    
    // 5分钟后停止追踪
    setTimeout(() => {
      this.engine.emit = originalEmit
      console.log(`⏹️ 停止追踪事件: ${event}`)
    }, 300000)
  }
  
  private profile(name: string, fn: Function) {
    console.profile(name)
    const startTime = performance.now()
    
    try {
      const result = fn()
      
      const endTime = performance.now()
      console.profileEnd(name)
      console.log(`⚡ 性能分析 ${name}: ${endTime - startTime}ms`)
      
      return result
    } catch (error) {
      const endTime = performance.now()
      console.profileEnd(name)
      console.error(`❌ 性能分析 ${name} 出错: ${endTime - startTime}ms`, error)
      throw error
    }
  }
}

const browserDebugTools = new BrowserDebugTools(engine)
```

### VS Code 调试配置

创建 `.vscode/launch.json` 文件：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "调试 LDesign Engine 应用",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/main.ts",
      "env": {
        "DEBUG": "ldesign:*",
        "LOG_LEVEL": "debug"
      },
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "调试 LDesign Engine 测试",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "env": {
        "DEBUG": "ldesign:*",
        "LOG_LEVEL": "debug"
      },
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

## 调试最佳实践

### 1. 分层调试策略

```typescript
// 分层调试配置
const debugConfig = {
  // 应用层调试
  application: {
    enabled: true,
    events: ['user:*', 'app:*'],
    logLevel: 'info'
  },
  
  // 业务层调试
  business: {
    enabled: true,
    events: ['data:*', 'process:*'],
    logLevel: 'debug'
  },
  
  // 框架层调试
  framework: {
    enabled: false, // 生产环境关闭
    events: ['plugin:*', 'middleware:*'],
    logLevel: 'debug'
  }
}

// 应用调试配置
function applyDebugConfig(engine: Engine, config: typeof debugConfig) {
  Object.keys(config).forEach(layer => {
    const layerConfig = config[layer as keyof typeof config]
    
    if (layerConfig.enabled) {
      layerConfig.events.forEach(eventPattern => {
        // 使用通配符匹配事件
        const regex = new RegExp(eventPattern.replace('*', '.*'))
        
        engine.on('*', (event: string, data: any) => {
          if (regex.test(event)) {
            console.log(`[${layer.toUpperCase()}] ${event}`, data)
          }
        })
      })
    }
  })
}

applyDebugConfig(engine, debugConfig)
```

### 2. 条件调试

```typescript
// 条件调试器
class ConditionalDebugger {
  private conditions: Map<string, (data: any) => boolean> = new Map()
  
  constructor(private engine: Engine) {}
  
  // 添加调试条件
  addCondition(name: string, condition: (data: any) => boolean) {
    this.conditions.set(name, condition)
    
    this.engine.on('*', (event: string, data: any) => {
      if (condition(data)) {
        console.group(`🎯 [CONDITIONAL DEBUG] ${name}`)
        console.log('事件:', event)
        console.log('数据:', data)
        console.log('条件:', condition.toString())
        console.groupEnd()
      }
    })
  }
  
  // 移除调试条件
  removeCondition(name: string) {
    this.conditions.delete(name)
  }
}

const conditionalDebugger = new ConditionalDebugger(engine)

// 添加调试条件
conditionalDebugger.addCondition('高价值用户', (data) => {
  return data?.user?.value > 1000
})

conditionalDebugger.addCondition('错误状态', (data) => {
  return data?.status === 'error' || data?.error
})

conditionalDebugger.addCondition('慢操作', (data) => {
  return data?.duration > 1000
})
```

### 3. 调试会话管理

```typescript
// 调试会话管理器
class DebugSessionManager {
  private sessions: Map<string, {
    id: string
    name: string
    startTime: Date
    endTime?: Date
    events: Array<{
      event: string
      data: any
      timestamp: Date
    }>
    active: boolean
  }> = new Map()
  
  constructor(private engine: Engine) {}
  
  // 开始调试会话
  startSession(name: string): string {
    const sessionId = `session_${Date.now()}`
    
    const session = {
      id: sessionId,
      name,
      startTime: new Date(),
      events: [],
      active: true
    }
    
    this.sessions.set(sessionId, session)
    
    // 监听所有事件
    const listener = (event: string, data: any) => {
      if (session.active) {
        session.events.push({
          event,
          data,
          timestamp: new Date()
        })
      }
    }
    
    this.engine.on('*', listener)
    
    console.log(`🎬 开始调试会话: ${name} (${sessionId})`)
    
    return sessionId
  }
  
  // 结束调试会话
  endSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    
    if (session) {
      session.active = false
      session.endTime = new Date()
      
      console.log(`🎬 结束调试会话: ${session.name} (${sessionId})`)
      console.log(`📊 会话统计: ${session.events.length} 个事件`)
    }
  }
  
  // 导出会话数据
  exportSession(sessionId: string): any {
    const session = this.sessions.get(sessionId)
    
    if (!session) return null
    
    return {
      id: session.id,
      name: session.name,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.endTime 
        ? session.endTime.getTime() - session.startTime.getTime()
        : Date.now() - session.startTime.getTime(),
      eventCount: session.events.length,
      events: session.events
    }
  }
  
  // 分析会话
  analyzeSession(sessionId: string): {
    eventFrequency: Record<string, number>
    timeline: Array<{ time: number; event: string }>
    patterns: string[]
  } {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return {
        eventFrequency: {},
        timeline: [],
        patterns: []
      }
    }
    
    // 事件频率统计
    const eventFrequency: Record<string, number> = {}
    session.events.forEach(event => {
      eventFrequency[event.event] = (eventFrequency[event.event] || 0) + 1
    })
    
    // 时间线
    const timeline = session.events.map(event => ({
      time: event.timestamp.getTime() - session.startTime.getTime(),
      event: event.event
    }))
    
    // 模式识别
    const patterns = this.identifyPatterns(session.events)
    
    return {
      eventFrequency,
      timeline,
      patterns
    }
  }
  
  private identifyPatterns(events: any[]): string[] {
    const patterns: string[] = []
    
    // 识别事件序列模式
    for (let i = 0; i < events.length - 2; i++) {
      const sequence = events.slice(i, i + 3).map(e => e.event).join(' -> ')
      
      // 检查这个序列是否重复出现
      let count = 0
      for (let j = 0; j < events.length - 2; j++) {
        const checkSequence = events.slice(j, j + 3).map(e => e.event).join(' -> ')
        if (checkSequence === sequence) count++
      }
      
      if (count >= 3 && !patterns.includes(sequence)) {
        patterns.push(`重复序列 (${count}次): ${sequence}`)
      }
    }
    
    return patterns
  }
}

const debugSessionManager = new DebugSessionManager(engine)

// 使用示例
const sessionId = debugSessionManager.startSession('用户登录流程调试')

// 执行一些操作...

setTimeout(() => {
  debugSessionManager.endSession(sessionId)
  const analysis = debugSessionManager.analyzeSession(sessionId)
  console.log('会话分析结果:', analysis)
}, 10000)
```

## 总结

调试是开发过程中不可或缺的技能。@ldesign/engine 提供了丰富的调试功能和工具，帮助您快速定位和解决问题。

### 关键调试技巧

1. **开启详细日志**：使用调试模式和适当的日志级别
2. **事件流追踪**：监控事件的发布和处理过程
3. **插件生命周期监控**：跟踪插件的安装、启动和运行状态
4. **状态变化追踪**：监控应用状态的变化
5. **性能监控**：识别性能瓶颈和慢操作
6. **错误追踪**：系统化地处理和分析错误
7. **条件调试**：只在特定条件下进行调试
8. **会话管理**：组织和分析调试数据

### 调试工具链

- **浏览器开发者工具**：利用浏览器的调试功能
- **VS Code 调试器**：集成开发环境调试
- **性能分析工具**：识别性能问题
- **错误监控系统**：生产环境错误追踪

通过掌握这些调试技巧和工具，您可以更高效地开发和维护基于 @ldesign/engine 的应用程序。
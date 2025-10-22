# Engine API 参考文档

> 📅 版本：v0.3.0+  
> 📖 完整的 API 参考和使用示例

## 🚀 新增 API（v0.3.0）

### 状态管理器增强

#### `batchSet(updates, triggerWatchers?)`
批量设置多个状态值，优化性能

```typescript
// 批量更新，避免多次触发监听器
state.batchSet({
  'user.name': 'Alice',
  'user.age': 30,
  'user.email': 'alice@example.com',
  'settings.theme': 'dark'
})
```

#### `batchGet(keys)`
批量获取多个状态值

```typescript
const values = state.batchGet(['user.name', 'user.age', 'settings.theme'])
// { 'user.name': 'Alice', 'user.age': 30, 'settings.theme': 'dark' }
```

#### `batchRemove(keys)`
批量删除多个状态

```typescript
state.batchRemove(['temp.data1', 'temp.data2', 'temp.data3'])
```

#### `transaction(operation)`
事务操作，出错时自动回滚

```typescript
try {
  state.transaction(() => {
    state.set('user.balance', 1000)
    state.set('user.status', 'active')
    // 如果抛出错误，自动回滚到操作前状态
    if (someCondition) {
      throw new Error('Transaction failed')
    }
  })
} catch (error) {
  // 状态已回滚
}
```

### 模块加载器增强

#### `unload(moduleName)`
卸载已加载的模块

```typescript
const loaded = await loader.load('heavy-module')
// 使用完毕后卸载
loader.unload('heavy-module')
```

#### `unloadBatch(moduleNames)`
批量卸载模块

```typescript
const count = loader.unloadBatch(['mod1', 'mod2', 'mod3'])
console.log(`卸载了 ${count} 个模块`)
```

#### `shrinkCache(targetSize?)`
收缩缓存到目标大小

```typescript
// 响应内存压力
loader.shrinkCache(25) // 收缩到25个模块
```

#### `getCacheStats()`
获取缓存使用统计

```typescript
const stats = loader.getCacheStats()
console.log('缓存命中率：', stats.hitRate.toFixed(1), '%')
console.log('最常用模块：', stats.mostUsed)
```

### Worker 池增强

#### `shrink(targetSize?)`
收缩 Worker 池大小

```typescript
// 内存压力时收缩到最小值
const terminated = pool.shrink(2)
console.log(`终止了 ${terminated} 个 Worker`)
```

#### `getResourceStats()`
获取资源使用统计

```typescript
const stats = pool.getResourceStats()
console.log('创建的 Workers：', stats.createdWorkers)
console.log('终止的 Workers：', stats.terminatedWorkers)
console.log('活跃的 Blob URLs：', stats.activeBlobUrls)
```

## 🎯 并发控制 API

### Semaphore（信号量）

```typescript
import { createSemaphore } from '@ldesign/engine'

const sem = createSemaphore(3) // 最多3个并发

// 方式1：手动获取/释放
await sem.acquire()
try {
  await doWork()
} finally {
  sem.release()
}

// 方式2：自动管理
await sem.runExclusive(async () => {
  await doWork()
})

// 查询状态
console.log('可用许可：', sem.available())
console.log('等待数量：', sem.waitingCount())
```

### ConcurrencyLimiter（并发限制器）

```typescript
import { createConcurrencyLimiter } from '@ldesign/engine'

const limiter = createConcurrencyLimiter({
  maxConcurrent: 5,
  timeout: 30000,
  maxQueueSize: 100,
  onQueueFull: () => console.warn('队列已满')
})

// 执行受限操作
const result = await limiter.execute(async () => {
  return await fetch('/api/data')
})

// 批量执行
const results = await limiter.executeBatch([
  () => fetch('/api/user/1'),
  () => fetch('/api/user/2'),
  () => fetch('/api/user/3')
])

// 查看统计
const stats = limiter.getStats()
console.log('平均等待时间：', stats.averageWaitTime.toFixed(2), 'ms')
console.log('成功率：', (stats.succeeded / stats.executed * 100).toFixed(1), '%')
```

### RateLimiter（速率限制器）

```typescript
import { createRateLimiter } from '@ldesign/engine'

const limiter = createRateLimiter({
  maxRequests: 10,    // 最多10个请求
  windowMs: 1000,     // 每秒
  strategy: 'sliding' // 滑动窗口
})

// 尝试获取许可
if (await limiter.tryAcquire()) {
  await makeApiCall()
} else {
  console.log('速率限制')
}

// 等待许可
await limiter.waitForPermit()
await makeApiCall()

// 执行受限操作
await limiter.execute(async () => {
  return await fetch('/api/data')
})
```

### CircuitBreaker（熔断器）

```typescript
import { createCircuitBreaker } from '@ldesign/engine'

const breaker = createCircuitBreaker({
  failureThreshold: 5,    // 5次失败打开熔断器
  successThreshold: 2,    // 2次成功关闭熔断器
  timeout: 5000,          // 操作超时
  resetTimeout: 30000,    // 30秒后尝试恢复
  onStateChange: (state) => {
    console.log('熔断器状态：', state)
  }
})

try {
  const result = await breaker.execute(async () => {
    return await unstableApiCall()
  })
} catch (error) {
  if (error.message === 'Circuit breaker is open') {
    // 熔断器打开，使用降级逻辑
    return getFallbackData()
  }
}

// 查看状态
console.log('当前状态：', breaker.getState())
const stats = breaker.getStats()
console.log('失败次数：', stats.failures)
console.log('成功次数：', stats.successes)
```

## 📦 请求批处理 API

### DataLoader

```typescript
import { createDataLoader } from '@ldesign/engine'

const userLoader = createDataLoader({
  batchFn: async (userIds) => {
    // 批量加载用户
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ ids: userIds })
    })
    return response.json()
  },
  maxBatchSize: 50,
  cache: engine.cache,
  cacheTTL: 60000,
  cacheKeyFn: (userId) => `user:${userId}`
})

// 单个加载（自动批处理）
const user1 = await userLoader.load('123')
const user2 = await userLoader.load('456')

// 批量加载
const users = await userLoader.loadMany(['123', '456', '789'])

// 预填充缓存
await userLoader.prime('123', userData)

// 查看统计
const stats = userLoader.getStats()
console.log('批处理次数：', stats.totalBatches)
console.log('平均批次大小：', stats.averageBatchSize.toFixed(1))
console.log('缓存命中率：', (stats.cacheHits / stats.totalRequests * 100).toFixed(1), '%')
```

### RequestMerger

```typescript
import { createRequestMerger } from '@ldesign/engine'

const merger = createRequestMerger({
  mergeWindow: 10, // 10ms内的相同请求合并
  maxBatchSize: 100
})

// 自动合并相同请求
const promise1 = merger.execute('user:123', () => fetchUser('123'))
const promise2 = merger.execute('user:123', () => fetchUser('123'))

// promise1 和 promise2 实际上是同一个请求
const user1 = await promise1
const user2 = await promise2 // 直接使用相同结果，无额外请求
```

### BatchScheduler

```typescript
import { createBatchScheduler } from '@ldesign/engine'

const scheduler = createBatchScheduler({
  processFn: async (items) => {
    // 批量处理
    return await batchProcess(items)
  },
  maxBatchSize: 100,
  maxWaitTime: 10,
  minBatchSize: 5
})

// 添加项（自动批处理）
const results = await Promise.all([
  scheduler.add(item1),
  scheduler.add(item2),
  scheduler.add(item3)
])

// 立即处理
await scheduler.flush()
```

## 🔄 事件高级功能

### EventMediator（事件中介者）

```typescript
import { createEventMediator } from '@ldesign/engine'

const mediator = createEventMediator(engine.events)

// 订阅频道
const unsubscribe = mediator.subscribe('user-events', (data) => {
  console.log('用户事件：', data)
})

// 发布到频道
await mediator.publish('user-events', {  action: 'login', userId: '123' })

// 添加中间件
mediator.use('user-events', async (data) => {
  // 数据转换
  return { ...data, timestamp: Date.now() }
})

// 添加过滤器
mediator.filter('user-events', (data) => {
  return data.action !== 'spam' // 过滤垃圾事件
})

// 桥接频道
mediator.bridge('raw-events', 'processed-events', (data) => {
  return processData(data)
})
```

### EventReplay（事件重放）

```typescript
import { createEventReplay } from '@ldesign/engine'

const replay = createEventReplay(engine.events)

// 开始记录
replay.startRecording(['user:*', 'api:*'])

// ... 用户操作 ...

// 停止记录
const events = replay.stopRecording()

// 导出记录
const exported = replay.export()
localStorage.setItem('event-recording', exported)

// 导入并回放
replay.import(exported)
await replay.replay({
  speed: 2.0,        // 2倍速
  loop: false,
  filter: (event) => event.name.startsWith('user:')
})

// 停止回放
replay.stopReplay()
```

### EventPersistence（事件持久化）

```typescript
import { createEventPersistence } from '@ldesign/engine'

const persistence = createEventPersistence(engine.events, {
  storage: 'indexedDB',
  maxEvents: 1000,
  autoSave: true,
  saveInterval: 5000
})

// 开始持久化
persistence.startPersisting(['critical:*', 'error:*'])

// 获取持久化的事件
const events = persistence.getEvents()
```

## 🕐 状态时间旅行 API

### TimeTravelManager

```typescript
import { createTimeTravelManager } from '@ldesign/engine'

const timeTravel = createTimeTravelManager(engine.state, {
  maxSnapshots: 50,
  maxUndoStack: 20,
  autoSnapshot: true,
  snapshotInterval: 60000
})

// 创建快照
const snapshotId = timeTravel.createSnapshot('操作前', {
  operation: 'update-user'
})

// 恢复快照
timeTravel.restoreSnapshot(snapshotId)

// 撤销/重做
if (timeTravel.canUndo()) {
  timeTravel.undo()
}

if (timeTravel.canRedo()) {
  timeTravel.redo()
}

// 对比快照
const diff = timeTravel.diff(snapshot1, snapshot2)
console.log('新增键：', diff.added)
console.log('删除键：', diff.removed)
console.log('修改键：', diff.modified)

// 回放状态变化
await timeTravel.playback(from, to, {
  speed: 1.0,
  onStep: (snapshot) => {
    console.log('当前快照：', snapshot.label)
  }
})

// 导出/导入
const exported = timeTravel.export()
localStorage.setItem('snapshots', exported)

timeTravel.import(localStorage.getItem('snapshots')!)
```

## 💾 内存分析 API

### MemoryProfiler

```typescript
import { createMemoryProfiler } from '@ldesign/engine'

const profiler = createMemoryProfiler({
  sampleInterval: 10000,
  maxSnapshots: 100,
  leakThreshold: 10 * 1024 * 1024
})

// 开始采样
profiler.start()

// 手动采样
const snapshotId = profiler.takeSnapshot('关键操作前')

// 对比快照
const comparison = profiler.compare(snapshot1, snapshot2)
console.log('内存增长：', comparison.heapGrowth, 'bytes')
console.log('增长速率：', comparison.growthRate, 'bytes/s')

// 检测泄漏
const leaks = profiler.detectLeaks()
for (const leak of leaks) {
  console.log('泄漏：', leak.name, '置信度：', leak.confidence)
}

// 生成报告
const report = profiler.generateReport()
console.log(report.summary)
console.log(report.recommendations)

profiler.stop()
```

### MemoryLeakDetector

```typescript
import { createMemoryLeakDetector } from '@ldesign/engine'

const detector = createMemoryLeakDetector({
  checkInterval: 30000,
  threshold: 10 * 1024 * 1024,
  windowSize: 10
})

// 监听泄漏事件
const unsubscribe = detector.onLeakDetected((suspect) => {
  console.error('内存泄漏：', suspect)
  sendAlert(suspect)
})

detector.start()

// 稍后清理
unsubscribe()
detector.stop()
```

## 📊 性能预算 API（增强）

### PerformanceBudgetManager

```typescript
import { createPerformanceBudgetManager } from '@ldesign/engine'

const budgetManager = createPerformanceBudgetManager(
  {
    bundleSize: 500 * 1024,
    initialLoadTime: 3000,
    memoryUsage: 100 * 1024 * 1024,
    minFps: 30
  },
  (metric) => {
    console.warn('预算超标：', metric)
  },
  {
    warningThreshold: 80,
    criticalThreshold: 100,
    autoDegrade: true,
    onDegrade: (level, metrics) => {
      console.log('性能降级：', level, metrics)
    }
  }
)

budgetManager.startMonitoring()

// 获取违规历史
const violations = budgetManager.getViolationHistory()

// 获取指标趋势
const trend = budgetManager.getMetricTrend('memoryUsage')
if (trend) {
  console.log('趋势：', trend.trend)
  console.log('预测值：', trend.prediction)
}

// 生成可视化数据
const vizData = budgetManager.getVisualizationData()
// 用于图表渲染

// 导出报告
const report = budgetManager.exportReport()
```

## 🔧 并发控制装饰器

### @Concurrent

```typescript
import { Concurrent } from '@ldesign/engine'

class ApiService {
  @Concurrent(5) // 最多5个并发
  async fetchData(id: string) {
    return await fetch(`/api/data/${id}`)
  }
}
```

### @RateLimit

```typescript
import { RateLimit } from '@ldesign/engine'

class ApiService {
  @RateLimit(10, 1000) // 每秒最多10个请求
  async callApi(endpoint: string) {
    return await fetch(endpoint)
  }
}
```

### @WithCircuitBreaker

```typescript
import { WithCircuitBreaker } from '@ldesign/engine'

class ExternalService {
  @WithCircuitBreaker({
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 30000
  })
  async unstableCall() {
    return await fetch('/unstable-api')
  }
}
```

## 📚 完整示例

### 企业级应用配置

```typescript
import {
  createEngine,
  createDataLoader,
  createMemoryLeakDetector,
  createPerformanceBudgetManager,
  createTimeTravelManager
} from '@ldesign/engine'

// 1. 创建引擎
const engine = createEngine({
  debug: process.env.NODE_ENV === 'development',
  cache: {
    maxSize: 100,
    defaultTTL: 5 * 60 * 1000
  }
})

// 2. 配置性能预算
const budgetManager = createPerformanceBudgetManager(
  {
    bundleSize: 500 * 1024,
    initialLoadTime: 3000,
    memoryUsage: 100 * 1024 * 1024,
    minFps: 30,
    domNodes: 5000
  },
  undefined,
  {
    warningThreshold: 80,
    criticalThreshold: 100,
    autoDegrade: true
  }
)

budgetManager.startMonitoring()

// 3. 启用内存泄漏检测
const leakDetector = createMemoryLeakDetector({
  checkInterval: 30000,
  threshold: 10 * 1024 * 1024
})

leakDetector.onLeakDetected((suspect) => {
  console.error('内存泄漏：', suspect)
  // 发送到监控系统
  sendToMonitoring('memory-leak', suspect)
})

leakDetector.start()

// 4. 配置状态时间旅行（开发环境）
let timeTravel: TimeTravelManager | null = null

if (process.env.NODE_ENV === 'development') {
  timeTravel = createTimeTravelManager(engine.state, {
    maxSnapshots: 50,
    autoSnapshot: true
  })

  // 暴露到window供调试使用
  ;(window as any).__timeTravel = timeTravel
}

// 5. 配置请求批处理
const userLoader = createDataLoader({
  batchFn: async (ids) => {
    const response = await fetch('/api/users/batch', {
      method: 'POST',
      body: JSON.stringify({ ids })
    })
    return response.json()
  },
  cache: engine.cache,
  cacheTTL: 60000
})

// 6. 使用
export const app = {
  engine,
  budgetManager,
  leakDetector,
  timeTravel,
  userLoader,

  // 清理方法
  async destroy() {
    budgetManager.destroy()
    leakDetector.destroy()
    timeTravel?.destroy()
    await engine.destroy()
  }
}
```

## 🔍 调试 API

### 开发工具集成

```typescript
// 开发环境调试接口
if (process.env.NODE_ENV === 'development') {
  (window as any).__engineDebug = {
    // 内存相关
    memory: {
      getInfo: () => engine.performance.getMemoryInfo(),
      getTrend: () => engine.performance.getMemoryTrend(),
      takeSnapshot: () => profiler.takeSnapshot('manual'),
      detectLeaks: () => profiler.detectLeaks(),
      generateReport: () => profiler.generateReport()
    },

    // 性能相关
    performance: {
      getReport: () => engine.performance.getReport(),
      getMetrics: () => engine.performance.getMetrics(),
      startMonitoring: () => engine.performance.startMonitoring(),
      stopMonitoring: () => engine.performance.stopMonitoring()
    },

    // 状态相关
    state: {
      getSnapshot: () => engine.state.getSnapshot(),
      getKeys: () => engine.state.keys(),
      getStats: () => engine.state.getStats(),
      undo: () => timeTravel?.undo(),
      redo: () => timeTravel?.redo()
    },

    // 缓存相关
    cache: {
      getStats: () => engine.cache.getStats(),
      clear: () => engine.cache.clear()
    },

    // 事件相关
    events: {
      getStats: () => engine.events.getStats(),
      listEvents: () => engine.events.eventNames()
    }
  }

  console.log('🛠️ 调试接口已启用：window.__engineDebug')
}
```

## 📖 类型定义

所有 API 都有完整的 TypeScript 类型定义，支持智能提示和类型检查。

```typescript
import type {
  // 核心类型
  Engine,
  EngineConfig,
  
  // 状态管理
  StateManager,
  StateSnapshot,
  TimeTravelConfig,
  
  // 并发控制
  Semaphore,
  ConcurrencyLimiter,
  RateLimiter,
  CircuitBreaker,
  
  // 请求批处理
  DataLoader,
  BatcherConfig,
  
  // 内存分析
  MemoryProfiler,
  MemorySnapshot,
  LeakSuspect,
  
  // 性能管理
  PerformanceBudget,
  DegradationConfig
} from '@ldesign/engine'
```

---

**📖 探索更多功能，构建高性能应用！**




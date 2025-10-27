# 高级特性

探索 LDesign Engine 的高级功能，充分发挥引擎的强大能力。

## 时间旅行 (Time Travel)

时间旅行功能允许你保存、恢复和回放应用状态。

### 启用时间旅行

```typescript
// 启用时间旅行
engine.state.enableTimeTravel({
  maxSnapshots: 50, // 最多保存50个快照
  autoSnapshot: true, // 自动保存快照
  snapshotInterval: 1000 // 每1秒自动保存一次
})
```

### 保存和恢复快照

```typescript
// 手动保存快照
engine.state.saveSnapshot('before-important-operation')

// 执行重要操作
try {
  await performImportantOperation()
} catch (error) {
  // 出错时恢复快照
  engine.state.restoreSnapshot('before-important-operation')
  console.error('操作失败，已恢复到之前状态')
}
```

### 撤销和重做

```typescript
// 撤销上一个操作
engine.state.undo()

// 重做
engine.state.redo()

// 检查是否可以撤销/重做
const canUndo = engine.state.canUndo()
const canRedo = engine.state.canRedo()

// 获取历史记录
const history = engine.state.getHistory()
console.log('历史记录:', history)
```

### 状态回放

```typescript
// 开始记录
engine.state.startRecording()

// 执行一系列操作
engine.state.set('count', 1)
engine.state.set('count', 2)
engine.state.set('count', 3)

// 停止记录
const recording = engine.state.stopRecording()

// 回放操作
await engine.state.replay(recording, {
  speed: 2, // 2倍速
  onStep: (state, index) => {
    console.log(`步骤 ${index}:`, state)
  }
})
```

## 性能分析工具

引擎提供了三大可视化工具帮助你分析和优化应用性能。

### 1. 性能火焰图

分析函数调用栈和耗时：

```typescript
import { PerformanceFlamegraph } from '@ldesign/engine/devtools'

// 创建火焰图
const flamegraph = new PerformanceFlamegraph()

// 开始分析
flamegraph.start()

// 执行你的代码
await performComplexOperation()

// 停止分析
flamegraph.stop()

// 生成报告
const report = flamegraph.generateReport()
console.log('性能火焰图:', report)

// 导出为JSON
flamegraph.exportJSON('performance.json')

// 导出为HTML（可视化）
flamegraph.exportHTML('performance.html')
```

### 2. 内存时间线

监控内存使用趋势：

```typescript
import { MemoryTimeline } from '@ldesign/engine/devtools'

// 创建时间线
const timeline = new MemoryTimeline({
  interval: 1000, // 每秒采样一次
  maxPoints: 60 // 保存最近60个数据点
})

// 开始监控
timeline.start()

// 运行你的应用...

// 获取内存快照
const snapshot = timeline.getSnapshot()
console.log('内存使用:', snapshot)

// 检测内存泄漏
const leaks = timeline.detectLeaks()
if (leaks.length > 0) {
  console.warn('检测到潜在内存泄漏:', leaks)
}

// 停止监控
timeline.stop()

// 生成报告
const report = timeline.generateReport()
```

### 3. 事件流可视化

可视化事件传播路径：

```typescript
import { EventFlowVisualizer } from '@ldesign/engine/devtools'

// 创建可视化工具
const visualizer = new EventFlowVisualizer(engine)

// 开始记录
visualizer.start()

// 触发一些事件
engine.events.emit('user:login', userData)
engine.events.emit('data:update', newData)

// 停止记录
visualizer.stop()

// 生成可视化图表
const graph = visualizer.generateGraph()

// 导出
visualizer.exportHTML('event-flow.html')
```

## 微前端支持

引擎提供完整的微前端解决方案。

### 注册子应用

```typescript
// 主应用
import { MicroFrontendManager } from '@ldesign/engine/micro-frontend'

const mfManager = new MicroFrontendManager(engine)

// 注册子应用
mfManager.register({
  name: 'sub-app-1',
  entry: 'https://sub-app-1.example.com',
  container: '#sub-app-container',
  activeRule: '/app1'
})

// 启动
await mfManager.start()
```

### 应用间通信

```typescript
// 主应用发送消息
mfManager.postMessage('sub-app-1', {
  type: 'update',
  data: { user: userData }
})

// 子应用接收消息
mfManager.onMessage((message) => {
  console.log('收到消息:', message)
})

// 共享状态
mfManager.shareState({
  user: userData,
  theme: 'dark'
})
```

### 生命周期钩子

```typescript
mfManager.onAppMount('sub-app-1', (app) => {
  console.log('子应用挂载:', app)
})

mfManager.onAppUnmount('sub-app-1', (app) => {
  console.log('子应用卸载:', app)
})

mfManager.onAppError('sub-app-1', (error) => {
  console.error('子应用错误:', error)
})
```

## Worker 池

使用 Worker 池进行多线程计算。

### 创建 Worker 池

```typescript
import { WorkerPool } from '@ldesign/engine/workers'

// 创建 Worker 池
const pool = new WorkerPool({
  worker: () => new Worker(new URL('./worker.js', import.meta.url)),
  size: 4, // 4个 Worker
  maxQueueSize: 100 // 最多排队100个任务
})

// 执行任务
const result = await pool.execute({
  type: 'heavy-calculation',
  data: largeDataset
})

// 并行执行多个任务
const results = await pool.executeMany([
  { type: 'task1', data: data1 },
  { type: 'task2', data: data2 },
  { type: 'task3', data: data3 }
])

// 清理资源
await pool.terminate()
```

### Worker 脚本示例

```javascript
// worker.js
self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data

  try {
    let result
    
    switch (type) {
      case 'heavy-calculation':
        result = await performHeavyCalculation(data)
        break
      case 'process-data':
        result = await processData(data)
        break
      default:
        throw new Error(`未知任务类型: ${type}`)
    }

    self.postMessage({ id, result })
  } catch (error) {
    self.postMessage({ id, error: error.message })
  }
})

async function performHeavyCalculation(data) {
  // 执行耗时计算
  return result
}
```

## 分布式状态同步

跨标签页或多端同步状态。

### 启用分布式同步

```typescript
import { DistributedSync } from '@ldesign/engine/state'

// 创建同步管理器
const sync = new DistributedSync(engine, {
  channel: 'my-app', // 同步通道
  syncInterval: 100, // 同步间隔（毫秒）
  conflictResolution: 'last-write-wins' // 冲突解决策略
})

// 启动同步
await sync.start()

// 标记需要同步的状态
sync.markForSync('user')
sync.markForSync('cart')

// 状态变更会自动同步到其他标签页
engine.state.set('user.name', 'Alice')
```

### 自定义冲突解决

```typescript
const sync = new DistributedSync(engine, {
  conflictResolution: (local, remote) => {
    // 自定义冲突解决逻辑
    if (local.timestamp > remote.timestamp) {
      return local
    }
    return remote
  }
})
```

## 请求批处理

合并多个请求，减少网络开销。

### DataLoader

```typescript
import { DataLoader } from '@ldesign/engine/utils'

// 创建 DataLoader
const userLoader = new DataLoader(async (ids: string[]) => {
  // 批量获取用户
  const users = await fetchUsersByIds(ids)
  // 返回结果数组（顺序与ids一致）
  return users
})

// 单独请求会被自动批处理
const user1 = await userLoader.load('1')
const user2 = await userLoader.load('2')
const user3 = await userLoader.load('3')

// 以上三个请求会被合并为一个批量请求
// fetchUsersByIds(['1', '2', '3'])
```

### RequestMerger

合并相同的请求：

```typescript
import { RequestMerger } from '@ldesign/engine/utils'

const merger = new RequestMerger()

// 多个相同的请求会被合并
const promise1 = merger.merge('user:123', () => fetchUser('123'))
const promise2 = merger.merge('user:123', () => fetchUser('123'))
const promise3 = merger.merge('user:123', () => fetchUser('123'))

// 只会发起一个请求，三个 promise 共享结果
const [user1, user2, user3] = await Promise.all([promise1, promise2, promise3])
```

## 并发控制

### 信号量 (Semaphore)

```typescript
import { Semaphore } from '@ldesign/engine/utils'

// 创建信号量（限制3个并发）
const semaphore = new Semaphore(3)

async function processItem(item) {
  await semaphore.acquire()
  try {
    await process(item)
  } finally {
    semaphore.release()
  }
}

// 并发处理，但最多3个同时执行
await Promise.all(items.map(processItem))
```

### 速率限制器 (RateLimiter)

```typescript
import { RateLimiter } from '@ldesign/engine/utils'

// 创建限流器（每秒最多10个请求）
const limiter = new RateLimiter({
  maxRequests: 10,
  timeWindow: 1000
})

async function apiCall() {
  await limiter.acquire()
  return await fetch('/api/data')
}
```

### 断路器 (CircuitBreaker)

```typescript
import { CircuitBreaker } from '@ldesign/engine/utils'

// 创建断路器
const breaker = new CircuitBreaker({
  threshold: 5, // 5次失败后打开
  timeout: 10000, // 10秒后尝试恢复
  onOpen: () => console.log('断路器打开'),
  onHalfOpen: () => console.log('断路器半开'),
  onClose: () => console.log('断路器关闭')
})

async function callExternalAPI() {
  return await breaker.execute(async () => {
    return await fetch('/api/external')
  })
}
```

## 虚拟滚动

高性能渲染大列表。

```vue
<template>
  <VirtualScroll
    :items="largeList"
    :item-height="50"
    :buffer="5"
  >
    <template #default="{ item }">
      <div class="item">{{ item.name }}</div>
    </template>
  </VirtualScroll>
</template>

<script setup>
import { VirtualScroll } from '@ldesign/engine/performance'

const largeList = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`
})))
</script>
```

## DevTools 集成

### 创建自定义检查器

```typescript
import { createDevToolsIntegration } from '@ldesign/engine/devtools'

const devtools = createDevToolsIntegration({
  enabled: true
})

// 初始化
devtools.init(app, engine)

// 添加自定义检查器
devtools.addInspector({
  id: 'my-plugin',
  label: '我的插件',
  icon: 'plugin',
  treeFilterPlaceholder: '搜索...',
  actions: [
    {
      icon: 'refresh',
      tooltip: '刷新',
      action: () => {
        // 刷新逻辑
      }
    }
  ]
})

// 添加时间线事件
devtools.addTimelineEvent('my-plugin', {
  time: Date.now(),
  title: '自定义操作',
  subtitle: '操作描述',
  data: {
    key: 'value'
  }
})
```

## 下一步

- 📖 查看 [性能优化指南](/guide/performance-optimization) 了解更多优化技巧
- 🎯 阅读 [最佳实践](/guide/best-practices) 学习开发规范
- 💡 浏览 [API 参考](/api/) 查看完整接口
- 🔧 探索 [插件开发](/examples/plugin-development) 创建自定义插件



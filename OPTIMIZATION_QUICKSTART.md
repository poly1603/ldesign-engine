# @ldesign/engine 性能优化快速开始

## 🚀 5分钟上手优化版引擎

### 1. 安装

```bash
pnpm add @ldesign/engine
```

### 2. 创建优化版引擎

```typescript
import { createOptimizedEngine } from '@ldesign/engine'
import { createApp } from 'vue'
import App from './App.vue'

// 创建优化版引擎
const engine = createOptimizedEngine({
  debug: false, // 生产环境关闭调试
  optimization: {
    enableMemoryOptimization: true,  // 启用内存优化
    memoryLimit: 256,               // 内存限制 256MB
    batchDelay: 16,                 // 批处理延迟（一帧）
    enableAggressiveOptimization: true // 激进优化
  }
})

// 创建并挂载应用
const app = createApp(App)
engine.install(app)
app.mount('#app')
```

### 3. 在组件中使用

```vue
<script setup lang="ts">
import { useEngine } from '@ldesign/engine/vue'

const engine = useEngine()

// 使用优化的缓存
async function loadData() {
  // 自动压缩和批处理
  const data = await engine.cache.get('user-data')
  if (!data) {
    const freshData = await fetchUserData()
    await engine.cache.set('user-data', freshData, {
      ttl: 300000,    // 5分钟过期
      compress: true  // 自动压缩
    })
  }
  return data
}

// 使用优化的状态管理
const user = engine.state.getProxy('user')

// 批量更新状态
function updateUser(updates: any) {
  engine.state.batchSet({
    'user.name': updates.name,
    'user.email': updates.email,
    'user.profile': updates.profile
  })
}

// 使用优化的事件系统
engine.events.on('data:update', (data) => {
  // 处理更新
}, { priority: 100 }) // 高优先级
</script>
```

## ⚡ 性能最佳实践

### 1. 使用对象池减少GC

```typescript
// 获取对象池
const requestPool = engine.getObjectPool('request')

// 使用对象
const req = requestPool.acquire()
try {
  req.url = '/api/data'
  req.method = 'GET'
  await sendRequest(req)
} finally {
  // 必须释放！
  requestPool.release(req)
}
```

### 2. 批量操作提升性能

```typescript
// ❌ 避免：循环单个操作
for (const item of items) {
  await engine.cache.set(item.id, item)
}

// ✅ 推荐：批量操作
await engine.cache.mset(
  items.map(item => [item.id, item])
)
```

### 3. 使用性能监控

```typescript
import { Monitored, MemoryLimit } from '@ldesign/engine'

class DataService {
  @Monitored // 自动记录性能
  @MemoryLimit(50 * 1024 * 1024) // 限制50MB
  async processLargeData(data: any[]) {
    // 处理大数据
    return data.map(transform)
  }
}
```

### 4. 并发控制

```typescript
import { createConcurrencyLimiter } from '@ldesign/engine'

// 限制并发数为5
const limiter = createConcurrencyLimiter({
  maxConcurrent: 5
})

// 并发请求
const results = await Promise.all(
  urls.map(url => 
    limiter.execute(() => fetch(url))
  )
)
```

## 📊 查看优化效果

### 运行基准测试

```typescript
// 运行内置基准测试
const benchmark = await engine.runBenchmark()
console.log(benchmark.summary)
/*
输出：
Performance Benchmark Results:
- Cache: 125000 ops/sec
- State: 200000 ops/sec  
- Events: 250000 ops/sec
*/
```

### 获取优化统计

```typescript
const stats = engine.getOptimizationStats()
console.log('内存使用:', stats.memory)
console.log('对象池统计:', stats.pools)
console.log('优化建议:', stats.suggestions)
```

### 内存泄漏检测

```typescript
import { MemoryLeakDetector } from '@ldesign/engine'

const detector = new MemoryLeakDetector()
detector.start()

// 执行你的代码...

const report = detector.getReport()
if (report.possibleLeaks.length > 0) {
  console.warn('检测到可能的内存泄漏:', report.possibleLeaks)
}
```

## 🎯 常见场景优化

### 场景1：大数据列表

```typescript
// 使用虚拟滚动
import { RenderOptimizer } from '@ldesign/engine'

const visibleData = computed(() => {
  return RenderOptimizer.virtualScroll(
    allItems.value,
    viewportHeight.value,
    itemHeight
  )
})
```

### 场景2：实时数据更新

```typescript
// 使用批处理减少渲染
engine.state.setBatchDelay(50) // 50ms批处理

// 高频更新会自动合并
function onRealtimeData(data: any) {
  engine.state.set(`realtime.${data.id}`, data)
}
```

### 场景3：大文件上传

```typescript
// 使用内存管理器
const memoryManager = engine.getMemoryManager()
memoryManager.registerQuota('upload', 100 * 1024 * 1024) // 100MB

// 分片处理
async function uploadLargeFile(file: File) {
  const chunks = await splitFile(file, 5 * 1024 * 1024) // 5MB chunks
  
  for (const chunk of chunks) {
    const buffer = memoryManager.allocate('upload', chunk.size)
    if (!buffer) {
      throw new Error('内存不足')
    }
    
    try {
      await uploadChunk(chunk, buffer)
    } finally {
      memoryManager.deallocate('upload', buffer)
    }
  }
}
```

## 🔧 配置参考

### 完整配置选项

```typescript
createOptimizedEngine({
  // 基础配置
  debug: false,
  
  // 优化配置
  optimization: {
    // 内存优化
    enableMemoryOptimization: true,
    memoryLimit: 256,              // 总内存限制(MB)
    
    // 性能分析
    enableProfiling: false,        // 生产环境建议关闭
    
    // 批处理
    batchDelay: 16,               // 批处理延迟(ms)
    
    // 激进优化
    enableAggressiveOptimization: false // 可能影响兼容性
  },
  
  // 缓存配置
  cache: {
    maxSize: 1000,                // 最大缓存数
    strategy: 'lru',              // 淘汰策略
    defaultTTL: 300000            // 默认过期时间
  },
  
  // 性能预算
  performance: {
    budgets: {
      initialization: 100,        // 初始化时间(ms)
      rendering: 16,             // 渲染时间(ms)
      apiCall: 500               // API调用时间(ms)
    }
  }
})
```

## 🎉 立即体验

1. 升级到最新版本
2. 使用 `createOptimizedEngine` 替代 `createEngine`
3. 运行基准测试查看提升效果
4. 根据实际场景调整配置

## 📚 了解更多

- [完整优化指南](./OPTIMIZATION_GUIDE.md)
- [API 文档](./docs/api/README.md)
- [示例项目](./examples/performance/)



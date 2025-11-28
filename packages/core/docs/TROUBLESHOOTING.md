# 故障排查指南

> 版本：2.0.0  
> 更新日期：2025-11-27

本文档提供常见问题的排查和解决方案，帮助您快速定位和解决使用 LDesign Core Engine 时遇到的问题。

## 目录

- [常见错误及解决方案](#常见错误及解决方案)
- [调试技巧](#调试技巧)
- [性能问题排查](#性能问题排查)
- [内存问题排查](#内存问题排查)
- [插件问题排查](#插件问题排查)

---

## 常见错误及解决方案

### 1. 插件安装失败

#### 错误信息
```
EngineError: Plugin installation failed
Code: PLUGIN_INSTALL_FAILED
```

#### 可能原因
1. 依赖插件未安装
2. 插件配置无效
3. 并发安装冲突
4. 插件初始化超时

#### 解决方案

```typescript
// 确保依赖插件先安装
await engine.installPlugin(requiredPlugin);
await engine.installPlugin(plugin);

// 验证配置
const plugin = definePlugin({
  name: 'my-plugin',
  async install(engine, options) {
    if (!options.apiKey) {
      throw new EngineError(
        ErrorCode.CONFIG_INVALID,
        'apiKey is required',
        { options }
      );
    }
  }
});

// 使用并发控制
await Promise.all(
  plugins.map(p => engine.installPlugin(p, {
    concurrency: { maxConcurrent: 3 }
  }))
);

// 增加超时时间
await engine.installPlugin(plugin, {
  timeout: 30000
});
```

---

### 2. 生命周期钩子错误

#### 错误信息
```
EngineError: Lifecycle hook error
Code: LIFECYCLE_HOOK_ERROR
```

#### 解决方案

```typescript
// 正确的错误处理
lifecycle.on('beforeInit', async () => {
  try {
    await criticalOperation();
  } catch (error) {
    logger.error('Critical operation failed', { error });
    throw error; // 关键错误重新抛出
  }
  
  try {
    await optionalOperation();
  } catch (error) {
    logger.warn('Optional operation failed', { error });
    // 非关键错误只记录
  }
});

// 监听钩子错误
lifecycle.on('hook:error', (data) => {
  console.error('Hook failed:', {
    hook: data.hookName,
    phase: data.phase,
    error: data.error
  });
});
```

---

### 3. 内存泄漏

#### 症状
- 内存使用持续增长
- 应用响应变慢
- 最终导致崩溃

#### 排查步骤

```typescript
// 1. 启用内存监控
import { MemoryLeakDetector } from '@ldesign/core';

const detector = new MemoryLeakDetector({
  enabled: true,
  checkInterval: 60000,
  threshold: 100 * 1024 * 1024
});

detector.on('leak:detected', (data) => {
  console.warn('Memory leak detected:', data);
});

// 2. 检查事件监听器
console.log(engine.getListenerCount());
console.log(engine.listenerCount('state:changed'));

// 清理未使用的监听器
const unsubscribe = engine.on('event', handler);
unsubscribe();

// 3. 检查定时器
class MyPlugin {
  private timers: NodeJS.Timeout[] = [];
  
  install() {
    const timer = setInterval(() => {}, 1000);
    this.timers.push(timer);
  }
  
  uninstall() {
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];
  }
}

// 4. 检查闭包引用
// ❌ 可能导致内存泄漏
function createHandler(largeData) {
  return () => {
    console.log(largeData.length); // 闭包持有 largeData
  };
}

// ✅ 只保留必要的数据
function createHandler(largeData) {
  const length = largeData.length;
  return () => {
    console.log(length);
  };
}
```

---

### 4. 性能问题

#### 症状
- 操作响应慢
- CPU 使用率高
- 事件处理延迟

#### 排查步骤

```typescript
// 1. 启用性能监控
import { PerformanceTracker } from '@ldesign/core';

const tracker = new PerformanceTracker({
  enabled: true,
  slowThreshold: 100,
  warningThreshold: 50
});

engine.on('performance:slow', (data) => {
  console.warn('Slow operation:', data);
});

// 2. 分析慢操作
const endTracking = tracker.startTracking('data-processing');
try {
  await processLargeDataset();
} finally {
  endTracking();
}

const report = tracker.getReport();
console.log('Slow operations:', report.slowOperations);

// 3. 优化事件监听器
// ❌ 避免
for (let i = 0; i < 1000; i++) {
  engine.on('update', () => handleUpdate(i));
}

// ✅ 使用单个监听器
engine.on('update', (data) => {
  items.forEach(item => {
    if (item.id === data.id) {
      handleUpdate(item);
    }
  });
});

// 4. 批量处理状态更新
stateManager.batch(() => {
  for (const item of items) {
    stateManager.setState({ [item.id]: item });
  }
});
```

---

### 5. 热重载失败

#### 错误信息
```
EngineError: Plugin hot reload failed
Code: PLUGIN_RELOAD_FAILED
```

#### 解决方案

```typescript
await engine.hotReloadPlugin('my-plugin', {
  preserveState: true,
  
  beforeReload: async (plugin) => {
    try {
      await savePluginState(plugin);
    } catch (error) {
      logger.error('Failed to save plugin state', { error });
      throw error;
    }
  },
  
  afterReload: async (plugin) => {
    try {
      await restorePluginState(plugin);
    } catch (error) {
      logger.error('Failed to restore plugin state', { error });
    }
  }
});

// 确保状态可序列化
// ✅ 只保存可序列化的数据
const state = {
  data: 'value',
  config: { key: 'value' }
};
```

---

## 调试技巧

### 1. 启用详细日志

```typescript
import { Logger, LogLevel } from '@ldesign/core';

const logger = new Logger({
  level: LogLevel.DEBUG,
  timestamp: true,
  colors: true
});

const engine = new CoreEngine({ logger });
```

### 2. 使用调试事件

```typescript
// 监听所有错误
engine.on('error', (error) => {
  console.error('Engine error:', error);
  if (error instanceof EngineError) {
    console.error('Error code:', error.code);
    console.error('Context:', error.context);
  }
});

// 监听生命周期事件
['beforeInit', 'init', 'afterInit'].forEach(phase => {
  engine.lifecycle.on(phase, () => {
    console.log(`Lifecycle: ${phase}`);
  });
});

// 监听插件事件
engine.on('plugin:installed', (plugin) => {
  console.log('Plugin installed:', plugin.name);
});
```

### 3. 使用性能分析

```typescript
// Node.js 环境
const { performance } = require('perf_hooks');

const start = performance.now();
await engine.init();
const duration = performance.now() - start;
console.log(`Initialization took ${duration}ms`);

// 浏览器环境
console.profile('Engine Init');
await engine.init();
console.profileEnd('Engine Init');
```

### 4. 检查引擎状态

```typescript
console.log('Engine state:', {
  phase: engine.lifecycle.currentPhase,
  pluginCount: engine.getPluginCount(),
  listenerCount: engine.getListenerCount(),
  stateKeys: Object.keys(engine.getState())
});

const plugins = engine.getPlugins();
console.log('Installed plugins:', plugins.map(p => p.name));
```

---

## 性能问题排查

### 慢操作检测

```typescript
const report = tracker.getReport();
const slowOps = report.slowOperations
  .sort((a, b) => b.duration - a.duration)
  .slice(0, 10);

console.log('Top 10 slow operations:', slowOps);

// 按类别分析
const byCategory = report.byCategory;
Object.entries(byCategory).forEach(([category, stats]) => {
  if (stats.averageDuration > 50) {
    console.warn(`Category ${category} is slow:`, stats);
  }
});
```

### 事件系统优化

```typescript
const listenerCount = engine.getListenerCount();
if (listenerCount > 100) {
  console.warn(`Too many listeners: ${listenerCount}`);
  
  const events = engine.eventNames();
  events.forEach(event => {
    const count = engine.listenerCount(event);
    if (count > 10) {
      console.warn(`Event ${event} has ${count} listeners`);
    }
  });
}
```

### 状态管理优化

```typescript
// 测试状态更新性能
const iterations = 1000;
const start = Date.now();

for (let i = 0; i < iterations; i++) {
  stateManager.setState({ count: i });
}

const duration = Date.now() - start;
console.log(`${iterations} updates took ${duration}ms`);
console.log(`Average: ${duration / iterations}ms per update`);
```

---

## 内存问题排查

### 内存快照分析

```typescript
// Node.js 环境
const v8 = require('v8');

function takeHeapSnapshot(filename) {
  const snapshot = v8.writeHeapSnapshot(filename);
  console.log(`Heap snapshot written to ${snapshot}`);
}

takeHeapSnapshot('before-operation.heapsnapshot');
await performOperation();
takeHeapSnapshot('after-operation.heapsnapshot');
```

### 监控内存使用

```typescript
setInterval(() => {
  if (process.memoryUsage) {
    const usage = process.memoryUsage();
    console.log('Memory usage:', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`
    });
    
    if (usage.heapUsed > 500 * 1024 * 1024) {
      console.warn('High memory usage detected!');
    }
  }
}, 30000);
```

---

## 插件问题排查

### 插件依赖问题

```typescript
// 检查插件依赖
const plugin = engine.getPlugin('my-plugin');
console.log('Dependencies:', plugin.dependencies);

// 验证依赖是否已安装
plugin.dependencies.forEach(dep => {
  if (!engine.hasPlugin(dep)) {
    console.error(`Missing dependency: ${dep}`);
  }
});
```

### 插件冲突检测

```typescript
// 检查插件冲突
const plugins = engine.getPlugins();
const conflicts = plugins.filter((p1, i) => 
  plugins.slice(i + 1).some(p2 => 
    p1.name === p2.name || 
    hasConflictingAPIs(p1, p2)
  )
);

if (conflicts.length > 0) {
  console.error('Plugin conflicts detected:', conflicts);
}
```

---

## 获取帮助

如果以上方法无法解决问题：

1. **查看文档**
   - [API 文档](./API_UPDATES.md)
   - [最佳实践](./BEST_PRACTICES.md)
   - [迁移指南](./MIGRATION_GUIDE.md)

2. **搜索已知问题**
   - GitHub Issues
   - 社区讨论

3. **提交问题报告**
   - 包含完整的错误信息
   - 提供最小可复现示例
   - 说明环境信息（Node.js版本、浏览器等）

---

**文档版本**: 2.0.0  
**最后更新**: 2025-11-27  
**维护者**: LDesign Team

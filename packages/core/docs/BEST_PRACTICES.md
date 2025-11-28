# 最佳实践指南

> 版本：2.0.0  
> 更新日期：2025-11-27

本文档提供了使用 LDesign Core Engine 的最佳实践和推荐模式，帮助您构建健壮、高性能的应用程序。

## 目录

- [错误处理最佳实践](#错误处理最佳实践)
- [并发控制最佳实践](#并发控制最佳实践)
- [性能优化最佳实践](#性能优化最佳实践)
- [测试最佳实践](#测试最佳实践)
- [插件开发最佳实践](#插件开发最佳实践)
- [状态管理最佳实践](#状态管理最佳实践)
- [生命周期管理最佳实践](#生命周期管理最佳实践)
- [内存管理最佳实践](#内存管理最佳实践)

---

## 错误处理最佳实践

### 1. 使用统一的错误类型

✅ **推荐做法**

```typescript
import { EngineError, ErrorCode } from '@ldesign/core';

throw new EngineError(
  ErrorCode.PLUGIN_LOAD_FAILED,
  'Failed to load plugin: invalid configuration',
  { pluginName: 'my-plugin', config: invalidConfig }
);
```

❌ **避免做法**

```typescript
throw new Error('Plugin load failed'); // 不要使用普通 Error
throw 'Something went wrong'; // 不要使用字符串错误
```

### 2. 实现适当的错误恢复策略

✅ **推荐做法**

```typescript
async function loadPluginWithRetry(pluginName: string) {
  const maxRetries = 3;
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await engine.loadPlugin(pluginName);
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Plugin load attempt ${attempt} failed`, { error, pluginName });
      
      if (attempt < maxRetries) {
        await delay(Math.pow(2, attempt) * 1000); // 指数退避
      }
    }
  }
  
  throw new EngineError(
    ErrorCode.PLUGIN_LOAD_FAILED,
    `Failed to load plugin after ${maxRetries} attempts`,
    { pluginName, lastError }
  );
}
```

### 3. 错误日志记录规范

✅ **推荐做法**

```typescript
logger.error('Plugin installation failed', {
  pluginName: plugin.name,
  version: plugin.version,
  error: error.message,
  stack: error.stack,
  context: {
    timestamp: Date.now(),
    environment: process.env.NODE_ENV
  }
});
```

---

## 并发控制最佳实践

### 1. 插件安装并发控制

✅ **推荐做法**

```typescript
const plugins = [plugin1, plugin2, plugin3, plugin4, plugin5];

await Promise.all(
  plugins.map(plugin => 
    engine.installPlugin(plugin, {
      concurrency: {
        maxConcurrent: 3,
        timeout: 30000,
        priority: 1
      }
    })
  )
);
```

❌ **避免做法**

```typescript
// 不要无限制并发
await Promise.all(
  plugins.map(plugin => engine.installPlugin(plugin))
);
```

### 2. 避免竞态条件

✅ **推荐做法**

```typescript
class PluginManager {
  private installLock = new Map<string, Promise<void>>();
  
  async installPlugin(plugin: Plugin) {
    const existingInstall = this.installLock.get(plugin.name);
    if (existingInstall) {
      await existingInstall;
      return;
    }
    
    const installPromise = this._doInstall(plugin);
    this.installLock.set(plugin.name, installPromise);
    
    try {
      await installPromise;
    } finally {
      this.installLock.delete(plugin.name);
    }
  }
}
```

### 3. 热重载时的并发控制

✅ **推荐做法**

```typescript
async function reloadPlugins(pluginNames: string[]) {
  for (const name of pluginNames) {
    try {
      await engine.hotReloadPlugin(name, {
        preserveState: true
      });
    } catch (error) {
      logger.error(`Failed to reload plugin: ${name}`, { error });
    }
  }
}
```

---

## 性能优化最佳实践

### 1. 使用性能监控

✅ **推荐做法**

```typescript
import { PerformanceTracker } from '@ldesign/core';

const tracker = new PerformanceTracker({
  enabled: process.env.NODE_ENV !== 'test',
  slowThreshold: 100,
  warningThreshold: 50,
  sampleRate: 0.1
});

async function processData(data: any[]) {
  const endTracking = tracker.startTracking('data-processing', {
    category: 'business',
    metadata: { dataSize: data.length }
  });
  
  try {
    return await heavyOperation(data);
  } finally {
    endTracking();
  }
}

setInterval(() => {
  const report = tracker.getReport();
  if (report.slowOperations.length > 0) {
    logger.warn('Performance issues detected', {
      slowOperations: report.slowOperations.slice(0, 10)
    });
  }
}, 60000);
```

### 2. 优化事件监听器

✅ **推荐做法**

```typescript
// 及时清理监听器
const unsubscribe = engine.on('state:changed', handler);
unsubscribe(); // 在组件卸载时

// 使用 once 监听一次性事件
engine.once('engine:ready', () => {
  console.log('Engine is ready');
});
```

❌ **避免做法**

```typescript
// 不要在循环中创建监听器
items.forEach(item => {
  engine.on('update', () => handleUpdate(item));
});
```

### 3. 状态更新优化

✅ **推荐做法**

```typescript
// 启用深度比较
const stateManager = new StateManager({
  deepCompare: true,
  maxDepth: 5,
  ignoreKeys: ['_internal', 'timestamp']
});

// 批量更新状态
stateManager.batch(() => {
  stateManager.setState({ user: newUser });
  stateManager.setState({ preferences: newPreferences });
  stateManager.setState({ settings: newSettings });
});
```

### 4. 延迟加载和代码分割

✅ **推荐做法**

```typescript
const lazyPlugin = {
  name: 'heavy-plugin',
  lazy: true,
  loader: () => import('./heavy-plugin')
};

async function enableAdvancedFeature() {
  const module = await import('./advanced-feature');
  return module.initialize();
}
```

---

## 测试最佳实践

### 1. 单元测试编写规范

✅ **推荐做法**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoreEngine } from '@ldesign/core';

describe('PluginManager', () => {
  let engine: CoreEngine;
  
  beforeEach(() => {
    engine = new CoreEngine();
  });
  
  afterEach(async () => {
    await engine.destroy();
    vi.clearAllMocks();
  });
  
  it('should install plugin successfully', async () => {
    // Arrange
    const plugin = createTestPlugin('test-plugin');
    
    // Act
    await engine.installPlugin(plugin);
    
    // Assert
    expect(engine.hasPlugin('test-plugin')).toBe(true);
  });
  
  it('should handle plugin installation errors', async () => {
    const invalidPlugin = createInvalidPlugin();
    
    await expect(
      engine.installPlugin(invalidPlugin)
    ).rejects.toThrow(EngineError);
  });
});
```

### 2. 并发测试方法

✅ **推荐做法**

```typescript
describe('Concurrent Plugin Installation', () => {
  it('should handle concurrent installations correctly', async () => {
    const plugins = Array.from({ length: 10 }, (_, i) => 
      createTestPlugin(`plugin-${i}`)
    );
    
    const results = await Promise.allSettled(
      plugins.map(p => engine.installPlugin(p))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled');
    expect(successful.length).toBe(plugins.length);
  });
});
```

### 3. 性能测试建议

✅ **推荐做法**

```typescript
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  it('should complete event emission within threshold', async () => {
    const eventCount = 1000;
    const startTime = performance.now();
    
    for (let i = 0; i < eventCount; i++) {
      await engine.emit('test:event', { data: i });
    }
    
    const duration = performance.now() - startTime;
    const avgTime = duration / eventCount;
    
    expect(avgTime).toBeLessThan(1);
  });
});
```

---

## 插件开发最佳实践

### 1. 插件结构设计

✅ **推荐做法**

```typescript
import { definePlugin, EngineError, ErrorCode } from '@ldesign/core';

export default definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  dependencies: ['core-plugin'],
  
  async install(engine, options) {
    try {
      this.validateConfig(options);
      engine.registerService('myService', new MyService());
      this.registerEventListeners(engine);
      await this.initialize(engine);
    } catch (error) {
      throw new EngineError(
        ErrorCode.PLUGIN_INSTALL_FAILED,
        `Failed to install ${this.name}`,
        { error, options }
      );
    }
  },
  
  async uninstall(engine) {
    try {
      await this.cleanup();
      this.removeEventListeners();
      engine.unregisterService('myService');
    } catch (error) {
      throw new EngineError(
        ErrorCode.PLUGIN_UNINSTALL_FAILED,
        `Failed to uninstall ${this.name}`,
        { error }
      );
    }
  }
});
```

### 2. 插件间通信

✅ **推荐做法**

```typescript
// 使用事件进行松耦合通信
class PluginA {
  async install(engine) {
    engine.emit('pluginA:dataReady', { data: 'important data' });
  }
}

class PluginB {
  async install(engine) {
    engine.on('pluginA:dataReady', (data) => {
      this.handleData(data);
    });
  }
}
```

---

## 状态管理最佳实践

### 1. 状态结构设计

✅ **推荐做法**

```typescript
interface AppState {
  user: {
    id: string;
    name: string;
  };
  settings: {
    theme: string;
    language: string;
  };
  cache: Map<string, any>;
}

// 使用命名空间组织状态
stateManager.setState('user:profile', userProfile);
stateManager.setState('app:settings', settings);
```

### 2. 状态更新模式

✅ **推荐做法**

```typescript
// 使用不可变更新
const newState = {
  ...currentState,
  user: {
    ...currentState.user,
    name: 'New Name'
  }
};
stateManager.setState(newState);

// 使用批量更新
stateManager.batch(() => {
  stateManager.setState('user:name', 'John');
  stateManager.setState('user:email', 'john@example.com');
  stateManager.setState('user:age', 30);
});
```

---

## 生命周期管理最佳实践

### 1. 生命周期钩子使用

✅ **推荐做法**

```typescript
lifecycle.on('beforeInit', async () => {
  await loadConfiguration();
});

lifecycle.on('init', async () => {
  await initializeServices();
});

lifecycle.on('afterInit', async () => {
  await cleanupTemporaryResources();
});

lifecycle.on('beforeDestroy', async () => {
  await saveCurrentState();
});
```

### 2. 错误处理

✅ **推荐做法**

```typescript
lifecycle.on('init', async () => {
  try {
    await criticalInitialization();
  } catch (error) {
    logger.error('Critical initialization failed', { error });
    throw error; // 关键错误，重新抛出
  }
  
  try {
    await nonCriticalInitialization();
  } catch (error) {
    logger.warn('Non-critical initialization failed', { error });
    // 非关键错误，记录但不中断
  }
});
```

---

## 内存管理最佳实践

### 1. 及时清理资源

✅ **推荐做法**

```typescript
class MyPlugin {
  private listeners: Array<() => void> = [];
  private timers: NodeJS.Timeout[] = [];
  
  async install(engine) {
    const listener = engine.on('event', handler);
    this.listeners.push(listener);
    
    const timer = setInterval(() => {}, 1000);
    this.timers.push(timer);
  }
  
  async uninstall() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
    
    this.timers.forEach(timer => clearInterval(timer));
    this.timers = [];
  }
}
```

### 2. 避免内存泄漏

✅ **推荐做法**

```typescript
// 使用 WeakMap 存储临时数据
const cache = new WeakMap<object, any>();

// 避免循环引用
class Component {
  parent?: Component;
  
  destroy() {
    this.parent = undefined;
  }
}

// 及时清理大对象
let largeData: LargeObject | null = loadLargeData();
processData(largeData);
largeData = null; // 释放引用
```

---

## 总结

遵循这些最佳实践将帮助您：

- ✅ 构建更健壮的应用程序
- ✅ 提高代码质量和可维护性
- ✅ 优化性能和资源使用
- ✅ 减少错误和调试时间
- ✅ 提升团队协作效率

## 相关文档

- [API 更新文档](./API_UPDATES.md)
- [故障排查指南](./TROUBLESHOOTING.md)
- [迁移指南](./MIGRATION_GUIDE.md)
- [开发者指南](./DEVELOPER_GUIDE.md)

---

**文档版本**: 2.0.0  
**最后更新**: 2025-11-27  
**维护者**: LDesign Team

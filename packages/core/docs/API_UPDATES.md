# API 更新文档

> 版本：2.0.0  
> 更新日期：2025-11-27  
> 适用于：代码健壮性优化版本

本文档详细说明了在代码健壮性优化过程中新增和修改的 API。

## 目录

- [错误处理 API](#错误处理-api)
- [监控和日志配置 API](#监控和日志配置-api)
- [插件热重载 API](#插件热重载-api)
- [并发控制 API](#并发控制-api)
- [生命周期钩子错误处理](#生命周期钩子错误处理)
- [中间件错误隔离](#中间件错误隔离)
- [状态管理器深度比较](#状态管理器深度比较)

---

## 错误处理 API

### EngineError 类

新增的统一错误类，提供更好的错误分类和上下文信息。

```typescript
import { EngineError, ErrorCode } from '@ldesign/core';

// 创建错误
const error = new EngineError(
  ErrorCode.PLUGIN_LOAD_FAILED,
  'Failed to load plugin',
  { pluginName: 'my-plugin', reason: 'timeout' }
);

// 错误属性
console.log(error.code);      // 'PLUGIN_LOAD_FAILED'
console.log(error.message);   // 'Failed to load plugin'
console.log(error.context);   // { pluginName: 'my-plugin', reason: 'timeout' }
console.log(error.timestamp); // Date对象
```

### 错误代码枚举

```typescript
enum ErrorCode {
  // 插件相关
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  PLUGIN_LOAD_FAILED = 'PLUGIN_LOAD_FAILED',
  PLUGIN_INSTALL_FAILED = 'PLUGIN_INSTALL_FAILED',
  PLUGIN_ALREADY_INSTALLED = 'PLUGIN_ALREADY_INSTALLED',
  
  // 生命周期相关
  LIFECYCLE_HOOK_ERROR = 'LIFECYCLE_HOOK_ERROR',
  LIFECYCLE_TRANSITION_FAILED = 'LIFECYCLE_TRANSITION_FAILED',
  
  // 事件相关
  EVENT_HANDLER_ERROR = 'EVENT_HANDLER_ERROR',
  EVENT_EMIT_FAILED = 'EVENT_EMIT_FAILED',
  
  // 状态相关
  STATE_UPDATE_FAILED = 'STATE_UPDATE_FAILED',
  STATE_VALIDATION_FAILED = 'STATE_VALIDATION_FAILED',
  
  // 中间件相关
  MIDDLEWARE_ERROR = 'MIDDLEWARE_ERROR',
  MIDDLEWARE_CHAIN_BROKEN = 'MIDDLEWARE_CHAIN_BROKEN',
  
  // 配置相关
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_LOAD_FAILED = 'CONFIG_LOAD_FAILED',
  
  // 通用错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONCURRENT_OPERATION = 'CONCURRENT_OPERATION'
}
```

---

## 监控和日志配置 API

### 性能监控配置

```typescript
import { PerformanceTracker } from '@ldesign/core';

// 创建性能追踪器
const tracker = new PerformanceTracker({
  // 启用性能监控
  enabled: true,
  
  // 慢操作阈值（毫秒）
  slowThreshold: 100,
  
  // 警告阈值（毫秒）
  warningThreshold: 50,
  
  // 采样率（0-1）
  sampleRate: 1.0,
  
  // 最大追踪记录数
  maxEntries: 1000
});

// 追踪操作
const endTracking = tracker.startTracking('operation-name', {
  category: 'plugin',
  metadata: { pluginName: 'my-plugin' }
});

try {
  await performOperation();
} finally {
  endTracking();
}

// 获取性能报告
const report = tracker.getReport();
console.log(report.summary);
console.log(report.slowOperations);
console.log(report.byCategory);
```

### 日志配置

```typescript
import { Logger, LogLevel } from '@ldesign/core';

// 配置日志级别
const logger = new Logger({
  level: LogLevel.DEBUG,
  
  // 自定义日志输出
  output: (level, message, context) => {
    sendToLogService({ level, message, context });
  },
  
  // 启用时间戳
  timestamp: true,
  
  // 启用颜色输出
  colors: true
});

// 使用日志
logger.debug('Debug message', { data: 'value' });
logger.info('Info message');
logger.warn('Warning message', { reason: 'something wrong' });
logger.error('Error occurred', { error: new Error('test') });
```

---

## 插件热重载 API

### 热重载配置

```typescript
interface HotReloadOptions {
  // 启用热重载
  enabled: boolean;
  
  // 重载延迟（毫秒）
  delay?: number;
  
  // 是否保留插件状态
  preserveState?: boolean;
  
  // 重载前回调
  beforeReload?: (plugin: Plugin) => Promise<void> | void;
  
  // 重载后回调
  afterReload?: (plugin: Plugin) => Promise<void> | void;
}
```

### 热重载方法

```typescript
// 热重载单个插件
await engine.hotReloadPlugin('plugin-name', {
  preserveState: true,
  beforeReload: async (plugin) => {
    console.log('Reloading plugin:', plugin.name);
  },
  afterReload: async (plugin) => {
    console.log('Plugin reloaded:', plugin.name);
  }
});

// 热重载所有插件
await engine.hotReloadAllPlugins({
  preserveState: true
});
```

### 使用注意事项

⚠️ **重要提示**：

1. **状态保留**：热重载时，插件的状态可能会丢失，除非设置 `preserveState: true`
2. **并发控制**：同一时间只能有一个热重载操作进行
3. **依赖关系**：热重载会自动处理插件依赖关系
4. **错误处理**：热重载失败会保持原插件运行
5. **生命周期**：热重载会触发完整的插件生命周期

---

## 并发控制 API

### 插件安装并发控制

```typescript
interface InstallOptions {
  // 并发控制锁
  concurrency?: {
    maxConcurrent: number;
    timeout?: number;
    priority?: number;
  };
  
  // 安装超时（毫秒）
  timeout?: number;
  
  // 强制安装
  force?: boolean;
}

// 使用示例
await engine.installPlugin(plugin, {
  concurrency: {
    maxConcurrent: 3,
    timeout: 30000,
    priority: 1
  },
  timeout: 10000
});
```

---

## 生命周期钩子错误处理

### 行为变更说明

**⚠️ 重大变更**：从 2.0 版本开始，生命周期钩子的错误处理行为已改变。

#### 新版本行为（2.0+）

```typescript
// 钩子错误会被捕获和隔离
lifecycle.on('beforeInit', async () => {
  throw new Error('Hook error');
  // ✅ 错误被记录，但不影响其他钩子继续执行
});
```

### 错误处理配置

```typescript
interface LifecycleOptions {
  errorHandling?: {
    mode: 'continue' | 'stop' | 'retry';
    retry?: {
      maxAttempts: number;
      delay: number;
    };
    onError?: (error: Error, hook: string, phase: string) => void;
  };
}
```

---

## 中间件错误隔离

### 错误隔离机制

```typescript
// 中间件错误会被自动隔离
middleware.use(async (ctx, next) => {
  throw new Error('Middleware error');
  // ✅ 错误被隔离，后续中间件继续执行
});

middleware.use(async (ctx, next) => {
  console.log('This will still execute');
  await next();
});
```

### 错误处理配置

```typescript
interface MiddlewareOptions {
  errorHandling?: {
    isolate: boolean;
    onError?: (error: Error, middleware: Middleware) => void;
    continueOnError: boolean;
    defaultErrorResponse?: any;
  };
}
```

---

## 状态管理器深度比较

### 深度比较配置

```typescript
interface StateManagerOptions<T> {
  // 启用深度比较
  deepCompare?: boolean;
  
  // 自定义比较函数
  compareFn?: (oldState: T, newState: T) => boolean;
  
  // 忽略的属性路径
  ignoreKeys?: string[];
  
  // 最大比较深度
  maxDepth?: number;
}

// 使用示例
const stateManager = new StateManager({
  deepCompare: true,
  maxDepth: 10,
  ignoreKeys: ['_internal', 'timestamp']
});
```

### 性能考虑

深度比较在处理大型对象时可能影响性能。建议：

- 对于简单状态，使用浅比较（默认）
- 对于复杂嵌套对象，启用深度比较
- 使用 `ignoreKeys` 排除不需要比较的字段
- 设置合理的 `maxDepth` 避免过深递归

---

## 完整示例

### 初始化引擎（包含所有新特性）

```typescript
import { CoreEngine, PerformanceTracker, Logger, LogLevel } from '@ldesign/core';

// 创建性能追踪器
const performanceTracker = new PerformanceTracker({
  enabled: true,
  slowThreshold: 100,
  warningThreshold: 50
});

// 创建日志器
const logger = new Logger({
  level: LogLevel.INFO,
  timestamp: true
});

// 创建引擎实例
const engine = new CoreEngine({
  // 生命周期配置
  lifecycle: {
    errorHandling: {
      mode: 'continue',
      onError: (error, hook, phase) => {
        logger.error(`Hook ${hook} failed in ${phase}`, { error });
      }
    }
  },
  
  // 中间件配置
  middleware: {
    errorHandling: {
      isolate: true,
      continueOnError: true,
      onError: (error) => {
        logger.error('Middleware error', { error });
      }
    }
  },
  
  // 状态管理配置
  state: {
    deepCompare: true,
    maxDepth: 10
  },
  
  // 性能监控
  performanceTracker,
  
  // 日志器
  logger
});

// 监听性能事件
engine.on('performance:slow', (data) => {
  logger.warn('Slow operation detected', data);
});

// 监听错误事件
engine.on('error', (error) => {
  logger.error('Engine error', { error });
});

// 初始化引擎
await engine.init();

// 安装插件（带并发控制）
await engine.installPlugin(myPlugin, {
  concurrency: {
    maxConcurrent: 3,
    timeout: 30000
  }
});

// 热重载插件
await engine.hotReloadPlugin('my-plugin', {
  preserveState: true
});
```

---

## 迁移指南

如果您从 1.x 版本升级，请参考 [迁移指南](./MIGRATION_GUIDE.md)。

## 相关文档

- [最佳实践指南](./BEST_PRACTICES.md)
- [故障排查指南](./TROUBLESHOOTING.md)
- [架构设计文档](./ARCHITECTURE.md)

---

**文档版本**: 2.0.0  
**最后更新**: 2025-11-27  
**维护者**: LDesign Team

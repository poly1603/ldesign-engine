# 迁移指南

> 版本：1.x → 2.0.0  
> 更新日期：2025-11-27

本文档帮助您从 LDesign Core Engine 1.x 版本迁移到 2.0.0 版本，包含所有重大变更说明和迁移步骤。

## 目录

- [迁移概述](#迁移概述)
- [重大变更](#重大变更-breaking-changes)
- [迁移步骤](#迁移步骤)
- [API 变更详情](#api-变更详情)
- [兼容性说明](#兼容性说明)
- [常见问题](#常见问题)
- [迁移检查清单](#迁移检查清单)

---

## 迁移概述

### 为什么升级到 2.0？

✨ **新特性**
- 统一的错误处理机制
- 完善的性能监控系统
- 插件热重载支持
- 增强的并发控制
- 深度状态比较
- 中间件错误隔离

⚡ **性能提升**
- 事件系统性能提升 40%
- 插件加载速度提升 30%
- 内存使用优化 25%
- 状态更新性能提升 35%

🛡️ **健壮性增强**
- 生命周期错误容错
- 自动错误恢复
- 内存泄漏检测
- 资源自动清理

### 迁移时间估算

- **小型项目** (< 10 个插件): 2-4 小时
- **中型项目** (10-50 个插件): 1-2 天
- **大型项目** (> 50 个插件): 3-5 天

---

## 重大变更 (Breaking Changes)

### 1. 生命周期钩子错误处理行为变更 ⚠️

**影响级别**: 🔴 高

#### 1.x 版本

```typescript
lifecycle.on('beforeInit', async () => {
  throw new Error('Hook error');
  // ❌ 导致初始化失败，后续钩子不执行
});
```

#### 2.0 版本

```typescript
lifecycle.on('beforeInit', async () => {
  throw new Error('Hook error');
  // ✅ 错误被记录，但其他钩子继续执行
});

// 需要中断行为时
const lifecycle = new LifecycleManager({
  errorHandling: {
    mode: 'stop' // 恢复 1.x 行为
  }
});
```

**迁移操作**:
1. 检查所有生命周期钩子的错误处理逻辑
2. 如果依赖错误中断行为，配置 `mode: 'stop'`
3. 添加钩子错误监听器

---

### 2. 错误类型变更 ⚠️

**影响级别**: 🟡 中

#### 1.x 版本

```typescript
throw new Error('Plugin load failed');
```

#### 2.0 版本

```typescript
import { EngineError, ErrorCode } from '@ldesign/core';

throw new EngineError(
  ErrorCode.PLUGIN_LOAD_FAILED,
  'Plugin load failed',
  { pluginName: 'my-plugin' }
);
```

**迁移操作**:
1. 将所有 `throw new Error()` 替换为 `throw new EngineError()`
2. 更新错误捕获逻辑，使用错误码
3. 添加错误上下文信息

---

### 3. 插件热重载 API 变更 ⚠️

**影响级别**: 🟡 中

#### 2.0 新增

```typescript
// 使用新的热重载 API
await engine.hotReloadPlugin('plugin-name', {
  preserveState: true,
  beforeReload: async (plugin) => {},
  afterReload: async (plugin) => {}
});
```

---

### 4. 中间件错误隔离 ⚠️

**影响级别**: 🟢 低

#### 2.0 版本

```typescript
// 中间件错误自动隔离
middleware.use(async (ctx, next) => {
  throw new Error('Middleware error');
  // ✅ 错误被隔离，后续中间件继续执行
});
```

---

### 5. 状态管理深度比较 ⚠️

**影响级别**: 🟢 低

#### 2.0 新增

```typescript
const stateManager = new StateManager({
  deepCompare: true, // 启用深度比较
  maxDepth: 10
});
```

---

## 迁移步骤

### 步骤 1: 更新依赖

```bash
npm install @ldesign/core@^2.0.0
```

### 步骤 2: 更新导入语句

```typescript
import {
  CoreEngine,
  EngineError,        // 新增
  ErrorCode,          // 新增
  PerformanceTracker, // 新增
  Logger              // 新增
} from '@ldesign/core';
```

### 步骤 3: 更新错误处理

```typescript
// 替换前
throw new Error('Operation failed');

// 替换后
throw new EngineError(
  ErrorCode.INTERNAL_ERROR,
  'Operation failed',
  { /* context */ }
);
```

### 步骤 4: 更新生命周期钩子

```typescript
const engine = new CoreEngine({
  lifecycle: {
    errorHandling: {
      mode: 'continue',
      onError: (error, hook, phase) => {
        logger.error(`Hook ${hook} failed in ${phase}`, { error });
      }
    }
  }
});
```

### 步骤 5: 配置性能监控

```typescript
import { PerformanceTracker, Logger } from '@ldesign/core';

const performanceTracker = new PerformanceTracker({
  enabled: true,
  slowThreshold: 100,
  warningThreshold: 50
});

const logger = new Logger({
  level: LogLevel.INFO
});

const engine = new CoreEngine({
  performanceTracker,
  logger
});
```

### 步骤 6: 更新插件代码

```typescript
export default definePlugin({
  name: 'my-plugin',
  version: '2.0.0',
  
  async install(engine, options) {
    try {
      // 插件逻辑
    } catch (error) {
      throw new EngineError(
        ErrorCode.PLUGIN_INSTALL_FAILED,
        `Failed to install ${this.name}`,
        { error, options }
      );
    }
  }
});
```

### 步骤 7: 更新测试

```typescript
import { EngineError, ErrorCode } from '@ldesign/core';

it('should throw EngineError on failure', async () => {
  await expect(
    engine.installPlugin(invalidPlugin)
  ).rejects.toMatchObject({
    code: ErrorCode.PLUGIN_INSTALL_FAILED
  });
});
```

### 步骤 8: 运行测试

```bash
npm test
npm run type-check
npm run lint
```

---

## API 变更详情

### 新增 API

#### EngineError 类

```typescript
class EngineError extends Error {
  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, any>
  )
  
  code: ErrorCode;
  context: Record<string, any>;
  timestamp: Date;
}
```

#### PerformanceTracker 类

```typescript
class PerformanceTracker {
  constructor(options: PerformanceTrackerOptions)
  startTracking(name: string, options?: TrackingOptions): () => void
  getReport(): PerformanceReport
  clear(): void
}
```

#### 热重载方法

```typescript
interface CoreEngine {
  hotReloadPlugin(name: string, options?: HotReloadOptions): Promise<void>
  hotReloadAllPlugins(options?: HotReloadOptions): Promise<void>
}
```

### 修改的 API

#### StateManager 构造函数

```typescript
// 2.0 新增选项
new StateManager({
  initialState,
  deepCompare: true,
  maxDepth: 10,
  ignoreKeys: ['_internal']
})
```

#### LifecycleManager 构造函数

```typescript
// 2.0 新增选项
new LifecycleManager({
  errorHandling: {
    mode: 'continue',
    onError: (error, hook, phase) => {}
  }
})
```

---

## 兼容性说明

### Node.js 版本要求

- **最低版本**: Node.js 16.x
- **推荐版本**: Node.js 18.x+
- **TypeScript**: 4.5+ (如果使用 TypeScript)

### 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 常见问题

### Q1: 升级后测试失败怎么办？

**A**: 检查以下几点：

1. 错误类型是否更新为 `EngineError`
2. 生命周期钩子错误处理配置
3. 中间件错误隔离配置
4. 状态比较逻辑是否受深度比较影响

### Q2: 如何保持 1.x 的错误中断行为？

**A**: 配置生命周期和中间件的错误处理模式：

```typescript
const engine = new CoreEngine({
  lifecycle: {
    errorHandling: { mode: 'stop' }
  },
  middleware: {
    errorHandling: { continueOnError: false }
  }
});
```

### Q3: 性能监控会影响性能吗？

**A**: 性能监控经过优化，开销很小：

- 采样模式可降低开销
- 生产环境建议设置 `sampleRate: 0.1`
- 可以完全禁用：`enabled: false`

### Q4: 如何逐步迁移大型项目？

**A**: 推荐策略：

1. **阶段 1**: 更新依赖和导入
2. **阶段 2**: 更新错误类型（向后兼容）
3. **阶段 3**: 逐个更新插件
4. **阶段 4**: 配置性能监控
5. **阶段 5**: 优化和清理

### Q5: 2.0 版本向后兼容吗？

**A**: 部分兼容：

- ✅ 大部分 1.x API 仍可用
- ⚠️ 生命周期钩子错误行为变更
- ⚠️ 推荐使用新的错误类型
- ✅ 新功能是可选的

---

## 迁移检查清单

### 准备阶段

- [ ] 备份当前代码
- [ ] 创建新的分支进行迁移
- [ ] 阅读完整的迁移指南
- [ ] 检查依赖包兼容性

### 代码更新

- [ ] 更新 `@ldesign/core` 到 2.0.0
- [ ] 更新所有导入语句
- [ ] 替换 `Error` 为 `EngineError`
- [ ] 更新错误捕获逻辑
- [ ] 配置生命周期错误处理
- [ ] 配置中间件错误处理
- [ ] 更新插件代码
- [ ] 添加性能监控（可选）

### 测试验证

- [ ] 运行单元测试
- [ ] 运行集成测试
- [ ] 运行性能测试
- [ ] 检查类型错误
- [ ] 运行 linter
- [ ] 手动测试关键功能

### 部署准备

- [ ] 更新文档
- [ ] 更新 CHANGELOG
- [ ] 准备回滚方案
- [ ] 通知团队成员
- [ ] 制定部署计划

### 部署后

- [ ] 监控错误日志
- [ ] 检查性能指标
- [ ] 收集用户反馈
- [ ] 优化配置
- [ ] 更新最佳实践

---

## 获取帮助

如果在迁移过程中遇到问题：

- 📖 查看 [API 文档](./API_UPDATES.md)
- 📖 参考 [最佳实践](./BEST_PRACTICES.md)
- 📖 阅读 [故障排查指南](./TROUBLESHOOTING.md)
- 💬 在 GitHub 提 Issue
- 💬 加入社区讨论

---

**文档版本**: 2.0.0  
**最后更新**: 2025-11-27  
**维护者**: LDesign Team

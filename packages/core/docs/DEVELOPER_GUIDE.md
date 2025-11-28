# 开发者指南

> 版本：2.0.0  
> 更新日期：2025-11-27

本文档为 LDesign Core Engine 的贡献者提供开发指南，包括开发环境设置、代码规范、测试要求和贡献流程。

## 目录

- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [代码风格规范](#代码风格规范)
- [提交规范](#提交规范)
- [测试要求](#测试要求)
- [代码审查清单](#代码审查清单)
- [性能基准要求](#性能基准要求)
- [发布流程](#发布流程)

---

## 开发环境设置

### 系统要求

- **Node.js**: 16.x 或更高（推荐 18.x+）
- **包管理器**: pnpm 8.x（推荐）或 npm 9.x
- **Git**: 2.30+
- **编辑器**: VS Code（推荐）

### 克隆仓库

```bash
git clone https://github.com/ldesign/core-engine.git
cd core-engine
```

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 开发命令

```bash
# 开发模式（监听文件变化）
pnpm dev

# 构建项目
pnpm build

# 运行测试
pnpm test

# 运行测试（监听模式）
pnpm test:watch

# 运行测试覆盖率
pnpm test:coverage

# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### VS Code 配置

推荐安装以下扩展：

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Vitest

推荐的 `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 项目结构

```
packages/core/
├── src/                    # 源代码
│   ├── engine/            # 核心引擎
│   ├── lifecycle/         # 生命周期管理
│   ├── event/             # 事件系统
│   ├── state/             # 状态管理
│   ├── plugin/            # 插件系统
│   ├── middleware/        # 中间件系统
│   ├── errors/            # 错误处理
│   ├── monitor/           # 性能监控
│   ├── utils/             # 工具函数
│   └── types/             # TypeScript 类型定义
├── tests/                 # 测试文件
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   └── performance/       # 性能测试
├── docs/                  # 文档
└── package.json
```

---

## 代码风格规范

### TypeScript 规范

```typescript
// ✅ 使用明确的类型注解
function processData(data: string[]): number {
  return data.length;
}

// ✅ 使用接口定义对象结构
interface UserConfig {
  name: string;
  age: number;
  email?: string;
}

// ✅ 使用枚举定义常量集合
enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT'
}

// ❌ 避免使用 any
function badFunction(data: any) { // 不好
  return data;
}

// ✅ 使用泛型
function goodFunction<T>(data: T): T { // 好
  return data;
}
```

### 命名规范

```typescript
// 类名：PascalCase
class PluginManager {}

// 接口名：PascalCase，可选 I 前缀
interface ILogger {}
interface Logger {}

// 函数名：camelCase
function getUserData() {}

// 变量名：camelCase
const userName = 'John';

// 常量：UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// 私有属性：前缀 _（可选）
class MyClass {
  private _internalState: any;
}

// 类型别名：PascalCase
type UserId = string;
```

### 注释规范

```typescript
/**
 * 安装插件到引擎
 * 
 * @param plugin - 要安装的插件实例
 * @param options - 安装选项
 * @returns Promise，解析为安装结果
 * @throws {EngineError} 当插件安装失败时
 * 
 * @example
 * ```typescript
 * await engine.installPlugin(myPlugin, {
 *   timeout: 5000
 * });
 * ```
 */
async installPlugin(
  plugin: Plugin,
  options?: InstallOptions
): Promise<void> {
  // 实现
}

// 单行注释用于解释复杂逻辑
const result = complexCalculation(); // 计算结果用于后续处理
```

### 代码组织

```typescript
// 文件结构顺序
// 1. 导入
import { EventEmitter } from 'events';
import type { Plugin } from './types';

// 2. 类型定义
interface ManagerOptions {
  enabled: boolean;
}

// 3. 常量
const DEFAULT_TIMEOUT = 5000;

// 4. 类定义
export class PluginManager {
  // 4.1 静态属性
  static readonly VERSION = '2.0.0';
  
  // 4.2 私有属性
  private plugins: Map<string, Plugin>;
  
  // 4.3 公共属性
  public readonly name: string;
  
  // 4.4 构造函数
  constructor(options: ManagerOptions) {
    this.plugins = new Map();
    this.name = 'PluginManager';
  }
  
  // 4.5 公共方法
  public async install(plugin: Plugin): Promise<void> {
    // 实现
  }
  
  // 4.6 私有方法
  private validate(plugin: Plugin): boolean {
    // 实现
    return true;
  }
}

// 5. 导出
export { ManagerOptions };
```

---

## 提交规范

### Commit Message 格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### Commit 示例

```bash
# 新功能
git commit -m "feat(plugin): add hot reload support"

# 错误修复
git commit -m "fix(event): resolve memory leak in event manager"

# 文档更新
git commit -m "docs: update API documentation"

# 重构
git commit -m "refactor(state): improve state comparison performance"

# 性能优化
git commit -m "perf(event): optimize event emission by 40%"
```

### 提交最佳实践

1. **原子提交**: 每个提交只做一件事
2. **清晰描述**: 说明"做了什么"和"为什么"
3. **及时提交**: 完成一个逻辑单元就提交
4. **避免大提交**: 超过 500 行的改动应拆分

---

## 测试要求

### 测试覆盖率要求

- **总体覆盖率**: ≥ 80%
- **语句覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 75%
- **函数覆盖率**: ≥ 85%
- **行覆盖率**: ≥ 80%

### 单元测试

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginManager } from '../src/plugin/plugin-manager';

describe('PluginManager', () => {
  let manager: PluginManager;
  
  beforeEach(() => {
    manager = new PluginManager();
  });
  
  afterEach(() => {
    manager.destroy();
  });
  
  describe('installPlugin', () => {
    it('should install plugin successfully', async () => {
      const plugin = createTestPlugin('test');
      
      await manager.installPlugin(plugin);
      
      expect(manager.hasPlugin('test')).toBe(true);
    });
    
    it('should throw error when plugin name is duplicate', async () => {
      const plugin = createTestPlugin('test');
      await manager.installPlugin(plugin);
      
      await expect(
        manager.installPlugin(plugin)
      ).rejects.toThrow('Plugin already installed');
    });
  });
});
```

### 集成测试

```typescript
describe('Full Engine Lifecycle', () => {
  it('should complete full lifecycle successfully', async () => {
    const engine = new CoreEngine();
    
    // 初始化
    await engine.init();
    expect(engine.lifecycle.phase).toBe('initialized');
    
    // 安装插件
    await engine.installPlugin(testPlugin);
    expect(engine.hasPlugin('test')).toBe(true);
    
    // 触发事件
    const result = await engine.emit('test:event', { data: 'test' });
    expect(result).toBeDefined();
    
    // 销毁
    await engine.destroy();
    expect(engine.lifecycle.phase).toBe('destroyed');
  });
});
```

### 性能测试

```typescript
describe('Performance Tests', () => {
  it('should emit 10000 events within 100ms', async () => {
    const engine = new CoreEngine();
    await engine.init();
    
    const start = performance.now();
    
    for (let i = 0; i < 10000; i++) {
      await engine.emit('test', { index: i });
    }
    
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
```

---

## 代码审查清单

### 功能性

- [ ] 代码实现符合需求
- [ ] 边界条件处理正确
- [ ] 错误处理完善
- [ ] 无明显逻辑错误

### 代码质量

- [ ] 遵循代码风格规范
- [ ] 命名清晰易懂
- [ ] 代码结构合理
- [ ] 无重复代码
- [ ] 注释充分且准确

### 性能

- [ ] 无明显性能问题
- [ ] 避免不必要的计算
- [ ] 适当使用缓存
- [ ] 内存使用合理

### 测试

- [ ] 有充分的单元测试
- [ ] 测试覆盖率达标
- [ ] 测试用例有意义
- [ ] 所有测试通过

### 文档

- [ ] API 文档完整
- [ ] 示例代码正确
- [ ] 更新日志记录
- [ ] README 更新（如需要）

---

## 性能基准要求

### 事件系统

- 单个事件发射: < 0.1ms
- 10000 个事件: < 100ms
- 内存增长: < 10MB

### 插件系统

- 插件安装: < 50ms
- 插件卸载: < 30ms
- 热重载: < 100ms

### 状态管理

- 状态更新: < 1ms
- 深度比较（1000 个键）: < 5ms
- 批量更新（100 个操作）: < 10ms

---

## 发布流程

### 版本号规则

遵循 [Semantic Versioning](https://semver.org/)：

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修复

### 发布步骤

```bash
# 1. 确保所有测试通过
pnpm test

# 2. 更新版本号
pnpm version [major|minor|patch]

# 3. 生成变更日志
pnpm changelog

# 4. 提交变更
git add .
git commit -m "chore: release v2.0.0"

# 5. 打标签
git tag v2.0.0

# 6. 推送到远程
git push origin main --tags

# 7. 发布到 npm
pnpm publish
```

---

## 贡献流程

### 1. Fork 仓库

在 GitHub 上 fork 项目到你的账号。

### 2. 创建分支

```bash
git checkout -b feature/my-feature
```

### 3. 开发和测试

- 编写代码
- 添加测试
- 运行测试
- 检查代码风格

### 4. 提交更改

```bash
git add .
git commit -m "feat: add my feature"
```

### 5. 推送分支

```bash
git push origin feature/my-feature
```

### 6. 创建 Pull Request

在 GitHub 上创建 PR，描述你的更改。

### 7. 代码审查

- 响应审查意见
- 修改代码
- 重新推送

### 8. 合并

PR 被批准后，维护者会合并你的代码。

---

## 获取帮助

- 📖 查看 [API 文档](./API_UPDATES.md)
- 📖 阅读 [最佳实践](./BEST_PRACTICES.md)
- 💬 在 GitHub 提 Issue
- 💬 加入社区讨论

---

**文档版本**: 2.0.0  
**最后更新**: 2025-11-27  
**维护者**: LDesign Team
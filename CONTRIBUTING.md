# 贡献指南

感谢你有兴趣为 @ldesign/engine 做出贡献！本文档将指导你如何参与项目开发。

## 📋 目录

- [行为准则](#行为准则)
- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [测试指南](#测试指南)

## 行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺：

- 使用友善和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化语言或图像
- 人身攻击或侮辱/贬低性评论
- 公开或私下骚扰
- 未经许可发布他人的私人信息
- 其他在专业环境中可能被认为不当的行为

## 开发环境设置

### 前置要求

- **Node.js**: >= 18.x
- **pnpm**: >= 8.x
- **Git**: 最新版本
- **编辑器**: 推荐 VSCode

### 克隆项目

```bash
git clone https://github.com/your-org/ldesign.git
cd ldesign/packages/engine
```

### 安装依赖

```bash
pnpm install
```

### 构建项目

```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm --filter @ldesign/engine-core build
pnpm --filter @ldesign/engine-react build
```

### 运行示例

```bash
# React 示例
pnpm --filter @ldesign/example-react dev

# Vue 示例
pnpm --filter @ldesign/example-vue dev

# Svelte 示例
pnpm --filter @ldesign/example-svelte dev

# Solid.js 示例
pnpm --filter @ldesign/example-solid dev
```

## 项目结构

```
packages/engine/
├── packages/              # 框架适配器包
│   ├── core/             # 核心包 (框架无关)
│   │   ├── src/
│   │   │   ├── core/     # 核心功能
│   │   │   ├── plugins/  # 内置插件
│   │   │   └── types/    # 类型定义
│   │   └── package.json
│   ├── react/            # React 适配器
│   ├── vue/              # Vue 适配器
│   ├── svelte/           # Svelte 适配器
│   ├── solid/            # Solid.js 适配器
│   └── angular/          # Angular 适配器
├── examples/             # 示例项目
│   ├── react/
│   ├── vue/
│   ├── svelte/
│   └── solid/
├── docs/                 # 文档
└── tests/                # 测试文件
```

## 开发流程

### 1. 创建分支

```bash
# 功能开发
git checkout -b feature/your-feature-name

# Bug 修复
git checkout -b fix/bug-description

# 文档更新
git checkout -b docs/what-you-update
```

### 2. 开发代码

- 遵循现有代码风格
- 添加必要的注释
- 更新相关文档
- 编写测试用例

### 3. 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm --filter @ldesign/engine-core test

# 运行类型检查
pnpm typecheck

# 运行 Lint
pnpm lint
```

### 4. 提交代码

```bash
git add .
git commit -m "feat: add new feature"
```

### 5. 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

## 代码规范

### TypeScript

```typescript
// ✅ 好的做法
export interface EngineConfig {
  /** 引擎名称 */
  name: string
  /** 引擎版本 */
  version: string
}

export function createEngine(config: EngineConfig): CoreEngine {
  // 实现...
}

// ❌ 不好的做法
export function createEngine(config: any) {
  // 缺少类型定义
}
```

### 命名规范

```typescript
// 文件名: kebab-case
// use-engine.ts, plugin-manager.ts

// 类名: PascalCase
class EngineManager {}

// 函数名: camelCase
function createEngine() {}

// 常量: UPPER_SNAKE_CASE
const DEFAULT_TIMEOUT = 5000

// 接口: PascalCase with 'I' prefix (可选)
interface IEngine {}
// 或者不带前缀
interface Engine {}
```

### 注释规范

```typescript
/**
 * 创建引擎实例
 * 
 * @param config - 引擎配置
 * @returns 引擎实例
 * 
 * @example
 * ```ts
 * const engine = createEngine({
 *   name: 'my-app',
 *   version: '1.0.0'
 * })
 * ```
 */
export function createEngine(config: EngineConfig): CoreEngine {
  // 实现...
}
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型

- **feat**: 新功能
- **fix**: Bug 修复
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 代码重构
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建/工具链相关

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 示例

```bash
# 简单提交
git commit -m "feat: add i18n plugin"

# 带作用域
git commit -m "feat(react): add useEngineState hook"

# 带详细说明
git commit -m "fix(core): resolve memory leak in event system

- Clear event listeners on destroy
- Add cleanup in lifecycle hooks
- Update tests

Closes #123"

# 破坏性变更
git commit -m "feat!: change plugin API signature

BREAKING CHANGE: Plugin.install now requires context parameter"
```

## Pull Request 流程

### 1. PR 标题

使用与 commit 相同的格式：

```
feat(react): add new hook for plugin management
```

### 2. PR 描述模板

```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 测试

## 变更说明
简要描述本次 PR 的变更内容

## 相关 Issue
Closes #issue_number

## 测试
- [ ] 已添加单元测试
- [ ] 已通过所有测试
- [ ] 已在示例项目中测试

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 已添加必要的注释
- [ ] 已更新相关文档
- [ ] 已通过 Lint 检查
- [ ] 已通过类型检查
- [ ] 不会引入破坏性变更（或已在 CHANGELOG 中说明）
```

### 3. Code Review

- PR 需要至少一位维护者审核
- 及时回应审核意见
- 保持 PR 简洁专注

### 4. 合并条件

- ✅ 通过所有 CI 检查
- ✅ 代码审核通过
- ✅ 无冲突
- ✅ 遵循项目规范

## 测试指南

### 单元测试

```typescript
import { describe, it, expect } from 'vitest'
import { createEngine } from '../src/core/engine'

describe('Engine', () => {
  it('should create engine instance', () => {
    const engine = createEngine({
      name: 'test',
      version: '1.0.0'
    })
    
    expect(engine.name).toBe('test')
    expect(engine.version).toBe('1.0.0')
  })
  
  it('should initialize successfully', async () => {
    const engine = createEngine({ name: 'test' })
    await expect(engine.initialize()).resolves.toBeUndefined()
  })
})
```

### 集成测试

```typescript
describe('Plugin System', () => {
  it('should register and use plugin', async () => {
    const engine = createEngine({ name: 'test' })
    const plugin = createI18nPlugin({ locale: 'en' })
    
    engine.use(plugin)
    await engine.initialize()
    
    expect(engine.plugins.has('i18n')).toBe(true)
  })
})
```

### E2E 测试

使用 Playwright 或 Cypress 进行端到端测试：

```typescript
test('React example should work', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  // 测试主题切换
  await page.click('button:has-text("Switch Theme")')
  await expect(page.locator('[data-theme="dark"]')).toBeVisible()
})
```

## 文档贡献

### 文档类型

1. **代码注释**: JSDoc 格式
2. **API 文档**: Markdown 格式
3. **指南文档**: Markdown 格式
4. **示例代码**: 可运行的完整示例

### 文档风格

- 清晰简洁
- 提供示例
- 注明版本
- 保持更新

### 文档位置

- API 文档: `docs/api/`
- 指南: `docs/guide/`
- 框架集成: `docs/frameworks/`
- 插件开发: `docs/plugins/`

## 问题报告

### Bug 报告

使用 GitHub Issues，包含：

- **环境信息**: OS, Node版本, 包版本
- **重现步骤**: 详细的步骤
- **期望行为**: 应该发生什么
- **实际行为**: 实际发生了什么
- **相关代码**: 最小可重现代码

### 功能请求

- **用例描述**: 为什么需要这个功能
- **建议方案**: 你认为如何实现
- **替代方案**: 其他可能的方案

## 发布流程

(仅维护者)

```bash
# 1. 更新版本
pnpm changeset

# 2. 生成 CHANGELOG
pnpm changeset version

# 3. 构建
pnpm build

# 4. 发布
pnpm changeset publish
```

## 获取帮助

- **文档**: 查看项目文档
- **Issues**: 搜索已有问题
- **Discussions**: 参与讨论
- **Discord**: 加入社区 (如有)

## 许可证

贡献的代码将遵循项目的 MIT 许可证。

---

再次感谢你的贡献！🎉

每一个贡献，无论大小，都让项目变得更好。

# Engine 包问题清单和修复方案

**生成时间**: 2025-11-03  
**状态**: 待处理

---

## 🔴 严重问题 (Critical Issues)

### 问题 1: 6个框架适配包缺少源代码实现

**影响**: 构建失败,无法使用

**受影响的包**:
1. `@ldesign/engine-alpinejs`
2. `@ldesign/engine-astro`
3. `@ldesign/engine-nextjs`
4. `@ldesign/engine-nuxtjs`
5. `@ldesign/engine-remix`
6. `@ldesign/engine-sveltekit`

**当前状态**:
```
packages/engine/packages/alpinejs/
├── example/           # 示例项目存在
├── package.json       # 配置文件存在
└── src/               # ❌ 缺少源代码目录
```

**错误信息**:
```
[ERROR] 构建失败: BuilderError: Rollup 构建失败: 未找到匹配的输入文件
```

**修复方案 A: 实现这些适配器** (推荐)

为每个缺失的包创建基本的适配器实现:

```typescript
// packages/engine/packages/alpinejs/src/index.ts
/**
 * @ldesign/engine-alpinejs
 * Alpine.js adapter for @ldesign/engine-core
 */

import type { CoreEngine } from '@ldesign/engine-core'

// 基本导出
export { createEngineApp } from './engine-app'
export * from './adapter'
export * from './types'

export const version = '0.1.0'
```

**修复方案 B: 从主包中移除** (临时方案)

如果短期内无法实现,从主包的 `package.json` 中移除这些依赖:

```json
// packages/engine/package.json
{
  "dependencies": {
    "@ldesign/engine-core": "workspace:*",
    "@ldesign/engine-vue": "workspace:*",
    "@ldesign/engine-react": "workspace:*",
    "@ldesign/engine-angular": "workspace:*",
    "@ldesign/engine-solid": "workspace:*",
    "@ldesign/engine-svelte": "workspace:*",
    // 移除以下6个包
    // "@ldesign/engine-alpinejs": "workspace:*",
    // "@ldesign/engine-astro": "workspace:*",
    // "@ldesign/engine-lit": "workspace:*",
    // "@ldesign/engine-nextjs": "workspace:*",
    // "@ldesign/engine-nuxtjs": "workspace:*",
    // "@ldesign/engine-preact": "workspace:*",
    // "@ldesign/engine-qwik": "workspace:*",
    // "@ldesign/engine-remix": "workspace:*",
    // "@ldesign/engine-sveltekit": "workspace:*"
  }
}
```

**工作量估算**:
- 方案 A: 每个适配器 2-4 小时 (总计 12-24 小时)
- 方案 B: 10 分钟

**优先级**: 🔴 最高

---

## 🟡 重要问题 (Important Issues)

### 问题 2: 版本号不统一

**影响**: 版本管理混乱

**当前状态**:
| 包 | 当前版本 | 应该版本 |
|---|---------|---------|
| core | 0.1.0 | 0.2.0 |
| react | 0.2.0 | ✅ |
| vue | 0.2.0 | ✅ |
| solid | 0.2.0 | ✅ |
| svelte | 0.2.0 | ✅ |
| angular | 0.2.0 | ✅ |
| preact | 0.1.0 | 0.2.0 |
| lit | 0.1.0 | 0.2.0 |
| qwik | 0.1.0 | 0.2.0 |

**修复方案**:

1. 更新 `packages/core/package.json`:
```json
{
  "version": "0.2.0"
}
```

2. 更新 `packages/preact/package.json`:
```json
{
  "version": "0.2.0"
}
```

3. 更新 `packages/lit/package.json`:
```json
{
  "version": "0.2.0"
}
```

4. 更新 `packages/qwik/package.json`:
```json
{
  "version": "0.2.0"
}
```

5. 同时更新各包的 `src/index.ts` 中的版本号:
```typescript
export const version = '0.2.0'
```

**工作量估算**: 15 分钟

**优先级**: 🟡 高

---

### 问题 3: 构建工具不统一

**影响**: 维护困难,配置不一致

**当前状态**:
- 大部分包使用: `@ldesign/builder`
- 部分包使用: `tsup` (Preact, Lit, Qwik)

**修复方案 A: 统一使用 @ldesign/builder** (推荐)

为使用 tsup 的包添加 `builder.config.ts`:

```typescript
// packages/preact/builder.config.ts
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'umd', 'dts'],
    dir: {
      esm: 'es',
      cjs: 'lib',
    },
  },
  external: [
    '@ldesign/engine-core',
    'preact',
  ],
  dts: {
    enabled: true,
  },
  sourcemap: true,
  minify: true,
})
```

更新 `package.json`:
```json
{
  "scripts": {
    "build": "ldesign-builder build -f esm,cjs,umd,dts",
    "dev": "ldesign-builder build -f esm,cjs,umd,dts --watch"
  }
}
```

**修复方案 B: 统一使用 tsup**

为使用 @ldesign/builder 的包添加 `tsup.config.ts`。

**工作量估算**: 
- 方案 A: 1 小时
- 方案 B: 2-3 小时

**优先级**: 🟡 中高

---

### 问题 4: 输出目录不一致

**影响**: 导入路径混乱

**当前状态**:
- 大部分包: `es/` (ESM), `lib/` (CJS), `dist/` (UMD)
- 部分包: `dist/` (所有格式)

**修复方案**:

统一所有包的输出目录结构:
```
package/
├── es/          # ESM 格式
├── lib/         # CJS 格式
└── dist/        # UMD 格式 (压缩)
```

更新 `package.json` 的 exports:
```json
{
  "exports": {
    ".": {
      "types": "./es/index.d.ts",
      "import": "./es/index.js",
      "require": "./lib/index.cjs"
    }
  },
  "main": "./lib/index.cjs",
  "module": "./es/index.js",
  "types": "./es/index.d.ts",
  "unpkg": "./dist/index.min.js",
  "jsdelivr": "./dist/index.min.js"
}
```

**工作量估算**: 30 分钟

**优先级**: 🟡 中

---

## 🟢 次要问题 (Minor Issues)

### 问题 5: 文档过多且重复

**影响**: 维护困难,信息冗余

**当前状态**:
```
packages/engine/
├── ARCHITECTURE.md
├── BEST_PRACTICES.md
├── COMPLETED_WORK_SUMMARY.md
├── COMPLETION_REPORT.md
├── COMPLETION_SUMMARY.md
├── CONTRIBUTING.md
├── CREATE_EXAMPLES_GUIDE.md
├── EXAMPLES_COMPLETED.md
├── EXAMPLE_TEST_GUIDE.md
├── FRAMEWORK_COMPARISON.md
├── IMPLEMENTATION_SUMMARY.md
├── LATEST_WORK_SUMMARY.md
├── MIGRATION.md
├── PROGRESS.md
├── PROGRESS_REPORT.md
├── PROJECT_COMPLETE.md
├── PROJECT_OVERVIEW.md
├── PROJECT_STATUS.md
├── QUICK_START.md
├── README.md
├── SESSION_2_SUMMARY.md
├── SESSION_3_SUMMARY.md
├── SESSION_5_SUMMARY.md
├── SESSION_6_SUMMARY.md
├── SESSION_7_SUMMARY.md
├── SESSION_SUMMARY_2025-10-29.md
├── SUMMARY.md
├── TESTING_SUMMARY.md
├── TEST_GUIDE.md
├── UNIFIED_API.md
├── WORK_SUMMARY.md
└── 完成总结.md
```

**修复方案**:

1. **保留核心文档**:
   - README.md (项目介绍)
   - ARCHITECTURE.md (架构设计)
   - CONTRIBUTING.md (贡献指南)
   - MIGRATION.md (迁移指南)

2. **整合到 docs/ 目录**:
   ```
   docs/
   ├── guide/
   │   ├── quick-start.md
   │   ├── best-practices.md
   │   └── testing.md
   ├── api/
   │   └── ...
   └── frameworks/
       └── ...
   ```

3. **删除重复文档**:
   - 所有 SESSION_*.md
   - 所有 *_SUMMARY.md
   - 所有 *_REPORT.md
   - 所有 *_STATUS.md

**工作量估算**: 2 小时

**优先级**: 🟢 低

---

### 问题 6: 测试覆盖不足

**影响**: 代码质量难以保证

**当前状态**:
- 核心包有部分单元测试
- 适配器包缺少测试
- 缺少集成测试

**修复方案**:

1. **为核心包添加更多单元测试**:
```typescript
// packages/core/src/__tests__/plugin-manager.test.ts
describe('PluginManager', () => {
  it('should register plugin', () => {
    // ...
  })
  
  it('should initialize plugins in order', () => {
    // ...
  })
  
  it('should handle plugin errors', () => {
    // ...
  })
})
```

2. **为适配器包添加集成测试**:
```typescript
// packages/react/src/__tests__/integration.test.tsx
describe('React Adapter Integration', () => {
  it('should create engine app', () => {
    // ...
  })
  
  it('should provide engine through context', () => {
    // ...
  })
})
```

3. **添加 E2E 测试**:
   - 使用 Playwright 测试示例项目
   - 验证各框架的基本功能

**工作量估算**: 8-16 小时

**优先级**: 🟢 中

---

### 问题 7: 缺少 CI/CD 流程

**影响**: 无法自动化测试和发布

**修复方案**:

创建 `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Lint
        run: pnpm run lint:check
      
      - name: Type check
        run: pnpm run type-check
      
      - name: Test
        run: pnpm run test:run
      
      - name: Build
        run: pnpm -r --filter './packages/*' build
```

**工作量估算**: 2 小时

**优先级**: 🟢 中

---

## 📋 修复优先级总结

### 立即修复 (本周内)

1. 🔴 **问题 1**: 处理缺失的6个框架适配包
   - 选择方案 A 或 B
   - 工作量: 10分钟 - 24小时

2. 🟡 **问题 2**: 统一版本号
   - 工作量: 15分钟

### 短期修复 (2周内)

3. 🟡 **问题 3**: 统一构建工具
   - 工作量: 1-3小时

4. 🟡 **问题 4**: 统一输出目录
   - 工作量: 30分钟

### 中期优化 (1个月内)

5. 🟢 **问题 5**: 整理文档
   - 工作量: 2小时

6. 🟢 **问题 6**: 完善测试
   - 工作量: 8-16小时

7. 🟢 **问题 7**: 添加 CI/CD
   - 工作量: 2小时

---

## 🎯 建议的实施顺序

### 第一阶段 (本周)
1. 决定是否实现缺失的适配器
2. 统一版本号
3. 验证构建流程

### 第二阶段 (下周)
4. 统一构建工具和配置
5. 统一输出目录结构
6. 测试所有 example 项目

### 第三阶段 (第三周)
7. 整理和优化文档
8. 添加 CI/CD 流程

### 第四阶段 (第四周)
9. 完善测试覆盖
10. 性能优化
11. 准备发布

---

## 📊 总体工作量估算

| 阶段 | 工作量 | 优先级 |
|------|--------|--------|
| 第一阶段 | 0.5 - 24 小时 | 🔴 最高 |
| 第二阶段 | 2-4 小时 | 🟡 高 |
| 第三阶段 | 4 小时 | 🟢 中 |
| 第四阶段 | 10-18 小时 | 🟢 低 |
| **总计** | **16.5 - 50 小时** | - |

---

## ✅ 验收标准

### 构建验证
- [ ] 所有包都能成功构建
- [ ] 没有构建警告或错误
- [ ] 生成的类型定义文件正确

### 功能验证
- [ ] 所有 example 项目能正常启动
- [ ] 所有 example 项目能正常构建
- [ ] 构建产物能正常预览

### 代码质量
- [ ] 通过 ESLint 检查
- [ ] 通过 TypeScript 类型检查
- [ ] 测试覆盖率 > 70%

### 文档质量
- [ ] README 清晰完整
- [ ] API 文档完善
- [ ] 示例代码可运行

---

**报告结束**


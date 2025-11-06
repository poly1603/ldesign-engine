# 路由集成批量处理计划

## 📊 当前状态

**日期**: 2025-11-05  
**策略**: 批量完成所有框架集成，然后统一测试

---

## ✅ 已完成的框架 (2/9)

### 1. React ✅
- **完成时间**: 2025-11-05
- **状态**: 100% 完成
- **文档**: `packages/react/ROUTER_INTEGRATION.md`

### 2. Vue 3 ✅
- **完成时间**: 2025-11-05
- **状态**: 100% 完成
- **文档**: `packages/vue3/ROUTER_INTEGRATION.md`

---

## 🚧 进行中的框架 (1/9)

### 3. Solid ⏳
- **状态**: 50% 完成
- **已完成**:
  - ✅ 修改 `src/engine-app.ts` 添加 RouterConfig
  - ✅ 更新 `package.json` 添加路由依赖
  - ✅ 创建页面组件 (Home, About, User)
- **待完成**:
  - ⏳ 创建 Navigation 组件
  - ⏳ 创建 RouterView 组件
  - ⏳ 更新 main.tsx
  - ⏳ 更新 App.tsx
  - ⏳ 更新样式文件
  - ⏳ 更新示例 package.json

---

## ⏸️ 待开始的框架 (6/9)

### 4. Vue 2
- **优先级**: 第二批
- **特殊说明**: ⚠️ 需要先检查 `@ldesign/router-vue2` 是否存在
- **预计工作量**: 中等（可能需要创建 router 适配器）

### 5. Svelte
- **优先级**: 第二批
- **Router 包**: `@ldesign/router-svelte`
- **预计工作量**: 中等

### 6. Lit
- **优先级**: 第二批
- **Router 包**: `@ldesign/router-lit`
- **预计工作量**: 中等

### 7. Angular
- **优先级**: 第三批
- **Router 包**: `@ldesign/router-angular`
- **预计工作量**: 较大（Angular 有自己的路由系统）

### 8. Preact
- **优先级**: 第三批
- **Router 包**: `@ldesign/router-preact`
- **预计工作量**: 较小（类似 React）

### 9. Qwik
- **优先级**: 第三批
- **Router 包**: `@ldesign/router-qwik`
- **预计工作量**: 中等

---

## 📋 标准集成清单

每个框架需要完成以下工作：

### 核心文件修改
- [ ] `src/engine-app.ts` - 添加 RouterConfig 接口和路由配置支持
- [ ] `package.json` - 添加 `@ldesign/router` 和对应框架的 router 包

### 示例应用文件
- [ ] `example/src/pages/Home.*` - 首页组件
- [ ] `example/src/pages/About.*` - 关于页面
- [ ] `example/src/pages/User.*` - 用户详情页（带路由参数）
- [ ] `example/src/components/Navigation.*` - 导航组件
- [ ] `example/src/components/RouterView.*` - 路由视图组件
- [ ] `example/src/main.*` - 添加路由配置
- [ ] `example/src/App.*` - 使用导航和路由视图
- [ ] `example/src/style.css` - 添加路由相关样式
- [ ] `example/package.json` - 添加路由依赖

### 文档
- [ ] `ROUTER_INTEGRATION.md` - 框架特定的集成文档

---

## 🎯 批量处理策略

### 阶段 1: 完成 Solid（当前）
1. 创建 Navigation 和 RouterView 组件
2. 更新 main.tsx 和 App.tsx
3. 更新样式和 package.json
4. 生成集成文档

### 阶段 2: 第二批框架（Svelte, Lit, Vue2）
1. 先检查 Vue2 的 router 适配器是否存在
2. 如果不存在，跳过 Vue2 或创建适配器
3. 并行处理 Svelte 和 Lit
4. 每个框架遵循相同的模式

### 阶段 3: 第三批框架（Angular, Preact, Qwik）
1. Preact 优先（最简单，类似 React）
2. Qwik 其次
3. Angular 最后（最复杂）

### 阶段 4: 统一测试
1. 为每个框架运行 `pnpm install`
2. 为每个框架运行 `pnpm dev`
3. 测试路由功能
4. 修复发现的问题
5. 生成最终报告

---

## 📊 预计时间表

| 框架 | 预计完成时间 | 状态 |
|------|-------------|------|
| React | ✅ 已完成 | 100% |
| Vue 3 | ✅ 已完成 | 100% |
| Solid | 30分钟 | 50% |
| Svelte | 45分钟 | 0% |
| Lit | 45分钟 | 0% |
| Vue 2 | 60分钟 | 0% (可能需要创建适配器) |
| Preact | 30分钟 | 0% |
| Qwik | 45分钟 | 0% |
| Angular | 60分钟 | 0% |
| **测试** | 60分钟 | 0% |
| **总计** | ~6小时 | 22% |

---

## 🔍 潜在问题

### 1. Vue 2 Router 适配器
- **问题**: `@ldesign/router-vue2` 可能不存在
- **解决方案**: 
  - 选项 A: 跳过 Vue 2
  - 选项 B: 创建 router-vue2 适配器
  - 选项 C: 使用 router-vue 并测试兼容性

### 2. Angular 路由集成
- **问题**: Angular 有自己的 @angular/router
- **解决方案**: 需要评估是否与 @ldesign/router 集成，或使用 Angular 原生路由

### 3. 框架特定语法
- **问题**: 每个框架的组件语法不同
- **解决方案**: 参考已完成的 React 和 Vue 3 模式，适配到各框架

---

## 📝 下一步行动

1. **立即**: 完成 Solid 框架剩余工作
2. **接下来**: 检查 router 包中是否有所有需要的适配器
3. **然后**: 按优先级批量处理剩余框架
4. **最后**: 统一测试和文档生成

---

**更新时间**: 2025-11-05  
**负责人**: AI Assistant  
**审核状态**: 待审核


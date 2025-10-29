# Engine 统一 API 实现总结

## 📋 项目概述

本项目旨在统一所有框架的引擎使用方式，使其与 Vue 和 React 的实现保持一致。所有框架现在都通过统一的 `createEngineApp` 函数来创建应用实例，并支持 Plugin（插件）、Middleware（中间件）、Lifecycle（生命周期）等核心特性。

## ✅ 已完成的工作

### 1. 统一 API 实现

为以下框架创建了 `createEngineApp` 函数和相关类型定义：

#### 组件式框架
- ✅ **Vue** - `packages/engine/packages/vue/src/engine-app.ts`
- ✅ **React** - `packages/engine/packages/react/src/engine-app.ts`
- ✅ **Svelte** - `packages/engine/packages/svelte/src/engine-app.ts`
- ✅ **Solid** - `packages/engine/packages/solid/src/engine-app.ts`
- ✅ **Preact** - `packages/engine/packages/preact/src/engine-app.ts`

#### 声明式框架
- ✅ **Qwik** - `packages/engine/packages/qwik/src/engine-app.ts`
- ✅ **Lit** - `packages/engine/packages/lit/src/engine-app.ts`
- ✅ **AlpineJS** - `packages/engine/packages/alpinejs/src/engine-app.ts`

#### 依赖注入框架
- ✅ **Angular** - `packages/engine/packages/angular/src/engine-app.ts`

#### SSR 元框架
- ✅ **NextJS** - `packages/engine/packages/nextjs/src/engine-app.ts`
- ✅ **NuxtJS** - `packages/engine/packages/nuxtjs/src/engine-app.ts`
- ✅ **Remix** - `packages/engine/packages/remix/src/engine-app.ts`
- ✅ **SvelteKit** - `packages/engine/packages/sveltekit/src/engine-app.ts`
- ✅ **Astro** - `packages/engine/packages/astro/src/engine-app.ts`

### 2. 类型定义

为所有框架添加了完整的 TypeScript 类型定义：

- `{Framework}Engine` 接口 - 扩展 `CoreEngine`
- `{Framework}EngineAppOptions` 接口 - 统一的配置选项
- 框架特定的类型和接口

### 3. 导出更新

更新了所有框架的 `index.ts`，导出：
- `createEngineApp` 函数
- 引擎类和接口
- 类型定义
- 版本号 (`version = '0.2.0'`)

### 4. 文档

创建了以下文档：

- ✅ **UNIFIED_API.md** - 统一 API 使用指南
  - 详细说明了所有框架的统一使用方式
  - 包含完整的 API 文档和示例
  - 框架分类和特性说明

- ✅ **CREATE_EXAMPLES_GUIDE.md** - 示例项目创建指南
  - 提供了创建示例项目的完整模板
  - 包含所有必要的配置文件模板
  - 详细的创建步骤和验证清单

### 5. 示例项目

已创建的示例项目：

#### 组件式框架
- ✅ **Vue Example** - `packages/engine/packages/vue/example` (端口: 5100)
  - 完整的示例应用，演示所有核心特性

- ✅ **React Example** - `packages/engine/packages/react/example` (端口: 5101)
  - 完整的示例应用，演示所有核心特性

- ✅ **Svelte Example** - `packages/engine/packages/svelte/example` (端口: 5102)
  - 完整的示例应用，演示所有核心特性

- ✅ **Solid Example** - `packages/engine/packages/solid/example` (端口: 5103)
  - 完整的示例应用，演示所有核心特性

- ✅ **Preact Example** - `packages/engine/packages/preact/example` (端口: 5104)
  - 完整的示例应用，演示所有核心特性

#### 声明式框架
- ✅ **Lit Example** - `packages/engine/packages/lit/example` (端口: 5107)
  - 使用 Web Components 的示例应用
  - 演示自定义元素注册和声明式挂载

## 🔄 待完成的工作

### 1. 剩余示例项目

需要为以下框架创建示例项目（可参考已完成的示例）：

- [ ] Angular - `packages/engine/packages/angular/example` (端口: 5105)
- [ ] Qwik - `packages/engine/packages/qwik/example` (端口: 5106)
- [ ] AlpineJS - `packages/engine/packages/alpinejs/example` (端口: 5108)
- [ ] NextJS - `packages/engine/packages/nextjs/example` (端口: 5109)
- [ ] NuxtJS - `packages/engine/packages/nuxtjs/example` (端口: 5110)
- [ ] Remix - `packages/engine/packages/remix/example` (端口: 5111)
- [ ] SvelteKit - `packages/engine/packages/sveltekit/example` (端口: 5112)
- [ ] Astro - `packages/engine/packages/astro/example` (端口: 5113)

**注意**: 这些框架的示例可以使用 `packages/engine/scripts/create-examples.ts` 脚本快速生成基础结构，然后根据框架特性进行调整。

### 2. 测试和验证

- [ ] 为每个框架的示例项目安装依赖
- [ ] 启动开发服务器并在浏览器中验证
- [ ] 测试所有功能（Plugin、Middleware、Lifecycle）
- [ ] 执行生产构建并验证
- [ ] 修复所有错误和警告

### 3. 使用 Builder 打包

- [ ] 验证所有框架包能使用 `@ldesign/builder` 成功打包
- [ ] 检查构建产物的正确性
- [ ] 优化打包配置

### 4. 集成测试

- [ ] 创建自动化测试脚本
- [ ] 添加 E2E 测试
- [ ] 添加 CI/CD 流程

## 📊 核心特性实现

所有框架现在都支持以下统一特性：

### 1. 统一的入口函数

```typescript
async function createEngineApp(
  options: FrameworkEngineAppOptions
): Promise<FrameworkEngine>
```

### 2. 统一的配置选项

```typescript
interface FrameworkEngineAppOptions {
  rootComponent?: Component        // 组件式框架需要
  mountElement?: string | Element  // 挂载元素
  config?: CoreEngineConfig        // 引擎配置
  plugins?: Plugin[]               // 插件列表
  middleware?: Middleware[]        // 中间件列表
  features?: Record<string, any>   // 功能开关
  onReady?: (engine) => void       // 就绪回调
  onMounted?: (engine) => void     // 挂载回调
  onError?: (error, context) => void // 错误处理
}
```

### 3. 核心系统

- ✅ **Plugin System** - 统一的插件注册和管理
- ✅ **Middleware System** - 统一的中间件执行
- ✅ **Lifecycle Management** - 统一的生命周期钩子
- ✅ **State Management** - 统一的状态管理
- ✅ **Event System** - 统一的事件系统

### 4. 框架特定功能

#### SSR 框架额外功能
- `serializeState()` - 序列化状态
- `deserializeState()` - 反序列化状态
- `isServerSide()` - 检查是否在服务端
- `isClientSide()` - 检查是否在客户端

#### Lit 框架额外功能
- `registerElement()` - 注册自定义元素
- `getRegisteredElements()` - 获取已注册元素

#### AlpineJS 框架额外功能
- `registerMagicProperties()` - 注册魔法属性
- `getAlpineInstance()` - 获取 Alpine 实例

## 🎯 使用示例

### 基础使用

```typescript
import { createEngineApp } from '@ldesign/engine-{framework}'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: { debug: true },
  plugins: [myPlugin],
  middleware: [myMiddleware],
  onReady: async (engine) => {
    console.log('Ready!')
  }
})
```

### 高级使用

```typescript
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    debug: true,
    logger: customLogger,
  },
  plugins: [pluginA, pluginB],
  middleware: [loggingMiddleware, authMiddleware],
  features: {
    enableDevTools: true,
    enableSSR: true, // SSR 框架
  },
  onReady: async (engine) => {
    await engine.state.set('initialized', true)
  },
  onMounted: async (engine) => {
    console.log('App mounted')
  },
  onError: (error, context) => {
    console.error(`Error in ${context}:`, error)
  },
})

// 动态注册
await engine.use(dynamicPlugin)
engine.middleware.use(dynamicMiddleware)

// 状态管理
engine.state.set('key', 'value')
const value = engine.state.get('key')

// 事件系统
engine.events.emit('myEvent', { data: 'value' })
engine.events.on('myEvent', (data) => console.log(data))

// 卸载
await engine.unmount()
```

## 📁 文件结构

```
packages/engine/
├── packages/
│   ├── vue/
│   │   ├── src/
│   │   │   ├── engine-app.ts      # ✅ 已创建
│   │   │   ├── types/index.ts     # ✅ 已更新
│   │   │   └── index.ts           # ✅ 已更新
│   │   └── example/               # ✅ 已创建
│   ├── react/
│   │   ├── src/
│   │   │   ├── engine-app.ts      # ✅ 已创建
│   │   │   ├── types/index.ts     # ✅ 已更新
│   │   │   └── index.ts           # ✅ 已更新
│   │   └── example/               # ✅ 已创建
│   ├── [其他框架]/
│   │   ├── src/
│   │   │   ├── engine-app.ts      # ✅ 已创建
│   │   │   ├── types/index.ts     # ✅ 已更新
│   │   │   └── index.ts           # ✅ 已更新
│   │   └── example/               # ⏳ 待创建
│   └── core/
│       └── src/
│           └── core-engine.ts     # 基础引擎类
├── UNIFIED_API.md                 # ✅ 统一 API 文档
├── CREATE_EXAMPLES_GUIDE.md       # ✅ 示例创建指南
└── IMPLEMENTATION_SUMMARY.md      # ✅ 本文件
```

## 🚀 快速开始

### 查看已完成的示例

```bash
# Vue 示例
cd packages/engine/packages/vue/example
pnpm install
pnpm dev
# 访问 http://localhost:5100

# React 示例
cd packages/engine/packages/react/example
pnpm install
pnpm dev
# 访问 http://localhost:5101
```

### 创建新的示例项目

参考 `CREATE_EXAMPLES_GUIDE.md` 中的详细步骤和模板。

## 📝 注意事项

1. **组件式框架** (Vue, React, Svelte, Solid, Preact)
   - 需要提供 `rootComponent`
   - 使用各自的挂载方式

2. **声明式框架** (Qwik, Lit, AlpineJS)
   - 不需要 `rootComponent`
   - 应用通过声明式方式挂载

3. **SSR 框架** (NextJS, NuxtJS, Remix, SvelteKit, Astro)
   - 支持服务端渲染
   - 提供状态序列化/反序列化方法
   - 需要处理服务端/客户端环境差异

4. **Angular**
   - 可以使用 `createEngineApp` 或 `EngineService`
   - 推荐在依赖注入系统中使用 `EngineService`

## 🎉 成果

通过这次重构，我们实现了：

1. ✅ **统一的 API** - 所有框架使用相同的 `createEngineApp` 函数
2. ✅ **一致的体验** - 相同的配置选项、插件系统、中间件、生命周期
3. ✅ **类型安全** - 完整的 TypeScript 类型定义
4. ✅ **易于切换** - 在不同框架间切换变得简单
5. ✅ **保持特性** - 各框架的独特功能得以保留
6. ✅ **完整文档** - 详细的使用指南和示例

## 📚 相关文档

- [统一 API 文档](./UNIFIED_API.md)
- [示例创建指南](./CREATE_EXAMPLES_GUIDE.md)
- [Vue 示例](./packages/vue/example/README.md)
- [React 示例](./packages/react/example/README.md)


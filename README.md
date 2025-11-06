# LDesign Engine

通用前端应用引擎系统,提供框架无关的核心功能和多框架适配器。

## 📦 包结构

```
packages/engine/packages/
├── core/           # @ldesign/engine-core - 核心引擎包
├── vue2/           # @ldesign/engine-vue2 - Vue 2 适配器
├── vue3/           # @ldesign/engine-vue3 - Vue 3 适配器
├── react/          # @ldesign/engine-react - React 适配器
├── svelte/         # @ldesign/engine-svelte - Svelte 适配器
├── solid/          # @ldesign/engine-solid - Solid 适配器
└── angular/        # @ldesign/engine-angular - Angular 适配器
```

## ✨ 核心特性

### 统一的 API

所有框架适配器提供完全一致的 API:

```typescript
import { createEngineApp } from '@ldesign/engine-vue3' // 或 vue2, react, svelte 等

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: { name: 'My App', debug: true },
  plugins: [myPlugin],
  middleware: [myMiddleware],
})
```

### 核心功能

- ✅ **插件系统** - 可复用的功能扩展
- ✅ **中间件系统** - 请求/响应处理链
- ✅ **生命周期管理** - 统一的生命周期钩子
- ✅ **事件系统** - 发布/订阅模式
- ✅ **状态管理** - 全局状态管理
- ✅ **TypeScript** - 完整的类型支持

## 🚀 快速开始

### 安装

```bash
# Vue 3
pnpm add @ldesign/engine-vue3

# Vue 2
pnpm add @ldesign/engine-vue2

# React
pnpm add @ldesign/engine-react
```

### 使用示例

#### Vue 3

```typescript
import { createEngineApp, definePlugin } from '@ldesign/engine-vue3'
import App from './App.vue'

// 定义插件
const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    context.engine.state.set('count', 0)
  }
})

// 创建应用
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  plugins: [myPlugin],
})
```

#### React

```typescript
import { createEngineApp } from '@ldesign/engine-react'
import App from './App'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
})
```

## 📚 文档

### 核心包

- [@ldesign/engine-core](./packages/core/README.md) - 核心引擎文档

### 框架适配器

- [@ldesign/engine-vue2](./packages/vue2/README.md) - Vue 2 适配器文档
- [@ldesign/engine-vue3](./packages/vue3/README.md) - Vue 3 适配器文档
- [@ldesign/engine-react](./packages/react/README.md) - React 适配器文档

## 🏗️ 架构设计

### 两层架构

1. **核心引擎层** (`@ldesign/engine-core`)
   - 框架无关的核心功能
   - 插件、中间件、生命周期、事件、状态管理

2. **框架适配器层** (`@ldesign/engine-*`)
   - 桥接框架特性到核心引擎
   - 提供框架特定的 API 和组合式函数

### 设计原则

- **框架无关** - 核心功能不依赖任何框架
- **统一 API** - 所有框架使用相同的 API
- **可扩展** - 通过插件和中间件扩展功能
- **类型安全** - 完整的 TypeScript 类型支持
- **轻量级** - 最小化依赖,按需加载

## 🔧 开发

### 构建所有包

```bash
pnpm --filter "@ldesign/engine-*" build
```

### 开发模式

```bash
pnpm --filter "@ldesign/engine-core" dev
```

### 运行测试

```bash
pnpm --filter "@ldesign/engine-*" test
```

## 📄 License

MIT


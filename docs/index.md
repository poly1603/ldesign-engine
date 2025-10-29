---
layout: home

hero:
  name: LDesign Engine
  text: 现代化前端应用引擎
  tagline: 强大、灵活、多框架支持的企业级应用基础设施
  image:
    src: /logo.svg
    alt: LDesign Engine
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/
    - theme: alt
      text: GitHub
      link: https://github.com/ldesign/engine

features:
  - icon: 🚀
    title: 高性能
    details: 优化的架构设计，双向链表 LRU、优先级桶、路径编译缓存等多重性能优化策略

  - icon: 🔌
    title: 插件化
    details: 强大的插件系统，支持依赖管理、生命周期控制、插件间通信，轻松扩展功能

  - icon: 🌍
    title: 多框架支持
    details: 支持 Vue 3、React 18、Angular、Solid.js、Svelte 等主流框架，一个引擎通用所有

  - icon: 📦
    title: 模块化
    details: 松耦合的模块设计，按需加载，Tree-shaking 友好，最小化打包体积

  - icon: 🔒
    title: 类型安全
    details: 完整的 TypeScript 支持，严格的类型约束，编译时发现问题

  - icon: 💾
    title: 内存安全
    details: 智能内存管理，自动清理、监控警告、防止内存泄漏

  - icon: 📡
    title: 事件系统
    details: 高性能事件发布订阅，支持优先级、命名空间、自动清理

  - icon: 🛡️
    title: 安全防护
    details: 内置安全防护机制，XSS 防护、CSRF 防护、输入验证

  - icon: ⚡
    title: 性能监控
    details: 实时性能监控和分析，性能预算管理，自动优化建议

  - icon: 🎯
    title: 开发者友好
    details: 详细的中文文档、丰富的示例、完整的类型提示、Vue DevTools 集成

  - icon: 🧪
    title: 测试完善
    details: 完整的测试生态，单元测试、性能测试、E2E 测试，覆盖率 > 80%

  - icon: 📚
    title: 文档齐全
    details: VitePress 构建的文档站点，API 参考、使用指南、最佳实践一应俱全
---

## 快速开始

### 安装

::: code-group

```bash [pnpm]
pnpm add @ldesign/engine
```

```bash [npm]
npm install @ldesign/engine
```

```bash [yarn]
yarn add @ldesign/engine
```

:::

### Vue 3 使用

```typescript
import { createEngineApp } from '@ldesign/engine/vue'
import App from './App.vue'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My App',
    debug: true
  }
})
```

### React 使用

```typescript
import { createEngineApp } from '@ldesign/engine/react'
import App from './App'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My React App',
    debug: true
  }
})
```

### 核心功能（框架无关）

```typescript
import { createCoreEngine } from '@ldesign/engine/core'

const engine = createCoreEngine({
  name: 'My App',
  debug: true
})

await engine.init()

// 使用缓存
engine.cache.set('user', userData, 3600000)

// 使用事件
engine.events.on('user:login', (user) => {
  console.log('User logged in:', user)
})

// 使用状态
engine.state.set('app.theme', 'dark')
```

## 为什么选择 LDesign Engine？

### 🎯 一个包，所有框架

不需要为每个框架安装不同的包，只需：

```bash
pnpm add @ldesign/engine
```

然后选择你喜欢的框架：

```typescript
// Vue
import { ... } from '@ldesign/engine/vue'

// React
import { ... } from '@ldesign/engine/react'

// 等等...
```

### ⚡ 性能第一

经过深度优化的核心实现：

- **缓存**: 双向链表 LRU，O(1) 操作
- **事件**: 优先级桶机制，零排序开销
- **状态**: 路径编译缓存，~3x 性能提升

### 💾 内存安全

完善的内存管理机制：

- 自动清理长时间未使用的资源
- 内存占用监控和警告
- 防止内存泄漏

### 🔧 开发体验

优秀的开发者体验：

- 完整的 TypeScript 类型定义
- 详细的中文文档和注释
- 丰富的使用示例
- Vue DevTools 深度集成

## 核心特性

### 插件系统

```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(engine) {
    // 插件逻辑
  }
}

await engine.use(myPlugin)
```

### 中间件系统

```typescript
const authMiddleware = {
  name: 'auth',
  handler: async (context, next) => {
    // 认证逻辑
    await next()
  }
}

engine.middleware.use(authMiddleware)
```

### 状态管理

```typescript
// 设置状态
engine.state.set('user.profile', {
  name: 'Alice',
  age: 30
})

// 监听变化
engine.state.watch('user.profile', (newValue) => {
  console.log('Profile updated:', newValue)
})

// 批量更新
engine.state.batch(() => {
  engine.state.set('user.name', 'Bob')
  engine.state.set('user.age', 35)
})
```

### 事件系统

```typescript
// 监听事件
engine.events.on('user:login', (user) => {
  console.log('User logged in:', user)
}, { 
  priority: 10,
  namespace: 'app'
})

// 触发事件
await engine.events.emit('user:login', userData)
```

### 缓存管理

```typescript
// 设置缓存
engine.cache.set('api:users', usersData, 3600000)

// 获取缓存
const users = engine.cache.get('api:users')

// 批量预热
await engine.cache.warmup([
  { key: 'config', loader: () => fetchConfig() }
])
```

## 性能数据

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 缓存操作 | O(n) | O(1) | ~100x |
| 事件触发 | 每次排序 | 无排序 | ~10x |
| 状态访问 | 每次解析 | 编译缓存 | ~3x |

## 支持的框架

<div class="frameworks">
  <a href="/guide/vue-integration" class="framework-card">
    <div class="framework-icon">Vue</div>
    <div class="framework-name">Vue 3</div>
  </a>
  <a href="/guide/react" class="framework-card">
    <div class="framework-icon">React</div>
    <div class="framework-name">React 18</div>
  </a>
  <a href="/guide/angular" class="framework-card">
    <div class="framework-icon">Angular</div>
    <div class="framework-name">Angular</div>
  </a>
  <a href="/guide/solid" class="framework-card">
    <div class="framework-icon">Solid</div>
    <div class="framework-name">Solid.js</div>
  </a>
  <a href="/guide/svelte" class="framework-card">
    <div class="framework-icon">Svelte</div>
    <div class="framework-name">Svelte</div>
  </a>
</div>

<style>
.frameworks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}

.framework-card {
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s;
  text-decoration: none;
}

.framework-card:hover {
  border-color: var(--vp-c-brand);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.framework-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.framework-name {
  font-weight: 600;
  color: var(--vp-c-text-1);
}
</style>

## 社区

- [GitHub Discussions](https://github.com/ldesign/engine/discussions) - 讨论和提问
- [GitHub Issues](https://github.com/ldesign/engine/issues) - 报告 Bug 和功能请求
- [更新日志](https://github.com/ldesign/engine/blob/main/CHANGELOG.md) - 查看最新更新

## 许可证

[MIT License](https://github.com/ldesign/engine/blob/main/LICENSE) © 2024-present LDesign Team

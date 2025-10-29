# 简介

## 什么是 LDesign Engine？

LDesign Engine 是一个现代化、模块化的前端应用引擎，为构建高性能 Web 应用提供强大的基础设施。它就像给你的应用装上了涡轮增压器！💨

## 核心理念

### 🎯 一次安装，多框架支持

只需安装一个包，就能在任何主流框架中使用：

```bash
pnpm add @ldesign/engine
```

然后根据你的框架选择对应的导入：

::: code-group

```typescript [Vue 3]
import { createEngineApp } from '@ldesign/engine/vue'
```

```typescript [React]
import { createEngineApp } from '@ldesign/engine/react'
```

```typescript [Angular]
import { EngineModule } from '@ldesign/engine/angular'
```

```typescript [Solid]
import { createEngineApp } from '@ldesign/engine/solid'
```

```typescript [Svelte]
import { createEngineApp } from '@ldesign/engine/svelte'
```

```typescript [Core (无框架)]
import { createCoreEngine } from '@ldesign/engine/core'
```

:::

### ⚡ 性能第一

经过深度优化的核心实现，提供企业级性能：

- **缓存管理**: 双向链表 LRU，O(1) 时间复杂度
- **事件系统**: 优先级桶机制，零排序开销
- **状态管理**: 路径编译缓存，~3x 性能提升

### 💾 内存安全

完善的内存管理机制，防止内存泄漏：

- 自动清理长时间未使用的资源
- 内存占用监控和警告
- 智能资源回收

### 🔒 类型安全

完整的 TypeScript 支持，让你的代码更可靠：

- 严格的类型定义
- 泛型支持
- 编译时错误检测

## 核心功能

### 插件系统

强大的插件架构，轻松扩展功能：

```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(engine) {
    engine.logger.info('Plugin installed')
  }
}

await engine.use(myPlugin)
```

### 中间件系统

灵活的中间件管道，处理横切关注点：

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

响应式状态管理，支持嵌套路径：

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
```

### 事件系统

发布订阅模式，支持优先级和命名空间：

```typescript
// 监听事件
engine.events.on('user:login', (user) => {
  console.log('User logged in:', user)
}, { priority: 10 })

// 触发事件
await engine.events.emit('user:login', userData)
```

### 缓存管理

高性能缓存，支持多种淘汰策略：

```typescript
// 设置缓存
engine.cache.set('api:users', usersData, 3600000)

// 获取缓存
const users = engine.cache.get('api:users')

// 查看统计
const stats = engine.cache.getStats()
console.log('命中率:', stats.hitRate)
```

## 支持的框架

| 框架 | 版本 | 导入路径 |
|------|------|----------|
| Vue | 3.3+ | `@ldesign/engine/vue` |
| React | 18.0+ | `@ldesign/engine/react` |
| Angular | 16-17 | `@ldesign/engine/angular` |
| Solid | 1.7+ | `@ldesign/engine/solid` |
| Svelte | 4-5 | `@ldesign/engine/svelte` |
| Core (无框架) | - | `@ldesign/engine/core` |

## 性能数据

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 缓存 get/set | O(n) | O(1) | ~100x (大缓存) |
| 事件触发 | 每次排序 | 无排序 | ~10x (多监听器) |
| 状态访问 | 每次解析 | 编译缓存 | ~3x |
| 内存泄漏 | 可能 | 自动清理 | 100% 解决 |

## 接下来

- [安装](./installation) - 了解如何安装和配置
- [快速开始](./getting-started) - 5 分钟快速体验
- [核心概念](./core-concepts) - 深入理解引擎架构

## 获取帮助

- [GitHub Discussions](https://github.com/ldesign/engine/discussions) - 提问和讨论
- [GitHub Issues](https://github.com/ldesign/engine/issues) - 报告 Bug
- [API 参考](/api/) - 查看完整 API 文档
- [示例](/examples/) - 浏览示例代码


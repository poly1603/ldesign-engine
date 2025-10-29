# 快速开始

本指南将带你在 5 分钟内快速体验 LDesign Engine 的核心功能。

## Vue 3 快速开始

### 1. 安装

```bash
pnpm add @ldesign/engine vue
```

### 2. 创建引擎应用

创建 `main.ts`：

```typescript
import { createEngineApp } from '@ldesign/engine/vue'
import App from './App.vue'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My Vue App',
    version: '1.0.0',
    debug: true,
  },
  features: {
    enableCaching: true,
    enablePerformanceMonitoring: true,
  },
})

console.log('✅ Engine initialized:', engine.getStatus())
```

### 3. 在组件中使用

创建 `App.vue`：

```vue
<template>
  <div class="app">
    <h1>{{ appName }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEngine } from '@ldesign/engine/vue'

const engine = useEngine()

// 从配置中获取应用名称
const appName = engine.config.get('name')

// 使用状态管理
const count = ref(0)

function increment() {
  count.value++
  
  // 保存到状态
  engine.state.set('count', count.value)
  
  // 触发事件
  engine.events.emit('count:changed', count.value)
  
  // 缓存结果
  engine.cache.set('last-count', count.value, 60000)
}

// 监听状态变化
engine.state.watch('count', (newValue) => {
  console.log('Count changed:', newValue)
})
</script>
```

### 4. 运行

```bash
pnpm dev
```

## React 快速开始

### 1. 安装

```bash
pnpm add @ldesign/engine react react-dom
```

### 2. 创建引擎应用

创建 `main.tsx`：

```typescript
import { createEngineApp } from '@ldesign/engine/react'
import App from './App'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My React App',
    debug: true,
  },
})

console.log('✅ Engine initialized')
```

### 3. 在组件中使用

创建 `App.tsx`：

```tsx
import { useState } from 'react'
import { useEngine } from '@ldesign/engine/react'

function App() {
  const engine = useEngine()
  const [count, setCount] = useState(0)
  
  const increment = () => {
    const newCount = count + 1
    setCount(newCount)
    
    // 保存到引擎状态
    engine.state.set('count', newCount)
    
    // 触发事件
    engine.events.emit('count:changed', newCount)
  }
  
  return (
    <div>
      <h1>{engine.config.get('name')}</h1>
      <p>Count: {count}</p>
      <button onClick={increment}>增加</button>
    </div>
  )
}

export default App
```

## 核心功能（无框架）快速开始

如果你只想使用核心功能，不依赖任何框架：

### 1. 安装

```bash
pnpm add @ldesign/engine
```

### 2. 创建引擎

```typescript
import { createCoreEngine } from '@ldesign/engine/core'

const engine = createCoreEngine({
  name: 'My App',
  debug: true,
  cache: {
    maxSize: 500,
    strategy: 'lru',
  },
  events: {
    maxListenersPerEvent: 100,
  },
})

await engine.init()
```

### 3. 使用核心功能

```typescript
// 缓存管理
engine.cache.set('user', { id: 1, name: 'Alice' }, 3600000)
const user = engine.cache.get('user')

// 事件系统
engine.events.on('data:update', (data) => {
  console.log('Data updated:', data)
}, { priority: 10 })

await engine.events.emit('data:update', { value: 100 })

// 状态管理
engine.state.set('app.theme', 'dark')
engine.state.watch('app.theme', (theme) => {
  console.log('Theme changed:', theme)
})

// 查看统计
console.log('缓存统计:', engine.cache.getStats())
console.log('事件统计:', engine.events.getStats?.())
console.log('引擎状态:', engine.getStatus())
```

## 核心概念速览

### 引擎实例

引擎实例是所有功能的入口，包含以下管理器：

- `engine.config` - 配置管理
- `engine.cache` - 缓存管理
- `engine.events` - 事件管理
- `engine.state` - 状态管理
- `engine.plugins` - 插件管理
- `engine.middleware` - 中间件管理
- `engine.lifecycle` - 生命周期管理
- `engine.logger` - 日志管理
- `engine.di` - 依赖注入

### 生命周期

引擎提供完整的生命周期钩子：

```typescript
engine.lifecycle.on('beforeInit', (engine) => {
  console.log('引擎即将初始化')
})

engine.lifecycle.on('afterInit', (engine) => {
  console.log('引擎初始化完成')
})

engine.lifecycle.on('beforeDestroy', (engine) => {
  console.log('引擎即将销毁')
})
```

### 依赖注入

使用依赖注入容器管理服务：

```typescript
// 注册服务
engine.di.register('userService', UserService, 'singleton')

// 解析服务
const userService = engine.di.resolve('userService')
```

## 常见使用场景

### 场景 1：API 请求缓存

```typescript
async function fetchUsers() {
  // 先检查缓存
  const cached = engine.cache.get('api:users')
  if (cached) {
    return cached
  }
  
  // 请求数据
  const users = await fetch('/api/users').then(r => r.json())
  
  // 缓存 5 分钟
  engine.cache.set('api:users', users, 300000)
  
  return users
}
```

### 场景 2：全局状态管理

```typescript
// 设置用户信息
engine.state.set('user.profile', {
  id: 123,
  name: 'Alice',
  role: 'admin'
})

// 在任何地方监听变化
engine.state.watch('user.profile', (profile) => {
  console.log('用户信息更新:', profile)
})

// 批量更新
engine.state.batch(() => {
  engine.state.set('user.name', 'Bob')
  engine.state.set('user.role', 'user')
})
```

### 场景 3：事件通信

```typescript
// 组件 A：监听事件
engine.events.on('notification:show', (message) => {
  showNotification(message)
}, { namespace: 'app' })

// 组件 B：触发事件
async function saveData() {
  await save()
  await engine.events.emit('notification:show', {
    type: 'success',
    text: '保存成功'
  })
}
```

## 下一步

现在你已经完成了快速开始，接下来可以：

- [深入了解核心概念](./core-concepts) - 理解引擎架构
- [查看完整示例](/examples/) - 浏览更多示例代码
- [阅读 API 参考](/api/) - 查看完整 API 文档

## 获取帮助

遇到问题？

- 查看 [FAQ](./faq)
- 查看 [故障排查](./troubleshooting)
- 在 [GitHub Discussions](https://github.com/ldesign/engine/discussions) 提问
- 报告 [Bug](https://github.com/ldesign/engine/issues)

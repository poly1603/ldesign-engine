---
layout: home

hero:
  name: "@ldesign/engine"
  text: "强大的插件化引擎"
  tagline: "构建可扩展、高性能的应用程序架构"
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
  - icon: 🔌
    title: 插件化架构
    details: 真正的插件化设计，支持热插拔、依赖管理和生命周期控制，让您的应用具备无限扩展能力。
  
  - icon: 🚀
    title: 高性能
    details: 优化的状态管理和事件系统，最小化重渲染，提供卓越的运行时性能。
  
  - icon: 📦
    title: 轻量级
    details: 核心库小于 50KB，按需加载，不会给您的应用增加不必要的负担。
  
  - icon: 🔧
    title: TypeScript 优先
    details: 完整的 TypeScript 类型定义，提供出色的开发体验和类型安全保障。
  
  - icon: 🌐
    title: 框架无关
    details: 可与 React、Vue、Angular 等任何前端框架无缝集成，也支持 Node.js 环境。
  
  - icon: 🛠️
    title: 开发友好
    details: 简洁的 API 设计、丰富的调试工具和详尽的文档，让开发变得更加轻松。
---

## 为什么选择 @ldesign/engine？

在现代应用开发中，我们经常面临以下挑战：

- **功能模块化**：如何将复杂的应用拆分成可管理的模块？
- **代码复用**：如何在不同项目间复用业务逻辑？
- **团队协作**：如何让多个团队并行开发而不相互干扰？
- **动态扩展**：如何在运行时动态加载和卸载功能？

@ldesign/engine 正是为解决这些问题而生。

## 核心特性

### 🔌 强大的插件系统

```typescript
// 创建插件
class MyPlugin implements Plugin {
  name = 'my-plugin'
  version = '1.0.0'
  
  async install(engine: Engine) {
    // 插件安装逻辑
    engine.addMethod('hello', () => 'Hello World!')
  }
}

// 使用插件
const engine = new Engine({ name: 'app', version: '1.0.0' })
await engine.use(new MyPlugin())

console.log(engine.hello()) // "Hello World!"
```

### 📊 响应式状态管理

```typescript
// 设置状态
engine.setState('user.profile.name', 'John Doe')

// 订阅状态变化
engine.subscribe('user.profile', (profile) => {
  console.log('Profile updated:', profile)
})

// 获取状态
const userName = engine.getState('user.profile.name')
```

### 📡 事件驱动架构

```typescript
// 监听事件
engine.on('user:login', (user) => {
  console.log('User logged in:', user.name)
})

// 触发事件
engine.emit('user:login', { id: 1, name: 'John' })
```

### 🔧 服务注册与依赖注入

```typescript
// 注册服务
engine.registerService('httpClient', new HttpClient())

// 在插件中使用服务
class ApiPlugin implements Plugin {
  async install(engine: Engine) {
    const http = engine.getService('httpClient')
    
    engine.addMethod('fetchUser', (id) => {
      return http.get(`/users/${id}`)
    })
  }
}
```

## 快速体验

只需几行代码，就能体验 @ldesign/engine 的强大功能：

::: code-group

```typescript [基础用法]
import { Engine } from '@ldesign/engine'

// 创建引擎实例
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 添加方法
engine.addMethod('greet', (name: string) => {
  return `Hello, ${name}!`
})

// 调用方法
console.log(engine.greet('World')) // "Hello, World!"
```

```typescript [插件开发]
import { Plugin, Engine } from '@ldesign/engine'

class CounterPlugin implements Plugin {
  name = 'counter'
  version = '1.0.0'
  
  async install(engine: Engine) {
    // 初始化状态
    engine.setState('counter', 0)
    
    // 添加方法
    engine.addMethod('increment', () => {
      const current = engine.getState('counter')
      engine.setState('counter', current + 1)
      engine.emit('counter:changed', current + 1)
    })
    
    engine.addMethod('getCount', () => {
      return engine.getState('counter')
    })
  }
}

// 使用插件
const engine = new Engine({ name: 'app', version: '1.0.0' })
await engine.use(new CounterPlugin())

engine.on('counter:changed', (count) => {
  console.log('Count:', count)
})

engine.increment() // Count: 1
engine.increment() // Count: 2
console.log(engine.getCount()) // 2
```

```typescript [React 集成]
import React, { useEffect, useState } from 'react'
import { Engine } from '@ldesign/engine'

function useEngine() {
  const [engine] = useState(() => 
    new Engine({ name: 'react-app', version: '1.0.0' })
  )
  
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    // 订阅状态变化
    return engine.subscribe('counter', setCount)
  }, [engine])
  
  return { engine, count }
}

function Counter() {
  const { engine, count } = useEngine()
  
  useEffect(() => {
    // 初始化计数器插件
    engine.use(new CounterPlugin())
  }, [engine])
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => engine.increment()}>
        Increment
      </button>
    </div>
  )
}
```

:::

## 适用场景

@ldesign/engine 适用于各种应用场景：

### 🏢 企业级应用
- **微前端架构**：将大型应用拆分为独立的功能模块
- **多团队协作**：不同团队开发独立的插件模块
- **功能开关**：动态启用或禁用特定功能

### 🎮 游戏开发
- **模组系统**：支持用户自定义游戏内容
- **功能扩展**：动态加载游戏功能和资源
- **插件生态**：构建丰富的插件生态系统

### 🛠️ 开发工具
- **IDE 插件**：为开发工具添加自定义功能
- **构建工具**：创建可扩展的构建流水线
- **脚手架工具**：构建模块化的项目生成器

### 📱 移动应用
- **功能模块**：按需加载应用功能
- **主题系统**：动态切换应用主题和样式
- **A/B 测试**：动态切换不同的功能实现

## 生态系统

@ldesign/engine 是 LDesign 生态系统的核心，与其他工具完美集成：

- **[@ldesign/store](./ecosystem/store)**：增强的状态管理解决方案
- **[@ldesign/router](./ecosystem/router)**：插件化路由系统
- **[@ldesign/ui](./ecosystem/ui)**：可扩展的 UI 组件库
- **[@ldesign/utils](./ecosystem/utils)**：实用工具集合

## 社区与支持

加入我们的社区，获取帮助和分享经验：

- **GitHub**：[https://github.com/ldesign/engine](https://github.com/ldesign/engine)
- **NPM**：[https://www.npmjs.com/package/@ldesign/engine](https://www.npmjs.com/package/@ldesign/engine)
- **文档**：您正在阅读的这份文档
- **示例**：[查看更多示例](/examples/)

## 开始使用

准备好开始您的插件化之旅了吗？

<div class="vp-doc" style="text-align: center; margin: 2rem 0;">
  <a href="/guide/getting-started" class="vp-button vp-button-brand vp-button-medium">
    🚀 立即开始
  </a>
  <a href="/examples/" class="vp-button vp-button-alt vp-button-medium" style="margin-left: 1rem;">
    📚 查看示例
  </a>
</div>

---

<div class="vp-doc" style="text-align: center; margin: 2rem 0; color: var(--vp-c-text-2);">
  <p>由 <strong>LDesign Team</strong> 用 ❤️ 构建</p>
  <p>基于 <a href="https://opensource.org/licenses/MIT">MIT 许可证</a> 开源</p>
</div>
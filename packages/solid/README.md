# @ldesign/engine-solid

Solid.js adapter for LDesign Engine - 为 Solid.js 提供的 LDesign 引擎适配器。

## 📦 安装

```bash
npm install @ldesign/engine-solid
# or
pnpm add @ldesign/engine-solid
# or
yarn add @ldesign/engine-solid
```

## 🚀 快速开始

### 基本使用

```typescript
import { createEngineApp } from '@ldesign/engine-solid'
import App from './App'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My Solid App',
    debug: true,
  },
})
```

### 在组件中使用

```tsx
import { Component } from 'solid-js'
import { useEngine, useEngineState, useEvent } from '@ldesign/engine-solid'

const Counter: Component = () => {
  const engine = useEngine()
  const [count, setCount] = useEngineState('count', 0)

  useEvent('reset', () => {
    setCount(0)
  })

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </div>
  )
}
```

## 🎯 核心功能

### 1. 引擎创建

#### createEngineApp

创建并初始化 Solid 引擎应用。

```typescript
import { createEngineApp } from '@ldesign/engine-solid'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My App',
    version: '1.0.0',
    debug: true,
  },
  plugins: [
    {
      name: 'my-plugin',
      version: '1.0.0',
      install(context) {
        // 插件逻辑
      },
    },
  ],
  middleware: [
    {
      name: 'my-middleware',
      async execute(context, next) {
        await next()
      },
    },
  ],
  onReady: async (engine) => {
    console.log('Engine ready!')
  },
  onMounted: async (engine) => {
    console.log('App mounted!')
  },
})
```

#### createEngineAppSync

同步版本的引擎创建(初始化是异步的)。

```typescript
import { createEngineAppSync } from '@ldesign/engine-solid'

const engine = createEngineAppSync({
  rootComponent: App,
  mountElement: '#app',
})
```

### 2. Solid Signals 集成

#### useEngine

获取引擎实例。

```tsx
import { useEngine } from '@ldesign/engine-solid'

function MyComponent() {
  const engine = useEngine()
  
  return <div>Engine: {engine.config.name}</div>
}
```

#### useEngineState

创建与引擎同步的响应式状态。

```tsx
import { useEngineState } from '@ldesign/engine-solid'

function Counter() {
  const [count, setCount] = useEngineState('count', 0)
  
  return (
    <button onClick={() => setCount(count() + 1)}>
      Count: {count()}
    </button>
  )
}
```

#### useEngineStateReadonly

创建只读的引擎状态。

```tsx
import { useEngineStateReadonly } from '@ldesign/engine-solid'

function ThemeDisplay() {
  const theme = useEngineStateReadonly('theme', 'light')
  
  return <div class={theme()}>Current theme: {theme()}</div>
}
```

#### useComputedState

创建计算状态。

```tsx
import { useEngineState, useComputedState } from '@ldesign/engine-solid'

function DoubledCounter() {
  const [count] = useEngineState('count', 0)
  const doubled = useComputedState(() => count() * 2)
  
  return <div>Doubled: {doubled()}</div>
}
```

#### useEvent

监听引擎事件。

```tsx
import { useEvent } from '@ldesign/engine-solid'

function LoginListener() {
  useEvent('user:login', (user) => {
    console.log('User logged in:', user)
  })
  
  return <div>Listening...</div>
}
```

#### useLifecycle

监听生命周期钩子。

```tsx
import { useLifecycle } from '@ldesign/engine-solid'

function MountedLogger() {
  useLifecycle('mounted', () => {
    console.log('Component mounted!')
  })
  
  return <div>Component</div>
}
```

#### usePlugin

获取插件实例。

```tsx
import { usePlugin } from '@ldesign/engine-solid'

function I18nComponent() {
  const i18n = usePlugin('i18n')
  
  return <div>{i18n() ? 'Plugin loaded' : 'Loading...'}</div>
}
```

#### emitEngineEvent

触发引擎事件。

```tsx
import { emitEngineEvent } from '@ldesign/engine-solid'

function LogoutButton() {
  return (
    <button onClick={() => emitEngineEvent('user:logout')}>
      Logout
    </button>
  )
}
```

#### emitEngineEventAsync

触发异步引擎事件。

```tsx
import { emitEngineEventAsync } from '@ldesign/engine-solid'

function LoadDataButton() {
  const handleClick = async () => {
    await emitEngineEventAsync('data:load', { id: 123 })
  }
  
  return <button onClick={handleClick}>Load Data</button>
}
```

### 3. 插件系统

```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  dependencies: ['other-plugin'], // 可选
  install(context) {
    const { engine } = context
    
    // 设置状态
    engine.state.set('plugin-data', {})
    
    // 监听事件
    engine.events.on('some-event', (data) => {
      console.log('Event received:', data)
    })
    
    // 注册中间件
    engine.middleware.use({
      name: 'plugin-middleware',
      async execute(ctx, next) {
        await next()
      },
    })
  },
  uninstall(context) {
    // 清理逻辑
  },
}

await engine.use(myPlugin)
```

### 4. 中间件系统

```typescript
const myMiddleware = {
  name: 'my-middleware',
  priority: 100, // 优先级越高越先执行
  async execute(context, next) {
    console.log('Before')
    await next()
    console.log('After')
  },
}

engine.middleware.use(myMiddleware)
await engine.middleware.execute({ data: {} })
```

### 5. 状态管理

```typescript
// 设置状态
engine.state.set('user', { name: 'John', age: 30 })

// 获取状态
const user = engine.state.get('user')

// 监听状态变化
const unwatch = engine.state.watch('user', (newValue, oldValue) => {
  console.log('User changed:', newValue)
})

// 批量更新
engine.state.batch(() => {
  engine.state.set('count', 100)
  engine.state.set('user', { name: 'Jane' })
})

// 取消监听
unwatch()
```

### 6. 事件系统

```typescript
// 监听事件
const unsubscribe = engine.events.on('user:login', (user) => {
  console.log('User logged in:', user)
})

// 触发事件
engine.events.emit('user:login', { id: 1, name: 'John' })

// 异步事件
await engine.events.emitAsync('data:load', { id: 123 })

// 一次性监听
engine.events.once('app:ready', () => {
  console.log('App is ready!')
})

// 取消监听
unsubscribe()
```

### 7. 生命周期

```typescript
// 监听生命周期钩子
engine.lifecycle.on('mounted', () => {
  console.log('App mounted!')
})

// 触发自定义钩子
await engine.lifecycle.trigger('custom-hook', { data: 'value' })
```

## 📁 示例项目

查看 [example](./example) 目录获取完整的示例项目,包含:

- ✅ 插件系统演示
- ✅ 中间件系统演示
- ✅ 状态管理演示
- ✅ 事件系统演示
- ✅ 生命周期演示

## 🔧 TypeScript 支持

完整的 TypeScript 类型定义:

```typescript
import type {
  CoreEngine,
  EngineConfig,
  Plugin,
  Middleware,
  SolidEngineAppConfig,
} from '@ldesign/engine-solid'
```

## 📚 API 文档

### 类型定义

```typescript
interface SolidEngineAppConfig {
  rootComponent: any
  mountElement: string | Element
  config?: Partial<EngineConfig>
  props?: Record<string, any>
  plugins?: Plugin[]
  middleware?: Middleware[]
  onReady?: (engine: CoreEngine) => void | Promise<void>
  onMounted?: (engine: CoreEngine) => void | Promise<void>
  onError?: (error: Error, context?: any) => void
}
```

## 🌟 特性

- ✅ **细粒度响应式** - 基于 Solid Signals 的高性能响应式系统
- ✅ **类型安全** - 完整的 TypeScript 支持
- ✅ **插件系统** - 强大的插件架构
- ✅ **中间件** - 洋葱模型中间件系统
- ✅ **事件系统** - 灵活的发布订阅模式
- ✅ **生命周期** - 完整的生命周期管理
- ✅ **状态管理** - 响应式状态管理
- ✅ **零配置** - 开箱即用

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!


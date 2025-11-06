# @ldesign/engine-svelte

Svelte adapter for LDesign Engine - 为 Svelte 4/5 提供统一的应用引擎支持。

## ✨ 特性

- 🎯 **Svelte 4/5 支持** - 完全兼容 Svelte 4 和 Svelte 5
- 🔄 **Svelte Stores 集成** - 与 Svelte stores 无缝集成
- ⚡️ **Svelte 5 Runes** - 支持最新的 Svelte 5 响应式系统
- 🔌 **插件系统** - 强大的插件架构,轻松扩展功能
- ⚙️ **中间件系统** - 洋葱模型中间件,灵活的请求处理
- 📦 **状态管理** - 响应式状态管理,自动同步
- 📡 **事件系统** - 发布订阅模式,支持异步事件
- 🔄 **生命周期管理** - 统一的生命周期钩子
- 🎨 **TypeScript** - 完整的类型定义和类型推导
- 📝 **完整文档** - 详细的中文注释和使用示例

## 📦 安装

```bash
# 使用 pnpm
pnpm add @ldesign/engine-svelte

# 使用 npm
npm install @ldesign/engine-svelte

# 使用 yarn
yarn add @ldesign/engine-svelte
```

## 🚀 快速开始

### 1. 创建引擎应用

```typescript
// main.ts
import { createEngineApp } from '@ldesign/engine-svelte'
import App from './App.svelte'

await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My Svelte App',
    version: '1.0.0',
    debug: true,
  },
  plugins: [
    // 你的插件
  ],
  middleware: [
    // 你的中间件
  ],
})
```

### 2. 在组件中使用引擎

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { setEngineContext } from '@ldesign/engine-svelte'

  // 从 props 获取引擎实例
  let { engine } = $props()

  // 设置引擎到上下文
  setEngineContext(engine)
</script>

<div>
  <h1>My Svelte App</h1>
</div>
```

### 3. 使用引擎功能

```svelte
<!-- MyComponent.svelte -->
<script lang="ts">
  import { getEngineContext } from '@ldesign/engine-svelte'

  const engine = getEngineContext()

  // 使用 Svelte 5 runes
  let count = $state(0)

  // 监听引擎状态
  $effect(() => {
    const unsub = engine.state.watch('count', (value) => {
      count = value
    })
    return () => unsub()
  })

  function increment() {
    engine.state.set('count', count + 1)
  }
</script>

<button on:click={increment}>
  Count: {count}
</button>
```

## 📖 API 文档

### createEngineApp(config)

创建 Svelte 引擎应用。

```typescript
interface SvelteEngineAppConfig {
  rootComponent: any              // 根组件
  mountElement: string | Element  // 挂载元素
  config?: Partial<EngineConfig>  // 引擎配置
  props?: Record<string, any>     // 组件属性
  plugins?: Plugin[]              // 插件列表
  middleware?: Middleware[]       // 中间件列表
  onReady?: (engine) => void      // 准备就绪回调
  onMounted?: (engine) => void    // 挂载完成回调
  onError?: (error, context) => void  // 错误处理回调
}
```

### Svelte Stores API

#### setEngineContext(engine)

设置引擎到 Svelte 上下文。

```svelte
<script>
  import { setEngineContext } from '@ldesign/engine-svelte'
  
  setEngineContext(engine)
</script>
```

#### getEngineContext()

从 Svelte 上下文获取引擎。

```svelte
<script>
  import { getEngineContext } from '@ldesign/engine-svelte'
  
  const engine = getEngineContext()
</script>
```

#### createEngineState(key, defaultValue)

创建引擎状态 store。

```svelte
<script>
  import { createEngineState } from '@ldesign/engine-svelte'
  
  const count = createEngineState('count', 0)
</script>

<button on:click={() => $count++}>
  Count: {$count}
</button>
```

#### createEventListener(event, handler)

创建事件监听器(自动清理)。

```svelte
<script>
  import { createEventListener } from '@ldesign/engine-svelte'
  
  createEventListener('user:login', (user) => {
    console.log('User logged in:', user)
  })
</script>
```

#### createLifecycleHook(hook, handler)

创建生命周期钩子监听器(自动清理)。

```svelte
<script>
  import { createLifecycleHook } from '@ldesign/engine-svelte'
  
  createLifecycleHook('mounted', () => {
    console.log('Component mounted!')
  })
</script>
```

#### emitEngineEvent(event, data)

触发引擎事件。

```svelte
<script>
  import { emitEngineEvent } from '@ldesign/engine-svelte'
</script>

<button on:click={() => emitEngineEvent('user:logout')}>
  Logout
</button>
```

## 🔌 插件系统

### 创建插件

```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    const { engine } = context
    
    // 初始化插件
    engine.state.set('myPluginData', {})
    
    // 监听事件
    engine.events.on('app:ready', () => {
      console.log('App is ready!')
    })
  },
}
```

### 使用插件

```typescript
await createEngineApp({
  // ...
  plugins: [myPlugin],
})
```

## ⚙️ 中间件系统

### 创建中间件

```typescript
const authMiddleware = {
  name: 'auth',
  priority: 100,
  async execute(context, next) {
    console.log('Before auth check')
    
    // 执行下一个中间件
    await next()
    
    console.log('After auth check')
  },
}
```

### 使用中间件

```typescript
await createEngineApp({
  // ...
  middleware: [authMiddleware],
})
```

## 📦 状态管理

```typescript
// 设置状态
engine.state.set('count', 0)

// 获取状态
const count = engine.state.get('count')

// 监听状态变化
const unsub = engine.state.watch('count', (newValue, oldValue) => {
  console.log('Count changed:', oldValue, '->', newValue)
})

// 批量更新
engine.state.batch(() => {
  engine.state.set('a', 1)
  engine.state.set('b', 2)
  engine.state.set('c', 3)
})
```

## 📡 事件系统

```typescript
// 监听事件
const unsub = engine.events.on('user:login', (user) => {
  console.log('User logged in:', user)
})

// 触发事件
engine.events.emit('user:login', { name: 'Alice' })

// 异步事件
await engine.events.emitAsync('data:load', { id: 123 })

// 取消监听
unsub()
```

## 🔄 生命周期

```typescript
// 注册钩子
const unsub = engine.lifecycle.on('mounted', () => {
  console.log('App mounted!')
})

// 触发钩子
await engine.lifecycle.trigger('mounted')

// 取消监听
unsub()
```

## 📝 示例项目

查看 [example](./example) 目录获取完整的示例项目。

## 🔗 相关链接

- [@ldesign/engine-core](../core) - 核心引擎
- [示例项目](./example) - 完整示例
- [Svelte 官方文档](https://svelte.dev/)

## 📄 License

MIT


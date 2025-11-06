# Svelte Engine 示例项目

这是一个使用 `@ldesign/engine-svelte` 和 Svelte 5 Runes 构建的完整示例项目,展示了引擎的所有核心功能。

## 📦 功能展示

### 1. 插件系统
- ✅ 插件安装和卸载
- ✅ 插件依赖管理
- ✅ 插件上下文访问
- ✅ 动态插件注册

### 2. 中间件系统
- ✅ 中间件注册和执行
- ✅ 优先级控制
- ✅ 洋葱模型执行
- ✅ 上下文传递

### 3. 状态管理
- ✅ 状态设置和获取
- ✅ 状态监听
- ✅ 批量更新
- ✅ 响应式状态

### 4. 事件系统
- ✅ 事件发布和订阅
- ✅ 异步事件
- ✅ 事件日志
- ✅ 自定义事件

### 5. 生命周期管理
- ✅ 生命周期钩子
- ✅ 钩子触发
- ✅ 自定义钩子
- ✅ 钩子计数

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## 📁 项目结构

```
example/
├── src/
│   ├── components/          # 演示组件
│   │   ├── PluginDemo.svelte      # 插件系统演示
│   │   ├── MiddlewareDemo.svelte  # 中间件系统演示
│   │   ├── StateDemo.svelte       # 状态管理演示
│   │   ├── EventDemo.svelte       # 事件系统演示
│   │   ├── LifecycleDemo.svelte   # 生命周期演示
│   │   └── DemoCard.css           # 共享样式
│   ├── App.svelte           # 主应用组件
│   ├── main.ts              # 入口文件
│   └── global.css           # 全局样式
├── index.html               # HTML 模板
├── package.json             # 项目配置
└── tsconfig.json            # TypeScript 配置
```

## 💡 使用示例

### 创建引擎应用

```typescript
import { createEngineApp } from '@ldesign/engine-svelte'
import App from './App.svelte'

await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My Svelte App',
    debug: true,
  },
  plugins: [/* 插件列表 */],
  middleware: [/* 中间件列表 */],
})
```

### 使用 Svelte 5 Runes

```svelte
<script lang="ts">
  import { getEngineContext, createEngineState } from '@ldesign/engine-svelte'

  // 获取引擎实例
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
</script>

<div>Count: {count}</div>
```

### 使用插件

```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    // 插件逻辑
    context.engine.state.set('pluginData', {})
  },
}

await engine.use(myPlugin)
```

### 使用中间件

```typescript
const myMiddleware = {
  name: 'my-middleware',
  priority: 100,
  async execute(context, next) {
    console.log('Before')
    await next()
    console.log('After')
  },
}

engine.middleware.use(myMiddleware)
```

### 状态管理

```typescript
// 设置状态
engine.state.set('count', 0)

// 获取状态
const count = engine.state.get('count')

// 监听状态变化
engine.state.watch('count', (newValue, oldValue) => {
  console.log('Count changed:', oldValue, '->', newValue)
})

// 批量更新
engine.state.batch(() => {
  engine.state.set('a', 1)
  engine.state.set('b', 2)
  engine.state.set('c', 3)
})
```

### 事件系统

```typescript
// 监听事件
engine.events.on('user:login', (user) => {
  console.log('User logged in:', user)
})

// 触发事件
engine.events.emit('user:login', { name: 'Alice' })

// 异步事件
await engine.events.emitAsync('data:load', { id: 123 })
```

### 生命周期钩子

```typescript
// 注册钩子
engine.lifecycle.on('mounted', () => {
  console.log('App mounted!')
})

// 触发钩子
await engine.lifecycle.trigger('mounted')
```

## 🎨 Svelte Stores API

### setEngineContext(engine)
设置引擎到 Svelte 上下文

```svelte
<script>
  import { setEngineContext } from '@ldesign/engine-svelte'
  
  setEngineContext(engine)
</script>
```

### getEngineContext()
从 Svelte 上下文获取引擎

```svelte
<script>
  import { getEngineContext } from '@ldesign/engine-svelte'
  
  const engine = getEngineContext()
</script>
```

### createEngineState(key, defaultValue)
创建引擎状态 store

```svelte
<script>
  import { createEngineState } from '@ldesign/engine-svelte'
  
  const count = createEngineState('count', 0)
</script>

<button on:click={() => $count++}>
  Count: {$count}
</button>
```

### createEventListener(event, handler)
创建事件监听器(自动清理)

```svelte
<script>
  import { createEventListener } from '@ldesign/engine-svelte'
  
  createEventListener('user:login', (user) => {
    console.log('User logged in:', user)
  })
</script>
```

### createLifecycleHook(hook, handler)
创建生命周期钩子监听器(自动清理)

```svelte
<script>
  import { createLifecycleHook } from '@ldesign/engine-svelte'
  
  createLifecycleHook('mounted', () => {
    console.log('Component mounted!')
  })
</script>
```

### emitEngineEvent(event, data)
触发引擎事件

```svelte
<script>
  import { emitEngineEvent } from '@ldesign/engine-svelte'
</script>

<button on:click={() => emitEngineEvent('user:logout')}>
  Logout
</button>
```

## 🔗 相关链接

- [@ldesign/engine-svelte 文档](../README.md)
- [@ldesign/engine-core 文档](../../core/README.md)
- [LDesign Engine 架构](../../../README.md)
- [Svelte 官方文档](https://svelte.dev/)
- [Svelte 5 Runes](https://svelte-5-preview.vercel.app/docs/runes)

## 📄 License

MIT


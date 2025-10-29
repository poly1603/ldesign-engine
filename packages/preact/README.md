# @ldesign/engine-preact

Preact adapter for LDesign Engine - 轻量级 React 替代方案的引擎适配器。

## 特性

- ✅ **轻量级**: 仅 3KB,完全兼容 React API
- ✅ **Hooks API**: 8 个强大的 Hooks
- ✅ **Signals 支持**: 原生 Preact Signals 集成
- ✅ **DevTools**: 支持 Preact DevTools
- ✅ **TypeScript**: 完整的类型定义
- ✅ **批量更新**: 优化的批量状态管理

## 安装

```bash
pnpm add @ldesign/engine-preact @ldesign/engine-core preact
```

## 快速开始

```tsx
import { createEngine } from '@ldesign/engine-core'
import { createPreactAdapter } from '@ldesign/engine-preact'

// 创建引擎实例
const engine = createEngine({
  adapter: createPreactAdapter({
    debug: true,
    enableSignals: true,
  })
})

await engine.init()
```

## Hooks API

### useEngine()

获取引擎实例:

```tsx
import { useEngine } from '@ldesign/engine-preact'

function MyComponent() {
  const engine = useEngine()
  return <div>Engine: {engine.name}</div>
}
```

### useEngineState()

响应式状态管理:

```tsx
import { useEngineState } from '@ldesign/engine-preact'

function Counter() {
  const [count, setCount] = useEngineState('counter', 0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### useEngineEvent()

事件监听:

```tsx
import { useEngineEvent } from '@ldesign/engine-preact'

function Notifications() {
  useEngineEvent('notification', (data) => {
    console.log('Notification:', data)
  })
  
  return <div>Listening for notifications...</div>
}
```

### useEngineCache()

缓存管理:

```tsx
import { useEngineCache } from '@ldesign/engine-preact'

function UserProfile({ userId }) {
  const [user, setUser] = useEngineCache(`user:${userId}`)
  
  return <div>{user?.name}</div>
}
```

### useEngineComputed()

计算属性:

```tsx
import { useEngineComputed } from '@ldesign/engine-preact'

function Total() {
  const total = useEngineComputed(
    ['cart.items'],
    (items) => items.reduce((sum, item) => sum + item.price, 0)
  )
  
  return <div>Total: ${total}</div>
}
```

### useEngineAction()

动作封装:

```tsx
import { useEngineAction } from '@ldesign/engine-preact'

function TodoList() {
  const addTodo = useEngineAction(async (text) => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ text })
    })
    return response.json()
  })
  
  return <button onClick={() => addTodo('New task')}>Add</button>
}
```

### useEnginePlugin()

插件访问:

```tsx
import { useEnginePlugin } from '@ldesign/engine-preact'

function PluginInfo() {
  const plugin = useEnginePlugin('my-plugin')
  return <div>Plugin: {plugin?.name}</div>
}
```

### useEngineBatchState()

批量状态管理:

```tsx
import { useEngineBatchState } from '@ldesign/engine-preact'

function UserForm() {
  const [state, setState] = useEngineBatchState({
    name: 'user.name',
    email: 'user.email',
    age: 'user.age'
  })
  
  return (
    <form>
      <input value={state.name} onChange={e => setState({ name: e.target.value })} />
      <input value={state.email} onChange={e => setState({ email: e.target.value })} />
      <input value={state.age} onChange={e => setState({ age: e.target.value })} />
    </form>
  )
}
```

## 配置选项

```typescript
interface PreactAdapterConfig {
  debug?: boolean              // 调试模式
  enableSignals?: boolean      // 启用 Signals
  enableDevTools?: boolean     // 启用 DevTools
}
```

## 最佳实践

### 1. 使用 Signals 优化性能

```tsx
import { signal } from '@preact/signals'
import { useEngineState } from '@ldesign/engine-preact'

const count = signal(0)

function Counter() {
  const [value] = useEngineState('counter', 0)
  return <div>{count.value + value}</div>
}
```

### 2. 批量更新优化

```tsx
import { batch } from 'preact/compat'
import { useEngineBatchState } from '@ldesign/engine-preact'

function Form() {
  const [state, setState] = useEngineBatchState({
    name: 'form.name',
    email: 'form.email'
  })
  
  const handleSubmit = () => {
    batch(() => {
      setState({ name: '', email: '' })
    })
  }
  
  return <form onSubmit={handleSubmit}>...</form>
}
```

### 3. 懒加载组件

```tsx
import { lazy, Suspense } from 'preact/compat'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  )
}
```

## TypeScript 支持

完整的类型定义:

```typescript
import type { PreactAdapterConfig } from '@ldesign/engine-preact'
import type { Engine } from '@ldesign/engine-core'

const config: PreactAdapterConfig = {
  debug: true,
  enableSignals: true
}
```

## 性能优化

- ✅ 使用 `memo()` 避免不必要的重渲染
- ✅ 使用 `useCallback()` 缓存回调函数
- ✅ 使用 `useMemo()` 缓存计算结果
- ✅ 使用 Signals 实现细粒度响应式
- ✅ 使用批量更新减少渲染次数

## 示例项目

查看 [examples/preact](../../examples/preact) 获取完整示例。

## License

MIT © LDesign Team


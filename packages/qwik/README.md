# @ldesign/engine-qwik

Qwik adapter for LDesign Engine - 为 Qwik 框架提供引擎集成。

## 特性

- ✅ 支持 Qwik 的可恢复性 (Resumability)
- ✅ 集成 Qwik Signal 系统
- ✅ 支持 SSR 和水合 (Hydration)
- ✅ 支持 QRL 序列化
- ✅ 提供完整的 Hooks API
- ✅ TypeScript 类型支持

## 安装

```bash
pnpm add @ldesign/engine-qwik @ldesign/engine-core @builder.io/qwik
```

## 快速开始

### 1. 创建引擎实例

```typescript
// src/engine.ts
import { createEngine } from '@ldesign/engine-core'
import { createQwikAdapter } from '@ldesign/engine-qwik'

export const engine = createEngine({
  adapter: createQwikAdapter({
    enableSSR: true,
    debug: import.meta.env.DEV
  })
})
```

### 2. 提供 Engine Context

```tsx
// src/root.tsx
import { component$, useContextProvider } from '@builder.io/qwik'
import { EngineContext } from '@ldesign/engine-qwik'
import { engine } from './engine'

export default component$(() => {
  useContextProvider(EngineContext, engine)
  
  return (
    <div>
      <Slot />
    </div>
  )
})
```

### 3. 使用 Hooks

```tsx
// src/components/counter.tsx
import { component$ } from '@builder.io/qwik'
import { useEngineState } from '@ldesign/engine-qwik'

export const Counter = component$(() => {
  const count = useEngineState('counter', 0)
  
  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick$={() => count.value++}>
        Increment
      </button>
    </div>
  )
})
```

## API 文档

### Hooks

#### `useEngine()`

获取引擎实例。

```tsx
const engine = useEngine()
```

#### `useEngineState(path, initialValue)`

使用引擎状态,返回 Qwik Signal。

```tsx
const count = useEngineState('counter', 0)
count.value++ // 更新状态
```

#### `useEngineEvent(eventName, handler)`

监听引擎事件。

```tsx
useEngineEvent('notification', (data) => {
  console.log('收到通知:', data)
})
```

#### `useEngineCache(key, fetcher, options)`

使用引擎缓存。

```tsx
const user = useEngineCache(
  'user:123',
  async () => {
    const res = await fetch('/api/user/123')
    return res.json()
  },
  { ttl: 60000 }
)
```

#### `useEngineComputed(getter, deps)`

创建计算属性。

```tsx
const total = useEngineComputed(
  () => items.value.reduce((sum, item) => sum + item.price, 0),
  ['cart.items']
)
```

#### `useEngineAction(action)`

创建引擎动作。

```tsx
const addTodo = useEngineAction(async (text: string) => {
  const engine = useEngine()
  // ... 执行操作
})
```

#### `useEnginePlugin(pluginName)`

获取插件实例。

```tsx
const analytics = useEnginePlugin('analytics')
analytics?.track('page_view')
```

### Adapter

#### `QwikAdapter`

Qwik 框架适配器类。

```typescript
const adapter = new QwikAdapter({
  enableSSR: true,
  debug: false,
  serialization: {
    serializeState: true,
    serializeEvents: false
  }
})
```

#### `createQwikAdapter(config)`

创建 Qwik 适配器的工厂函数。

```typescript
const adapter = createQwikAdapter({
  enableSSR: true
})
```

## SSR 支持

Qwik 适配器完全支持服务端渲染 (SSR)。

### 服务端

```typescript
// 序列化状态
const serializedState = adapter.serializeState()

// 在 HTML 中注入
const html = `
  <script>
    window.__ENGINE_STATE__ = ${serializedState}
  </script>
`
```

### 客户端

```typescript
// 反序列化状态
if (typeof window !== 'undefined' && window.__ENGINE_STATE__) {
  adapter.deserializeState(window.__ENGINE_STATE__)
}
```

## 示例

### 完整的 Todo 应用

```tsx
import { component$, useSignal } from '@builder.io/qwik'
import { useEngineState, useEngineEvent } from '@ldesign/engine-qwik'

export const TodoApp = component$(() => {
  const todos = useEngineState<Array<{ text: string; done: boolean }>>('todos', [])
  const input = useSignal('')
  
  // 监听 todo 添加事件
  useEngineEvent('todo:added', (data) => {
    console.log('Todo added:', data)
  })
  
  const addTodo = $(() => {
    if (input.value.trim()) {
      todos.value = [...todos.value, { text: input.value, done: false }]
      input.value = ''
    }
  })
  
  const toggleTodo = $((index: number) => {
    const newTodos = [...todos.value]
    newTodos[index].done = !newTodos[index].done
    todos.value = newTodos
  })
  
  return (
    <div>
      <h1>Todo List</h1>
      <div>
        <input
          value={input.value}
          onInput$={(e) => input.value = e.target.value}
          placeholder="Add a todo..."
        />
        <button onClick$={addTodo}>Add</button>
      </div>
      <ul>
        {todos.value.map((todo, index) => (
          <li key={index}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange$={() => toggleTodo(index)}
            />
            <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
})
```

## 许可证

MIT


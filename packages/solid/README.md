# @ldesign/engine-solid

Solid.js adapter for @ldesign/engine-core - 提供与 React/Vue 完全一致的 API。

## 📦 安装

```bash
pnpm add @ldesign/engine-solid @ldesign/engine-core
```

## 🚀 快速开始

### 1. 设置引擎 Provider

```tsx
// App.tsx
import { EngineProvider } from '@ldesign/engine-solid'
import { createCoreEngine } from '@ldesign/engine-core'

const engine = createCoreEngine({
  name: 'my-app',
  version: '1.0.0'
})

function App() {
  return (
    <EngineProvider engine={engine}>
      <YourApp />
    </EngineProvider>
  )
}

export default App
```

### 2. 使用状态管理

```tsx
// Counter.tsx
import { useEngineState } from '@ldesign/engine-solid'

function Counter() {
  const [count, setCount] = useEngineState('count', 0)

  return (
    <button onClick={() => setCount(prev => prev + 1)}>
      Count: {count()}
    </button>
  )
}
```

### 3. 使用事件系统

```tsx
// Publisher.tsx
import { useEventEmitter } from '@ldesign/engine-solid'

function Publisher() {
  const emit = useEventEmitter()

  const handleClick = () => {
    emit('button:clicked', { timestamp: Date.now() })
  }

  return <button onClick={handleClick}>Click me</button>
}
```

```tsx
// Subscriber.tsx
import { useEventListener } from '@ldesign/engine-solid'

function Subscriber() {
  useEventListener('button:clicked', (payload) => {
    console.log('Button clicked at:', payload.timestamp)
  })

  return <div>Listening for button clicks...</div>
}
```

## 📚 API 文档

### 状态管理

#### `useEngineState(path, defaultValue)`

使用引擎状态,返回 `[Accessor, Setter]` 元组(与 React/Vue 一致)。

```tsx
import { useEngineState } from '@ldesign/engine-solid'

function MyComponent() {
  const [count, setCount] = useEngineState('count', 0)

  // 直接更新
  const increment = () => setCount(10)

  // 函数式更新
  const incrementByOne = () => setCount(prev => prev + 1)

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={increment}>Set to 10</button>
      <button onClick={incrementByOne}>+1</button>
    </div>
  )
}
```

#### `useEngineStateValue(path, defaultValue)`

使用引擎状态(只读),返回 `Accessor`。

```tsx
import { useEngineStateValue } from '@ldesign/engine-solid'

function UserGreeting() {
  const userName = useEngineStateValue('user.name', 'Guest')

  return <div>Hello, {userName()}!</div>
}
```

### 事件系统

#### `useEventListener(eventName, handler, options)`

监听事件,组件销毁时自动清理。

```tsx
import { useEventListener } from '@ldesign/engine-solid'

function MyComponent() {
  useEventListener('user:login', (user) => {
    console.log('User logged in:', user)
  })

  return <div>Listening...</div>
}
```

#### `useEventEmitter()`

获取事件发射器函数。

```tsx
import { useEventEmitter } from '@ldesign/engine-solid'

function MyComponent() {
  const emit = useEventEmitter()

  const notify = () => {
    emit('notification', { message: 'Hello!' })
  }

  return <button onClick={notify}>Notify</button>
}
```

### 引擎访问

#### `useEngine()`

获取引擎实例。

```tsx
import { useEngine } from '@ldesign/engine-solid'

function MyComponent() {
  const engine = useEngine()
  console.log('Engine:', engine)

  return <div>Engine loaded</div>
}
```

## 🎯 与 React/Vue 的 API 一致性

| 功能 | React | Vue | Solid | 一致性 |
|------|-------|-----|-------|--------|
| 引擎访问 | `useEngine()` | `useEngine()` | `useEngine()` | ✅ 100% |
| 状态读写 | `useEngineState()` | `useEngineState()` | `useEngineState()` | ✅ 100% |
| 只读状态 | `useEngineStateValue()` | `useEngineStateValue()` | `useEngineStateValue()` | ✅ 100% |
| 函数式更新 | `setValue(p=>p+1)` | `setValue(p=>p+1)` | `setCount(p=>p+1)` | ✅ 100% |
| 事件监听 | `useEventListener()` | `useEventListener()` | `useEventListener()` | ✅ 100% |
| 事件发射 | `useEventEmitter()` | `useEventEmitter()` | `useEventEmitter()` | ✅ 100% |

## 📖 完整示例

### Todo List

```tsx
// TodoList.tsx
import { useEngineState, useEventEmitter } from '@ldesign/engine-solid'
import { createSignal, For } from 'solid-js'

interface Todo {
  id: number
  text: string
  done: boolean
}

function TodoList() {
  const [todos, setTodos] = useEngineState<Todo[]>('todos', [])
  const emit = useEventEmitter()
  const [newTodoText, setNewTodoText] = createSignal('')

  const addTodo = () => {
    const text = newTodoText()
    if (!text.trim()) return

    setTodos(prev => [...(prev || []), {
      id: Date.now(),
      text,
      done: false
    }])
    emit('todo:added', { text })
    setNewTodoText('')
  }

  const toggleTodo = (id: number) => {
    setTodos(prev => (prev || []).map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ))
  }

  const removeTodo = (id: number) => {
    setTodos(prev => (prev || []).filter(todo => todo.id !== id))
    emit('todo:removed', { id })
  }

  return (
    <div>
      <div>
        <input
          value={newTodoText()}
          onInput={(e) => setNewTodoText(e.currentTarget.value)}
          placeholder="New todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <ul>
        <For each={todos()}>
          {(todo) => (
            <li>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggleTodo(todo.id)}
              />
              <span style={{ 
                'text-decoration': todo.done ? 'line-through' : 'none',
                opacity: todo.done ? 0.6 : 1
              }}>
                {todo.text}
              </span>
              <button onClick={() => removeTodo(todo.id)}>Delete</button>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}

export default TodoList
```

## 🔧 高级用法

### 计算属性

```tsx
import { useEngineState } from '@ldesign/engine-solid'
import { createMemo } from 'solid-js'

function ShoppingCart() {
  const [items, setItems] = useEngineState('cart.items', [])

  // 计算总价
  const total = createMemo(() => {
    return (items() || []).reduce((sum, item) => sum + item.price, 0)
  })

  return (
    <div>
      <p>Total: ${total()}</p>
    </div>
  )
}
```

### 批量更新

```tsx
import { useEngineState } from '@ldesign/engine-solid'

function UserProfile() {
  const [user, setUser] = useEngineState('user', {})

  const updateUser = () => {
    // Solid 会自动批处理更新
    setUser(prev => ({
      ...prev,
      name: 'Jane',
      age: 25,
      email: 'jane@example.com'
    }))
  }

  return <button onClick={updateUser}>Update User</button>
}
```

## 📝 最佳实践

### 1. 使用函数式更新

```tsx
// ✅ 推荐
setCount(prev => prev + 1)

// ❌ 不推荐(可能有闭包问题)
setCount(count() + 1)
```

### 2. 使用只读状态

```tsx
// ✅ 推荐:只读状态
const userName = useEngineStateValue('user.name')

// ❌ 不推荐:可写但不修改
const [userName] = useEngineState('user.name')
```

### 3. 使用事件发射器

```tsx
// ✅ 推荐
const emit = useEventEmitter()
emit('event:name', payload)

// ❌ 不推荐
const events = useEvents()
events.emit('event:name', payload)
```

## 📄 License

MIT

## 🔗 相关链接

- [核心包文档](../core/README.md)
- [React 适配器](../react/README.md)
- [Vue 适配器](../vue/README.md)
- [Svelte 适配器](../svelte/README.md)
- [统一 API 规范](../../UNIFIED_API_SPECIFICATION.md)


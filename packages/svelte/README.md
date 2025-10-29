# @ldesign/engine-svelte

Svelte adapter for @ldesign/engine-core - 提供与 React/Vue 完全一致的 API。

## 📦 安装

```bash
pnpm add @ldesign/engine-svelte @ldesign/engine-core
```

## 🚀 快速开始

### 1. 设置引擎上下文

```svelte
<!-- App.svelte -->
<script>
import { setContext } from 'svelte'
import { createCoreEngine } from '@ldesign/engine-core'
import { ENGINE_CONTEXT_KEY } from '@ldesign/engine-svelte'

const engine = createCoreEngine({
  name: 'my-app',
  version: '1.0.0'
})

setContext(ENGINE_CONTEXT_KEY, engine)
</script>

<slot />
```

### 2. 使用状态管理

```svelte
<!-- Counter.svelte -->
<script>
import { createEngineStore } from '@ldesign/engine-svelte'

// 方式 1: 使用元组(与 React/Vue 一致)
const [count, setCount] = createEngineStore('count', 0)

function increment() {
  setCount(prev => prev + 1)
}
</script>

<button on:click={increment}>
  Count: {$count}
</button>
```

或者使用 Svelte 惯用方式:

```svelte
<script>
import { useEngineState } from '@ldesign/engine-svelte'

// 方式 2: 直接使用 Store
const count = useEngineState('count', 0)
</script>

<button on:click={() => $count++}>
  Count: {$count}
</button>
```

### 3. 使用事件系统

```svelte
<!-- Publisher.svelte -->
<script>
import { useEventEmitter } from '@ldesign/engine-svelte'

const emit = useEventEmitter()

function handleClick() {
  emit('button:clicked', { timestamp: Date.now() })
}
</script>

<button on:click={handleClick}>Click me</button>
```

```svelte
<!-- Subscriber.svelte -->
<script>
import { useEventListener } from '@ldesign/engine-svelte'

useEventListener('button:clicked', (payload) => {
  console.log('Button clicked at:', payload.timestamp)
})
</script>

<div>Listening for button clicks...</div>
```

## 📚 API 文档

### 状态管理

#### `createEngineStore(path, defaultValue)`

创建引擎状态 Store,返回元组 `[store, setter]`(与 React/Vue 一致)。

```svelte
<script>
const [count, setCount] = createEngineStore('count', 0)

// 直接更新
setCount(10)

// 函数式更新
setCount(prev => prev + 1)
</script>

<div>Count: {$count}</div>
```

#### `useEngineState(path, defaultValue)`

创建引擎状态 Store,直接返回 Writable Store(Svelte 惯用方式)。

```svelte
<script>
const count = useEngineState('count', 0)
</script>

<button on:click={() => $count++}>
  Count: {$count}
</button>
```

#### `createEngineReadable(path, defaultValue)`

创建只读引擎状态 Store。

```svelte
<script>
const userName = createEngineReadable('user.name', 'Guest')
</script>

<div>Hello, {$userName}!</div>
```

#### `useEngineStateValue(path, defaultValue)`

创建只读引擎状态 Store(别名)。

### 事件系统

#### `useEventListener(eventName, handler, options)`

监听事件,组件销毁时自动清理。

```svelte
<script>
import { useEventListener } from '@ldesign/engine-svelte'

useEventListener('user:login', (user) => {
  console.log('User logged in:', user)
})
</script>
```

#### `useEventEmitter()`

获取事件发射器函数。

```svelte
<script>
import { useEventEmitter } from '@ldesign/engine-svelte'

const emit = useEventEmitter()

function notify() {
  emit('notification', { message: 'Hello!' })
}
</script>

<button on:click={notify}>Notify</button>
```

### 引擎访问

#### `useEngine()`

获取引擎实例。

```svelte
<script>
import { useEngine } from '@ldesign/engine-svelte'

const engine = useEngine()
console.log('Engine:', engine)
</script>
```

## 🎯 与 React/Vue 的 API 一致性

| 功能 | React | Vue | Svelte | 一致性 |
|------|-------|-----|--------|--------|
| 引擎访问 | `useEngine()` | `useEngine()` | `useEngine()` | ✅ 100% |
| 状态读写 | `useEngineState()` | `useEngineState()` | `createEngineStore()` | ✅ 100% |
| 只读状态 | `useEngineStateValue()` | `useEngineStateValue()` | `createEngineReadable()` | ✅ 100% |
| 函数式更新 | `setValue(p=>p+1)` | `setValue(p=>p+1)` | `setCount(p=>p+1)` | ✅ 100% |
| 事件监听 | `useEventListener()` | `useEventListener()` | `useEventListener()` | ✅ 100% |
| 事件发射 | `useEventEmitter()` | `useEventEmitter()` | `useEventEmitter()` | ✅ 100% |

## 📖 完整示例

### Todo List

```svelte
<!-- TodoList.svelte -->
<script>
import { createEngineStore, useEventEmitter } from '@ldesign/engine-svelte'

const [todos, setTodos] = createEngineStore('todos', [])
const emit = useEventEmitter()

function addTodo(text) {
  setTodos(prev => [...prev, { 
    id: Date.now(), 
    text, 
    done: false 
  }])
  emit('todo:added', { text })
}

function toggleTodo(id) {
  setTodos(prev => prev.map(todo => 
    todo.id === id ? { ...todo, done: !todo.done } : todo
  ))
}

function removeTodo(id) {
  setTodos(prev => prev.filter(todo => todo.id !== id))
  emit('todo:removed', { id })
}

let newTodoText = ''
</script>

<div>
  <input bind:value={newTodoText} placeholder="New todo..." />
  <button on:click={() => { addTodo(newTodoText); newTodoText = '' }}>
    Add
  </button>

  <ul>
    {#each $todos as todo (todo.id)}
      <li>
        <input 
          type="checkbox" 
          checked={todo.done} 
          on:change={() => toggleTodo(todo.id)} 
        />
        <span class:done={todo.done}>{todo.text}</span>
        <button on:click={() => removeTodo(todo.id)}>Delete</button>
      </li>
    {/each}
  </ul>
</div>

<style>
.done {
  text-decoration: line-through;
  opacity: 0.6;
}
</style>
```

## 🔧 高级用法

### 双向绑定

```svelte
<script>
import { useEngineState } from '@ldesign/engine-svelte'

const name = useEngineState('user.name', '')
</script>

<!-- 双向绑定 -->
<input bind:value={$name} />

<!-- 显示 -->
<p>Hello, {$name}!</p>
```

### 批量更新

```svelte
<script>
import { createEngineStore } from '@ldesign/engine-svelte'

const [user, setUser] = createEngineStore('user', {})

function updateUser() {
  // Svelte 会自动批处理更新
  setUser(prev => ({
    ...prev,
    name: 'Jane',
    age: 25,
    email: 'jane@example.com'
  }))
}
</script>
```

## 📝 最佳实践

### 1. 使用函数式更新

```svelte
<script>
// ✅ 推荐
setCount(prev => prev + 1)

// ❌ 不推荐(可能有闭包问题)
setCount($count + 1)
</script>
```

### 2. 使用只读状态

```svelte
<script>
// ✅ 推荐:只读状态
const userName = createEngineReadable('user.name')

// ❌ 不推荐:可写但不修改
const [userName] = createEngineStore('user.name')
</script>
```

### 3. 使用事件发射器

```svelte
<script>
// ✅ 推荐
const emit = useEventEmitter()
emit('event:name', payload)

// ❌ 不推荐
const events = useEvents()
events.emit('event:name', payload)
</script>
```

## 📄 License

MIT

## 🔗 相关链接

- [核心包文档](../core/README.md)
- [React 适配器](../react/README.md)
- [Vue 适配器](../vue/README.md)
- [统一 API 规范](../../UNIFIED_API_SPECIFICATION.md)


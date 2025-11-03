# Solid.js 集成指南

完整的 @ldesign/engine 与 Solid.js 集成指南。

## 安装

```bash
pnpm add @ldesign/engine-core @ldesign/engine-solid
```

## 基础集成

### 1. 创建引擎实例

在应用入口创建引擎实例：

```typescript
// index.tsx
import { render } from 'solid-js/web'
import { createEngine } from '@ldesign/engine-core'
import { EngineProvider } from '@ldesign/engine-solid'
import { createI18nPlugin } from '@ldesign/engine-core/plugins/i18n'
import { createThemePlugin } from '@ldesign/engine-core/plugins/theme'
import App from './App'

// 创建引擎
const engine = createEngine({
  name: 'my-solid-app',
  version: '1.0.0',
  logger: {
    level: 'info'
  }
})

// 注册插件
engine.use(createI18nPlugin({
  locale: 'en',
  messages: {
    en: { welcome: 'Welcome' },
    zh: { welcome: '欢迎' }
  }
}))

engine.use(createThemePlugin({
  defaultTheme: 'light'
}))

// 初始化引擎
await engine.initialize()

// 渲染应用并提供引擎
render(
  () => (
    <EngineProvider engine={engine}>
      <App />
    </EngineProvider>
  ),
  document.getElementById('root')!
)
```

### 2. 在组件中使用

使用 Solid 的响应式 Primitives：

```tsx
import { useEngine, useEnginePlugin } from '@ldesign/engine-solid'

function App() {
  // 获取引擎实例
  const engine = useEngine()
  
  // 获取特定插件
  const i18nPlugin = useEnginePlugin('i18n')
  
  // 使用插件 API
  const switchLanguage = () => {
    i18nPlugin()?.api.setLocale('zh')
  }
  
  return (
    <div>
      <h1>{engine().config.get('name')}</h1>
      <button onClick={switchLanguage}>切换语言</button>
    </div>
  )
}
```

## Signals 和 Primitives

Solid.js 适配器使用 Signals 提供响应式支持：

### useEngine

获取引擎实例的 Signal：

```tsx
import { useEngine } from '@ldesign/engine-solid'

function Component() {
  const engine = useEngine()
  
  // 访问引擎 API (engine 是一个 Accessor)
  const appName = () => engine().config.get('name')
  
  const handleAction = () => {
    engine().logger.info('Button clicked')
    engine().events.emit('action:click')
  }
  
  return (
    <div>
      <h1>{appName()}</h1>
      <button onClick={handleAction}>Action</button>
    </div>
  )
}
```

### useEnginePlugin

获取特定插件的 Signal：

```tsx
import { useEnginePlugin } from '@ldesign/engine-solid'

function LanguageSwitcher() {
  const i18nPlugin = useEnginePlugin('i18n')
  const themePlugin = useEnginePlugin('theme')
  
  const changeTheme = () => {
    themePlugin()?.api.setTheme('dark')
  }
  
  const changeLanguage = () => {
    i18nPlugin()?.api.setLocale('zh')
  }
  
  return (
    <div>
      <Show when={i18nPlugin() && themePlugin()} fallback={<div>Loading...</div>}>
        <button onClick={changeTheme}>Change Theme</button>
        <button onClick={changeLanguage}>Change Language</button>
      </Show>
    </div>
  )
}
```

### useEngineState

响应式状态管理：

```tsx
import { createSignal, createEffect } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function UserProfile() {
  const engine = useEngine()
  const [user, setUser] = createSignal({ name: '', email: '' })
  
  // 从引擎状态初始化
  createEffect(() => {
    const savedUser = engine().state.getState('user', { name: '', email: '' })
    setUser(savedUser)
  })
  
  // 监听状态变化
  createEffect(() => {
    const unwatch = engine().state.watch('user', (newUser) => {
      setUser(newUser)
    })
    
    return unwatch
  })
  
  const updateUser = () => {
    const newUser = { name: 'John', email: 'john@example.com' }
    engine().state.setState('user', newUser)
  }
  
  return (
    <div>
      <p>Name: {user().name}</p>
      <p>Email: {user().email}</p>
      <button onClick={updateUser}>Update</button>
    </div>
  )
}
```

### useEngineConfig

访问配置：

```tsx
import { useEngineConfig } from '@ldesign/engine-solid'

function AppHeader() {
  const appName = useEngineConfig('name', 'My App')
  const debug = useEngineConfig('debug', false)
  
  return (
    <header>
      <h1>{appName()}</h1>
      <Show when={debug()}>
        <span>Debug Mode</span>
      </Show>
    </header>
  )
}
```

### useEngineEvent

监听事件：

```tsx
import { createSignal, onCleanup } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function NotificationList() {
  const engine = useEngine()
  const [notifications, setNotifications] = createSignal<string[]>([])
  
  // 监听事件
  const unsubscribe = engine().events.on('notification:show', (data) => {
    setNotifications(prev => [...prev, data.message])
  })
  
  onCleanup(() => {
    unsubscribe()
  })
  
  return (
    <ul>
      <For each={notifications()}>
        {(msg) => <li>{msg}</li>}
      </For>
    </ul>
  )
}
```

## 高级用法

### 自定义 Hooks

创建自定义 Hook 封装引擎功能：

```tsx
import { createSignal, createEffect } from 'solid-js'
import { useEnginePlugin } from '@ldesign/engine-solid'

// 自定义 i18n Hook
function useTranslation() {
  const i18nPlugin = useEnginePlugin('i18n')
  const [locale, setLocale] = createSignal('en')
  
  createEffect(() => {
    const plugin = i18nPlugin()
    if (plugin?.api) {
      setLocale(plugin.api.getLocale())
    }
  })
  
  const t = (key: string) => {
    const plugin = i18nPlugin()
    return plugin?.api.t(key) || key
  }
  
  const changeLocale = (newLocale: string) => {
    i18nPlugin()?.api.setLocale(newLocale)
  }
  
  return { t, locale, changeLocale }
}

// 使用自定义 Hook
function MyComponent() {
  const { t, locale, changeLocale } = useTranslation()
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => changeLocale('zh')}>
        {locale() === 'en' ? '中文' : 'English'}
      </button>
    </div>
  )
}
```

### 与 Solid Router 集成

```tsx
// App.tsx
import { Router, Route } from '@solidjs/router'
import { useEngine } from '@ldesign/engine-solid'
import { createEffect } from 'solid-js'

function AppWithRouter() {
  const engine = useEngine()
  
  // 监听路由事件
  createEffect(() => {
    const unsubscribe = engine().events.on('route:change', (data) => {
      engine().logger.info('Route changed', data)
    })
    
    return unsubscribe
  })
  
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
    </Router>
  )
}
```

### 响应式主题

```tsx
import { createSignal, createEffect } from 'solid-js'
import { useEnginePlugin } from '@ldesign/engine-solid'

function ThemeProvider(props) {
  const themePlugin = useEnginePlugin('theme')
  const [currentTheme, setCurrentTheme] = createSignal('light')
  
  createEffect(() => {
    const plugin = themePlugin()
    if (plugin?.api) {
      setCurrentTheme(plugin.api.getTheme())
      applyTheme()
    }
  })
  
  const applyTheme = () => {
    const plugin = themePlugin()
    if (!plugin?.api) return
    
    const theme = plugin.api.getCurrentTheme()
    document.documentElement.style.setProperty(
      '--primary',
      theme.colors.primary
    )
    document.documentElement.style.setProperty(
      '--background',
      theme.colors.background
    )
  }
  
  const toggleTheme = () => {
    const newTheme = currentTheme() === 'light' ? 'dark' : 'light'
    themePlugin()?.api.setTheme(newTheme)
  }
  
  return (
    <div class={`theme-${currentTheme()}`}>
      {props.children}
      <button onClick={toggleTheme}>
        Toggle Theme ({currentTheme()})
      </button>
    </div>
  )
}
```

## 完整示例

### 多语言应用

```tsx
import { createSignal, createEffect } from 'solid-js'
import { useEnginePlugin } from '@ldesign/engine-solid'

function App() {
  const i18nPlugin = useEnginePlugin('i18n')
  const [locale, setLocale] = createSignal('en')
  const [translations, setTranslations] = createSignal({})
  
  createEffect(() => {
    const plugin = i18nPlugin()
    if (plugin?.api) {
      setLocale(plugin.api.getLocale())
      setTranslations(plugin.api.messages[plugin.api.getLocale()])
    }
  })
  
  const switchLanguage = () => {
    const newLocale = locale() === 'en' ? 'zh' : 'en'
    i18nPlugin()?.api.setLocale(newLocale)
  }
  
  const t = (key: string) => {
    const keys = key.split('.')
    let value = translations()
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }
  
  return (
    <div class="app">
      <header>
        <h1>{t('app.title')}</h1>
        <button onClick={switchLanguage}>
          {locale() === 'en' ? '中文' : 'English'}
        </button>
      </header>
      <main>
        <p>{t('app.welcome')}</p>
      </main>
    </div>
  )
}
```

### 状态管理示例

```tsx
import { createSignal, For } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function TodoList() {
  const engine = useEngine()
  const [todos, setTodos] = createSignal([])
  const [newTodo, setNewTodo] = createSignal('')
  
  // 从引擎状态初始化
  const savedTodos = engine().state.getState('todos', [])
  setTodos(savedTodos)
  
  const addTodo = () => {
    if (newTodo().trim()) {
      const updated = [...todos(), {
        id: Date.now(),
        text: newTodo(),
        completed: false
      }]
      setTodos(updated)
      engine().state.setState('todos', updated)
      setNewTodo('')
    }
  }
  
  const toggleTodo = (id: number) => {
    const updated = todos().map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
    setTodos(updated)
    engine().state.setState('todos', updated)
  }
  
  const removeTodo = (id: number) => {
    const updated = todos().filter(todo => todo.id !== id)
    setTodos(updated)
    engine().state.setState('todos', updated)
  }
  
  return (
    <div>
      <input
        value={newTodo()}
        onInput={(e) => setNewTodo(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        placeholder="Add todo..."
      />
      <button onClick={addTodo}>Add</button>
      
      <ul>
        <For each={todos()}>
          {(todo) => (
            <li classList={{ completed: todo.completed }}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span>{todo.text}</span>
              <button onClick={() => removeTodo(todo.id)}>Delete</button>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
```

### 事件系统示例

```tsx
import { createSignal, onCleanup } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function EventLog() {
  const engine = useEngine()
  const [eventLog, setEventLog] = createSignal([])
  
  // 监听所有事件
  const unsubscribe = engine().events.on('*', (event) => {
    setEventLog(prev => [
      { type: event.type, payload: event.payload },
      ...prev.slice(0, 9)
    ])
  })
  
  onCleanup(() => {
    unsubscribe()
  })
  
  const triggerEvent = () => {
    engine().events.emit('custom:event', {
      timestamp: Date.now(),
      message: 'Custom event triggered'
    })
  }
  
  return (
    <div>
      <button onClick={triggerEvent}>Trigger Event</button>
      
      <div class="event-log">
        <For each={eventLog()}>
          {(event) => (
            <div class="event-item">
              <strong>{event.type}</strong>
              <pre>{JSON.stringify(event.payload, null, 2)}</pre>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
```

## TypeScript 支持

### 类型定义

```typescript
// types/engine.d.ts
import type { CoreEngine } from '@ldesign/engine-core'

declare global {
  interface Window {
    __ENGINE__: CoreEngine
  }
}
```

### 插件类型

```typescript
import type { Plugin } from '@ldesign/engine-core'
import type { Accessor } from 'solid-js'

interface MyPluginAPI {
  doSomething(): void
  getValue(): string
}

interface MyPlugin extends Plugin {
  api: MyPluginAPI
}

// 使用时的类型
const myPlugin: Accessor<MyPlugin | undefined> = useEnginePlugin('my-plugin')
```

## 性能优化

### 1. createMemo 缓存计算

```tsx
import { createMemo } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function Component() {
  const engine = useEngine()
  
  // 缓存计算结果
  const config = createMemo(() => engine().config.getAll())
  
  return <div>{JSON.stringify(config())}</div>
}
```

### 2. 批量更新

```tsx
import { batch } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function Component() {
  const engine = useEngine()
  
  const updateMultiple = () => {
    batch(() => {
      engine().state.setState('user.name', 'John')
      engine().state.setState('user.email', 'john@example.com')
      engine().state.setState('user.age', 30)
    })
  }
  
  return <button onClick={updateMultiple}>Update</button>
}
```

### 3. 懒加载插件

```tsx
import { createSignal, Show } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function FeatureToggle() {
  const engine = useEngine()
  const [featureEnabled, setFeatureEnabled] = createSignal(false)
  
  const enableFeature = async () => {
    const { createFeaturePlugin } = await import('@my/feature-plugin')
    await engine().use(createFeaturePlugin())
    setFeatureEnabled(true)
  }
  
  return (
    <div>
      <Show
        when={featureEnabled()}
        fallback={<button onClick={enableFeature}>Enable Feature</button>}
      >
        <FeatureComponent />
      </Show>
    </div>
  )
}
```

### 4. 条件渲染优化

```tsx
import { Show } from 'solid-js'
import { useEnginePlugin } from '@ldesign/engine-solid'

function OptimizedComponent(props) {
  const advancedPlugin = useEnginePlugin('advanced')
  
  return (
    <div>
      <Show when={props.showAdvanced && advancedPlugin()}>
        {(plugin) => (
          <div>
            Advanced: {plugin().api.getValue()}
          </div>
        )}
      </Show>
    </div>
  )
}
```

## 常见问题

### Q: 如何在组件外使用引擎？

A: 创建时导出引擎实例：

```typescript
// engine.ts
export const engine = createEngine({ /* ... */ })

// anywhere.ts
import { engine } from './engine'
engine.logger.info('Message')
```

### Q: 如何处理异步插件？

A: 在渲染前等待初始化：

```typescript
const engine = createEngine({ /* ... */ })
engine.use(createAsyncPlugin())

await engine.initialize()

render(() => <App />, root)
```

### Q: 如何在 SolidStart 中使用？

A: 为每个请求创建新的引擎实例：

```typescript
// entry-server.tsx
export default createHandler(
  renderAsync((event) => {
    const engine = createEngine({ /* ... */ })
    await engine.initialize()
    
    return (
      <EngineProvider engine={engine}>
        <App />
      </EngineProvider>
    )
  })
)
```

### Q: Solid 的 Signal 与引擎状态如何同步？

A: 使用 `createEffect` 监听引擎状态变化并更新 Signal：

```tsx
const [state, setState] = createSignal(engine().state.getState('key'))

createEffect(() => {
  return engine().state.watch('key', (newValue) => {
    setState(newValue)
  })
})
```

## 最佳实践

1. **使用 EngineProvider** - 在应用顶层提供引擎
2. **Signals 优先** - 使用 Solid 的响应式系统
3. **createMemo 优化** - 缓存昂贵的计算
4. **batch 批量更新** - 减少不必要的重渲染
5. **类型安全** - 充分利用 TypeScript

## 下一步

- [查看完整示例](/examples/solid)
- [学习插件开发](/guide/plugin-development)
- [了解核心概念](/guide/core-concepts)
- [Solid.js 文档](https://www.solidjs.com/docs/latest)

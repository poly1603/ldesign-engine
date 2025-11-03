# React 集成指南

完整的 @ldesign/engine 与 React 集成指南。

## 安装

```bash
pnpm add @ldesign/engine-core @ldesign/engine-react
```

## 基础集成

### 1. 创建引擎实例

在应用入口创建引擎实例：

```typescript
// main.tsx
import ReactDOM from 'react-dom/client'
import { createEngine } from '@ldesign/engine-core'
import { EngineProvider } from '@ldesign/engine-react'
import { createI18nPlugin } from '@ldesign/engine-core/plugins/i18n'
import { createThemePlugin } from '@ldesign/engine-core/plugins/theme'
import App from './App'

// 创建引擎
const engine = createEngine({
  name: 'my-react-app',
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

// 创建 React 应用并提供引擎
ReactDOM.createRoot(document.getElementById('root')!).render(
  <EngineProvider engine={engine}>
    <App />
  </EngineProvider>
)
```

### 2. 在组件中使用

使用 Hooks：

```tsx
import { useEngine, useEnginePlugin } from '@ldesign/engine-react'

function App() {
  // 获取引擎实例
  const engine = useEngine()
  
  // 获取特定插件
  const i18nPlugin = useEnginePlugin('i18n')
  
  // 使用插件 API
  const switchLanguage = () => {
    i18nPlugin?.api.setLocale('zh')
  }
  
  return (
    <div>
      <h1>{engine.config.get('name')}</h1>
      <button onClick={switchLanguage}>切换语言</button>
    </div>
  )
}
```

## Hooks

React 适配器提供了一系列 Hooks：

### useEngine

获取引擎实例：

```tsx
import { useEngine } from '@ldesign/engine-react'

function Component() {
  const engine = useEngine()
  
  // 访问引擎 API
  const appName = engine.config.get('name')
  
  const handleAction = () => {
    engine.logger.info('Button clicked')
    engine.events.emit('action:click', { component: 'Button' })
  }
  
  return (
    <div>
      <h1>{appName}</h1>
      <button onClick={handleAction}>Action</button>
    </div>
  )
}
```

### useEnginePlugin

获取特定插件：

```tsx
import { useEnginePlugin } from '@ldesign/engine-react'

function LanguageSwitcher() {
  const i18nPlugin = useEnginePlugin('i18n')
  const themePlugin = useEnginePlugin('theme')
  
  if (!i18nPlugin || !themePlugin) {
    return <div>Loading...</div>
  }
  
  const changeTheme = () => {
    themePlugin.api.setTheme('dark')
  }
  
  return <button onClick={changeTheme}>Change Theme</button>
}
```

### useEngineState

响应式状态管理：

```tsx
import { useState, useEffect } from 'react'
import { useEngine } from '@ldesign/engine-react'

function UserProfile() {
  const engine = useEngine()
  const [user, setUser] = useState(() => 
    engine.state.getState('user', { name: '', email: '' })
  )
  
  useEffect(() => {
    // 监听状态变化
    return engine.state.watch('user', (newUser) => {
      setUser(newUser)
    })
  }, [engine])
  
  const updateUser = () => {
    engine.state.setState('user', {
      name: 'John',
      email: 'john@example.com'
    })
  }
  
  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <button onClick={updateUser}>Update</button>
    </div>
  )
}
```

### useEngineConfig

访问配置：

```tsx
import { useEngineConfig } from '@ldesign/engine-react'

function AppHeader() {
  const appName = useEngineConfig('name', 'My App')
  const debug = useEngineConfig('debug', false)
  
  return (
    <header>
      <h1>{appName}</h1>
      {debug && <span>Debug Mode</span>}
    </header>
  )
}
```

### useEngineEvent

监听事件：

```tsx
import { useState, useCallback } from 'react'
import { useEngineEvent } from '@ldesign/engine-react'

function NotificationList() {
  const [notifications, setNotifications] = useState<string[]>([])
  
  // 监听单个事件
  useEngineEvent('notification:show', (data) => {
    setNotifications(prev => [...prev, data.message])
  })
  
  // 监听多个事件
  useEngineEvent(['user:login', 'user:logout'], (event) => {
    console.log('User event:', event.type, event.payload)
  })
  
  return (
    <ul>
      {notifications.map((msg, i) => (
        <li key={i}>{msg}</li>
      ))}
    </ul>
  )
}
```

### useEngineLogger

使用日志系统：

```tsx
import { useEngineLogger } from '@ldesign/engine-react'

function DataTable() {
  const logger = useEngineLogger()
  
  const handleRowClick = (row: any) => {
    logger.info('Row clicked', { rowId: row.id })
  }
  
  const handleError = (error: Error) => {
    logger.error('Table error', error)
  }
  
  return <div>{/* table content */}</div>
}
```

## 高级用法

### 自定义 Hook

创建自定义 Hook 封装引擎功能：

```tsx
import { useState, useEffect } from 'react'
import { useEnginePlugin } from '@ldesign/engine-react'

// 自定义 i18n Hook
function useTranslation() {
  const i18nPlugin = useEnginePlugin('i18n')
  const [locale, setLocale] = useState('en')
  
  useEffect(() => {
    if (i18nPlugin?.api) {
      setLocale(i18nPlugin.api.getLocale())
    }
  }, [i18nPlugin])
  
  const t = (key: string) => {
    return i18nPlugin?.api.t(key) || key
  }
  
  const changeLocale = (newLocale: string) => {
    i18nPlugin?.api.setLocale(newLocale)
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
        {locale === 'en' ? '中文' : 'English'}
      </button>
    </div>
  )
}
```

### 与 React Router 集成

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEngine } from '@ldesign/engine-react'

function RouterLogger() {
  const engine = useEngine()
  const navigate = useNavigate()
  
  useEffect(() => {
    // 监听路由事件并记录
    return engine.events.on('route:change', (data) => {
      engine.logger.info('Route changed', data)
      navigate(data.path)
    })
  }, [engine, navigate])
  
  return null
}

function App() {
  return (
    <BrowserRouter>
      <RouterLogger />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 与 Redux 集成

```tsx
// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import type { CoreEngine } from '@ldesign/engine-core'

export function createStore(engine: CoreEngine) {
  const store = configureStore({
    reducer: {
      // reducers
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        // 添加引擎中间件
        () => (next) => (action) => {
          engine.logger.info('Redux action', action)
          return next(action)
        }
      )
  })
  
  return store
}
```

```tsx
// App.tsx
import { Provider } from 'react-redux'
import { useEngine } from '@ldesign/engine-react'

function App() {
  const engine = useEngine()
  const store = useMemo(() => createStore(engine), [engine])
  
  return (
    <Provider store={store}>
      {/* app content */}
    </Provider>
  )
}
```

## 完整示例

### 多语言应用

```tsx
import { useState, useEffect } from 'react'
import { useEnginePlugin } from '@ldesign/engine-react'

function App() {
  const i18nPlugin = useEnginePlugin('i18n')
  const [locale, setLocale] = useState('en')
  
  useEffect(() => {
    if (i18nPlugin?.api) {
      setLocale(i18nPlugin.api.getLocale())
    }
  }, [i18nPlugin])
  
  const switchLanguage = () => {
    const newLocale = locale === 'en' ? 'zh' : 'en'
    i18nPlugin?.api.setLocale(newLocale)
  }
  
  const t = (key: string) => {
    return i18nPlugin?.api.t(key) || key
  }
  
  return (
    <div className="app">
      <header>
        <h1>{t('app.title')}</h1>
        <button onClick={switchLanguage}>
          {locale === 'en' ? '中文' : 'English'}
        </button>
      </header>
      <main>
        <p>{t('app.welcome')}</p>
      </main>
    </div>
  )
}
```

### 主题切换

```tsx
import { useState, useEffect } from 'react'
import { useEnginePlugin } from '@ldesign/engine-react'

function ThemeToggle() {
  const themePlugin = useEnginePlugin('theme')
  const [currentTheme, setCurrentTheme] = useState('light')
  
  useEffect(() => {
    if (themePlugin?.api) {
      setCurrentTheme(themePlugin.api.getTheme())
      applyTheme()
    }
  }, [themePlugin, currentTheme])
  
  const applyTheme = () => {
    const theme = themePlugin?.api.getCurrentTheme()
    if (theme) {
      document.documentElement.style.setProperty(
        '--primary',
        theme.colors.primary
      )
      document.documentElement.style.setProperty(
        '--background',
        theme.colors.background
      )
    }
  }
  
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    themePlugin?.api.setTheme(newTheme)
  }
  
  return (
    <div className={`theme-${currentTheme}`}>
      <button onClick={toggleTheme}>
        Toggle Theme ({currentTheme})
      </button>
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

interface MyPluginAPI {
  doSomething(): void
  getValue(): string
}

interface MyPlugin extends Plugin {
  api: MyPluginAPI
}

// 使用时的类型断言
const myPlugin = useEnginePlugin('my-plugin') as MyPlugin | undefined
```

### Props 类型

```typescript
interface AppProps {
  engine: CoreEngine
}

function App({ engine }: AppProps) {
  return <div>{engine.config.get('name')}</div>
}
```

## 性能优化

### 1. useMemo 缓存计算

```tsx
import { useMemo } from 'react'

function Component() {
  const engine = useEngine()
  
  // 缓存插件引用
  const i18nPlugin = useMemo(
    () => engine.plugins.get('i18n'),
    [engine]
  )
  
  return <div>{/* content */}</div>
}
```

### 2. useCallback 缓存函数

```tsx
import { useCallback } from 'react'

function Component() {
  const engine = useEngine()
  
  // 缓存事件处理函数
  const handleClick = useCallback(() => {
    engine.events.emit('button:click')
  }, [engine])
  
  return <button onClick={handleClick}>Click</button>
}
```

### 3. React.memo 防止重渲染

```tsx
import { memo } from 'react'

const ExpensiveComponent = memo(function ExpensiveComponent({
  data
}: {
  data: any
}) {
  const engine = useEngine()
  // 复杂渲染逻辑
  return <div>{/* content */}</div>
})
```

### 4. 懒加载插件

```tsx
import { lazy, Suspense } from 'react'

const FeatureWithPlugin = lazy(() => 
  import('./Feature').then(async (module) => {
    const { createFeaturePlugin } = await import('@my/feature-plugin')
    const engine = getEngine()
    await engine.use(createFeaturePlugin())
    return module
  })
)

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FeatureWithPlugin />
    </Suspense>
  )
}
```

## 常见问题

### Q: 如何在 Hook 外使用引擎？

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

// 然后渲染
ReactDOM.createRoot(root).render(<App />)
```

### Q: 如何在 SSR 中使用？

A: 为每个请求创建新实例：

```tsx
// server.tsx
export async function render(url: string) {
  const engine = createEngine({ /* ... */ })
  await engine.initialize()
  
  const html = ReactDOMServer.renderToString(
    <EngineProvider engine={engine}>
      <App />
    </EngineProvider>
  )
  
  return html
}
```

### Q: 如何测试使用引擎的组件？

A: 使用测试工具提供 mock 引擎：

```tsx
import { render } from '@testing-library/react'
import { EngineProvider } from '@ldesign/engine-react'

function renderWithEngine(ui: React.ReactElement) {
  const mockEngine = createEngine({ /* test config */ })
  
  return render(
    <EngineProvider engine={mockEngine}>
      {ui}
    </EngineProvider>
  )
}

test('component works', () => {
  const { getByText } = renderWithEngine(<MyComponent />)
  expect(getByText('Welcome')).toBeInTheDocument()
})
```

## 最佳实践

1. **使用 EngineProvider** - 始终在应用顶层提供引擎
2. **使用 Hooks** - 优先使用提供的 Hooks 而不是直接访问
3. **性能优化** - 使用 useMemo、useCallback 优化性能
4. **类型安全** - 充分利用 TypeScript 类型系统
5. **错误边界** - 使用 Error Boundary 捕获引擎相关错误

## 下一步

- [查看完整示例](/examples/react)
- [学习插件开发](/guide/plugin-development)
- [了解核心概念](/guide/core-concepts)
- [API 参考](/api/react/hooks)

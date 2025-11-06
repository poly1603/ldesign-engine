# @ldesign/engine-react

React 适配器包,为 React 应用提供核心引擎集成。

## 📦 安装

```bash
pnpm add @ldesign/engine-react
```

## ✨ 特性

- ✅ **统一 API** - 与其他框架适配器保持一致的 API
- ✅ **React Hooks** - 提供完整的 hooks 支持
- ✅ **TypeScript** - 完整的类型支持
- ✅ **插件系统** - 可复用的功能扩展
- ✅ **中间件系统** - 请求/响应处理链
- ✅ **生命周期管理** - 统一的生命周期钩子
- ✅ **事件系统** - 发布/订阅模式
- ✅ **状态管理** - 全局状态管理

## 🚀 快速开始

### 基础使用

```typescript
import { createEngineApp } from '@ldesign/engine-react'
import App from './App'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My React App',
    debug: true,
  },
})
```

### 使用插件

```typescript
import { createEngineApp, definePlugin } from '@ldesign/engine-react'
import App from './App'

// 定义插件
const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    context.engine.state.set('count', 0)
  }
})

// 创建应用
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  plugins: [myPlugin],
})
```

### 在组件中使用 Hooks

```tsx
import { useEngine, useEngineState, useEvent } from '@ldesign/engine-react'

function Counter() {
  const engine = useEngine()
  const count = useEngineState<number>('count', 0)

  const increment = () => {
    engine.state.set('count', count + 1)
  }

  useEvent('reset', () => {
    engine.state.set('count', 0)
  })

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  )
}
```

## 📚 API 文档

### createEngineApp(options)

创建 React 引擎应用。

**参数:**
- `rootComponent` - React 根组件
- `mountElement` - 挂载元素选择器或 DOM 元素
- `config` - 引擎配置
- `plugins` - 插件列表
- `middleware` - 中间件列表
- `rootProps` - 根组件属性
- `onReady` - 准备就绪回调
- `onMounted` - 挂载完成回调
- `onError` - 错误处理回调

**返回:** `Promise<ReactEngineApp>`

### Hooks

#### useEngine()

获取引擎实例。

```tsx
const engine = useEngine()
```

#### useEngineState(key, defaultValue)

获取并监听引擎状态。

```tsx
const count = useEngineState<number>('count', 0)
```

#### useEvent(event, handler)

监听引擎事件。

```tsx
useEvent('user:login', (user) => {
  console.log('User logged in:', user)
})
```

#### usePlugin(name)

获取插件实例。

```tsx
const i18nPlugin = usePlugin('i18n')
```

#### useLifecycle(hook, handler)

注册生命周期钩子。

```tsx
useLifecycle('mounted', () => {
  console.log('Component mounted')
})
```

#### useMiddleware()

获取中间件执行函数。

```tsx
const executeMiddleware = useMiddleware()

await executeMiddleware({
  data: { action: 'click' },
  cancelled: false
})
```

### EngineProvider

引擎上下文提供者组件。

```tsx
import { EngineProvider } from '@ldesign/engine-react'
import { createCoreEngine } from '@ldesign/engine-core'

const engine = createCoreEngine()
await engine.init()

function App() {
  return (
    <EngineProvider engine={engine}>
      <YourApp />
    </EngineProvider>
  )
}
```

## 🏗️ 架构设计

```
@ldesign/engine-react
├── adapter.ts        - React 框架适配器
├── engine-app.ts     - 引擎应用创建函数
├── hooks.ts          - React hooks
└── index.ts          - 入口文件
```

## 📝 示例

查看完整示例: [examples/react](../../examples/react)

## 🔗 相关链接

- [核心引擎文档](../core/README.md)
- [通用引擎架构](../../UNIVERSAL_ENGINE_ARCHITECTURE.md)
- [快速参考](../../QUICK_REFERENCE.md)

## 📄 License

MIT


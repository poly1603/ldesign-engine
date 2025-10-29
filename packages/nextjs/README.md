# @ldesign/engine-nextjs

Next.js adapter for LDesign Engine - 支持 App Router 和 Server Components 的全栈 React 框架适配器。

## 特性

- ✅ **App Router**: 完整支持 Next.js 14/15 App Router
- ✅ **Server Components**: 服务端组件支持
- ✅ **Server Actions**: 服务端动作集成
- ✅ **SSR/ISR/SSG**: 多种渲染模式
- ✅ **状态序列化**: 自动状态水合
- ✅ **TypeScript**: 完整类型定义

## 安装

```bash
pnpm add @ldesign/engine-nextjs @ldesign/engine-core next react
```

## 快速开始

### 客户端组件

```tsx
'use client'
import { useEngineState } from '@ldesign/engine-nextjs'

export default function Counter() {
  const [count, setCount] = useEngineState('counter', 0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### 服务端组件

```tsx
import { createServerEngine, serializeEngineState } from '@ldesign/engine-nextjs/server'

export default async function Page() {
  const engine = createServerEngine()
  await engine.state.set('user', { name: 'John' })
  
  const serializedState = serializeEngineState(engine)
  
  return (
    <div>
      <script dangerouslySetInnerHTML={{ __html: `window.__ENGINE_STATE__=${serializedState}` }} />
      <ClientComponent />
    </div>
  )
}
```

### Server Actions

```tsx
'use server'
import { updateStateAction, emitEventAction } from '@ldesign/engine-nextjs/server'

export async function updateUser(formData: FormData) {
  const name = formData.get('name')
  await updateStateAction('user.name', name)
  await emitEventAction('user:updated', { name })
}
```

## API

### 客户端 Hooks

- `useEngine()` - 获取引擎实例
- `useEngineState(path, defaultValue)` - 响应式状态
- `useEngineEvent(event, handler)` - 事件监听
- `useEngineCache(key, defaultValue)` - 缓存管理
- `useEngineComputed(deps, fn)` - 计算属性
- `useEngineAction(fn)` - 动作封装
- `useEnginePlugin(name)` - 插件访问

### 服务端工具

- `createServerEngine()` - 创建服务端引擎
- `serializeEngineState(engine)` - 序列化状态
- `updateStateAction(path, value)` - 更新状态
- `emitEventAction(event, data)` - 触发事件

## 配置

```typescript
import { createEngine } from '@ldesign/engine-core'
import { createNextJSAdapter } from '@ldesign/engine-nextjs'

const engine = createEngine({
  adapter: createNextJSAdapter({
    debug: true,
    enableSSR: true,
    enableServerComponents: true,
    enableServerActions: true
  })
})
```

## 最佳实践

### 1. 状态水合

```tsx
// app/layout.tsx
import { HydrationBoundary } from '@ldesign/engine-nextjs'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <HydrationBoundary>
          {children}
        </HydrationBoundary>
      </body>
    </html>
  )
}
```

### 2. 路由缓存

```tsx
// app/page.tsx
export const revalidate = 60 // ISR: 60秒

export default async function Page() {
  const engine = createServerEngine()
  // ...
}
```

### 3. 流式渲染

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AsyncComponent />
    </Suspense>
  )
}
```

## License

MIT © LDesign Team


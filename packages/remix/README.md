# @ldesign/engine-remix

Remix adapter for LDesign Engine - 全栈 React 框架适配器,支持 Loader/Action 模式。

## 特性

- ✅ **Loader/Action**: 完整支持 Remix 数据加载模式
- ✅ **Progressive Enhancement**: 渐进增强
- ✅ **SSR**: 服务端渲染
- ✅ **Nested Routes**: 嵌套路由支持
- ✅ **TypeScript**: 完整类型定义

## 安装

```bash
pnpm add @ldesign/engine-remix @ldesign/engine-core @remix-run/react react
```

## 快速开始

```tsx
import { useEngineState } from '@ldesign/engine-remix'

export default function Counter() {
  const [count, setCount] = useEngineState('counter', 0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

## API

### useEngine()

```tsx
import { useEngine } from '@ldesign/engine-remix'

export default function Component() {
  const engine = useEngine()
  return <div>Engine: {engine.name}</div>
}
```

### useEngineState()

```tsx
import { useEngineState } from '@ldesign/engine-remix'

export default function UserProfile() {
  const [user, setUser] = useEngineState('user', { name: '' })
  
  return <div>{user.name}</div>
}
```

### useEngineEvent()

```tsx
import { useEngineEvent } from '@ldesign/engine-remix'

export default function Notifications() {
  useEngineEvent('notification', (data) => {
    console.log('Notification:', data)
  })
  
  return <div>Listening...</div>
}
```

## 与 Remix Loader/Action 集成

```tsx
// app/routes/user.tsx
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { useEngineState } from '@ldesign/engine-remix'

export async function loader({ params }: LoaderFunctionArgs) {
  const user = await fetchUser(params.id)
  return json({ user })
}

export default function UserRoute() {
  const { user } = useLoaderData<typeof loader>()
  const [localUser, setLocalUser] = useEngineState('user', user)
  
  return <div>{localUser.name}</div>
}
```

## 配置

```typescript
import { createEngine } from '@ldesign/engine-core'
import { createRemixAdapter } from '@ldesign/engine-remix'

const engine = createEngine({
  adapter: createRemixAdapter({
    debug: true,
    enableSSR: true
  })
})
```

## License

MIT © LDesign Team


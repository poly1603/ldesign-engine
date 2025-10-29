# @ldesign/engine-nuxtjs

Nuxt.js adapter for LDesign Engine - Vue 3 全栈框架适配器,支持 Nuxt 3 和 SSR。

## 特性

- ✅ **Nuxt 3**: 完整支持 Nuxt 3
- ✅ **Composables**: Vue 3 组合式 API
- ✅ **Auto-imports**: 自动导入支持
- ✅ **SSR**: 服务端渲染
- ✅ **Nitro**: Nitro 引擎集成
- ✅ **TypeScript**: 完整类型定义

## 安装

```bash
pnpm add @ldesign/engine-nuxtjs @ldesign/engine-core nuxt vue
```

## 快速开始

```vue
<script setup>
import { useEngineState } from '@ldesign/engine-nuxtjs'

const [count, setCount] = useEngineState('counter', 0)
</script>

<template>
  <button @click="setCount(count + 1)">
    Count: {{ count }}
  </button>
</template>
```

## Composables API

### useEngine()

```vue
<script setup>
import { useEngine } from '@ldesign/engine-nuxtjs'

const engine = useEngine()
</script>
```

### useEngineState()

```vue
<script setup>
import { useEngineState } from '@ldesign/engine-nuxtjs'

const [user, setUser] = useEngineState('user', { name: '' })
</script>

<template>
  <div>{{ user.name }}</div>
</template>
```

### useEngineEvent()

```vue
<script setup>
import { useEngineEvent } from '@ldesign/engine-nuxtjs'

useEngineEvent('notification', (data) => {
  console.log('Notification:', data)
})
</script>
```

### useEngineCache()

```vue
<script setup>
import { useEngineCache } from '@ldesign/engine-nuxtjs'

const [cachedData, setCachedData] = useEngineCache('api:users')
</script>
```

### useEngineComputed()

```vue
<script setup>
import { useEngineComputed } from '@ldesign/engine-nuxtjs'

const total = useEngineComputed(
  ['cart.items'],
  (items) => items.reduce((sum, item) => sum + item.price, 0)
)
</script>

<template>
  <div>Total: ${{ total }}</div>
</template>
```

### useEnginePlugin()

```vue
<script setup>
import { useEnginePlugin } from '@ldesign/engine-nuxtjs'

const plugin = useEnginePlugin('my-plugin')
</script>
```

## 服务端工具

```typescript
// server/api/user.ts
import { createServerEngine } from '@ldesign/engine-nuxtjs/server'

export default defineEventHandler(async (event) => {
  const engine = createServerEngine()
  await engine.state.set('user', { name: 'John' })
  
  return {
    state: engine.state.getAll()
  }
})
```

## 配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@ldesign/engine-nuxtjs'],
  
  ldesignEngine: {
    debug: true,
    enableSSR: true,
    autoImports: true
  }
})
```

## 最佳实践

### 1. 使用 Auto-imports

```vue
<script setup>
// 无需导入,自动可用
const [count, setCount] = useEngineState('counter', 0)
</script>
```

### 2. SSR 状态同步

```vue
<script setup>
const [data, setData] = useEngineState('data', null)

// 服务端获取数据
if (process.server) {
  const result = await $fetch('/api/data')
  setData(result)
}
</script>
```

### 3. 使用 Nitro 缓存

```typescript
// server/api/cached.ts
export default defineCachedEventHandler(async (event) => {
  const engine = createServerEngine()
  return engine.cache.get('data')
}, {
  maxAge: 60 * 60 // 1小时
})
```

## License

MIT © LDesign Team


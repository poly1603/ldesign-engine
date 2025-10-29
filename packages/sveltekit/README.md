# @ldesign/engine-sveltekit

SvelteKit adapter for LDesign Engine - Svelte 全栈框架适配器。

## 特性

- ✅ **SvelteKit**: 完整支持 SvelteKit
- ✅ **Stores**: Svelte Stores 集成
- ✅ **Context API**: Svelte Context 支持
- ✅ **SSR**: 服务端渲染
- ✅ **TypeScript**: 完整类型定义

## 安装

```bash
pnpm add @ldesign/engine-sveltekit @ldesign/engine-core @sveltejs/kit svelte
```

## 快速开始

```svelte
<script>
  import { useEngineState } from '@ldesign/engine-sveltekit'
  
  const count = useEngineState('counter', 0)
</script>

<button on:click={() => $count++}>
  Count: {$count}
</button>
```

## API

### getEngine()

```svelte
<script>
  import { getEngine } from '@ldesign/engine-sveltekit'
  
  const engine = getEngine()
</script>
```

### useEngineState()

```svelte
<script>
  import { useEngineState } from '@ldesign/engine-sveltekit'
  
  const user = useEngineState('user', { name: '' })
</script>

<div>{$user.name}</div>
```

### useEngineEvent()

```svelte
<script>
  import { useEngineEvent } from '@ldesign/engine-sveltekit'
  
  useEngineEvent('notification', (data) => {
    console.log('Notification:', data)
  })
</script>
```

## 与 SvelteKit Load 函数集成

```typescript
// +page.ts
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ fetch }) => {
  const user = await fetch('/api/user').then(r => r.json())
  
  return {
    user
  }
}
```

```svelte
<!-- +page.svelte -->
<script>
  import { useEngineState } from '@ldesign/engine-sveltekit'
  import { page } from '$app/stores'
  
  const user = useEngineState('user', $page.data.user)
</script>

<div>{$user.name}</div>
```

## 配置

```typescript
import { createEngine } from '@ldesign/engine-core'
import { createSvelteKitAdapter } from '@ldesign/engine-sveltekit'

const engine = createEngine({
  adapter: createSvelteKitAdapter({
    debug: true,
    enableSSR: true
  })
})
```

## License

MIT © LDesign Team


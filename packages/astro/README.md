# @ldesign/engine-astro

Astro adapter for LDesign Engine - 多框架静态站点生成器适配器。

## 特性

- ✅ **Islands Architecture**: Astro Islands 支持
- ✅ **多框架**: 支持多框架集成
- ✅ **静态生成**: 优化的静态站点生成
- ✅ **部分水合**: 按需水合
- ✅ **TypeScript**: 完整类型定义

## 安装

```bash
pnpm add @ldesign/engine-astro @ldesign/engine-core astro
```

## 快速开始

```astro
---
import { createAstroAdapter } from '@ldesign/engine-astro'
import { createEngine } from '@ldesign/engine-core'

const engine = createEngine({
  adapter: createAstroAdapter({ enableIslands: true })
})

await engine.init()
---

<div>
  <h1>Astro + LDesign Engine</h1>
</div>
```

## 与其他框架集成

### React

```astro
---
import ReactCounter from '../components/ReactCounter.jsx'
---

<ReactCounter client:load />
```

### Vue

```astro
---
import VueCounter from '../components/VueCounter.vue'
---

<VueCounter client:visible />
```

### Svelte

```astro
---
import SvelteCounter from '../components/SvelteCounter.svelte'
---

<SvelteCounter client:idle />
```

## 配置

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config'
import ldesignEngine from '@ldesign/engine-astro/integration'

export default defineConfig({
  integrations: [
    ldesignEngine({
      debug: true,
      enableIslands: true
    })
  ]
})
```

## Islands 模式

```astro
---
// 服务端渲染
const data = await fetch('/api/data').then(r => r.json())
---

<!-- 静态内容 -->
<div>{data.title}</div>

<!-- 交互式 Island -->
<InteractiveComponent client:load data={data} />
```

## License

MIT © LDesign Team


# 快速开始指南

本指南将帮助你快速在任何前端框架中使用 @ldesign/engine。

## 📦 安装

### React
```bash
pnpm add @ldesign/engine-core @ldesign/engine-react
```

### Vue
```bash
pnpm add @ldesign/engine-core @ldesign/engine-vue
```

### Svelte
```bash
pnpm add @ldesign/engine-core @ldesign/engine-svelte
```

### Angular
```bash
pnpm add @ldesign/engine-core @ldesign/engine-angular rxjs
```

### Solid.js
```bash
pnpm add @ldesign/engine-core @ldesign/engine-solid
```

## 🚀 5 分钟快速上手

### React

**1. 创建并初始化引擎** (`main.tsx`)
```tsx
import { createEngine } from '@ldesign/engine-core'
import { EngineProvider } from '@ldesign/engine-react'
import App from './App'

const engine = createEngine({
  name: 'my-app',
  version: '1.0.0'
})

await engine.initialize()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <EngineProvider engine={engine}>
    <App />
  </EngineProvider>
)
```

**2. 使用引擎** (`App.tsx`)
```tsx
import { useEngine, useEngineState } from '@ldesign/engine-react'

function App() {
  const engine = useEngine()
  const [count, setCount] = useEngineState<number>('counter', 0)
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  )
}
```

### Vue

**1. 创建并初始化引擎** (`main.ts`)
```ts
import { createApp } from 'vue'
import { createEngine } from '@ldesign/engine-core'
import { ENGINE_INJECTION_KEY } from '@ldesign/engine-vue'
import App from './App.vue'

const engine = createEngine({
  name: 'my-app',
  version: '1.0.0'
})

await engine.initialize()

const app = createApp(App)
app.provide(ENGINE_INJECTION_KEY, engine)
app.mount('#app')
```

**2. 使用引擎** (`App.vue`)
```vue
<script setup>
import { useEngine, useEngineState } from '@ldesign/engine-vue'

const engine = useEngine()
const [count, setCount] = useEngineState<number>('counter', 0)

const increment = () => setCount(count.value + 1)
</script>

<template>
  <div>
    <h1>Count: {{ count }}</h1>
    <button @click="increment">+1</button>
  </div>
</template>
```

### Svelte

**1. 创建并初始化引擎** (`main.ts`)
```ts
import { createEngine } from '@ldesign/engine-core'
import { setEngine } from '@ldesign/engine-svelte'
import App from './App.svelte'

const engine = createEngine({
  name: 'my-app',
  version: '1.0.0'
})

await engine.initialize()
setEngine(engine)

new App({ target: document.getElementById('app')! })
```

**2. 使用引擎** (`App.svelte`)
```svelte
<script>
import { getEngine, createEngineStateStore } from '@ldesign/engine-svelte'

const engine = getEngine()
const count = createEngineStateStore('counter', 0)
</script>

<div>
  <h1>Count: {$count}</h1>
  <button on:click={() => $count++}>+1</button>
</div>
```

### Angular

**1. 创建并初始化引擎** (`main.ts`)
```ts
import { bootstrapApplication } from '@angular/platform-browser'
import { createEngine } from '@ldesign/engine-core'
import { ENGINE_TOKEN } from '@ldesign/engine-angular'
import { AppComponent } from './app/app.component'

const engine = createEngine({
  name: 'my-app',
  version: '1.0.0'
})

await engine.initialize()

bootstrapApplication(AppComponent, {
  providers: [
    { provide: ENGINE_TOKEN, useValue: engine }
  ]
})
```

**2. 使用引擎** (`app.component.ts`)
```ts
import { Component } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  selector: 'app-root',
  template: `
    <div>
      <h1>Count: {{ count$ | async }}</h1>
      <button (click)="increment()">+1</button>
    </div>
  `
})
export class AppComponent {
  count$ = this.engineService.getState$<number>('counter', 0)
  
  constructor(private engineService: EngineService) {}
  
  increment() {
    const current = this.engineService.getState<number>('counter', 0)
    this.engineService.setState('counter', current + 1)
  }
}
```

### Solid.js

**1. 创建并初始化引擎** (`index.tsx`)
```tsx
import { render } from 'solid-js/web'
import { createEngine } from '@ldesign/engine-core'
import { setEngine } from '@ldesign/engine-solid'
import App from './App'

const engine = createEngine({
  name: 'my-app',
  version: '1.0.0'
})

await engine.initialize()
setEngine(engine)

render(() => <App />, document.getElementById('root')!)
```

**2. 使用引擎** (`App.tsx`)
```tsx
import { useEngine, useEngineState } from '@ldesign/engine-solid'

function App() {
  const engine = useEngine()
  const [count, setCount] = useEngineState<number>('counter', 0)
  
  return (
    <div>
      <h1>Count: {count()}</h1>
      <button onClick={() => setCount(count() + 1)}>+1</button>
    </div>
  )
}
```

## 🔌 使用插件

所有框架都支持相同的插件系统：

```ts
import { createEngine } from '@ldesign/engine-core'
import { createI18nPlugin } from '@ldesign/engine-core/plugins/i18n'
import { createThemePlugin } from '@ldesign/engine-core/plugins/theme'

const engine = createEngine({ ... })

// 注册 i18n 插件
engine.use(createI18nPlugin({
  locale: 'en',
  messages: {
    en: { hello: 'Hello' },
    zh: { hello: '你好' }
  }
}))

// 注册主题插件
engine.use(createThemePlugin({
  defaultTheme: 'light',
  themes: {
    light: { colors: { primary: '#1890ff' } },
    dark: { colors: { primary: '#177ddc' } }
  }
}))

await engine.initialize()
```

## 📚 核心 API

### 状态管理

```typescript
// React
const [state, setState] = useEngineState('path', initialValue)

// Vue
const [state, setState] = useEngineState('path', initialValue)

// Svelte
const state = createEngineStateStore('path', initialValue)

// Angular
const state$ = engineService.getState$('path', initialValue)

// Solid.js
const [state, setState] = useEngineState('path', initialValue)
```

### 事件监听

```typescript
// React
useEngineEvent('event-name', (data) => { ... })

// Vue
useEngineEvent('event-name', (data) => { ... })

// Svelte
engine.events.on('event-name', (data) => { ... })

// Angular
engineService.onEvent('event-name').subscribe(data => { ... })

// Solid.js
useEngineEvent('event-name', (data) => { ... })
```

### 访问插件

```typescript
// React
const plugin = usePlugin('plugin-name')

// Vue
const plugin = usePlugin('plugin-name')

// Svelte
const plugin = createPluginStore('plugin-name')

// Angular
const plugin$ = engineService.getPlugin$('plugin-name')

// Solid.js
const plugin = usePlugin('plugin-name')
```

## 🎯 下一步

### 查看完整示例
- [React 示例](../../examples/react)
- [Vue 示例](../../examples/vue)
- [Svelte 示例](../../examples/svelte)
- [Solid.js 示例](../../examples/solid)

### 深入学习
- [架构设计](./ARCHITECTURE.md)
- [框架对比](./FRAMEWORK_COMPARISON.md)
- [插件开发](../../docs/guide/plugin-development.md)
- [API 文档](../../docs/api)

### 常见问题

**Q: 如何在现有项目中集成？**  
A: 只需安装对应的包，创建引擎实例，然后使用对应框架的 Provider/Context。

**Q: 支持 SSR 吗？**  
A: 是的，所有框架适配器都支持服务端渲染。

**Q: 打包体积如何？**  
A: 核心包约 5KB（gzip），各框架适配器 1-2KB。

**Q: 如何调试？**  
A: 引擎内置日志系统，可在配置中设置 `logger.level: 'debug'`。

**Q: 性能如何？**  
A: 引擎本身几乎零开销，主要性能取决于所使用的框架。

## 🆘 获取帮助

- [GitHub Issues](https://github.com/your-org/ldesign/issues)
- [讨论区](https://github.com/your-org/ldesign/discussions)
- [文档](../../docs)

---

开始你的 @ldesign/engine 之旅吧！🚀

# 框架集成对比

@ldesign/engine 支持多个前端框架，每个框架都有其独特的集成方式。本指南对比不同框架的集成方法。

## 快速对比

| 特性 | Vue 3 | React | Angular | Svelte | Solid.js |
|------|-------|-------|---------|--------|----------|
| 响应式方式 | Composables | Hooks | RxJS | Stores | Signals |
| 依赖注入 | Plugin | Context | DI System | setContext | Context |
| 状态管理 | ref/reactive | useState | BehaviorSubject | writable | createSignal |
| 事件监听 | watchEffect | useEffect | subscribe | $ syntax | createEffect |
| 类型支持 | ✅ | ✅ | ✅ | ✅ | ✅ |
| SSR 支持 | ✅ | ✅ | ✅ | ✅ | ✅ |

## 安装

::: code-group

```bash [Vue]
pnpm add @ldesign/engine-core @ldesign/engine-vue
```

```bash [React]
pnpm add @ldesign/engine-core @ldesign/engine-react
```

```bash [Angular]
pnpm add @ldesign/engine-core @ldesign/engine-angular
```

```bash [Svelte]
pnpm add @ldesign/engine-core @ldesign/engine-svelte
```

```bash [Solid.js]
pnpm add @ldesign/engine-core @ldesign/engine-solid
```

:::

## 引擎初始化

### Vue 3

```typescript
import { createApp } from 'vue'
import { createEngine } from '@ldesign/engine-core'
import { VueEnginePlugin } from '@ldesign/engine-vue'

const engine = createEngine({ name: 'my-app' })
await engine.initialize()

const app = createApp(App)
app.use(VueEnginePlugin, { engine })
app.mount('#app')
```

### React

```typescript
import ReactDOM from 'react-dom/client'
import { createEngine } from '@ldesign/engine-core'
import { EngineProvider } from '@ldesign/engine-react'

const engine = createEngine({ name: 'my-app' })
await engine.initialize()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <EngineProvider engine={engine}>
    <App />
  </EngineProvider>
)
```

### Angular

```typescript
import { bootstrapApplication } from '@angular/platform-browser'
import { createEngine } from '@ldesign/engine-core'
import { provideEngine } from '@ldesign/engine-angular'

const engine = createEngine({ name: 'my-app' })
await engine.initialize()

bootstrapApplication(AppComponent, {
  providers: [provideEngine(engine)]
})
```

### Svelte

```typescript
import App from './App.svelte'
import { createEngine } from '@ldesign/engine-core'
import { setEngine } from '@ldesign/engine-svelte'

const engine = createEngine({ name: 'my-app' })
await engine.initialize()

setEngine(engine)

const app = new App({ target: document.getElementById('app')! })
```

### Solid.js

```typescript
import { render } from 'solid-js/web'
import { createEngine } from '@ldesign/engine-core'
import { EngineProvider } from '@ldesign/engine-solid'

const engine = createEngine({ name: 'my-app' })
await engine.initialize()

render(
  () => (
    <EngineProvider engine={engine}>
      <App />
    </EngineProvider>
  ),
  document.getElementById('root')!
)
```

## 访问引擎实例

### Vue 3

```vue
<script setup lang="ts">
import { useEngine } from '@ldesign/engine-vue'

const engine = useEngine()
</script>
```

### React

```tsx
import { useEngine } from '@ldesign/engine-react'

function Component() {
  const engine = useEngine()
  return <div>{engine.config.get('name')}</div>
}
```

### Angular

```typescript
import { Component } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({ /* ... */ })
export class MyComponent {
  constructor(private engine: EngineService) {}
}
```

### Svelte

```svelte
<script lang="ts">
import { engineStore } from '@ldesign/engine-svelte'

$: engine = $engineStore
</script>
```

### Solid.js

```tsx
import { useEngine } from '@ldesign/engine-solid'

function Component() {
  const engine = useEngine()
  return <div>{engine().config.get('name')}</div>
}
```

## 使用插件

### Vue 3

```vue
<script setup lang="ts">
import { useEnginePlugin } from '@ldesign/engine-vue'

const i18nPlugin = useEnginePlugin('i18n')

function switchLanguage() {
  i18nPlugin.value?.api.setLocale('zh')
}
</script>
```

### React

```tsx
import { useEnginePlugin } from '@ldesign/engine-react'

function Component() {
  const i18nPlugin = useEnginePlugin('i18n')
  
  const switchLanguage = () => {
    i18nPlugin?.api.setLocale('zh')
  }
  
  return <button onClick={switchLanguage}>Switch</button>
}
```

### Angular

```typescript
@Component({ /* ... */ })
export class MyComponent {
  constructor(private engine: EngineService) {}
  
  switchLanguage() {
    const i18nPlugin = this.engine.getPlugin('i18n')
    i18nPlugin?.api.setLocale('zh')
  }
}
```

### Svelte

```svelte
<script lang="ts">
import { pluginStore } from '@ldesign/engine-svelte'

const i18nPlugin = pluginStore('i18n')

function switchLanguage() {
  $i18nPlugin?.api.setLocale('zh')
}
</script>

<button on:click={switchLanguage}>Switch</button>
```

### Solid.js

```tsx
import { useEnginePlugin } from '@ldesign/engine-solid'

function Component() {
  const i18nPlugin = useEnginePlugin('i18n')
  
  const switchLanguage = () => {
    i18nPlugin()?.api.setLocale('zh')
  }
  
  return <button onClick={switchLanguage}>Switch</button>
}
```

## 响应式状态

### Vue 3 - ref/reactive

```vue
<script setup lang="ts">
import { watchEffect } from 'vue'
import { useEnginePlugin } from '@ldesign/engine-vue'

const i18nPlugin = useEnginePlugin('i18n')
const locale = ref('en')

watchEffect(() => {
  if (i18nPlugin.value?.api) {
    locale.value = i18nPlugin.value.api.getLocale()
  }
})
</script>

<template>
  <div>Current: {{ locale }}</div>
</template>
```

### React - Hooks

```tsx
import { useState, useEffect } from 'react'
import { useEnginePlugin } from '@ldesign/engine-react'

function Component() {
  const i18nPlugin = useEnginePlugin('i18n')
  const [locale, setLocale] = useState('en')
  
  useEffect(() => {
    if (i18nPlugin?.api) {
      setLocale(i18nPlugin.api.getLocale())
    }
  }, [i18nPlugin])
  
  return <div>Current: {locale}</div>
}
```

### Angular - RxJS

```typescript
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  template: `<div>Current: {{ locale }}</div>`
})
export class MyComponent implements OnInit {
  locale = 'en'
  
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.engine.locale$.subscribe(locale => {
      this.locale = locale
    })
  }
}
```

### Svelte - Stores

```svelte
<script lang="ts">
import { pluginStore } from '@ldesign/engine-svelte'

const i18nPlugin = pluginStore('i18n')

$: locale = $i18nPlugin?.api.getLocale() || 'en'
</script>

<div>Current: {locale}</div>
```

### Solid.js - Signals

```tsx
import { createEffect, createSignal } from 'solid-js'
import { useEnginePlugin } from '@ldesign/engine-solid'

function Component() {
  const i18nPlugin = useEnginePlugin('i18n')
  const [locale, setLocale] = createSignal('en')
  
  createEffect(() => {
    const plugin = i18nPlugin()
    if (plugin?.api) {
      setLocale(plugin.api.getLocale())
    }
  })
  
  return <div>Current: {locale()}</div>
}
```

## 监听事件

### Vue 3

```vue
<script setup lang="ts">
import { useEngineEvent } from '@ldesign/engine-vue'

useEngineEvent('locale:changed', (data) => {
  console.log('Locale changed:', data)
})
</script>
```

### React

```tsx
import { useEngineEvent } from '@ldesign/engine-react'

function Component() {
  useEngineEvent('locale:changed', (data) => {
    console.log('Locale changed:', data)
  })
  
  return <div>Listening...</div>
}
```

### Angular

```typescript
@Component({ /* ... */ })
export class MyComponent implements OnInit {
  constructor(private engine: EngineService) {}
  
  ngOnInit() {
    this.engine.onEvent('locale:changed').subscribe(data => {
      console.log('Locale changed:', data)
    })
  }
}
```

### Svelte

```svelte
<script lang="ts">
import { onMount } from 'svelte'
import { engineStore } from '@ldesign/engine-svelte'

onMount(() => {
  const engine = $engineStore
  return engine?.events.on('locale:changed', (data) => {
    console.log('Locale changed:', data)
  })
})
</script>
```

### Solid.js

```tsx
import { onMount, onCleanup } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function Component() {
  const engine = useEngine()
  
  onMount(() => {
    const unsubscribe = engine().events.on('locale:changed', (data) => {
      console.log('Locale changed:', data)
    })
    
    onCleanup(() => unsubscribe())
  })
  
  return <div>Listening...</div>
}
```

## 性能对比

| 框架 | 初始化速度 | 运行时性能 | 内存占用 | 打包大小 |
|------|-----------|-----------|---------|---------|
| Vue 3 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ~25KB |
| React | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ~35KB |
| Angular | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ~45KB |
| Svelte | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ~15KB |
| Solid.js | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ~18KB |

## 选择建议

### Vue 3
- ✅ 团队熟悉 Vue 生态
- ✅ 需要渐进式框架
- ✅ 需要完善的工具链

### React
- ✅ 团队熟悉 React 生态
- ✅ 需要丰富的第三方库
- ✅ 需要 React Native 跨平台

### Angular
- ✅ 企业级大型应用
- ✅ 需要完整的解决方案
- ✅ 团队有 TypeScript 经验

### Svelte
- ✅ 注重性能和包大小
- ✅ 简单的语法
- ✅ 小型到中型应用

### Solid.js
- ✅ 极致性能要求
- ✅ 熟悉 React 但需要更好性能
- ✅ 现代化的响应式系统

## 完整示例

每个框架都有完整的示例项目：

- [Vue 示例](https://github.com/ldesign/engine/tree/main/examples/vue)
- [React 示例](https://github.com/ldesign/engine/tree/main/examples/react)
- [Angular 示例](https://github.com/ldesign/engine/tree/main/examples/angular)
- [Svelte 示例](https://github.com/ldesign/engine/tree/main/examples/svelte)
- [Solid.js 示例](https://github.com/ldesign/engine/tree/main/examples/solid)

## 下一步

- [Vue 集成指南](/guide/vue-integration)
- [React 集成指南](/guide/react-integration)
- [Angular 集成指南](/guide/angular-integration)
- [Svelte 集成指南](/guide/svelte-integration)
- [Solid.js 集成指南](/guide/solid-integration)

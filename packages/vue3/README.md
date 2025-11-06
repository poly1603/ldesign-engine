# @ldesign/engine-vue3

Vue 3 适配器,为 Vue 3 应用提供统一的引擎功能。

## 安装

```bash
pnpm add @ldesign/engine-vue3 vue@^3.5.0
```

## 快速开始

```typescript
import { createEngineApp } from '@ldesign/engine-vue3'
import App from './App.vue'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My Vue 3 App',
    debug: true,
  },
})
```

## 使用插件

```typescript
import { createEngineApp, definePlugin } from '@ldesign/engine-vue3'

const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    const { engine } = context
    engine.state.set('myData', { count: 0 })
  }
})

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  plugins: [myPlugin],
})
```

## 使用中间件

```typescript
import { createEngineApp, defineMiddleware } from '@ldesign/engine-vue3'

const authMiddleware = defineMiddleware({
  name: 'auth',
  async execute(context, next) {
    console.log('Before:', context)
    await next()
    console.log('After:', context)
  }
})

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  middleware: [authMiddleware],
})
```

## 组合式 API

### useEngine

获取引擎实例:

```vue
<script setup>
import { useEngine } from '@ldesign/engine-vue3'

const engine = useEngine()

// 使用引擎功能
engine.state.set('count', 0)
engine.events.emit('custom-event', { data: 'hello' })
</script>
```

### usePlugin

获取插件实例:

```vue
<script setup>
import { usePlugin } from '@ldesign/engine-vue3'

const i18nPlugin = usePlugin('i18n')
const currentLocale = i18nPlugin?.getLocale()
</script>
```

### useState

使用状态:

```vue
<script setup>
import { useState } from '@ldesign/engine-vue3'

const count = useState('count', 0)
</script>
```

### useEvent

监听事件:

```vue
<script setup>
import { useEvent } from '@ldesign/engine-vue3'

useEvent('custom-event', (payload) => {
  console.log('Event received:', payload)
})
</script>
```

### useLifecycle

使用生命周期:

```vue
<script setup>
import { useLifecycle } from '@ldesign/engine-vue3'

useLifecycle('mounted', () => {
  console.log('Component mounted')
})
</script>
```

## 完整示例

```vue
<template>
  <div>
    <h1>{{ appName }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEngine, useState, useEvent } from '@ldesign/engine-vue3'

const engine = useEngine()
const appName = useState('appName', 'My App')
const count = ref(useState('count', 0))

// 监听事件
useEvent('count:changed', (newCount) => {
  count.value = newCount
})

// 方法
const increment = () => {
  const newCount = count.value + 1
  engine.state.set('count', newCount)
  engine.events.emit('count:changed', newCount)
}
</script>
```

## 生命周期钩子

```typescript
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  
  onReady: async (engine) => {
    console.log('Engine ready!')
    engine.state.set('appName', 'My App')
  },
  
  onMounted: async (engine) => {
    console.log('App mounted!')
    engine.events.emit('app:mounted')
  },
  
  onError: (error, context) => {
    console.error('Error:', error, context)
  }
})
```

## API

### createEngineApp(options)

创建 Vue 3 引擎应用。

**参数:**

- `options.rootComponent` - 根组件
- `options.mountElement` - 挂载元素
- `options.config` - 引擎配置
- `options.plugins` - 插件列表
- `options.middleware` - 中间件列表
- `options.onReady` - 准备就绪回调
- `options.onMounted` - 挂载完成回调
- `options.onError` - 错误处理回调

**返回:** `Promise<Vue3EngineApp>`

## 文档

查看完整文档: [packages/engine/UNIVERSAL_ENGINE_ARCHITECTURE.md](../../UNIVERSAL_ENGINE_ARCHITECTURE.md)


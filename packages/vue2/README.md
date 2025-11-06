# @ldesign/engine-vue2

Vue 2 适配器,为 Vue 2 应用提供统一的引擎功能。

## 安装

```bash
pnpm add @ldesign/engine-vue2 vue@^2.7.0
```

## 快速开始

```typescript
import { createEngineApp } from '@ldesign/engine-vue2'
import App from './App.vue'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My Vue 2 App',
    debug: true,
  },
})
```

## 使用插件

```typescript
import { createEngineApp, definePlugin } from '@ldesign/engine-vue2'

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
import { createEngineApp, defineMiddleware } from '@ldesign/engine-vue2'

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

## 在组件中使用

```vue
<template>
  <div>
    <h1>{{ appName }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      appName: '',
      count: 0
    }
  },
  
  created() {
    // 访问引擎
    const engine = this.$engine
    
    // 获取状态
    this.appName = engine.state.get('appName')
    this.count = engine.state.get('count') || 0
    
    // 监听事件
    engine.events.on('count:changed', (newCount) => {
      this.count = newCount
    })
  },
  
  methods: {
    increment() {
      const newCount = this.count + 1
      this.$engine.state.set('count', newCount)
      this.$engine.events.emit('count:changed', newCount)
    }
  }
}
</script>
```

## API

### createEngineApp(options)

创建 Vue 2 引擎应用。

**参数:**

- `options.rootComponent` - 根组件
- `options.mountElement` - 挂载元素
- `options.config` - 引擎配置
- `options.plugins` - 插件列表
- `options.middleware` - 中间件列表
- `options.onReady` - 准备就绪回调
- `options.onMounted` - 挂载完成回调
- `options.onError` - 错误处理回调

**返回:** `Promise<Vue2EngineApp>`

## 文档

查看完整文档: [packages/engine/UNIVERSAL_ENGINE_ARCHITECTURE.md](../../UNIVERSAL_ENGINE_ARCHITECTURE.md)


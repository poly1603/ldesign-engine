# Vue 3 Engine 示例项目

这是一个使用 `@ldesign/engine-vue3` 和 Composition API 构建的完整示例项目,展示了引擎的所有核心功能。

## 📦 功能展示

### 1. 插件系统
- ✅ 插件安装和卸载
- ✅ 插件依赖管理
- ✅ 插件上下文访问
- ✅ 动态插件注册

### 2. 中间件系统
- ✅ 中间件注册和执行
- ✅ 优先级控制
- ✅ 洋葱模型执行
- ✅ 上下文传递

### 3. 状态管理
- ✅ 状态设置和获取
- ✅ 状态监听
- ✅ 批量更新
- ✅ 响应式状态

### 4. 事件系统
- ✅ 事件发布和订阅
- ✅ 异步事件
- ✅ 事件日志
- ✅ 自定义事件

### 5. 生命周期管理
- ✅ 生命周期钩子
- ✅ 钩子触发
- ✅ 自定义钩子
- ✅ 钩子计数

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## 📁 项目结构

```
example/
├── src/
│   ├── components/          # 演示组件
│   │   ├── PluginDemo.vue      # 插件系统演示
│   │   ├── MiddlewareDemo.vue  # 中间件系统演示
│   │   ├── StateDemo.vue       # 状态管理演示
│   │   ├── EventDemo.vue       # 事件系统演示
│   │   └── LifecycleDemo.vue   # 生命周期演示
│   ├── App.vue              # 主应用组件
│   ├── main.ts              # 入口文件
│   └── style.css            # 全局样式
├── index.html               # HTML 模板
├── package.json             # 项目配置
└── tsconfig.json            # TypeScript 配置
```

## 💡 使用示例

### 创建引擎应用

```typescript
import { createEngineApp } from '@ldesign/engine-vue3'
import App from './App.vue'

createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My Vue 3 App',
    debug: true,
  },
  plugins: [/* 插件列表 */],
  middleware: [/* 中间件列表 */],
})
```

### 使用 Composition API

```vue
<script setup lang="ts">
import { useEngine, useEngineState, useEvent } from '@ldesign/engine-vue3'

// 获取引擎实例
const engine = useEngine()

// 使用状态管理
const count = useEngineState('count', 0)

// 监听事件
useEvent('user:login', (user) => {
  console.log('User logged in:', user)
})
</script>
```

### 使用插件

```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    // 插件逻辑
    context.engine.state.set('pluginData', {})
  },
}

await engine.use(myPlugin)
```

### 使用中间件

```typescript
const myMiddleware = {
  name: 'my-middleware',
  priority: 100,
  async execute(context, next) {
    console.log('Before')
    await next()
    console.log('After')
  },
}

engine.middleware.use(myMiddleware)
```

### 状态管理

```typescript
// 设置状态
engine.state.set('count', 0)

// 获取状态
const count = engine.state.get('count')

// 监听状态变化
engine.state.watch('count', (newValue, oldValue) => {
  console.log('Count changed:', oldValue, '->', newValue)
})

// 批量更新
engine.state.batch(() => {
  engine.state.set('a', 1)
  engine.state.set('b', 2)
  engine.state.set('c', 3)
})
```

### 事件系统

```typescript
// 监听事件
engine.events.on('user:login', (user) => {
  console.log('User logged in:', user)
})

// 触发事件
engine.events.emit('user:login', { name: 'Alice' })

// 异步事件
await engine.events.emitAsync('data:load', { id: 123 })
```

### 生命周期钩子

```typescript
// 注册钩子
engine.lifecycle.on('mounted', () => {
  console.log('App mounted!')
})

// 触发钩子
await engine.lifecycle.trigger('mounted')
```

## 🎨 Composition API Composables

### useEngine()
获取引擎实例

```typescript
const engine = useEngine()
```

### useEngineState(key, defaultValue)
使用响应式状态

```typescript
const count = useEngineState('count', 0)
count.value++ // 自动同步到引擎状态
```

### useEvent(event, handler)
监听事件(自动清理)

```typescript
useEvent('user:login', (user) => {
  console.log('User logged in:', user)
})
```

### usePlugin(name)
获取插件实例

```typescript
const i18nPlugin = usePlugin('i18n')
```

### useLifecycle(hook, handler)
监听生命周期钩子(自动清理)

```typescript
useLifecycle('mounted', () => {
  console.log('Component mounted!')
})
```

### useMiddleware(context)
执行中间件链

```typescript
const result = await useMiddleware({ data: { action: 'test' } })
```

## 🔗 相关链接

- [@ldesign/engine-vue3 文档](../README.md)
- [@ldesign/engine-core 文档](../../core/README.md)
- [LDesign Engine 架构](../../../README.md)
- [Vue 3 官方文档](https://vuejs.org/)

## 📄 License

MIT


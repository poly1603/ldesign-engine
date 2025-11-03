# 框架适配器对比指南

本文档对比了 @ldesign/engine 在不同前端框架中的使用方式和特性。

## 📊 快速对比表

| 特性 | React | Vue | Svelte | Angular | Solid.js |
|------|-------|-----|--------|---------|----------|
| **响应式系统** | Hooks | Composition API | Stores | RxJS | Signals |
| **状态管理** | useState | ref/reactive | writable | BehaviorSubject | createSignal |
| **依赖注入** | Context | provide/inject | - | DI Container | - |
| **类型安全** | ✅ 完整 | ✅ 完整 | ✅ 完整 | ✅ 完整 | ✅ 完整 |
| **Tree Shaking** | ✅ 优秀 | ✅ 优秀 | ✅ 优秀 | ✅ 良好 | ✅ 优秀 |
| **学习曲线** | 中等 | 简单 | 简单 | 陡峭 | 简单 |
| **打包体积** | 中等 | 小 | 极小 | 大 | 极小 |
| **示例项目** | ✅ | ✅ | ✅ | ❌ | ✅ |

## 🎯 核心 API 对比

### 1. 引擎初始化

#### React
```tsx
import { createEngine } from '@ldesign/engine-core'
import { EngineProvider } from '@ldesign/engine-react'

const engine = createEngine({ ... })
await engine.initialize()

<EngineProvider engine={engine}>
  <App />
</EngineProvider>
```

#### Vue
```ts
import { createEngine } from '@ldesign/engine-core'
import { provide } from 'vue'
import { ENGINE_INJECTION_KEY } from '@ldesign/engine-vue'

const engine = createEngine({ ... })
await engine.initialize()
provide(ENGINE_INJECTION_KEY, engine)
```

#### Svelte
```ts
import { createEngine } from '@ldesign/engine-core'
import { setEngine } from '@ldesign/engine-svelte'

const engine = createEngine({ ... })
await engine.initialize()
setEngine(engine)
```

#### Angular
```ts
import { createEngine } from '@ldesign/engine-core'
import { ENGINE_TOKEN } from '@ldesign/engine-angular'

const engine = createEngine({ ... })
await engine.initialize()

@NgModule({
  providers: [
    { provide: ENGINE_TOKEN, useValue: engine }
  ]
})
```

#### Solid.js
```tsx
import { createEngine } from '@ldesign/engine-core'
import { setEngine } from '@ldesign/engine-solid'

const engine = createEngine({ ... })
await engine.initialize()
setEngine(engine)
```

### 2. 访问引擎实例

#### React
```tsx
import { useEngine } from '@ldesign/engine-react'

function MyComponent() {
  const engine = useEngine()
  return <div>Engine: {engine.name}</div>
}
```

#### Vue
```vue
<script setup>
import { useEngine } from '@ldesign/engine-vue'

const engine = useEngine()
</script>

<template>
  <div>Engine: {{ engine.name }}</div>
</template>
```

#### Svelte
```svelte
<script>
import { getEngine } from '@ldesign/engine-svelte'

const engine = getEngine()
</script>

<div>Engine: {engine.name}</div>
```

#### Angular
```ts
import { Component } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({...})
export class MyComponent {
  constructor(private engineService: EngineService) {
    const engine = engineService.getEngine()
  }
}
```

#### Solid.js
```tsx
import { useEngine } from '@ldesign/engine-solid'

function MyComponent() {
  const engine = useEngine()
  return <div>Engine: {engine().name}</div>
}
```

### 3. 状态管理

#### React
```tsx
import { useEngineState } from '@ldesign/engine-react'

function Counter() {
  const [count, setCount] = useEngineState<number>('counter', 0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  )
}
```

#### Vue
```vue
<script setup>
import { useEngineState } from '@ldesign/engine-vue'

const [count, setCount] = useEngineState<number>('counter', 0)

const increment = () => setCount(count.value + 1)
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">+1</button>
  </div>
</template>
```

#### Svelte
```svelte
<script>
import { createEngineStateStore } from '@ldesign/engine-svelte'

const count = createEngineStateStore('counter', 0)
</script>

<div>
  <p>Count: {$count}</p>
  <button on:click={() => $count++}>+1</button>
</div>
```

#### Angular
```ts
import { Component } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({
  template: `
    <div>
      <p>Count: {{ count$ | async }}</p>
      <button (click)="increment()">+1</button>
    </div>
  `
})
export class CounterComponent {
  count$ = this.engineService.getState$<number>('counter', 0)
  
  constructor(private engineService: EngineService) {}
  
  increment() {
    const current = this.engineService.getState<number>('counter', 0)
    this.engineService.setState('counter', current + 1)
  }
}
```

#### Solid.js
```tsx
import { useEngineState } from '@ldesign/engine-solid'

function Counter() {
  const [count, setCount] = useEngineState<number>('counter', 0)
  
  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>+1</button>
    </div>
  )
}
```

### 4. 事件监听

#### React
```tsx
import { useEngineEvent } from '@ldesign/engine-react'

function MyComponent() {
  useEngineEvent('theme:changed', (data) => {
    console.log('Theme changed:', data.to)
  })
  
  return <div>Listening...</div>
}
```

#### Vue
```vue
<script setup>
import { useEngineEvent } from '@ldesign/engine-vue'

useEngineEvent('theme:changed', (data) => {
  console.log('Theme changed:', data.to)
})
</script>
```

#### Svelte
```svelte
<script>
import { onMount } from 'svelte'
import { getEngine } from '@ldesign/engine-svelte'

const engine = getEngine()

onMount(() => {
  const unsubscribe = engine.events.on('theme:changed', (data) => {
    console.log('Theme changed:', data.to)
  })
  
  return unsubscribe
})
</script>
```

#### Angular
```ts
import { Component, OnInit } from '@angular/core'
import { EngineService } from '@ldesign/engine-angular'

@Component({...})
export class MyComponent implements OnInit {
  constructor(private engineService: EngineService) {}
  
  ngOnInit() {
    this.engineService.onEvent('theme:changed').subscribe(data => {
      console.log('Theme changed:', data.to)
    })
  }
}
```

#### Solid.js
```tsx
import { useEngineEvent } from '@ldesign/engine-solid'

function MyComponent() {
  useEngineEvent('theme:changed', (data) => {
    console.log('Theme changed:', data.to)
  })
  
  return <div>Listening...</div>
}
```

## 🔄 响应式系统对比

### React
- **模式**: Virtual DOM + Reconciliation
- **更新粒度**: 组件级
- **优点**: 成熟稳定、生态丰富
- **缺点**: 需要手动优化（useMemo, useCallback）
- **适用场景**: 大型应用、团队协作

### Vue
- **模式**: Proxy + Virtual DOM
- **更新粒度**: 属性级
- **优点**: 渐进式、易学易用
- **缺点**: Options API 和 Composition API 混用可能困惑
- **适用场景**: 快速开发、中小型应用

### Svelte
- **模式**: 编译时优化
- **更新粒度**: 语句级
- **优点**: 极小打包体积、无运行时
- **缺点**: 生态相对较小
- **适用场景**: 性能敏感、体积敏感

### Angular
- **模式**: Zone.js + Change Detection
- **更新粒度**: 组件树
- **优点**: 企业级、完整解决方案
- **缺点**: 学习曲线陡峭、打包体积大
- **适用场景**: 大型企业应用

### Solid.js
- **模式**: 细粒度响应式 Signals
- **更新粒度**: 表达式级
- **优点**: 极高性能、极小体积
- **缺点**: 生态较新
- **适用场景**: 性能要求高、追求极致优化

## 📦 打包体积对比

以简单的 Counter 应用为例（生产构建，gzip 后）：

| 框架 | 打包体积 | 运行时 |
|------|---------|--------|
| React | ~45KB | React (18KB) + Engine (5KB) |
| Vue | ~35KB | Vue (15KB) + Engine (5KB) |
| Svelte | ~10KB | 无运行时 + Engine (5KB) |
| Angular | ~120KB | Angular (95KB) + Engine (5KB) + RxJS |
| Solid.js | ~12KB | Solid (7KB) + Engine (5KB) |

## 🎨 开发体验对比

### TypeScript 支持
✅ 所有框架都提供完整的 TypeScript 支持

### DevTools
- React: ✅ React DevTools
- Vue: ✅ Vue DevTools
- Svelte: ✅ Svelte DevTools
- Angular: ✅ Angular DevTools
- Solid.js: ✅ Solid DevTools

### 热重载
- React: ✅ Fast Refresh
- Vue: ✅ HMR
- Svelte: ✅ HMR
- Angular: ✅ HMR
- Solid.js: ✅ HMR

## 🚀 性能对比

基于 JS Framework Benchmark 的相对性能（数值越小越好）：

| 框架 | 渲染速度 | 更新速度 | 内存占用 |
|------|---------|---------|---------|
| React | 1.5x | 1.4x | 1.6x |
| Vue | 1.2x | 1.3x | 1.3x |
| Svelte | 1.1x | 1.1x | 1.1x |
| Angular | 1.8x | 1.6x | 1.7x |
| Solid.js | 1.0x | 1.0x | 1.0x |

*注：Solid.js 作为基准 (1.0x)*

## 🎯 选择建议

### 选择 React，如果你需要：
- 成熟稳定的生态系统
- 大量的第三方库支持
- 大型团队协作
- 移动端支持 (React Native)

### 选择 Vue，如果你需要：
- 简单易学的框架
- 快速开发原型
- 渐进式集成
- 良好的中文社区

### 选择 Svelte，如果你需要：
- 最小的打包体积
- 极致的性能
- 简洁的语法
- 无运行时开销

### 选择 Angular，如果你需要：
- 企业级完整解决方案
- 内置依赖注入
- RxJS 响应式编程
- 大型团队规范

### 选择 Solid.js，如果你需要：
- 最佳的性能
- 细粒度响应式
- 类 React 语法
- 现代化开发体验

## 📚 相关资源

- [React 示例](../../examples/react)
- [Vue 示例](../../examples/vue)
- [Svelte 示例](../../examples/svelte)
- [Solid.js 示例](../../examples/solid)
- [架构设计](./ARCHITECTURE.md)
- [API 文档](../../docs/api)

## 🤝 贡献

欢迎为任何框架适配器贡献代码和文档！

---

最后更新: 2025-10-29

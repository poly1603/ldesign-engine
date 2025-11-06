# Solid 框架路由集成文档

## 📋 集成概述

本文档说明如何在 `@ldesign/engine-solid` 中集成和使用路由功能。

**完成时间**: 2025-11-05  
**Router 包**: `@ldesign/router-solid`  
**状态**: ✅ 完成

---

## 🔧 安装依赖

路由功能作为可选依赖提供：

```bash
pnpm add @ldesign/router @ldesign/router-solid
```

---

## 📝 使用方法

### 1. 配置路由

在 `main.tsx` 中配置路由：

```typescript
import { createEngineApp } from '@ldesign/engine-solid'
import App from './App'
import Home from './pages/Home'
import About from './pages/About'
import User from './pages/User'

createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  router: {
    mode: 'hash',  // 'history' | 'hash' | 'memory'
    preset: 'spa', // 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'
    routes: [
      { path: '/', component: Home, meta: { title: '首页' } },
      { path: '/about', component: About, meta: { title: '关于' } },
      { path: '/user/:id', component: User, meta: { title: '用户详情' } },
    ],
  },
})
```

### 2. 创建导航组件

```typescript
// components/Navigation.tsx
import { createSignal, createEffect, onCleanup } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function NavLink(props: { to: string; children: any }) {
  const engine = useEngine()
  const [isActive, setIsActive] = createSignal(false)

  createEffect(() => {
    const checkActive = () => {
      if (!engine.router) return
      const route = engine.router.getCurrentRoute()
      const currentPath = route.value?.path || '/'
      setIsActive(currentPath === props.to)
    }
    
    checkActive()
    const unsubscribe = engine.events.on('router:navigated', checkActive)
    onCleanup(() => unsubscribe?.())
  })

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    engine.router?.push(props.to)
  }

  return (
    <a
      href={props.to}
      onClick={handleClick}
      classList={{ 'nav-link': true, active: isActive() }}
    >
      {props.children}
    </a>
  )
}
```

### 3. 创建路由视图组件

```typescript
// components/RouterView.tsx
import { createSignal, createEffect, onCleanup, Component } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

export default function RouterView() {
  const engine = useEngine()
  const [CurrentComponent, setCurrentComponent] = createSignal<Component | null>(null)

  createEffect(() => {
    if (!engine.router) return

    const updateComponent = () => {
      const route = engine.router!.getCurrentRoute()
      if (route.value?.component) {
        setCurrentComponent(() => route.value.component as Component)
      }
    }

    updateComponent()
    const unsubscribe = engine.events.on('router:navigated', updateComponent)
    onCleanup(() => unsubscribe?.())
  })

  return (
    <div class="router-view">
      {CurrentComponent() ? <CurrentComponent() /> : <div>Loading...</div>}
    </div>
  )
}
```

### 4. 在 App 中使用

```typescript
// App.tsx
import { Component } from 'solid-js'
import { EngineContext } from '@ldesign/engine-solid'
import Navigation from './components/Navigation'
import RouterView from './components/RouterView'

const App: Component<{ engine: any }> = (props) => {
  return (
    <EngineContext.Provider value={props.engine}>
      <div class="app">
        <Navigation />
        <main class="main">
          <RouterView />
        </main>
      </div>
    </EngineContext.Provider>
  )
}
```

---

## 🎯 路由 API

### 编程式导航

```typescript
import { useEngine } from '@ldesign/engine-solid'

function MyComponent() {
  const engine = useEngine()

  const navigate = () => {
    // 导航到指定路径
    engine.router.push('/about')
    
    // 带参数导航
    engine.router.push('/user/123')
    
    // 后退
    engine.router.back()
    
    // 前进
    engine.router.forward()
  }

  return <button onClick={navigate}>导航</button>
}
```

### 获取路由信息

```typescript
import { createSignal, createEffect } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function MyComponent() {
  const engine = useEngine()
  const [currentPath, setCurrentPath] = createSignal('')

  createEffect(() => {
    if (!engine.router) return
    
    const route = engine.router.getCurrentRoute()
    setCurrentPath(route.value?.path || '/')
    
    // 获取路由参数
    const params = route.value?.params
    console.log('路由参数:', params)
    
    // 获取查询参数
    const query = route.value?.query
    console.log('查询参数:', query)
  })

  return <div>当前路径: {currentPath()}</div>
}
```

---

## 📊 配置选项

### RouterConfig 接口

```typescript
interface RouterConfig {
  mode?: 'history' | 'hash' | 'memory'
  base?: string
  routes: RouteConfig[]
  preset?: 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'
  scrollBehavior?: (to: any, from: any, savedPosition: any) => any
  linkActiveClass?: string
  linkExactActiveClass?: string
  preload?: boolean | PreloadConfig
  cache?: boolean | CacheConfig
  animation?: boolean | AnimationConfig
  performance?: PerformanceConfig
  development?: DevelopmentConfig
  security?: SecurityConfig
}
```

### 预设配置

- **spa**: 单页应用优化
- **mpa**: 多页应用优化
- **mobile**: 移动端优化
- **desktop**: 桌面端优化
- **admin**: 后台管理系统优化
- **blog**: 博客系统优化

---

## 🎨 Solid 特性

### 细粒度响应式

Solid 的路由集成充分利用了 Solid 的细粒度响应式系统：

```typescript
import { createSignal, createEffect } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function UserProfile() {
  const engine = useEngine()
  const [userId, setUserId] = createSignal('')

  createEffect(() => {
    if (!engine.router) return
    const route = engine.router.getCurrentRoute()
    setUserId(route.value?.params?.id || '')
  })

  return <div>用户 ID: {userId()}</div>
}
```

### Signals 集成

路由状态可以与 Solid Signals 无缝集成：

```typescript
import { createSignal, createMemo } from 'solid-js'
import { useEngine } from '@ldesign/engine-solid'

function MyComponent() {
  const engine = useEngine()
  const [count, setCount] = createSignal(0)
  
  const routeInfo = createMemo(() => {
    if (!engine.router) return null
    return engine.router.getCurrentRoute().value
  })

  return (
    <div>
      <p>路由: {routeInfo()?.path}</p>
      <p>计数: {count()}</p>
    </div>
  )
}
```

---

## 📦 示例应用

完整的示例应用位于 `packages/solid/example/`，包含：

- ✅ 首页 (Home)
- ✅ 关于页面 (About)
- ✅ 用户详情页 (User) - 带路由参数
- ✅ 导航组件 - 带活动状态
- ✅ 路由视图组件
- ✅ 完整的样式

运行示例：

```bash
cd packages/engine/packages/solid/example
pnpm install
pnpm dev
```

---

## ✅ 集成清单

- [x] 修改 `src/engine-app.ts` 添加 RouterConfig
- [x] 更新 `package.json` 添加路由依赖
- [x] 创建示例页面 (Home, About, User)
- [x] 创建 Navigation 组件
- [x] 创建 RouterView 组件
- [x] 更新 main.tsx 配置路由
- [x] 更新 App.tsx 使用路由组件
- [x] 更新样式文件
- [x] 更新示例 package.json
- [x] 生成集成文档

---

**文档版本**: 1.0.0  
**最后更新**: 2025-11-05  
**维护者**: LDesign Team


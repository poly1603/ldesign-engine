# 📖 LDesign Engine 路由使用指南

## 简介

本指南将帮助你在 LDesign Engine 应用中配置和使用路由功能。LDesign Router 支持 9 个主流前端框架，提供统一的 API 和配置方式。

---

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装 Engine 框架适配器（以 React 为例）
pnpm add @ldesign/engine-react

# 安装 Router（可选，Engine 会自动加载）
pnpm add @ldesign/router
```

### 2. 基本配置

```typescript
import { createEngineApp } from '@ldesign/engine-react'
import App from './App'
import Home from './pages/Home'
import About from './pages/About'

const app = createEngineApp({
  rootComponent: App,
  router: {
    mode: 'hash',  // 或 'history', 'memory'
    base: '/',
    routes: [
      { path: '/', component: Home },
      { path: '/about', component: About },
    ],
  },
})
```

### 3. 创建路由视图

在你的根组件中添加路由视图：

**React 示例**:
```tsx
import { RouterView } from './components/RouterView'

function App() {
  return (
    <div>
      <Navigation />
      <RouterView />
    </div>
  )
}
```

**Vue3 示例**:
```vue
<template>
  <div>
    <Navigation />
    <RouterView />
  </div>
</template>
```

---

## 📝 配置选项

### 路由模式

```typescript
router: {
  mode: 'hash',     // Hash 模式 (#/path)
  // mode: 'history', // History 模式 (/path)
  // mode: 'memory',  // Memory 模式（无 URL 变化）
}
```

### 路由规则

```typescript
router: {
  routes: [
    // 基本路由
    { path: '/', component: Home },
    
    // 带参数的路由
    { path: '/user/:id', component: User },
    
    // 带元数据的路由
    { 
      path: '/about', 
      component: About,
      meta: { 
        title: '关于我们',
        requiresAuth: true 
      }
    },
    
    // 嵌套路由
    {
      path: '/dashboard',
      component: Dashboard,
      children: [
        { path: 'profile', component: Profile },
        { path: 'settings', component: Settings },
      ]
    },
  ],
}
```

### 使用预设配置

LDesign Router 提供了多种预设配置，开箱即用：

```typescript
router: {
  preset: 'spa',  // 单页应用预设
  routes: [...],
}
```

可用的预设：

| 预设 | 说明 | 适用场景 |
|------|------|---------|
| `spa` | 单页应用 | 大多数 Web 应用 |
| `mobile` | 移动应用 | 移动端 H5 应用 |
| `desktop` | 桌面应用 | Electron 等桌面应用 |
| `admin` | 后台管理 | 管理后台系统 |
| `blog` | 博客网站 | 内容展示网站 |

### 高级配置

```typescript
router: {
  mode: 'history',
  base: '/',
  preset: 'spa',
  routes: [...],
  
  // 预加载配置
  preload: {
    strategy: 'hover',  // 'hover' | 'visible' | 'idle'
    delay: 200,         // 延迟时间（毫秒）
    enabled: true,
  },
  
  // 缓存配置
  cache: {
    maxSize: 20,        // 最大缓存数量
    strategy: 'memory', // 'memory' | 'session' | 'local'
    enabled: true,
  },
  
  // 动画配置
  animation: {
    type: 'fade',       // 'fade' | 'slide' | 'zoom' | 'none'
    duration: 300,      // 动画时长（毫秒）
    enabled: true,
  },
  
  // 滚动行为
  scrollBehavior: {
    behavior: 'smooth', // 'auto' | 'smooth'
    top: 0,
    left: 0,
  },
}
```

---

## 🎯 使用方法

### 访问路由器

在组件中访问路由器实例：

**React**:
```tsx
import { useEngine } from '@ldesign/engine-react'

function MyComponent() {
  const engine = useEngine()
  
  const handleClick = () => {
    engine.router?.push('/about')
  }
  
  return <button onClick={handleClick}>Go to About</button>
}
```

**Vue3**:
```vue
<script setup>
import { useEngine } from '@ldesign/engine-vue3'

const engine = useEngine()

const handleClick = () => {
  engine.router?.push('/about')
}
</script>
```

**Solid**:
```tsx
import { useEngine } from '@ldesign/engine-solid'

function MyComponent() {
  const engine = useEngine()
  
  const handleClick = () => {
    engine.router?.push('/about')
  }
  
  return <button onClick={handleClick}>Go to About</button>
}
```

### 路由导航

```typescript
// 导航到指定路径
engine.router.push('/about')

// 带参数导航
engine.router.push('/user/123')

// 带查询参数导航
engine.router.push('/search?q=keyword')

// 返回上一页
engine.router.back()

// 前进到下一页
engine.router.forward()

// 替换当前路由（不产生历史记录）
engine.router.replace('/login')
```

### 获取路由信息

```typescript
// 获取当前路由
const route = engine.router.getCurrentRoute()

console.log(route.value.path)      // 当前路径
console.log(route.value.params)    // 路由参数
console.log(route.value.query)     // 查询参数
console.log(route.value.meta)      // 元数据
```

### 监听路由变化

```typescript
// 监听路由导航事件
engine.events.on('router:navigated', (event) => {
  console.log('路由已变化:', event.to)
})

// 监听路由错误
engine.events.on('router:error', (error) => {
  console.error('路由错误:', error)
})
```

---

## 🧩 组件示例

### Navigation 组件

**React**:
```tsx
import { useEngine } from '@ldesign/engine-react'
import { useState, useEffect } from 'react'

export function Navigation() {
  const engine = useEngine()
  const [currentPath, setCurrentPath] = useState('/')
  
  useEffect(() => {
    const unsubscribe = engine.events.on('router:navigated', () => {
      const route = engine.router?.getCurrentRoute()
      setCurrentPath(route?.value?.path || '/')
    })
    return unsubscribe
  }, [])
  
  const navigate = (path: string) => {
    engine.router?.push(path)
  }
  
  return (
    <nav>
      <a 
        onClick={() => navigate('/')}
        className={currentPath === '/' ? 'active' : ''}
      >
        Home
      </a>
      <a 
        onClick={() => navigate('/about')}
        className={currentPath === '/about' ? 'active' : ''}
      >
        About
      </a>
    </nav>
  )
}
```

### RouterView 组件

**React**:
```tsx
import { useEngine } from '@ldesign/engine-react'
import { useState, useEffect } from 'react'

export function RouterView() {
  const engine = useEngine()
  const [CurrentComponent, setCurrentComponent] = useState<any>(null)
  
  useEffect(() => {
    const updateRoute = () => {
      const route = engine.router?.getCurrentRoute()
      const matchedRoute = routes.find(r => matchRoute(r.path, route?.value?.path))
      setCurrentComponent(() => matchedRoute?.component || NotFound)
    }
    
    updateRoute()
    const unsubscribe = engine.events.on('router:navigated', updateRoute)
    return unsubscribe
  }, [])
  
  return CurrentComponent ? <CurrentComponent /> : null
}
```

---

## 🎨 框架特定用法

### React

使用 Hooks:
```tsx
import { useEngine, useEngineState } from '@ldesign/engine-react'
```

### Vue3

使用 Composition API:
```vue
<script setup>
import { useEngine, useEngineState } from '@ldesign/engine-vue3'
</script>
```

### Solid

使用 Signals:
```tsx
import { useEngine } from '@ldesign/engine-solid'
import { createSignal, createEffect } from 'solid-js'
```

### Svelte

使用 Stores:
```svelte
<script>
import { useEngine } from '@ldesign/engine-svelte'
import { writable } from 'svelte/store'
</script>
```

### Angular

使用独立组件:
```typescript
import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'app-my-component',
  standalone: true,
})
export class MyComponent implements OnInit {
  ngOnInit() {
    const engine = (window as any).__ENGINE__
    // 使用 engine.router
  }
}
```

---

## 🔍 常见问题

### Q: 如何实现路由守卫？

A: 使用 Engine 的中间件系统：

```typescript
const authMiddleware = {
  name: 'auth',
  priority: 100,
  async execute(context, next) {
    const route = context.engine.router?.getCurrentRoute()
    if (route?.value?.meta?.requiresAuth && !isAuthenticated()) {
      context.engine.router?.push('/login')
      return
    }
    await next()
  },
}

createEngineApp({
  middleware: [authMiddleware],
  router: { ... },
})
```

### Q: 如何实现 404 页面？

A: 在 RouterView 组件中处理未匹配的路由：

```tsx
const matchedRoute = routes.find(r => matchRoute(r.path, currentPath))
const Component = matchedRoute?.component || NotFound
```

### Q: 如何获取路由参数？

A: 从当前路由对象中获取：

```typescript
const route = engine.router.getCurrentRoute()
const userId = route.value?.params?.id
```

---

## 📚 更多资源

- [完整 API 文档](./API.md)
- [示例项目](./packages/engine/packages/)
- [框架集成文档](./packages/engine/packages/*/ROUTER_INTEGRATION.md)

---

**最后更新**: 2025-11-05


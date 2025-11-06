# 路由集成当前进度和后续步骤

## 📊 当前进度

**更新时间**: 2025-11-05  
**总体完成度**: 40% (3.5/9 框架)

---

## ✅ 已完成的框架

### 1. React ✅ 100%
- 核心集成完成
- 示例应用完成
- 文档完成

### 2. Vue 3 ✅ 100%
- 核心集成完成
- 示例应用完成
- 文档完成

### 3. Solid ✅ 100%
- 核心集成完成
- 示例应用完成
- 文档完成

### 4. Preact ⏳ 60%
**已完成**:
- ✅ 修改 `src/engine-app.ts` - 添加 RouterConfig 接口（158行）
- ✅ 修改 `package.json` - 添加路由依赖
- ✅ 创建 `example/src/pages/Home.tsx`
- ✅ 创建 `example/src/pages/About.tsx`
- ✅ 创建 `example/src/pages/User.tsx`

**待完成**:
- ⏳ 创建 `example/src/components/Navigation.tsx`
- ⏳ 创建 `example/src/components/RouterView.tsx`
- ⏳ 更新 `example/src/main.tsx`
- ⏳ 更新 `example/src/App.tsx`
- ⏳ 更新 `example/src/App.css`
- ⏳ 更新 `example/package.json`
- ⏳ 生成 `ROUTER_INTEGRATION.md`

---

## ⏸️ 待开始的框架

### 5. Svelte - 0%
- Router 包: `@ldesign/router-svelte` ✅
- 预计时间: 45分钟
- 文件扩展名: `.svelte`

### 6. Lit - 0%
- Router 包: `@ldesign/router-lit` ✅
- 预计时间: 45分钟
- 文件扩展名: `.ts`

### 7. Qwik - 0%
- Router 包: `@ldesign/router-qwik` ✅
- 预计时间: 45分钟
- 文件扩展名: `.tsx`

### 8. Angular - 0%
- Router 包: `@ldesign/router-angular` ✅
- 预计时间: 60分钟
- 文件扩展名: `.ts`

### 9. Vue 2 - ⚠️ 跳过
- Router 包: ❌ 不存在
- 建议: 跳过此框架

---

## 📝 Preact 剩余工作详细步骤

### 步骤 1: 创建 Navigation 组件

创建文件: `packages/engine/packages/preact/example/src/components/Navigation.tsx`

```typescript
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { useEngine } from '@ldesign/engine-preact'

interface NavLinkProps {
  to: string
  children: any
}

function NavLink({ to, children }: NavLinkProps) {
  const engine = useEngine()
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (!engine.router) return

    const checkActive = () => {
      const route = engine.router!.getCurrentRoute()
      const currentPath = route.value?.path || '/'
      setIsActive(currentPath === to || currentPath.startsWith(to + '/'))
    }

    checkActive()
    const unsubscribe = engine.events.on('router:navigated', checkActive)

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [engine.router, to])

  const handleClick = (e: Event) => {
    e.preventDefault()
    if (engine.router) {
      engine.router.push(to)
    }
  }

  return (
    <a href={to} onClick={handleClick} class={`nav-link ${isActive ? 'active' : ''}`}>
      {children}
    </a>
  )
}

export default function Navigation() {
  return (
    <nav class="navigation">
      <div class="nav-brand">
        <h1>🚀 Preact + LDesign Engine</h1>
      </div>
      <div class="nav-links">
        <NavLink to="/">🏠 首页</NavLink>
        <NavLink to="/about">ℹ️ 关于</NavLink>
        <NavLink to="/user/1">👤 用户</NavLink>
      </div>
    </nav>
  )
}
```

### 步骤 2: 创建 RouterView 组件

创建文件: `packages/engine/packages/preact/example/src/components/RouterView.tsx`

```typescript
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { useEngine } from '@ldesign/engine-preact'

export default function RouterView() {
  const engine = useEngine()
  const [CurrentComponent, setCurrentComponent] = useState<any>(null)

  useEffect(() => {
    if (!engine.router) {
      console.warn('Router not available')
      return
    }

    const updateComponent = () => {
      const route = engine.router!.getCurrentRoute()
      if (route.value?.component) {
        setCurrentComponent(() => route.value.component)
      }
    }

    updateComponent()
    const unsubscribe = engine.events.on('router:navigated', updateComponent)

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [engine])

  return (
    <div class="router-view">
      {CurrentComponent ? <CurrentComponent /> : <div>Loading...</div>}
    </div>
  )
}
```

### 步骤 3: 更新 main.tsx

在 `packages/engine/packages/preact/example/src/main.tsx` 中：

1. 导入页面组件：
```typescript
import Home from './pages/Home'
import About from './pages/About'
import User from './pages/User'
```

2. 在 `createEngineApp` 配置中添加 router：
```typescript
createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'Preact Engine Demo',
    debug: true,
  },
  router: {
    mode: 'hash',
    preset: 'spa',
    routes: [
      { path: '/', component: Home, meta: { title: '首页' } },
      { path: '/about', component: About, meta: { title: '关于' } },
      { path: '/user/:id', component: User, meta: { title: '用户详情' } },
    ],
  },
  // ... 其他配置
})
```

### 步骤 4: 更新 App.tsx

修改 `packages/engine/packages/preact/example/src/App.tsx`：

```typescript
import { h } from 'preact'
import { EngineContext } from '@ldesign/engine-preact'
import Navigation from './components/Navigation'
import RouterView from './components/RouterView'
import './App.css'

export default function App({ engine }: { engine: any }) {
  return (
    <EngineContext.Provider value={engine}>
      <div class="app">
        <Navigation />
        <main class="main">
          <RouterView />
        </main>
        <footer class="footer">
          <p>Powered by @ldesign/engine-preact + @ldesign/router</p>
        </footer>
      </div>
    </EngineContext.Provider>
  )
}
```

### 步骤 5: 更新 App.css

复制 React 或 Solid 的 App.css 样式文件（包含路由相关样式）

### 步骤 6: 更新 example/package.json

在 `packages/engine/packages/preact/example/package.json` 的 dependencies 中添加：
```json
"@ldesign/router": "workspace:*",
"@ldesign/router-preact": "workspace:*"
```

### 步骤 7: 生成集成文档

创建 `packages/engine/packages/preact/ROUTER_INTEGRATION.md`（参考 React/Vue3/Solid 的文档）

---

## 🚀 后续框架快速指南

### Svelte 框架

**关键差异**:
- 文件扩展名: `.svelte`
- 使用 Svelte stores
- 使用 `on:click` 而不是 `onClick`
- 使用 `class:active` 进行条件类名

**Navigation.svelte 示例**:
```svelte
<script>
  import { onMount, onDestroy } from 'svelte'
  import { writable } from 'svelte/store'
  import { getEngine } from '@ldesign/engine-svelte'

  const engine = getEngine()
  const currentPath = writable('/')
  let unsubscribe

  onMount(() => {
    if (engine.router) {
      const route = engine.router.getCurrentRoute()
      currentPath.set(route.value?.path || '/')
      unsubscribe = engine.events.on('router:navigated', () => {
        const route = engine.router.getCurrentRoute()
        currentPath.set(route.value?.path || '/')
      })
    }
  })

  onDestroy(() => {
    if (unsubscribe) unsubscribe()
  })

  function navigate(path) {
    if (engine.router) {
      engine.router.push(path)
    }
  }
</script>

<nav class="navigation">
  <div class="nav-brand">
    <h1>🚀 Svelte + LDesign Engine</h1>
  </div>
  <div class="nav-links">
    <a href="/" on:click|preventDefault={() => navigate('/')} 
       class:active={$currentPath === '/'}>🏠 首页</a>
    <a href="/about" on:click|preventDefault={() => navigate('/about')}
       class:active={$currentPath === '/about'}>ℹ️ 关于</a>
    <a href="/user/1" on:click|preventDefault={() => navigate('/user/1')}
       class:active={$currentPath.startsWith('/user')}>👤 用户</a>
  </div>
</nav>
```

### Lit 框架

**关键差异**:
- 使用 Web Components
- 使用 decorators (`@customElement`, `@state`)
- 使用 `html` 模板标签
- 使用 `@click` 事件绑定

### Qwik 框架

**关键差异**:
- 使用 `$` 符号（如 `useSignal$`, `component$`）
- Resumability 特性
- 使用 `onClick$` 事件处理

### Angular 框架

**关键差异**:
- 使用 decorators (`@Component`, `@Injectable`)
- 使用 RxJS
- 使用依赖注入
- 可能需要与 `@angular/router` 集成

---

## 📊 预计剩余时间

| 任务 | 预计时间 |
|------|---------|
| 完成 Preact | 20分钟 |
| Svelte 集成 | 45分钟 |
| Lit 集成 | 45分钟 |
| Qwik 集成 | 45分钟 |
| Angular 集成 | 60分钟 |
| 测试所有框架 | 30分钟 |
| 生成最终文档 | 15分钟 |
| **总计** | **~4小时** |

---

## 💡 建议

1. **立即完成 Preact** - 只需 20分钟
2. **优先 Svelte** - 使用广泛
3. **然后 Lit 和 Qwik** - 覆盖更多场景
4. **最后 Angular** - 最复杂
5. **跳过 Vue 2** - router 包不存在

---

**更新时间**: 2025-11-05  
**当前状态**: Preact 60% 完成  
**下一步**: 完成 Preact 剩余 40%


# 剩余框架集成实施指南

## 📋 概述

本指南提供了完成剩余 6 个框架路由集成的详细步骤和代码模板。

**已完成**: React, Vue 3, Solid (3/9)  
**待完成**: Svelte, Lit, Preact, Qwik, Angular, Vue 2 (6/9)

---

## 🎯 统一集成模式

所有框架都遵循相同的 3 步集成模式：

### 步骤 1: 修改 engine-app.ts
在文件开头添加 RouterConfig 接口（115行，所有框架完全相同）

### 步骤 2: 修改 createEngineApp 函数
在创建引擎后、挂载前添加路由插件加载逻辑

### 步骤 3: 更新 package.json
添加 optionalDependencies 和 devDependencies

---

## 📝 RouterConfig 接口（通用）

在每个框架的 `src/engine-app.ts` 文件开头添加：

```typescript
/**
 * 路由配置接口
 */
export interface RouterConfig {
  /**
   * 路由模式
   * - history: HTML5 History 模式
   * - hash: Hash 模式
   * - memory: 内存模式（用于 SSR）
   */
  mode?: 'history' | 'hash' | 'memory'

  /**
   * 基础路径
   */
  base?: string

  /**
   * 路由配置列表
   */
  routes: RouteConfig[]

  /**
   * 预设配置
   * - spa: 单页应用优化
   * - mpa: 多页应用优化
   * - mobile: 移动端优化
   * - desktop: 桌面端优化
   * - admin: 后台管理系统优化
   * - blog: 博客系统优化
   */
  preset?: 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'

  /**
   * 滚动行为
   */
  scrollBehavior?: (to: any, from: any, savedPosition: any) => any

  /**
   * 激活链接的 class 名称
   */
  linkActiveClass?: string

  /**
   * 精确激活链接的 class 名称
   */
  linkExactActiveClass?: string

  /**
   * 预加载配置
   */
  preload?: boolean | PreloadConfig

  /**
   * 缓存配置
   */
  cache?: boolean | CacheConfig

  /**
   * 动画配置
   */
  animation?: boolean | AnimationConfig

  /**
   * 性能配置
   */
  performance?: PerformanceConfig

  /**
   * 开发配置
   */
  development?: DevelopmentConfig

  /**
   * 安全配置
   */
  security?: SecurityConfig
}

/**
 * 路由配置
 */
export interface RouteConfig {
  path: string
  component?: any
  children?: RouteConfig[]
  meta?: Record<string, any>
  [key: string]: any
}

// ... 其他接口定义（PreloadConfig, CacheConfig 等）
```

---

## 🔧 路由插件加载逻辑（通用）

在每个框架的 `createEngineApp` 函数中添加：

```typescript
// 在配置解构中添加
const {
  // ... 其他配置
  router: routerConfig,  // 新增
} = config

// 在创建引擎后添加
// 如果配置了路由，动态加载路由插件
if (routerConfig) {
  try {
    const { createRouterEnginePlugin } = await import('@ldesign/router')
    const routerPlugin = createRouterEnginePlugin({
      name: 'router',
      version: '1.0.0',
      ...routerConfig,
    })
    
    // 将路由插件添加到插件列表开头
    plugins.unshift(routerPlugin)
    
    engine.logger.info('Router plugin created successfully')
  } catch (error) {
    engine.logger.warn(
      'Failed to load @ldesign/router. Make sure it is installed if you want to use routing features.',
      error
    )
  }
}
```

---

## 📦 package.json 更新（通用）

在每个框架的 `package.json` 中添加：

```json
{
  "optionalDependencies": {
    "@ldesign/router": "workspace:*",
    "@ldesign/router-[framework]": "workspace:*"
  },
  "devDependencies": {
    "@ldesign/router": "workspace:*",
    "@ldesign/router-[framework]": "workspace:*",
    // ... 其他依赖
  }
}
```

将 `[framework]` 替换为具体框架名：
- svelte → `@ldesign/router-svelte`
- lit → `@ldesign/router-lit`
- preact → `@ldesign/router-preact`
- qwik → `@ldesign/router-qwik`
- angular → `@ldesign/router-angular`
- vue2 → `@ldesign/router-vue` (使用 vue 包测试兼容性)

---

## 🎨 框架特定示例

### Svelte 框架

**文件扩展名**: `.svelte`

**Navigation.svelte**:
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

**文件扩展名**: `.ts`

**Navigation.ts**:
```typescript
import { LitElement, html, css } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { getEngine } from '@ldesign/engine-lit'

@customElement('app-navigation')
export class Navigation extends LitElement {
  @state()
  private currentPath = '/'

  private engine = getEngine()
  private unsubscribe?: () => void

  static styles = css`
    .navigation {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 2rem;
    }
    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
    }
    .nav-link.active {
      background: rgba(255, 255, 255, 0.3);
    }
  `

  connectedCallback() {
    super.connectedCallback()
    if (this.engine.router) {
      const route = this.engine.router.getCurrentRoute()
      this.currentPath = route.value?.path || '/'
      
      this.unsubscribe = this.engine.events.on('router:navigated', () => {
        const route = this.engine.router!.getCurrentRoute()
        this.currentPath = route.value?.path || '/'
      })
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this.unsubscribe) this.unsubscribe()
  }

  private navigate(path: string) {
    if (this.engine.router) {
      this.engine.router.push(path)
    }
  }

  render() {
    return html`
      <nav class="navigation">
        <div class="nav-brand">
          <h1>🚀 Lit + LDesign Engine</h1>
        </div>
        <div class="nav-links">
          <a href="/" @click=${(e: Event) => { e.preventDefault(); this.navigate('/') }}
             class="nav-link ${this.currentPath === '/' ? 'active' : ''}">
            🏠 首页
          </a>
          <a href="/about" @click=${(e: Event) => { e.preventDefault(); this.navigate('/about') }}
             class="nav-link ${this.currentPath === '/about' ? 'active' : ''}">
            ℹ️ 关于
          </a>
          <a href="/user/1" @click=${(e: Event) => { e.preventDefault(); this.navigate('/user/1') }}
             class="nav-link ${this.currentPath.startsWith('/user') ? 'active' : ''}">
            👤 用户
          </a>
        </div>
      </nav>
    `
  }
}
```

---

## 📊 快速参考表

| 框架 | Router 包 | 文件扩展名 | 特殊说明 |
|------|----------|-----------|---------|
| Svelte | `@ldesign/router-svelte` | `.svelte` | 使用 stores |
| Lit | `@ldesign/router-lit` | `.ts` | Web Components |
| Preact | `@ldesign/router-preact` | `.tsx` | 类似 React |
| Qwik | `@ldesign/router-qwik` | `.tsx` | Resumability |
| Angular | `@ldesign/router-angular` | `.ts` | DI + Decorators |
| Vue 2 | `@ldesign/router-vue` | `.vue` | 使用 Vue 包 |

---

## ⚡ 快速实施步骤

对于每个框架：

1. **修改 engine-app.ts** (5分钟)
   - 添加 RouterConfig 接口
   - 在配置接口中添加 `router?: RouterConfig`
   - 在 createEngineApp 中添加路由插件加载逻辑

2. **更新 package.json** (1分钟)
   - 添加 optionalDependencies
   - 添加 devDependencies

3. **创建示例页面** (10分钟)
   - Home, About, User 三个页面
   - 参考已完成框架的代码

4. **创建导航组件** (10分钟)
   - Navigation 组件
   - 参考框架特定示例

5. **创建路由视图** (5分钟)
   - RouterView 组件

6. **更新示例应用** (5分钟)
   - main.* 添加路由配置
   - App.* 使用 Navigation 和 RouterView

7. **更新样式** (3分钟)
   - 复制已完成框架的样式

8. **更新示例 package.json** (1分钟)
   - 添加路由依赖

9. **生成文档** (5分钟)
   - 复制模板并调整

**总计**: 约 45分钟/框架

---

## 🎯 建议

1. **优先级**: Preact → Svelte → Lit → Qwik → Angular
2. **Vue 2**: 建议跳过（router 包不存在）
3. **测试**: 每完成一个框架立即测试
4. **文档**: 可以批量生成

---

**更新时间**: 2025-11-05  
**状态**: 实施指南  
**用途**: 快速完成剩余框架集成


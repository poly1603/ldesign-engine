# Engine-Vue3 使用指南

## 快速开始

### 1. 安装依赖

```bash
pnpm add @ldesign/engine-vue3 @ldesign/router-vue @ldesign/i18n-vue vue
```

### 2. 基础配置

```typescript
// main.ts
import { createVueEngine } from '@ldesign/engine-vue3'
import App from './App.vue'

const engine = createVueEngine({
  name: 'My App',
  debug: true,
  app: {
    rootComponent: App
  }
})

await engine.mount('#app')
```

## 集成路由

### 配置路由

```typescript
import { createVueEngine } from '@ldesign/engine-vue3'
import App from './App.vue'
import Home from './views/Home.vue'
import About from './views/About.vue'

const engine = createVueEngine({
  name: 'My App',
  debug: true,
  app: {
    rootComponent: App
  },
  // 启用路由
  router: {
    enabled: true,
    options: {
      mode: 'history',  // 或 'hash', 'memory'
      base: '/',
      routes: [
        {
          path: '/',
          name: 'home',
          component: Home,
          meta: { title: '首页' }
        },
        {
          path: '/about',
          name: 'about',
          component: About,
          meta: { title: '关于' }
        }
      ]
    }
  }
})

await engine.mount('#app')
```

### 在组件中使用路由

```vue
<template>
  <div>
    <RouterView />
    <RouterLink to="/">首页</RouterLink>
    <RouterLink to="/about">关于</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from '@ldesign/router-vue'

const router = useRouter()
const route = useRoute()

// 编程式导航
function navigate() {
  router.push('/about')
}

// 访问当前路由
console.log(route.path)
</script>
```

## 集成国际化

### 配置 I18n

```typescript
import { createVueEngine } from '@ldesign/engine-vue3'
import App from './App.vue'

const engine = createVueEngine({
  name: 'My App',
  debug: true,
  app: {
    rootComponent: App
  },
  // 启用国际化
  i18n: {
    enabled: true,
    locale: 'zh-CN',
    fallbackLocale: 'en-US',
    messages: {
      'zh-CN': {
        hello: '你好',
        welcome: '欢迎使用 LDesign'
      },
      'en-US': {
        hello: 'Hello',
        welcome: 'Welcome to LDesign'
      }
    },
    // 性能优化
    cache: true,
    cacheSize: 100,
    performance: true,
    // 持久化配置
    persistence: {
      enabled: true,
      key: 'my-app-locale'
    }
  }
})

await engine.mount('#app')
```

### 在组件中使用 I18n

```vue
<template>
  <div>
    <!-- 使用 $t 方法 -->
    <h1>{{ $t('hello') }}</h1>
    <p>{{ $t('welcome') }}</p>

    <!-- 使用 v-t 指令 -->
    <span v-t="'hello'"></span>

    <!-- 语言切换器 -->
    <select v-model="locale">
      <option value="zh-CN">中文</option>
      <option value="en-US">English</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@ldesign/i18n-vue'

const { t, locale } = useI18n()

// 使用翻译函数
const message = t('hello')
console.log(message)

// 切换语言
function changeLanguage(lang: string) {
  locale.value = lang
}
</script>
```

## 同时集成路由和国际化

### 完整配置示例

```typescript
import { createVueEngine } from '@ldesign/engine-vue3'
import App from './App.vue'
import messages from './locales'

const engine = createVueEngine({
  name: 'My App',
  debug: true,
  
  app: {
    rootComponent: App
  },
  
  // 路由配置
  router: {
    enabled: true,
    options: {
      mode: 'history',
      routes: [
        {
          path: '/',
          name: 'home',
          component: () => import('./views/Home.vue'),
          meta: { 
            title: 'home.title',  // 使用 i18n key
            requiresAuth: false 
          }
        },
        {
          path: '/profile',
          name: 'profile',
          component: () => import('./views/Profile.vue'),
          meta: { 
            title: 'profile.title',
            requiresAuth: true  // 需要认证
          }
        }
      ],
      // 路由守卫
      guards: {
        beforeEach: (to, from, next) => {
          // 权限检查
          if (to.meta.requiresAuth) {
            const isAuthenticated = checkAuth()
            if (!isAuthenticated) {
              next('/login')
              return
            }
          }
          next()
        }
      }
    }
  },
  
  // 国际化配置
  i18n: {
    enabled: true,
    locale: 'zh-CN',
    fallbackLocale: 'en-US',
    messages,
    cache: true,
    performance: true,
    persistence: {
      enabled: true,
      key: 'my-app-locale'
    }
  }
})

// 监听语言变化
engine.events.on('i18n:localeChanged', (payload) => {
  console.log('Language changed:', payload)
  // 可以在这里更新路由标题等
})

// 监听路由变化
engine.events.on('router:navigated', ({ to, from }) => {
  console.log(`Navigated from ${from.path} to ${to.path}`)
  // 更新页面标题
  document.title = to.meta.title || 'My App'
})

await engine.mount('#app')
```

### 语言包组织

```typescript
// locales/index.ts
export default {
  'zh-CN': {
    common: {
      hello: '你好',
      goodbye: '再见'
    },
    home: {
      title: '首页',
      welcome: '欢迎回来'
    },
    profile: {
      title: '个人资料',
      settings: '设置'
    }
  },
  'en-US': {
    common: {
      hello: 'Hello',
      goodbye: 'Goodbye'
    },
    home: {
      title: 'Home',
      welcome: 'Welcome back'
    },
    profile: {
      title: 'Profile',
      settings: 'Settings'
    }
  }
}
```

## 高级用法

### 访问 Engine 实例

```typescript
// main.ts
const engine = createVueEngine({...})
await engine.mount('#app')

// 暴露到全局 (仅开发环境)
if (import.meta.env.DEV) {
  window.engine = engine
}
```

```vue
<!-- 在组件中 -->
<script setup lang="ts">
import { inject } from 'vue'
import type { VueEngine } from '@ldesign/engine-vue3'

// 通过 inject 获取 engine
const engine = inject<VueEngine>('engine')

// 访问服务容器
const router = engine?.container.resolve('router')
const i18n = engine?.container.resolve('i18n')

// 访问状态管理
const currentRoute = engine?.state.get('router:current')

// 触发事件
engine?.events.emit('custom:event', { data: 'hello' })

// 监听事件
engine?.events.on('custom:event', (payload) => {
  console.log('Event received:', payload)
})
</script>
```

### 添加自定义插件

```typescript
import { createVueEngine } from '@ldesign/engine-vue3'
import type { VueEnginePlugin } from '@ldesign/engine-vue3'

// 创建自定义插件
const myPlugin: VueEnginePlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  
  async install(ctx) {
    const engine = ctx.engine
    
    // 注册服务
    engine.container.singleton('myService', {
      doSomething() {
        console.log('Doing something...')
      }
    })
    
    // 监听生命周期
    engine.lifecycle.on('mounted', () => {
      console.log('App mounted!')
    })
  },
  
  async uninstall() {
    // 清理逻辑
  }
}

const engine = createVueEngine({...})

// 使用插件
await engine.use(myPlugin)

await engine.mount('#app')
```

### 多环境配置

```typescript
// config/index.ts
const configs = {
  development: {
    router: {
      enabled: true,
      options: {
        mode: 'history',
        base: '/'
      }
    },
    i18n: {
      enabled: true,
      locale: 'zh-CN',
      debug: true
    }
  },
  production: {
    router: {
      enabled: true,
      options: {
        mode: 'history',
        base: '/app/'
      }
    },
    i18n: {
      enabled: true,
      locale: 'zh-CN',
      debug: false,
      performance: true
    }
  }
}

// main.ts
import { createVueEngine } from '@ldesign/engine-vue3'
import configs from './config'

const env = import.meta.env.MODE
const config = configs[env] || configs.development

const engine = createVueEngine({
  name: 'My App',
  environment: env,
  ...config
})

await engine.mount('#app')
```

## 调试技巧

### 开启调试模式

```typescript
const engine = createVueEngine({
  debug: true,  // 开启调试输出
  //...
})
```

### 查看路由状态

```typescript
// 在浏览器控制台
window.engine.state.get('router:current')     // 当前路由
window.engine.state.get('router:history')     // 路由历史
window.engine.state.get('router:tabs')        // 标签页
```

### 查看 I18n 状态

```typescript
// 在浏览器控制台
const i18n = window.engine.container.resolve('i18n')
i18n.getLocale()           // 当前语言
i18n.t('common.hello')     // 翻译测试
```

## 常见问题

### Q: 如何实现路由权限控制?
A: 使用路由守卫:

```typescript
router: {
  enabled: true,
  options: {
    guards: {
      beforeEach: (to, from, next) => {
        if (to.meta.requiresAuth && !isLoggedIn()) {
          next('/login')
        } else {
          next()
        }
      }
    }
  }
}
```

### Q: 如何实现语言切换后刷新路由?
A: 监听语言变化事件:

```typescript
engine.events.on('i18n:localeChanged', () => {
  // 刷新当前路由
  router.go(0)
})
```

### Q: 可以不使用 router 或 i18n 吗?
A: 可以,它们都是可选的:

```typescript
// 只使用 router
const engine = createVueEngine({
  router: { enabled: true }
  // i18n 不配置
})

// 只使用 i18n
const engine = createVueEngine({
  i18n: { enabled: true }
  // router 不配置
})

// 都不使用
const engine = createVueEngine({
  app: { rootComponent: App }
})
```

## 性能优化建议

1. **路由懒加载**: 使用动态导入
```typescript
{
  path: '/about',
  component: () => import('./views/About.vue')
}
```

2. **I18n 缓存**: 启用翻译缓存
```typescript
i18n: {
  cache: true,
  cacheSize: 200
}
```

3. **语言包拆分**: 按需加载语言包
```typescript
i18n: {
  preloadLocales: ['zh-CN'],  // 只预加载常用语言
  // 其他语言动态加载
}
```

4. **路由预加载**: 启用预加载策略
```typescript
router: {
  options: {
    preload: {
      strategy: 'hover',  // 鼠标悬停时预加载
      delay: 200
    }
  }
}
```

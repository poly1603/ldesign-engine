# Vue I18n 集成

将 LDesign Engine 与 Vue I18n 集成，实现国际化应用。

## 安装

```bash
pnpm add vue-i18n
```

## 基础集成

```typescript
import { createEngine } from '@ldesign/engine'
import { createI18n } from 'vue-i18n'
import { createApp } from 'vue'
import App from './App.vue'

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages: {
    'zh-CN': {
      welcome: '欢迎',
      hello: '你好，{name}'
    },
    'en': {
      welcome: 'Welcome',
      hello: 'Hello, {name}'
    }
  }
})

// 创建应用
const app = createApp(App)

// 使用 i18n
app.use(i18n)

// 创建并使用 Engine
const engine = createEngine({
  locale: i18n.global.locale.value
})
engine.install(app)

app.mount('#app')
```

## I18n 插件

创建 Engine 插件管理国际化：

```typescript
// plugins/i18n-plugin.ts
import type { Plugin, Engine } from '@ldesign/engine'
import type { I18n } from 'vue-i18n'

export function createI18nPlugin(i18n: I18n): Plugin {
  return {
    name: 'i18n-plugin',
    version: '1.0.0',
    
    install(engine: Engine) {
      // 添加 i18n 到 Engine
      ;(engine as any).i18n = i18n
      
      // 监听语言变化
      engine.state.watch('locale', (newLocale: string) => {
        i18n.global.locale.value = newLocale
        engine.logger.info('语言已切换', { locale: newLocale })
        engine.events.emit('locale:changed', newLocale)
      })
      
      // 同步当前语言到状态
      engine.state.set('locale', i18n.global.locale.value)
      
      // 添加语言切换方法
      ;(engine as any).setLocale = async (locale: string) => {
        // 动态加载语言包
        if (!i18n.global.availableLocales.includes(locale)) {
          try {
            const messages = await loadLocaleMessages(locale)
            i18n.global.setLocaleMessage(locale, messages)
          } catch (error) {
            engine.logger.error('加载语言包失败', error)
            throw error
          }
        }
        
        // 更新语言
        engine.state.set('locale', locale)
        
        // 保存到本地存储
        await engine.cache.set('user_locale', locale)
        
        engine.notifications.success(`语言已切换为 ${locale}`)
      }
      
      engine.logger.info('i18n 插件已安装')
    }
  }
}

async function loadLocaleMessages(locale: string) {
  // 动态导入语言包
  const messages = await import(`../locales/${locale}.json`)
  return messages.default
}
```

## 完整示例

### 1. 多语言配置

```typescript
// locales/index.ts
export const messages = {
  'zh-CN': {
    app: {
      title: 'LDesign Engine 演示',
      description: '强大的 Vue3 应用引擎'
    },
    nav: {
      home: '首页',
      about: '关于',
      contact: '联系'
    },
    user: {
      login: '登录',
      logout: '登出',
      profile: '个人资料'
    },
    messages: {
      welcome: '欢迎，{name}！',
      loginSuccess: '登录成功',
      loginFailed: '登录失败',
      saved: '已保存'
    }
  },
  'en': {
    app: {
      title: 'LDesign Engine Demo',
      description: 'Powerful Vue3 Application Engine'
    },
    nav: {
      home: 'Home',
      about: 'About',
      contact: 'Contact'
    },
    user: {
      login: 'Login',
      logout: 'Logout',
      profile: 'Profile'
    },
    messages: {
      welcome: 'Welcome, {name}!',
      loginSuccess: 'Login successful',
      loginFailed: 'Login failed',
      saved: 'Saved'
    }
  }
}
```

### 2. 语言切换组件

```vue
<template>
  <div class="locale-switcher">
    <select v-model="currentLocale" @change="changeLocale">
      <option value="zh-CN">简体中文</option>
      <option value="en">English</option>
      <option value="ja">日本語</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEngine } from '@ldesign/engine/vue'

const { locale } = useI18n()
const engine = useEngine()

const currentLocale = computed({
  get: () => locale.value,
  set: (value) => {
    locale.value = value
  }
})

async function changeLocale() {
  try {
    await (engine as any).setLocale(currentLocale.value)
  } catch (error) {
    engine.logger.error('切换语言失败', error)
    engine.notifications.error('切换语言失败')
  }
}
</script>
```

### 3. 国际化组件

```vue
<template>
  <div class="app">
    <header>
      <h1>{{ t('app.title') }}</h1>
      <p>{{ t('app.description') }}</p>
      <LocaleSwitcher />
    </header>
    
    <nav>
      <router-link to="/">{{ t('nav.home') }}</router-link>
      <router-link to="/about">{{ t('nav.about') }}</router-link>
      <router-link to="/contact">{{ t('nav.contact') }}</router-link>
    </nav>
    
    <main>
      <p>{{ t('messages.welcome', { name: userName }) }}</p>
      
      <button @click="handleLogin">
        {{ t('user.login') }}
      </button>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEngine } from '@ldesign/engine/vue'
import LocaleSwitcher from './LocaleSwitcher.vue'

const { t } = useI18n()
const engine = useEngine()

const userName = ref('Alice')

async function handleLogin() {
  try {
    // 登录逻辑...
    engine.notifications.success(t('messages.loginSuccess'))
  } catch (error) {
    engine.notifications.error(t('messages.loginFailed'))
  }
}
</script>
```

## 高级功能

### 1. 动态语言包加载

```typescript
// composables/useLocale.ts
import { useI18n } from 'vue-i18n'
import { useEngine } from '@ldesign/engine/vue'

export function useLocale() {
  const { locale, availableLocales } = useI18n()
  const engine = useEngine()
  
  async function loadAndSetLocale(newLocale: string) {
    if (!availableLocales.includes(newLocale)) {
      engine.logger.info('加载语言包', { locale: newLocale })
      
      try {
        // 从服务器加载
        const response = await fetch(`/api/locales/${newLocale}.json`)
        const messages = await response.json()
        
        // 设置消息
        i18n.global.setLocaleMessage(newLocale, messages)
        
        // 缓存语言包
        await engine.cache.set(`locale_${newLocale}`, messages, 86400000)
        
        engine.logger.info('语言包加载成功', { locale: newLocale })
      } catch (error) {
        engine.logger.error('语言包加载失败', error)
        throw error
      }
    }
    
    // 切换语言
    locale.value = newLocale
    engine.state.set('locale', newLocale)
    
    // 保存用户偏好
    await engine.cache.set('user_locale', newLocale)
    
    // 触发事件
    engine.events.emit('locale:changed', newLocale)
  }
  
  return {
    locale,
    availableLocales,
    loadAndSetLocale
  }
}
```

### 2. 自动检测用户语言

```typescript
// utils/locale.ts
export function detectUserLocale(): string {
  // 1. 检查缓存的用户偏好
  const saved = localStorage.getItem('user_locale')
  if (saved) return saved
  
  // 2. 检查浏览器语言
  const browserLang = navigator.language
  
  // 3. 映射到支持的语言
  const supportedLocales = ['zh-CN', 'en', 'ja']
  
  if (supportedLocales.includes(browserLang)) {
    return browserLang
  }
  
  // 4. 匹配语言前缀
  const langPrefix = browserLang.split('-')[0]
  const matched = supportedLocales.find(l => l.startsWith(langPrefix))
  
  return matched || 'zh-CN' // 默认语言
}

// main.ts
import { detectUserLocale } from './utils/locale'

const userLocale = detectUserLocale()

const i18n = createI18n({
  legacy: false,
  locale: userLocale,
  fallbackLocale: 'zh-CN',
  messages
})
```

### 3. 格式化工具

```typescript
// composables/useFormatters.ts
import { useI18n } from 'vue-i18n'

export function useFormatters() {
  const { locale, n, d } = useI18n()
  
  function formatCurrency(amount: number, currency = 'CNY') {
    return n(amount, {
      style: 'currency',
      currency,
      locale: locale.value
    })
  }
  
  function formatDate(date: Date | number, format: 'short' | 'long' = 'short') {
    return d(date, format, locale.value)
  }
  
  function formatNumber(num: number, options?: Intl.NumberFormatOptions) {
    return n(num, options || {}, locale.value)
  }
  
  function formatRelativeTime(date: Date) {
    const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
    const diff = date.getTime() - Date.now()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (Math.abs(days) > 0) return rtf.format(days, 'day')
    if (Math.abs(hours) > 0) return rtf.format(hours, 'hour')
    if (Math.abs(minutes) > 0) return rtf.format(minutes, 'minute')
    return rtf.format(seconds, 'second')
  }
  
  return {
    formatCurrency,
    formatDate,
    formatNumber,
    formatRelativeTime
  }
}
```

### 4. 使用示例

```vue
<template>
  <div class="product">
    <h2>{{ product.name }}</h2>
    <p class="price">{{ formatCurrency(product.price) }}</p>
    <p class="date">{{ formatRelativeTime(product.createdAt) }}</p>
    <p class="stock">{{ formatNumber(product.stock) }} {{ t('product.inStock') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useFormatters } from '@/composables/useFormatters'

const { t } = useI18n()
const { formatCurrency, formatNumber, formatRelativeTime } = useFormatters()

const product = {
  name: 'Product Name',
  price: 99.99,
  stock: 1000,
  createdAt: new Date('2024-01-01')
}
</script>
```

## 最佳实践

### 1. 组织语言文件

```
locales/
├── zh-CN/
│   ├── common.json
│   ├── user.json
│   ├── product.json
│   └── index.ts
├── en/
│   ├── common.json
│   ├── user.json
│   ├── product.json
│   └── index.ts
└── index.ts
```

### 2. 类型安全的翻译

```typescript
// types/i18n.d.ts
import 'vue-i18n'

declare module 'vue-i18n' {
  export interface DefineLocaleMessage {
    app: {
      title: string
      description: string
    }
    messages: {
      welcome: string
      loginSuccess: string
    }
  }
}
```

### 3. 缺失翻译处理

```typescript
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  missing: (locale, key) => {
    engine.logger.warn('缺失翻译', { locale, key })
    // 上报到服务器
    reportMissingTranslation(locale, key)
    return key
  }
})
```

## 总结

LDesign Engine 与 Vue I18n 的集成提供了：

- ✅ 完整的国际化支持
- ✅ 动态语言包加载
- ✅ 自动语言检测
- ✅ 丰富的格式化工具
- ✅ 类型安全的翻译

## 相关资源

- [Vue I18n 文档](https://vue-i18n.intlify.dev/)
- [Engine 状态管理](/guide/state)
- [Engine 缓存系统](/guide/cache)



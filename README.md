# LDesign Engine

通用前端应用引擎系统,提供框架无关的核心功能和多框架适配器。

## 📦 包结构

```
packages/engine/packages/
├── core/           # @ldesign/engine-core - 核心引擎包
├── vue2/           # @ldesign/engine-vue2 - Vue 2 适配器
├── vue3/           # @ldesign/engine-vue3 - Vue 3 适配器
├── react/          # @ldesign/engine-react - React 适配器
├── svelte/         # @ldesign/engine-svelte - Svelte 适配器
├── solid/          # @ldesign/engine-solid - Solid 适配器
└── angular/        # @ldesign/engine-angular - Angular 适配器
```

## ✨ 核心特性

### 统一的 API

所有框架适配器提供完全一致的 API:

```typescript
import { createEngineApp } from '@ldesign/engine-vue3' // 或 vue2, react, svelte 等

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: { name: 'My App', debug: true },
  plugins: [myPlugin],
  middleware: [myMiddleware],
})
```

### 核心功能

- ✅ **插件系统** - 可复用的功能扩展
- ✅ **中间件系统** - 请求/响应处理链
- ✅ **生命周期管理** - 统一的生命周期钩子
- ✅ **事件系统** - 发布/订阅模式
- ✅ **状态管理** - 全局状态管理
- ✅ **TypeScript** - 完整的类型支持

## 🚀 快速开始

### 安装

```bash
# Vue 3
pnpm add @ldesign/engine-vue3

# Vue 2
pnpm add @ldesign/engine-vue2

# React
pnpm add @ldesign/engine-react
```

### 使用示例

#### Vue 3

```typescript
import { createEngineApp, definePlugin } from '@ldesign/engine-vue3'
import App from './App.vue'

// 定义插件
const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    context.engine.state.set('count', 0)
  }
})

// 创建应用
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  plugins: [myPlugin],
})
```

#### React

```typescript
import { createEngineApp } from '@ldesign/engine-react'
import App from './App'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
})
```

## 📚 文档

### 核心包

- [@ldesign/engine-core](./packages/core/README.md) - 核心引擎文档

### 框架适配器

- [@ldesign/engine-vue2](./packages/vue2/README.md) - Vue 2 适配器文档
- [@ldesign/engine-vue3](./packages/vue3/README.md) - Vue 3 适配器文档
- [@ldesign/engine-react](./packages/react/README.md) - React 适配器文档

## 🏗️ 架构设计

### 两层架构

1. **核心引擎层** (`@ldesign/engine-core`)
   - 框架无关的核心功能
   - 插件、中间件、生命周期、事件、状态管理

2. **框架适配器层** (`@ldesign/engine-*`)
   - 桥接框架特性到核心引擎
   - 提供框架特定的 API 和组合式函数

### 设计原则

- **框架无关** - 核心功能不依赖任何框架
- **统一 API** - 所有框架使用相同的 API
- **可扩展** - 通过插件和中间件扩展功能
- **类型安全** - 完整的 TypeScript 类型支持
- **轻量级** - 最小化依赖,按需加载

## 🔌 跨插件通信最佳实践

### 概述

Engine 提供了两种主要的跨插件通信机制：

1. **状态管理（State）** - 用于共享数据
2. **事件系统（Events）** - 用于响应式通知

### 1. 使用命名空间的状态键

为了避免不同插件之间的状态键冲突，**必须**使用命名空间前缀。

#### ✅ 推荐做法

```typescript
import { definePlugin, StateKeys } from '@ldesign/engine-vue3'

const myPlugin = definePlugin({
  name: 'my-plugin',
  install(context) {
    // 使用预定义的状态键（类型安全）
    context.engine.state.set(StateKeys.I18N_LOCALE, 'zh-CN')

    // 或使用自定义命名空间
    context.engine.state.set('myPlugin:config', { theme: 'dark' })
  }
})
```

#### ❌ 不推荐做法

```typescript
// 不要使用没有命名空间的键，容易冲突
context.engine.state.set('locale', 'zh-CN')
context.engine.state.set('config', { theme: 'dark' })
```

### 2. 使用类型化的事件

事件是插件间通信的主要方式，应该包含完整的上下文信息。

#### ✅ 推荐做法

```typescript
import { definePlugin, EventKeys } from '@ldesign/engine-vue3'

const i18nPlugin = definePlugin({
  name: 'i18n',
  install(context) {
    const changeLocale = (newLocale: string) => {
      const oldLocale = context.engine.state.get(StateKeys.I18N_LOCALE)

      // 更新状态
      context.engine.state.set(StateKeys.I18N_LOCALE, newLocale)

      // 发送类型化的事件，包含完整上下文
      context.engine.events.emit(EventKeys.I18N_LOCALE_CHANGED, {
        locale: newLocale,
        oldLocale: oldLocale || 'en-US'
      })
    }
  }
})

// 其他插件监听事件
const colorPlugin = definePlugin({
  name: 'color',
  install(context) {
    // 监听语言变化事件
    context.engine.events.on(EventKeys.I18N_LOCALE_CHANGED, ({ locale, oldLocale }) => {
      console.log(`Locale changed from ${oldLocale} to ${locale}`)
      // 更新 color 插件的语言
      updateColorLocale(locale)
    })
  }
})
```

#### ❌ 不推荐做法

```typescript
// 不要发送缺少上下文的事件
context.engine.events.emit('localeChanged', 'zh-CN') // 缺少旧值

// 不要使用没有命名空间的事件名
context.engine.events.emit('changed', { locale: 'zh-CN' }) // 太通用
```

### 3. 声明可选依赖

插件可以依赖其他插件，但应该优雅地处理依赖不存在的情况。

#### ✅ 推荐做法

```typescript
import { definePlugin, StateKeys } from '@ldesign/engine-vue3'

const colorPlugin = definePlugin({
  name: 'color',
  // 不在 dependencies 中强制要求 i18n
  dependencies: [],

  install(context) {
    // 方式 1: 从容器获取 i18n 实例（推荐）
    let i18nInstance = null
    try {
      if (context.container?.has('i18n')) {
        i18nInstance = context.container.resolve('i18n')
        console.log('[Color] Found i18n instance, will use external i18n')
      }
    } catch (error) {
      console.log('[Color] No i18n instance found, using built-in locales')
    }

    // 方式 2: 从状态读取初始值
    const initialLocale = context.engine.state.get(StateKeys.I18N_LOCALE) || 'zh-CN'

    // 方式 3: 监听事件（响应式更新）
    context.engine.events.on(EventKeys.I18N_LOCALE_CHANGED, ({ locale }) => {
      console.log('[Color] Locale changed to:', locale)
      updateColorLocale(locale)
    })

    // 如果有 i18n 实例，优先使用；否则使用内置
    const locale = i18nInstance?.getLocale() || initialLocale
    initColorWithLocale(locale)
  }
})
```

#### ❌ 不推荐做法

```typescript
// 不要强制依赖其他插件（除非真的必需）
const colorPlugin = definePlugin({
  name: 'color',
  dependencies: ['i18n'], // 这会强制要求安装 i18n

  install(context) {
    // 假设 i18n 一定存在，不处理不存在的情况
    const i18n = context.container.resolve('i18n')
    // 如果 i18n 不存在，这里会报错
  }
})
```

### 4. 完整示例：I18n 与 Color 集成

```typescript
import {
  definePlugin,
  StateKeys,
  EventKeys,
  type EnhancedPluginContext
} from '@ldesign/engine-vue3'

// I18n 插件
const i18nPlugin = definePlugin({
  name: 'i18n',
  version: '1.0.0',

  install(context: EnhancedPluginContext, options) {
    const i18n = createI18n(options)

    // 1. 注册到容器（供其他插件使用）
    context.container?.singleton('i18n', i18n)

    // 2. 保存状态
    context.engine.state.set(StateKeys.I18N_LOCALE, i18n.locale)
    context.engine.state.set(StateKeys.I18N_AVAILABLE_LOCALES, i18n.availableLocales)

    // 3. 监听语言变化，发送事件
    i18n.on('localeChange', (locale: string, oldLocale: string) => {
      context.engine.state.set(StateKeys.I18N_LOCALE, locale)
      context.engine.events.emit(EventKeys.I18N_LOCALE_CHANGED, { locale, oldLocale })
    })

    // 4. 发送安装完成事件
    context.engine.events.emit(EventKeys.I18N_INSTALLED, {
      i18n,
      locale: i18n.locale
    })
  }
})

// Color 插件
const colorPlugin = definePlugin({
  name: 'color',
  version: '1.0.0',
  // 不强制依赖 i18n
  dependencies: [],

  install(context: EnhancedPluginContext, options) {
    const themeAdapter = createThemeAdapter(options)

    // 1. 尝试从容器获取 i18n（可选依赖）
    let i18nInstance = null
    if (context.container?.has('i18n')) {
      i18nInstance = context.container.resolve('i18n')
    }

    // 2. 获取初始语言（优先使用 i18n，否则使用状态，最后使用默认值）
    const initialLocale =
      i18nInstance?.getLocale() ||
      context.engine.state.get(StateKeys.I18N_LOCALE) ||
      'zh-CN'

    // 3. 设置初始语言
    themeAdapter.setLocale(initialLocale)

    // 4. 监听语言变化事件（响应式更新）
    context.engine.events.on(EventKeys.I18N_LOCALE_CHANGED, ({ locale }) => {
      console.log('[Color] Locale changed to:', locale)
      themeAdapter.setLocale(locale)
    })

    // 5. 注册到容器
    context.container?.singleton('color', themeAdapter)

    // 6. 保存状态
    context.engine.state.set(StateKeys.COLOR_PRIMARY, options.primaryColor)
    context.engine.state.set(StateKeys.COLOR_MODE, options.mode)

    // 7. 发送安装完成事件
    context.engine.events.emit(EventKeys.COLOR_INSTALLED, {
      primaryColor: options.primaryColor,
      mode: options.mode
    })
  }
})

// 应用中使用
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  plugins: [
    i18nPlugin({ locale: 'zh-CN', messages: { ... } }),
    colorPlugin({ primaryColor: '#1890ff', mode: 'light' })
  ]
})
```

### 5. 预定义的状态键和事件键

Engine 提供了预定义的状态键和事件键，确保类型安全：

```typescript
import { StateKeys, EventKeys } from '@ldesign/engine-vue3'

// 状态键
StateKeys.I18N_LOCALE              // 'i18n:locale'
StateKeys.I18N_FALLBACK_LOCALE     // 'i18n:fallbackLocale'
StateKeys.I18N_AVAILABLE_LOCALES   // 'i18n:availableLocales'
StateKeys.COLOR_PRIMARY            // 'color:primaryColor'
StateKeys.COLOR_THEME_NAME         // 'color:themeName'
StateKeys.COLOR_MODE               // 'color:mode'
StateKeys.ROUTER_MODE              // 'router:mode'
StateKeys.ROUTER_BASE              // 'router:base'

// 事件键
EventKeys.I18N_INSTALLED           // 'i18n:installed'
EventKeys.I18N_LOCALE_CHANGED      // 'i18n:localeChanged'
EventKeys.COLOR_INSTALLED          // 'color:installed'
EventKeys.COLOR_THEME_CHANGED      // 'color:themeChanged'
EventKeys.COLOR_MODE_CHANGED       // 'color:modeChanged'
EventKeys.ROUTER_INSTALLED         // 'router:installed'
EventKeys.ROUTER_NAVIGATED         // 'router:navigated'
```

### 6. 最佳实践总结

1. ✅ **使用命名空间** - 所有状态键和事件名都使用 `<plugin>:<key>` 格式
2. ✅ **使用预定义常量** - 优先使用 `StateKeys` 和 `EventKeys` 常量
3. ✅ **事件包含完整上下文** - 事件负载应包含新值和旧值
4. ✅ **可选依赖** - 不强制依赖其他插件，优雅处理不存在的情况
5. ✅ **三种通信方式结合** - 容器依赖注入 + 状态读取 + 事件监听
6. ✅ **类型安全** - 使用 TypeScript 类型定义，避免运行时错误
7. ✅ **文档注释** - 为插件添加详细的 JSDoc 注释

## 🔧 开发

### 构建所有包

```bash
pnpm --filter "@ldesign/engine-*" build
```

### 开发模式

```bash
pnpm --filter "@ldesign/engine-core" dev
```

### 运行测试

```bash
pnpm --filter "@ldesign/engine-*" test
```

## 📄 License

MIT


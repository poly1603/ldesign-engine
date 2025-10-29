# @ldesign/engine

[![npm version](https://img.shields.io/npm/v/@ldesign/engine.svg)](https://www.npmjs.com/package/@ldesign/engine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

> 🚀 现代化、多框架通用的应用引擎 - 统一的插件系统、中间件、状态管理和事件系统

## ✨ 特性

- **🎯 框架无关**: 核心功能完全框架无关,可在任何 JavaScript 环境运行
- **🔌 统一插件系统**: 一次编写,所有框架通用的插件系统
- **⚡️ 多框架支持**: 开箱即用支持 Vue 3, React, Angular, Svelte, Solid 等 15+ 框架
- **🎨 内置功能插件**: i18n、主题切换、全局尺寸控制等开箱即用
- **📦 模块化设计**: 按需引入,Tree-shaking 友好
- **🔒 类型安全**: 完整的 TypeScript 类型定义
- **🎪 丰富的管理器**: 状态、事件、缓存、日志、配置、生命周期等
- **⚙️ 高性能**: 优化的性能和最小化的打包体积
- **🔧 高度可扩展**: 通过插件和中间件轻松扩展功能

## 📦 安装

```bash
# 使用 pnpm (推荐)
pnpm add @ldesign/engine

# 使用 npm
npm install @ldesign/engine

# 使用 yarn
yarn add @ldesign/engine
```

## 🚀 快速开始

### Vue 3

```typescript
import { createEngineApp } from '@ldesign/engine-vue'
import { createI18nPlugin, createThemePlugin } from '@ldesign/engine-core'
import App from './App.vue'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  plugins: [
    createI18nPlugin({
      locale: 'zh-CN',
      fallbackLocale: 'en-US',
      messages: {
        'zh-CN': { hello: '你好' },
        'en-US': { hello: 'Hello' }
      }
    }),
    createThemePlugin({
      defaultTheme: 'light',
      themes: {
        light: { variables: { 'primary-color': '#1890ff' } },
        dark: { variables: { 'primary-color': '#177ddc' } }
      }
    })
  ]
})

// 使用插件功能
engine.setLocale('en-US')
engine.setTheme('dark')
```

### React

```typescript
import { createEngineApp } from '@ldesign/engine-react'
import { createI18nPlugin } from '@ldesign/engine-core'
import App from './App'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#root',
  plugins: [createI18nPlugin({ /* ... */ })]
})
```

## 📚 文档

完整文档请访问: [Documentation](./docs/index.md)

- [快速开始](./docs/guide/getting-started.md)
- [核心概念](./docs/guide/core-concepts.md)
- [插件开发](./docs/guide/plugin-development.md)
- [API 参考](./docs/api/README.md)
- [架构设计](./ARCHITECTURE.md)

## 🌐 支持的框架

| 框架 | 包名 | 状态 |
|------|------|------|
| Vue 3 | `@ldesign/engine-vue` | ✅ |
| React | `@ldesign/engine-react` | ✅ |
| Angular | `@ldesign/engine-angular` | 🚧 |
| Svelte | `@ldesign/engine-svelte` | 🚧 |
| Solid | `@ldesign/engine-solid` | 🚧 |

## 📝 许可证

[MIT](./LICENSE) © ldesign

---

**Made with ❤️ by the ldesign team**

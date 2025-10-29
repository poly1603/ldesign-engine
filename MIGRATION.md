# 迁移指南

从旧版本迁移到 v1.0.0 (新架构)

## 📋 概述

v1.0.0 带来了全新的架构设计,主要变更包括:

1. **包结构重组**: 核心功能与框架适配器分离
2. **统一插件系统**: 所有框架使用相同的插件
3. **一致的 API**: 跨框架的统一接口
4. **更好的类型支持**: 完整的 TypeScript 类型定义

## 🔄 主要变更

### 1. 包导入变更

#### 旧版本 (v0.x)
```typescript
import { createEngineApp } from '@ldesign/engine'
```

#### 新版本 (v1.x)
```typescript
// 方式 1: 从主包导入 (包含 core + vue)
import { createEngineApp } from '@ldesign/engine'

// 方式 2: 从框架特定包导入 (推荐)
import { createEngineApp } from '@ldesign/engine-vue'

// 方式 3: 仅使用核心功能
import { createCoreEngine } from '@ldesign/engine-core'
```

### 2. 插件系统变更

#### 旧版本
```typescript
// 插件可能分散在不同位置
import { i18nPlugin } from '@ldesign/engine/plugins'
import { themePlugin } from '@ldesign/engine-vue/plugins'
```

#### 新版本
```typescript
// 所有插件统一从核心包导入
import { 
  createI18nPlugin, 
  createThemePlugin, 
  createSizePlugin 
} from '@ldesign/engine-core'
```

### 3. 配置结构变更

#### 旧版本
```typescript
const engine = await createEngineApp({
  app: App,
  mount: '#app',
  options: {
    i18n: { /* ... */ },
    theme: { /* ... */ }
  }
})
```

#### 新版本
```typescript
const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My App',
    debug: true
  },
  plugins: [
    createI18nPlugin({ /* ... */ }),
    createThemePlugin({ /* ... */ })
  ]
})
```

## 📝 详细迁移步骤

### 步骤 1: 更新依赖

```bash
# 移除旧版本
pnpm remove @ldesign/engine

# 安装新版本
pnpm add @ldesign/engine-core @ldesign/engine-vue
# 或其他框架: @ldesign/engine-react, @ldesign/engine-angular 等
```

### 步骤 2: 更新导入语句

**Vue 项目:**
```typescript
// 旧
import { createEngineApp } from '@ldesign/engine'

// 新
import { createEngineApp } from '@ldesign/engine-vue'
import { createI18nPlugin } from '@ldesign/engine-core'
```

**React 项目:**
```typescript
// 新
import { createEngineApp } from '@ldesign/engine-react'
import { createI18nPlugin } from '@ldesign/engine-core'
```

### 步骤 3: 重构插件配置

**i18n 插件:**
```typescript
// 旧
const engine = await createEngineApp({
  // ...
  options: {
    i18n: {
      locale: 'zh-CN',
      messages: { /* ... */ }
    }
  }
})

// 新
const engine = await createEngineApp({
  // ...
  plugins: [
    createI18nPlugin({
      locale: 'zh-CN',
      fallbackLocale: 'en-US',
      messages: { /* ... */ }
    })
  ]
})
```

**主题插件:**
```typescript
// 旧
const engine = await createEngineApp({
  // ...
  options: {
    theme: {
      current: 'light',
      themes: { /* ... */ }
    }
  }
})

// 新
const engine = await createEngineApp({
  // ...
  plugins: [
    createThemePlugin({
      defaultTheme: 'light',
      themes: { /* ... */ },
      persist: true
    })
  ]
})
```

### 步骤 4: 更新 API 调用

大部分 API 保持兼容,但有些方法名称有变更:

```typescript
// 语言切换 (兼容)
engine.setLocale('en-US') // ✅ 依然有效
engine.getLocale() // ✅ 依然有效

// 主题切换 (兼容)
engine.setTheme('dark') // ✅ 依然有效
engine.getTheme() // ✅ 依然有效

// 新增: 尺寸控制
engine.setSize('large') // ✨ 新功能
engine.getSize() // ✨ 新功能
```

### 步骤 5: 测试应用

运行测试确保一切正常:

```bash
pnpm test
pnpm dev
```

## 🎯 框架特定迁移

### Vue 3

**组合式 API 使用:**
```typescript
// 在组件中
import { useEngine } from '@ldesign/engine-vue'

export default {
  setup() {
    const engine = useEngine()
    
    const switchLanguage = () => {
      engine.setLocale('en-US')
    }
    
    return { engine, switchLanguage }
  }
}
```

### React

**Hooks 使用:**
```typescript
import { useEngine } from '@ldesign/engine-react'

function MyComponent() {
  const engine = useEngine()
  
  const switchLanguage = () => {
    engine.setLocale('en-US')
  }
  
  return <button onClick={switchLanguage}>Switch Language</button>
}
```

## ⚠️ 破坏性变更

### 1. 包结构
- `@ldesign/engine` 现在是聚合包,建议使用框架特定包
- 核心功能移至 `@ldesign/engine-core`

### 2. 插件 API
- 插件配置从 `options` 移至 `plugins` 数组
- 插件需要使用工厂函数创建 (如 `createI18nPlugin`)

### 3. 配置字段
- `app` → `rootComponent`
- `mount` → `mountElement`
- `options` → `config` + `plugins`

### 4. 移除的功能
- 旧的内置 i18n 配置 (改用插件)
- 旧的内置主题配置 (改用插件)

## 💡 最佳实践

### 1. 使用框架特定包
```typescript
// ✅ 推荐
import { createEngineApp } from '@ldesign/engine-vue'

// ⚠️ 不推荐
import { createEngineApp } from '@ldesign/engine'
```

### 2. 插件按需引入
```typescript
// ✅ 只导入需要的插件
import { createI18nPlugin } from '@ldesign/engine-core'

// ⚠️ 避免导入所有内容
import * as Engine from '@ldesign/engine-core'
```

### 3. 类型定义
```typescript
import type { CoreEngine } from '@ldesign/engine-core'
import type { Vue3Engine } from '@ldesign/engine-vue'
```

## 🆘 常见问题

### Q: 我的项目使用多个框架,如何处理?

A: 每个框架使用对应的适配器包,插件从核心包统一导入:

```typescript
// Vue 应用
import { createEngineApp as createVueApp } from '@ldesign/engine-vue'
import { createI18nPlugin } from '@ldesign/engine-core'

// React 应用
import { createEngineApp as createReactApp } from '@ldesign/engine-react'
import { createI18nPlugin } from '@ldesign/engine-core' // 同一个插件!
```

### Q: 旧的插件还能用吗?

A: 旧插件需要适配新的插件 API。参考 [插件开发指南](./docs/guide/plugin-development.md)

### Q: 如何回退到旧版本?

A: 在 `package.json` 中指定版本:

```json
{
  "dependencies": {
    "@ldesign/engine": "^0.3.0"
  }
}
```

### Q: 新版本有性能提升吗?

A: 是的! 新架构带来:
- 更小的 bundle size (按需加载)
- 更好的 Tree-shaking
- 优化的插件系统

## 📚 更多资源

- [架构设计文档](./ARCHITECTURE.md)
- [完整文档](./docs/index.md)
- [API 参考](./docs/api/README.md)
- [示例项目](./examples/README.md)

## 🤝 获取帮助

如果遇到问题:

1. 查看 [常见问题](./docs/guide/faq.md)
2. 查看 [故障排查](./docs/guide/troubleshooting.md)
3. 提交 [GitHub Issue](https://github.com/your-org/ldesign/issues)
4. 加入社区讨论

---

**迁移愉快! 🚀**

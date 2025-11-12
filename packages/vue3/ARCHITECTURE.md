# Engine-Vue3 架构设计

## 概述

`@ldesign/engine-vue3` 是一个轻量级的 Vue3 应用引擎,通过**适配器模式 + 插件聚合**的架构,实现对 `router` 和 `i18n` 功能包的统一集成。

## 核心设计原则

### 1. 职责单一
- **engine-vue3**: 仅作为集成层和统一入口
- **router-vue**: 负责路由的核心逻辑和 Vue 适配
- **i18n-vue**: 负责国际化的核心逻辑和 Vue 适配

### 2. 依赖解耦
```
app-vue
  ↓ (依赖)
engine-vue3
  ↓ (peerDependencies - optional)
router-vue ────→ router-core
i18n-vue   ────→ i18n-core
```

### 3. 插件委托模式
engine-vue3 中的插件不实现具体功能,而是**委托**给各功能包的 engine-plugin:

```typescript
// engine-vue3/src/plugins/router-plugin.ts
export function createRouterPlugin(config) {
  return {
    async install(ctx) {
      // 委托给 router-vue 的 engine-plugin
      const { createRouterEnginePlugin } = await import('@ldesign/router-vue/plugins')
      const plugin = createRouterEnginePlugin(config)
      await plugin.install(ctx, config)
    }
  }
}
```

## 架构层级

### Layer 1: 应用层 (app-vue)
```json
{
  "dependencies": {
    "@ldesign/engine-vue3": "workspace:*",
    "@ldesign/router-vue": "workspace:*",  // 显式依赖,用于类型提示
    "@ldesign/i18n-vue": "workspace:*",    // 显式依赖,用于类型提示
    "vue": "^3.4.0"
  }
}
```

**使用方式:**
```typescript
import { createVueEngine } from '@ldesign/engine-vue3'

const engine = createVueEngine({
  router: { enabled: true, options: {...} },
  i18n: { enabled: true, locale: 'zh-CN', ... }
})

await engine.mount('#app')
```

### Layer 2: 引擎层 (engine-vue3)
```json
{
  "dependencies": {
    "@ldesign/engine-core": "workspace:*"
  },
  "peerDependencies": {
    "vue": "^3.3.0",
    "@ldesign/router-vue": "workspace:*",  // 可选
    "@ldesign/i18n-vue": "workspace:*"     // 可选
  },
  "peerDependenciesMeta": {
    "@ldesign/router-vue": { "optional": true },
    "@ldesign/i18n-vue": { "optional": true }
  }
}
```

**功能:**
- 提供 `VueEngine` 类
- 提供 router 和 i18n 的集成插件(委托模式)
- 管理 Vue 应用生命周期
- 提供服务容器和配置管理

### Layer 3: 功能适配层 (router-vue, i18n-vue)

#### router-vue
```typescript
// 导出两种插件
export {
  createRouterPlugin,        // Vue Plugin - 标准 Vue 应用使用
  createRouterEnginePlugin   // Engine Plugin - LDesign Engine 使用
}
```

#### i18n-vue
```typescript
// 导出两种插件
export {
  createI18nPlugin,          // Vue Plugin - 标准 Vue 应用使用
  createI18nEnginePlugin     // Engine Plugin - LDesign Engine 使用
}
```

### Layer 4: 核心层 (router-core, i18n-core)
框架无关的核心逻辑实现

## 插件系统设计

### 1. 标准 Vue 插件 (Vue Plugin)
用于普通 Vue 应用:
```typescript
import { createApp } from 'vue'
import { createI18nPlugin } from '@ldesign/i18n-vue'
import { createRouterPlugin } from '@ldesign/router-vue'

const app = createApp(App)
app.use(createI18nPlugin(i18n))
app.use(createRouterPlugin(router))
```

### 2. 引擎插件 (Engine Plugin)
用于 LDesign Engine 应用:
```typescript
import { createVueEngine } from '@ldesign/engine-vue3'

// engine-vue3 内部会自动调用 router-vue 和 i18n-vue 的 engine-plugin
const engine = createVueEngine({
  router: { enabled: true },
  i18n: { enabled: true }
})
```

## 关键流程

### 路由集成流程
```
1. app-vue 配置 router: { enabled: true }
   ↓
2. engine-vue3 检测到 router 配置
   ↓
3. engine-vue3 动态导入 @ldesign/router-vue/plugins
   ↓
4. 调用 createRouterEnginePlugin(config)
   ↓
5. router-vue 的 engine-plugin 执行实际集成
   ↓
6. 注册 router 服务到 engine.container
   ↓
7. 安装到 Vue 应用
```

### I18n 集成流程
```
1. app-vue 配置 i18n: { enabled: true }
   ↓
2. engine-vue3 检测到 i18n 配置
   ↓
3. engine-vue3 动态导入 @ldesign/i18n-vue/plugins
   ↓
4. 调用 createI18nEnginePlugin(config)
   ↓
5. i18n-vue 的 engine-plugin 执行实际集成
   ↓
6. 创建 i18n 实例并初始化
   ↓
7. 安装到 Vue 应用,注册指令和组件
```

## 优势总结

### ✅ 避免循环依赖
- engine-vue3 使用 `peerDependencies` 声明对 router-vue 和 i18n-vue 的可选依赖
- router-vue 和 i18n-vue **不依赖** engine

### ✅ 代码复用
- engine-vue3 的插件只是薄薄的委托层
- 核心逻辑在 router-vue 和 i18n-vue 的 engine-plugin 中
- 避免代码重复

### ✅ 灵活性
- 可以单独使用 router-vue 或 i18n-vue (标准 Vue 应用)
- 也可以通过 engine-vue3 统一集成 (Engine 应用)
- 功能包可以独立演进

### ✅ 可维护性
- 每个包职责清晰
- 插件逻辑集中在功能包内
- engine-vue3 只负责编排和组合

## 最佳实践

### 应用开发者
```typescript
// ✅ 推荐: 使用 engine-vue3 统一集成
import { createVueEngine } from '@ldesign/engine-vue3'

const engine = createVueEngine({
  router: { enabled: true, options: {...} },
  i18n: { enabled: true, locale: 'zh-CN' }
})
```

### 功能包开发者
```typescript
// ✅ router-vue 和 i18n-vue 应该:
// 1. 导出标准 Vue Plugin
// 2. 导出 Engine Plugin
// 3. 不依赖 engine

// router-vue/src/plugins/index.ts
export { createRouterPlugin }      // for standard Vue
export { createRouterEnginePlugin } // for LDesign Engine
```

### Engine 开发者
```typescript
// ✅ engine-vue3 应该:
// 1. 使用委托模式集成功能包
// 2. 动态导入,避免硬依赖
// 3. 优雅处理功能包不可用的情况

try {
  const { createRouterEnginePlugin } = await import('@ldesign/router-vue/plugins')
  await plugin.install(ctx)
} catch (error) {
  // 功能包不可用,静默失败或警告
}
```

## 扩展性

添加新功能包(如 store-vue)时:

1. 在 engine-vue3 添加配置接口
```typescript
interface VueEngineConfig {
  store?: { enabled: boolean; options?: any }
}
```

2. 创建委托插件
```typescript
// engine-vue3/src/plugins/store-plugin.ts
export function createStorePlugin(config) {
  return {
    async install(ctx) {
      const { createStoreEnginePlugin } = await import('@ldesign/store-vue/plugins')
      await createStoreEnginePlugin(config).install(ctx)
    }
  }
}
```

3. 在 engine 中注册
```typescript
if (config.store?.enabled) {
  await this.installStore()
}
```

完全遵循现有模式,无需修改核心架构!

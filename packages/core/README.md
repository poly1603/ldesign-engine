# @ldesign/engine-core

框架无关的核心引擎包,提供插件系统、中间件、生命周期管理等核心功能。

## 安装

```bash
pnpm add @ldesign/engine-core
```

## 使用

```typescript
import { 
  createCoreEngine,
  definePlugin,
  defineMiddleware 
} from '@ldesign/engine-core'

// 创建核心引擎
const engine = createCoreEngine({
  name: 'My App',
  debug: true,
})

// 初始化引擎
await engine.init()

// 使用插件
const myPlugin = definePlugin({
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    console.log('Plugin installed')
  }
})

await engine.use(myPlugin)
```

## 功能

- ✅ 插件系统
- ✅ 中间件系统
- ✅ 生命周期管理
- ✅ 事件系统
- ✅ 状态管理
- ✅ 缓存管理
- ✅ 依赖注入
- ✅ 配置管理
- ✅ 日志系统

## 文档

查看完整文档: [packages/engine/UNIVERSAL_ENGINE_ARCHITECTURE.md](../../UNIVERSAL_ENGINE_ARCHITECTURE.md)


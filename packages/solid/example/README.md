# Solid + LDesign Engine 示例

这是一个使用 `@ldesign/engine-solid` 和 Solid.js 构建的完整示例项目,展示了如何在 Solid 应用中使用 LDesign Engine 的所有核心功能。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## 📦 功能展示

本示例展示了以下功能:

### 1. 插件系统 (PluginDemo)

- ✅ 动态安装插件
- ✅ 动态卸载插件
- ✅ 插件依赖管理
- ✅ 插件生命周期
- ✅ 查看已安装插件列表

**示例代码:**

```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(context) {
    console.log('Plugin installed!')
    // 插件逻辑
  },
}

await engine.use(myPlugin)
```

### 2. 中间件系统 (MiddlewareDemo)

- ✅ 洋葱模型中间件
- ✅ 优先级控制
- ✅ 中间件链执行
- ✅ 动态添加中间件
- ✅ 执行日志记录

**示例代码:**

```typescript
const myMiddleware = {
  name: 'my-middleware',
  priority: 100,
  async execute(context, next) {
    console.log('Before')
    await next()
    console.log('After')
  },
}

engine.middleware.use(myMiddleware)
await engine.middleware.execute({ data: {} })
```

### 3. 状态管理 (StateDemo)

- ✅ 响应式状态
- ✅ 状态监听
- ✅ 批量更新
- ✅ 状态重置
- ✅ 计算属性
- ✅ 与 Solid Signals 集成

**示例代码:**

```typescript
import { useEngineState } from '@ldesign/engine-solid'

function Counter() {
  const [count, setCount] = useEngineState('count', 0)
  
  return (
    <button onClick={() => setCount(count() + 1)}>
      Count: {count()}
    </button>
  )
}
```

### 4. 事件系统 (EventDemo)

- ✅ 事件发布订阅
- ✅ 同步事件
- ✅ 异步事件
- ✅ 事件日志
- ✅ 自定义事件
- ✅ 事件监听器管理

**示例代码:**

```typescript
import { useEvent, emitEngineEvent } from '@ldesign/engine-solid'

function MyComponent() {
  useEvent('user:login', (user) => {
    console.log('User logged in:', user)
  })
  
  return (
    <button onClick={() => emitEngineEvent('user:login', { id: 1 })}>
      Login
    </button>
  )
}
```

### 5. 生命周期管理 (LifecycleDemo)

- ✅ 生命周期钩子
- ✅ 钩子监听
- ✅ 自定义钩子
- ✅ 钩子触发统计
- ✅ 钩子日志

**示例代码:**

```typescript
import { useLifecycle } from '@ldesign/engine-solid'

function MyComponent() {
  useLifecycle('mounted', () => {
    console.log('Component mounted!')
  })
  
  return <div>Component</div>
}
```

## 🎯 核心 API

### 创建引擎应用

```typescript
import { createEngineApp } from '@ldesign/engine-solid'
import App from './App'

const engine = await createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'My App',
    debug: true,
  },
  plugins: [/* 插件列表 */],
  middleware: [/* 中间件列表 */],
  onReady: async (engine) => {
    // 引擎准备就绪
  },
  onMounted: async (engine) => {
    // 应用挂载完成
  },
})
```

### Solid Signals 集成

```typescript
import {
  useEngine,
  useEngineState,
  useEngineStateReadonly,
  useComputedState,
  useEvent,
  useLifecycle,
  usePlugin,
  emitEngineEvent,
  emitEngineEventAsync,
} from '@ldesign/engine-solid'

// 获取引擎实例
const engine = useEngine()

// 状态管理
const [count, setCount] = useEngineState('count', 0)
const theme = useEngineStateReadonly('theme', 'light')
const doubled = useComputedState(() => count() * 2)

// 事件系统
useEvent('user:login', (user) => {
  console.log('User logged in:', user)
})
emitEngineEvent('user:logout')

// 生命周期
useLifecycle('mounted', () => {
  console.log('Mounted!')
})

// 插件
const i18n = usePlugin('i18n')
```

## 📁 项目结构

```
example/
├── src/
│   ├── components/
│   │   ├── PluginDemo.tsx       # 插件系统演示
│   │   ├── MiddlewareDemo.tsx   # 中间件系统演示
│   │   ├── StateDemo.tsx        # 状态管理演示
│   │   ├── EventDemo.tsx        # 事件系统演示
│   │   ├── LifecycleDemo.tsx    # 生命周期演示
│   │   └── DemoCard.css         # 共享样式
│   ├── App.tsx                  # 主应用组件
│   ├── App.css                  # 应用样式
│   ├── main.tsx                 # 入口文件
│   └── index.css                # 全局样式
├── index.html
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 技术栈

- **Solid.js** - 细粒度响应式 UI 框架
- **@ldesign/engine-core** - 核心引擎
- **@ldesign/engine-solid** - Solid 适配器
- **@ldesign/launcher** - 开发工具(基于 Vite)
- **TypeScript** - 类型安全

## 📚 相关文档

- [Solid.js 官方文档](https://www.solidjs.com/)
- [LDesign Engine 核心文档](../../core/README.md)
- [Solid 适配器文档](../README.md)

## 💡 提示

1. 所有演示组件都是完整的功能实现,可以直接在生产环境中使用
2. 使用 Solid Signals 实现细粒度响应式更新
3. 所有事件都会被 logger 插件记录到控制台
4. 打开浏览器控制台可以看到详细的日志输出
5. 示例展示了 Solid 与引擎的最佳集成方式

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT


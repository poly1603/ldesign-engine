---
layout: home

hero:
  name: "@ldesign/engine"
  text: "强大的插件化引擎"
  tagline: 构建可扩展、高性能的应用程序架构
  image:
    src: /logo.svg
    alt: LDesign Engine
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看示例
      link: /examples/
    - theme: alt
      text: API 文档
      link: /api/

features:
  - icon: 🔌
    title: 插件化架构
    details: 基于插件的模块化设计，支持动态加载和热插拔，让您的应用程序具备无限扩展能力。
  - icon: ⚡
    title: 高性能
    details: 优化的事件系统和中间件机制，确保在复杂场景下依然保持出色的性能表现。
  - icon: 🛡️
    title: 类型安全
    details: 完整的 TypeScript 支持，提供强类型约束和智能代码提示，减少运行时错误。
  - icon: 🎯
    title: 事件驱动
    details: 强大的事件系统支持异步处理、事件拦截和自定义事件，构建响应式应用架构。
  - icon: 🔧
    title: 中间件支持
    details: 灵活的中间件机制，支持请求拦截、数据转换和业务逻辑处理。
  - icon: 📦
    title: 轻量级
    details: 核心库体积小巧，按需加载，不会给您的项目带来额外的负担。
  - icon: 🔄
    title: 状态管理
    details: 内置状态管理系统，支持状态持久化、时间旅行调试和状态同步。
  - icon: 🧩
    title: 可组合
    details: 模块化设计让您可以自由组合不同功能，构建符合业务需求的定制化解决方案。
  - icon: 📚
    title: 丰富文档
    details: 详细的文档和示例，帮助您快速上手并深入了解引擎的各项功能。
---

## 快速体验

```bash
# 安装
npm install @ldesign/engine

# 或使用 yarn
yarn add @ldesign/engine

# 或使用 pnpm
pnpm add @ldesign/engine
```

```typescript
import { Engine } from '@ldesign/engine'

// 创建引擎实例
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 注册插件
engine.use({
  name: 'hello-plugin',
  install(engine) {
    engine.on('app:start', () => {
      console.log('Hello from plugin!')
    })
  }
})

// 启动引擎
engine.start()
```

## 核心特性

### 🔌 插件系统

@ldesign/engine 采用插件化架构，让您可以轻松扩展应用功能：

- **动态加载**：支持运行时动态加载和卸载插件
- **依赖管理**：自动处理插件间的依赖关系
- **生命周期**：完整的插件生命周期管理
- **热重载**：开发环境下支持插件热重载

### ⚡ 事件系统

强大的事件驱动架构，支持复杂的业务场景：

- **异步事件**：支持异步事件处理和 Promise 链式调用
- **事件拦截**：可以拦截和修改事件数据
- **优先级控制**：支持事件监听器优先级设置
- **错误处理**：完善的错误处理和恢复机制

### 🔧 中间件机制

灵活的中间件系统，让您可以在关键节点插入自定义逻辑：

- **请求拦截**：拦截和处理各种请求
- **数据转换**：在数据流转过程中进行转换
- **权限控制**：实现细粒度的权限控制
- **日志记录**：自动记录关键操作日志

## 使用场景

@ldesign/engine 适用于多种应用场景：

- **微前端架构**：作为微前端的基础框架
- **插件化应用**：构建支持插件扩展的应用程序
- **工具链开发**：开发可扩展的开发工具
- **游戏引擎**：构建模块化的游戏引擎
- **IoT 平台**：物联网设备管理平台
- **数据处理**：构建数据处理管道

## 生态系统

@ldesign/engine 是 LDesign 生态系统的核心组件：

- **[@ldesign/store](/packages/store)**：状态管理库
- **[@ldesign/router](/packages/router)**：路由管理
- **[@ldesign/ui](/packages/ui)**：UI 组件库
- **[@ldesign/utils](/packages/utils)**：工具函数库

## 社区支持

- **GitHub**：[https://github.com/ldesign/engine](https://github.com/ldesign/engine)
- **文档**：[https://engine.ldesign.dev](https://engine.ldesign.dev)
- **问题反馈**：[GitHub Issues](https://github.com/ldesign/engine/issues)
- **讨论区**：[GitHub Discussions](https://github.com/ldesign/engine/discussions)

## 许可证

@ldesign/engine 采用 [MIT 许可证](https
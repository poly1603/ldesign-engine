# Lit Engine Example

这是一个演示 `@ldesign/engine-lit` 中 `createEngineApp` 统一 API 的示例项目。

## 功能演示

本示例展示了以下核心特性：

### 1. 统一的 createEngineApp API
```typescript
const engine = await createEngineApp({
  mountElement: '#app',
  config: { debug: true },
  plugins: [loggingPlugin],
  middleware: [authMiddleware],
  onReady: async (engine) => { /* ... */ },
  onMounted: async (engine) => { /* ... */ },
  onError: (error, context) => { /* ... */ }
})
```

### 2. Plugin（插件系统）
- 演示如何创建和注册插件
- 插件可以监听引擎事件
- 插件可以扩展引擎功能

### 3. Middleware（中间件）
- 演示如何创建和注册中间件
- 中间件可以拦截和处理请求
- 支持异步中间件

### 4. Lifecycle（生命周期）
- `onReady` - 引擎初始化完成
- `onMounted` - 应用挂载完成
- `onError` - 错误处理
- 支持自定义生命周期钩子

### 5. State Management（状态管理）
- 使用 `engine.state` 管理应用状态
- 支持状态的读取和更新
- 状态变化会触发事件

### 6. Event System（事件系统）
- 使用 `engine.events` 发送和监听事件
- 支持自定义事件
- 事件驱动的架构

### 7. Custom Elements（自定义元素）
- Lit 使用 Web Components 标准
- 通过 `@customElement` 装饰器注册元素
- 声明式挂载，无需手动调用 mount

## 运行示例

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:5107

### 构建生产版本
```bash
pnpm build
```

### 预览生产构建
```bash
pnpm preview
```

## 项目结构

```
example/
├── src/
│   ├── app-component.ts # 主应用组件 (Lit Element)
│   ├── main.ts          # 入口文件，演示 createEngineApp
│   └── style.css        # 全局样式
├── index.html           # HTML 模板
├── launcher.config.ts   # Launcher 配置
├── package.json         # 项目配置
├── tsconfig.json        # TypeScript 配置
└── README.md            # 本文件
```

## 技术栈

- **Lit** - 轻量级 Web Components 库
- **TypeScript** - 类型安全
- **@ldesign/engine-lit** - Lit 引擎适配器
- **@ldesign/engine-core** - 引擎核心
- **@ldesign/launcher** - 开发服务器和构建工具

## 了解更多

- [Lit Engine 文档](../../README.md)
- [统一 API 文档](../../../UNIFIED_API.md)
- [Engine Core 文档](../../core/README.md)


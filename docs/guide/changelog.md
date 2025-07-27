# 更新日志

本文档记录了 @ldesign/engine 的所有重要变更、新功能和修复。

## [1.2.0] - 2024-01-15

### 新增功能

- **插件热重载**：支持在开发模式下热重载插件，无需重启应用
- **异步插件加载**：新增 `loadPluginAsync()` 方法支持动态加载插件
- **插件依赖管理**：自动解析和安装插件依赖
- **状态持久化**：新增状态持久化到 localStorage 的功能
- **中间件系统增强**：支持异步中间件和错误处理中间件

### 改进

- **性能优化**：状态更新性能提升 40%
- **内存管理**：优化事件监听器的内存使用
- **错误处理**：更详细的错误信息和堆栈跟踪
- **TypeScript 支持**：改进类型定义，提供更好的 IDE 支持

### 修复

- 修复插件卸载时可能导致的内存泄漏
- 修复状态订阅在某些情况下不触发的问题
- 修复事件监听器重复注册的问题
- 修复在 SSR 环境下的兼容性问题

### 破坏性变更

- `Plugin.install()` 方法现在必须返回 Promise
- 移除了已废弃的 `engine.addPlugin()` 方法，请使用 `engine.use()`

### 迁移指南

```typescript
// 旧版本
class MyPlugin implements Plugin {
  install(engine: Engine) {
    // 同步安装
  }
}

// 新版本
class MyPlugin implements Plugin {
  async install(engine: Engine) {
    // 异步安装
  }
}
```

---

## [1.1.2] - 2023-12-20

### 修复

- 修复在 React 18 严格模式下的双重初始化问题
- 修复状态深度合并时的类型错误
- 修复事件名称包含特殊字符时的处理问题

### 改进

- 优化包大小，减少 15% 的体积
- 改进错误消息的可读性
- 更新依赖包到最新版本

---

## [1.1.1] - 2023-12-05

### 修复

- 修复 `setState` 在某些边缘情况下的竞态条件
- 修复插件配置合并时的深拷贝问题
- 修复 TypeScript 严格模式下的类型检查错误

### 改进

- 添加更多的单元测试覆盖
- 改进文档中的代码示例
- 优化 CI/CD 流程

---

## [1.1.0] - 2023-11-15

### 新增功能

- **服务注册系统**：新增服务注册和依赖注入功能
- **方法管理**：支持动态添加和移除方法
- **事件系统增强**：支持事件优先级和一次性监听器
- **配置验证**：内置配置验证和默认值处理
- **调试工具**：新增调试模式和性能监控工具

### 改进

- **API 一致性**：统一所有 API 的命名和参数格式
- **错误处理**：更好的错误分类和处理机制
- **文档完善**：添加完整的 API 文档和使用示例
- **测试覆盖**：测试覆盖率提升到 95%

### 修复

- 修复状态订阅路径解析的边缘情况
- 修复插件卸载时事件监听器未正确清理的问题
- 修复在某些浏览器中的兼容性问题

### API 变更

```typescript
// 新增 API
engine.registerService(name, service)
engine.getService(name)
engine.addMethod(name, method)
engine.removeMethod(name)
engine.hasMethod(name)

// 改进的 API
engine.on(event, handler, { priority: 1, once: true })
engine.setState(path, value, { silent: false, merge: true })
```

---

## [1.0.3] - 2023-10-20

### 修复

- 修复状态更新时的深度比较问题
- 修复插件安装顺序影响功能的问题
- 修复在 Node.js 环境下的兼容性

### 改进

- 优化状态更新的性能
- 改进错误消息的详细程度
- 更新开发依赖到最新版本

---

## [1.0.2] - 2023-10-05

### 修复

- 修复 TypeScript 类型定义中的导出问题
- 修复状态订阅在初始化时的触发问题
- 修复事件监听器在某些情况下的内存泄漏

### 改进

- 添加更多的 JSDoc 注释
- 改进包的元数据信息
- 优化构建流程

---

## [1.0.1] - 2023-09-20

### 修复

- 修复 npm 包发布时缺少类型定义文件的问题
- 修复 README 中的安装说明
- 修复示例代码中的语法错误

### 改进

- 添加 package.json 中的关键字和描述
- 改进 TypeScript 配置
- 更新许可证信息

---

## [1.0.0] - 2023-09-15

### 🎉 首次发布

这是 @ldesign/engine 的首个稳定版本！

### 核心功能

- **插件系统**：完整的插件架构，支持插件的安装、卸载、启用和禁用
- **状态管理**：响应式状态管理，支持深度路径访问和订阅
- **事件系统**：强大的事件发布订阅机制
- **中间件支持**：请求/响应中间件系统
- **TypeScript 支持**：完整的 TypeScript 类型定义

### 插件系统特性

- 插件生命周期管理
- 插件依赖解析
- 插件配置管理
- 插件热插拔

### 状态管理特性

- 不可变状态更新
- 深度路径访问（如 `user.profile.name`）
- 状态变化订阅
- 状态持久化选项

### 事件系统特性

- 类型安全的事件发布订阅
- 事件命名空间
- 一次性事件监听
- 事件传播控制

### 开发工具

- 调试模式
- 性能监控
- 错误追踪
- 开发者友好的 API

### 浏览器支持

- Chrome >= 60
- Firefox >= 55
- Safari >= 12
- Edge >= 79
- IE 11（需要 polyfill）

### Node.js 支持

- Node.js >= 14.0.0

---

## 版本规范

我们遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **主版本号**：当做了不兼容的 API 修改
- **次版本号**：当做了向下兼容的功能性新增
- **修订号**：当做了向下兼容的问题修正

## 发布周期

- **主版本**：每年 1-2 次，包含重大功能更新
- **次版本**：每月 1-2 次，包含新功能和改进
- **修订版本**：根据需要发布，主要修复 bug

## 支持政策

- **当前主版本**：完全支持，包括新功能、改进和 bug 修复
- **前一个主版本**：维护支持，只提供重要的 bug 修复和安全更新
- **更早版本**：不再支持，建议升级到支持的版本

## 迁移指南

### 从 0.x 升级到 1.x

1. **更新依赖**
```bash
npm install @ldesign/engine@latest
```

2. **API 变更**
```typescript
// 0.x 版本
const engine = new Engine()
engine.addPlugin(new MyPlugin())

// 1.x 版本
const engine = new Engine({ name: 'app', version: '1.0.0' })
engine.use(new MyPlugin())
```

3. **插件接口变更**
```typescript
// 0.x 版本
class MyPlugin {
  init(engine) {
    // 初始化逻辑
  }
}

// 1.x 版本
class MyPlugin implements Plugin {
  name = 'my-plugin'
  version = '1.0.0'

  async install(engine: Engine) {
    // 安装逻辑
  }
}
```

4. **状态管理变更**
```typescript
// 0.x 版本
engine.state.set('user', userData)
engine.state.get('user')

// 1.x 版本
engine.setState('user', userData)
engine.getState('user')
```

### 从 1.0.x 升级到 1.1.x

1. **更新依赖**
```bash
npm install @ldesign/engine@^1.1.0
```

2. **新功能使用**
```typescript
// 服务注册（新功能）
engine.registerService('http', new HttpService())
const httpService = engine.getService('http')

// 方法管理（新功能）
engine.addMethod('getData', async (id) => {
  return await httpService.get(`/data/${id}`)
})
```

### 从 1.1.x 升级到 1.2.x

1. **更新依赖**
```bash
npm install @ldesign/engine@^1.2.0
```

2. **插件接口更新**
```typescript
// 1.1.x 版本
class MyPlugin implements Plugin {
  install(engine: Engine) {
    // 同步安装
  }
}

// 1.2.x 版本
class MyPlugin implements Plugin {
  async install(engine: Engine) {
    // 异步安装（必须）
  }
}
```

3. **移除废弃 API**
```typescript
// 移除的 API
// engine.addPlugin() - 使用 engine.use() 替代

// 新的 API
engine.use(plugin)
```

## 贡献指南

我们欢迎社区贡献！请查看 [贡献指南](../contributing.md) 了解如何参与项目开发。

## 问题反馈

如果您发现 bug 或有功能建议，请在 [GitHub Issues](https://github.com/ldesign/engine/issues) 中提交。

## 许可证

@ldesign/engine 使用 [MIT 许可证](../LICENSE)。

# 常见问题 (FAQ)

本页面收集了使用 @ldesign/engine 时的常见问题和解答。

## 基础问题

### Q: @ldesign/engine 是什么？

**A:** @ldesign/engine 是一个强大的插件化引擎，用于构建可扩展、高性能的应用程序架构。它提供了完整的插件系统、状态管理、事件系统和中间件支持，帮助开发者构建模块化的应用程序。

### Q: 为什么选择 @ldesign/engine 而不是其他框架？

**A:** @ldesign/engine 的优势包括：

- **插件化架构**：真正的插件化设计，支持热插拔
- **轻量级**：核心库体积小，按需加载
- **TypeScript 优先**：完整的类型支持
- **框架无关**：可以与任何前端框架集成
- **高性能**：优化的状态管理和事件系统
- **易于扩展**：简单的 API 设计，易于学习和使用

### Q: @ldesign/engine 支持哪些环境？

**A:** @ldesign/engine 支持：

- **浏览器**：现代浏览器（Chrome 60+, Firefox 55+, Safari 12+, Edge 79+）
- **Node.js**：14.0.0 及以上版本
- **框架集成**：React, Vue, Angular, Svelte 等
- **构建工具**：Webpack, Vite, Rollup, Parcel 等

## 安装和配置

### Q: 如何安装 @ldesign/engine？

**A:** 使用 npm、yarn 或 pnpm 安装：

```bash
# npm
npm install @ldesign/engine

# yarn
yarn add @ldesign/engine

# pnpm
pnpm add @ldesign/engine
```

### Q: 是否需要额外的配置？

**A:** 基本使用不需要额外配置，但建议进行以下配置：

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### Q: 如何在 TypeScript 项目中使用？

**A:** @ldesign/engine 内置 TypeScript 支持，直接导入即可：

```typescript
import { Engine, Plugin } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})
```

## 插件系统

### Q: 如何创建一个插件？

**A:** 实现 `Plugin` 接口：

```typescript
import { Engine, Plugin } from '@ldesign/engine'

class MyPlugin implements Plugin {
  name = 'my-plugin'
  version = '1.0.0'

  async install(engine: Engine): Promise<void> {
    // 插件安装逻辑
    engine.addMethod('myMethod', () => {
      console.log('Hello from my plugin!')
    })
  }

  async uninstall(engine: Engine): Promise<void> {
    // 插件卸载逻辑
    engine.removeMethod('myMethod')
  }
}
```

### Q: 插件之间如何通信？

**A:** 插件间通信有多种方式：

1. **事件系统**：
```typescript
// 插件 A 发送事件
engine.emit('data:updated', { id: 1, data: 'new data' })

// 插件 B 监听事件
engine.on('data:updated', (payload) => {
  console.log('Data updated:', payload)
})
```

2. **共享服务**：
```typescript
// 插件 A 注册服务
engine.registerService('dataService', new DataService())

// 插件 B 使用服务
const dataService = engine.getService('dataService')
```

3. **状态管理**：
```typescript
// 插件 A 更新状态
engine.setState('user.profile', userProfile)

// 插件 B 订阅状态
engine.subscribe('user.profile', (profile) => {
  console.log('Profile updated:', profile)
})
```

### Q: 如何处理插件依赖？

**A:** 在插件中声明依赖：

```typescript
class MyPlugin implements Plugin {
  name = 'my-plugin'
  version = '1.0.0'
  dependencies = ['http-plugin', 'storage-plugin']

  async install(engine: Engine): Promise<void> {
    // 确保依赖已安装
    if (!engine.hasPlugin('http-plugin')) {
      throw new Error('http-plugin is required')
    }

    // 使用依赖提供的服务
    const httpService = engine.getService('http')
  }
}
```

### Q: 插件可以动态加载吗？

**A:** 是的，支持动态加载：

```typescript
// 动态导入插件
async function loadAnalyticsPlugin() {
  const { AnalyticsPlugin } = await import('./plugins/analytics')
  await engine.use(new AnalyticsPlugin())
}

// 按需加载
engine.addMethod('enableAnalytics', loadAnalyticsPlugin)
```

## 状态管理

### Q: 状态管理与 Redux/Vuex 有什么区别？

**A:** @ldesign/engine 的状态管理特点：

- **路径访问**：支持深度路径访问（如 `user.profile.name`）
- **插件友好**：专为插件化架构设计
- **轻量级**：没有复杂的概念，易于理解
- **类型安全**：完整的 TypeScript 支持
- **响应式**：自动触发订阅者更新

### Q: 如何避免状态更新的性能问题？

**A:** 使用以下最佳实践：

1. **批量更新**：
```typescript
// ❌ 多次单独更新
engine.setState('user.name', 'John')
engine.setState('user.email', 'john@example.com')

// ✅ 批量更新
engine.setState(state => ({
  ...state,
  user: {
    ...state.user,
    name: 'John',
    email: 'john@example.com'
  }
}))
```

2. **精确订阅**：
```typescript
// ❌ 订阅整个状态
engine.subscribe('*', callback)

// ✅ 订阅特定路径
engine.subscribe('user.profile', callback)
```

3. **使用防抖**：
```typescript
const debouncedUpdate = debounce((value) => {
  engine.setState('search.query', value)
}, 300)
```

### Q: 状态可以持久化吗？

**A:** 是的，可以实现状态持久化：

```typescript
// 保存状态到 localStorage
engine.subscribe('*', (path, value) => {
  const state = engine.getState()
  localStorage.setItem('app-state', JSON.stringify(state))
})

// 从 localStorage 恢复状态
const savedState = localStorage.getItem('app-state')
if (savedState) {
  engine.setState(JSON.parse(savedState))
}
```

## 事件系统

### Q: 事件系统支持异步处理吗？

**A:** 是的，事件处理器可以是异步的：

```typescript
engine.on('user:login', async (user) => {
  // 异步处理
  await analytics.track('user_login', user)
  await loadUserPreferences(user.id)
})

// 等待所有异步处理器完成
await engine.emitAsync('user:login', user)
```

### Q: 如何控制事件传播？

**A:** 使用事件对象的方法：

```typescript
engine.on('button:click', (event) => {
  if (someCondition) {
    event.stopPropagation() // 停止传播
  }

  // 继续处理
})
```

### Q: 事件监听器会导致内存泄漏吗？

**A:** 如果不正确清理，可能会导致内存泄漏。建议：

```typescript
class Component {
  private unsubscribers: Array<() => void> = []

  constructor(engine: Engine) {
    // 保存取消订阅函数
    this.unsubscribers.push(
      engine.on('event1', this.handler1.bind(this))
    )
    this.unsubscribers.push(
      engine.on('event2', this.handler2.bind(this))
    )
  }

  destroy() {
    // 清理所有监听器
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
  }
}
```

## 性能优化

### Q: 如何优化应用启动性能？

**A:** 使用以下策略：

1. **懒加载插件**：
```typescript
// 只加载核心插件
const engine = new Engine({ name: 'app', version: '1.0.0' })
await engine.use([corePlugin, authPlugin])

// 按需加载其他插件
engine.addMethod('loadFeature', async (featureName) => {
  const plugin = await import(`./plugins/${featureName}`)
  await engine.use(plugin.default)
})
```

2. **代码分割**：
```typescript
// 使用动态导入
const loadHeavyFeature = () => import('./heavy-feature')
```

3. **预加载关键资源**：
```typescript
// 预加载但不立即执行
const preloadPlugin = import('./plugins/analytics')
```

### Q: 如何监控应用性能？

**A:** 使用内置的性能监控：

```typescript
// 启用性能监控
const engine = new Engine({
  name: 'app',
  version: '1.0.0',
  debug: true,
  performance: true
})

// 监控方法执行时间
engine.on('method:before', ({ name, args }) => {
  console.time(`method:${name}`)
})

engine.on('method:after', ({ name, result, duration }) => {
  console.timeEnd(`method:${name}`)
  console.log(`Method ${name} took ${duration}ms`)
})
```

## 错误处理

### Q: 如何处理插件错误？

**A:** 使用全局错误处理：

```typescript
// 监听插件错误
engine.on('plugin:error', ({ plugin, error, phase }) => {
  console.error(`Plugin ${plugin} error in ${phase}:`, error)

  // 错误恢复策略
  if (phase === 'install') {
    // 尝试重新安装
    setTimeout(() => {
      engine.reinstallPlugin(plugin)
    }, 5000)
  }
})

// 监听全局错误
engine.on('error', (error) => {
  // 发送错误报告
  errorReporting.report(error)
})
```

### Q: 如何实现错误边界？

**A:** 在插件中实现错误边界：

```typescript
class SafePlugin implements Plugin {
  name = 'safe-plugin'

  async install(engine: Engine): Promise<void> {
    engine.addMethod('safeMethod', async (...args) => {
      try {
        return await this.riskyOperation(...args)
      }
 catch (error) {
        console.error('Method failed:', error)
        engine.emit('method:error', { method: 'safeMethod', error })
        return { success: false, error: error.message }
      }
    })
  }
}
```

## 测试

### Q: 如何测试使用 @ldesign/engine 的应用？

**A:** 使用以下测试策略：

1. **单元测试**：
```typescript
describe('MyPlugin', () => {
  let engine: Engine
  let plugin: MyPlugin

  beforeEach(() => {
    engine = new Engine({ name: 'test', version: '1.0.0' })
    plugin = new MyPlugin()
  })

  test('should install correctly', async () => {
    await engine.use(plugin)
    expect(engine.hasPlugin('my-plugin')).toBe(true)
  })
})
```

2. **集成测试**：
```typescript
test('plugins should work together', async () => {
  await engine.use([pluginA, pluginB, pluginC])

  const result = await engine.performComplexOperation()
  expect(result).toMatchSnapshot()
})
```

3. **模拟测试**：
```typescript
const mockEngine = {
  addMethod: jest.fn(),
  emit: jest.fn(),
  getState: jest.fn()
}

const plugin = new MyPlugin()
await plugin.install(mockEngine as any)

expect(mockEngine.addMethod).toHaveBeenCalledWith('myMethod', expect.any(Function))
```

### Q: 如何模拟插件依赖？

**A:** 创建模拟插件：

```typescript
function createMockPlugin(name: string, methods: Record<string, Function> = {}) {
  return {
  name,
  version: '1.0.0',
  async install(engine: Engine) {
    Object.entries(methods).forEach(([methodName, method]) => {
      engine.addMethod(methodName, method)
    })
  }
}
}

// 在测试中使用
const mockHttpPlugin = createMockPlugin('http-plugin', {
  get: jest.fn().mockResolvedValue({ data: 'mock data' }),
  post: jest.fn().mockResolvedValue({ success: true })
})

await engine.use(mockHttpPlugin)
```

## 部署和生产

### Q: 生产环境需要注意什么？

**A:** 生产环境建议：

1. **禁用调试模式**：
```typescript
const engine = new Engine({
  name: 'app',
  version: '1.0.0',
  debug: process.env.NODE_ENV !== 'production'
})
```

2. **错误监控**：
```typescript
if (process.env.NODE_ENV === 'production') {
  engine.on('error', (error) => {
    // 发送到错误监控服务
    Sentry.captureException(error)
  })
}
```

3. **性能监控**：
```typescript
engine.on('performance:slow', ({ operation, duration }) => {
  if (duration > 1000) {
    analytics.track('slow_operation', { operation, duration })
  }
})
```

### Q: 如何进行版本升级？

**A:** 遵循语义化版本规范：

1. **检查更新日志**：查看 [更新日志](./changelog.md) 了解变更
2. **测试兼容性**：在测试环境验证升级
3. **渐进式升级**：先升级补丁版本，再升级次版本
4. **监控错误**：升级后密切监控错误率

## 社区和支持

### Q: 在哪里可以获得帮助？

**A:** 可以通过以下渠道获得帮助：

- **GitHub Issues**：报告 bug 和功能请求
- **文档**：查看完整的 [API 文档](../api/index.md) 和 [示例](../examples/index.md)
- **社区讨论**：参与 GitHub Discussions
- **Stack Overflow**：使用 `ldesign-engine` 标签提问

### Q: 如何贡献代码？

**A:** 欢迎贡献！请查看 [贡献指南](../contributing.md) 了解详细信息：

1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 创建 Pull Request

### Q: 如何报告 bug？

**A:** 报告 bug 时请提供：

1. **环境信息**：Node.js 版本、浏览器版本、操作系统
2. **重现步骤**：详细的重现步骤
3. **期望行为**：期望的正确行为
4. **实际行为**：实际发生的错误行为
5. **代码示例**：最小化的重现代码
6. **错误信息**：完整的错误堆栈

---

## 还有其他问题？

如果您的问题没有在这里找到答案，请：

1. 查看 [故障排除指南](./troubleshooting.md)
2. 搜索 [GitHub Issues](https://github.com/ldesign/engine/issues)
3. 在 [GitHub Discussions](https://github.com/ldesign/engine/discussions) 中提问
4. 查看 [API 文档](../api/index.md) 获取详细信息

我们会持续更新这个 FAQ 页面，添加更多常见问题和解答。

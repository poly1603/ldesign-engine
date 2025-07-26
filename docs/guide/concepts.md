# 基本概念

本章将介绍 @ldesign/engine 的核心概念，帮助您深入理解引擎的设计理念和工作原理。

## 引擎 (Engine)

引擎是整个系统的核心，它负责管理插件、事件、中间件和状态。每个应用程序通常只需要一个引擎实例。

### 引擎的职责

- **插件管理**：注册、启用、禁用和卸载插件
- **事件调度**：处理事件的发布和订阅
- **中间件执行**：管理中间件的执行顺序
- **状态管理**：维护应用程序的全局状态
- **生命周期管理**：控制应用程序的启动和关闭

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  debug: true,
  maxListeners: 100,
  initialState: {
    // 初始状态
  }
})
```

### 引擎配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `name` | `string` | 必需 | 引擎名称 |
| `version` | `string` | 必需 | 引擎版本 |
| `debug` | `boolean` | `false` | 是否开启调试模式 |
| `maxListeners` | `number` | `10` | 最大事件监听器数量 |
| `initialState` | `object` | `{}` | 初始状态 |
| `plugins` | `Plugin[]` | `[]` | 预注册的插件列表 |
| `middleware` | `Middleware[]` | `[]` | 预注册的中间件列表 |

## 插件 (Plugin)

插件是扩展引擎功能的主要方式。每个插件都是一个独立的模块，可以添加新的功能、修改现有行为或与其他插件协作。

### 插件结构

```typescript
interface Plugin {
  name: string                    // 插件名称（唯一标识）
  version: string                 // 插件版本
  description?: string            // 插件描述
  dependencies?: string[]         // 依赖的其他插件
  install: (engine: Engine) => void | Promise<void>    // 安装函数
  uninstall?: (engine: Engine) => void | Promise<void> // 卸载函数
  enable?: (engine: Engine) => void | Promise<void>    // 启用函数
  disable?: (engine: Engine) => void | Promise<void>   // 禁用函数
}
```

### 插件生命周期

1. **注册 (Register)**：将插件添加到引擎中
2. **安装 (Install)**：执行插件的安装逻辑
3. **启用 (Enable)**：激活插件功能
4. **禁用 (Disable)**：暂时停用插件
5. **卸载 (Uninstall)**：完全移除插件

```typescript
const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: '我的自定义插件',
  dependencies: ['core-plugin'],
  
  async install(engine) {
    console.log('插件安装中...')
    // 注册事件监听器
    engine.on('app:start', this.onAppStart)
    // 添加自定义方法
    engine.addMethod('myMethod', this.myMethod)
  },
  
  async uninstall(engine) {
    console.log('插件卸载中...')
    // 清理资源
    engine.off('app:start', this.onAppStart)
    engine.removeMethod('myMethod')
  },
  
  onAppStart() {
    console.log('应用启动了！')
  },
  
  myMethod(param: string) {
    return `处理参数: ${param}`
  }
}
```

## 事件系统 (Event System)

事件系统是引擎的神经网络，允许不同组件之间进行松耦合的通信。

### 事件类型

#### 1. 同步事件

```typescript
// 发布同步事件
engine.emit('user:login', userData)

// 监听同步事件
engine.on('user:login', (userData) => {
  console.log('用户登录:', userData)
})
```

#### 2. 异步事件

```typescript
// 发布异步事件
await engine.emitAsync('data:process', largeDataSet)

// 监听异步事件
engine.on('data:process', async (data) => {
  await processData(data)
  console.log('数据处理完成')
})
```

#### 3. 可拦截事件

```typescript
// 拦截并修改事件数据
engine.intercept('message:send', (message) => {
  return {
    ...message,
    timestamp: Date.now(),
    encrypted: encrypt(message.content)
  }
})
```

### 事件命名约定

建议使用以下命名约定：

- `namespace:action` - 如 `user:login`、`file:upload`
- `component:event` - 如 `modal:open`、`form:submit`
- `lifecycle:stage` - 如 `app:start`、`plugin:install`

### 事件优先级

```typescript
// 高优先级监听器（先执行）
engine.on('data:validate', validator, { priority: 100 })

// 普通优先级监听器
engine.on('data:validate', processor, { priority: 50 })

// 低优先级监听器（后执行）
engine.on('data:validate', logger, { priority: 10 })
```

## 中间件 (Middleware)

中间件提供了一种在特定执行点插入自定义逻辑的机制，类似于洋葱模型。

### 中间件结构

```typescript
interface Middleware {
  name: string                    // 中间件名称
  priority?: number               // 执行优先级
  execute: MiddlewareFunction     // 执行函数
}

type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<any>
) => Promise<any>
```

### 中间件执行流程

```typescript
const authMiddleware: Middleware = {
  name: 'auth',
  priority: 100,
  async execute(context, next) {
    // 前置处理
    console.log('检查用户权限...')
    
    if (!context.user?.isAuthenticated) {
      throw new Error('用户未认证')
    }
    
    try {
      // 执行下一个中间件或目标操作
      const result = await next()
      
      // 后置处理
      console.log('操作执行成功')
      return result
    } catch (error) {
      // 错误处理
      console.error('操作执行失败:', error)
      throw error
    }
  }
}
```

### 中间件应用场景

- **身份验证**：检查用户权限
- **日志记录**：记录操作日志
- **性能监控**：测量执行时间
- **数据转换**：格式化输入输出
- **错误处理**：统一错误处理逻辑
- **缓存**：实现结果缓存

## 状态管理 (State Management)

引擎提供了简单而强大的状态管理功能，支持状态的读取、更新和监听。

### 状态操作

```typescript
// 设置状态
engine.setState('user', { id: 1, name: 'Alice' })

// 获取状态
const user = engine.getState('user')

// 批量更新状态
engine.updateState({
  theme: 'dark',
  language: 'zh-CN'
})

// 监听状态变化
engine.onStateChange('user', (newUser, oldUser) => {
  console.log('用户状态变化:', { newUser, oldUser })
})
```

### 状态持久化

```typescript
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0',
  persistence: {
    enabled: true,
    storage: 'localStorage', // 或 'sessionStorage'
    key: 'my-app-state',
    include: ['user', 'settings'], // 只持久化指定状态
    exclude: ['temp'] // 排除临时状态
  }
})
```

## 依赖注入 (Dependency Injection)

引擎支持简单的依赖注入，方便管理组件之间的依赖关系。

```typescript
// 注册服务
engine.register('userService', new UserService())
engine.register('apiClient', new ApiClient())

// 注入依赖
const userPlugin: Plugin = {
  name: 'user-plugin',
  version: '1.0.0',
  dependencies: ['userService', 'apiClient'],
  
  install(engine) {
    const userService = engine.resolve('userService')
    const apiClient = engine.resolve('apiClient')
    
    // 使用注入的依赖
    engine.addMethod('getUser', (id) => {
      return userService.getUser(id)
    })
  }
}
```

## 错误处理 (Error Handling)

引擎提供了完善的错误处理机制。

### 全局错误处理

```typescript
// 监听全局错误
engine.on('error', (error, context) => {
  console.error('引擎错误:', error)
  console.error('错误上下文:', context)
  
  // 发送错误报告
  errorReporter.report(error, context)
})

// 监听未捕获的异常
engine.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error)
  // 优雅关闭应用
  engine.shutdown()
})
```

### 插件错误隔离

```typescript
const safePlugin: Plugin = {
  name: 'safe-plugin',
  version: '1.0.0',
  
  async install(engine) {
    try {
      // 可能出错的操作
      await riskyOperation()
    } catch (error) {
      // 插件内部错误处理
      console.error('插件安装失败:', error)
      // 不影响其他插件的运行
    }
  }
}
```

## 性能优化 (Performance Optimization)

### 懒加载

```typescript
// 懒加载插件
const lazyPlugin: Plugin = {
  name: 'lazy-plugin',
  version: '1.0.0',
  
  async install(engine) {
    // 只在需要时加载重型依赖
    engine.addMethod('heavyOperation', async () => {
      const { HeavyLibrary } = await import('./heavy-library')
      return new HeavyLibrary().process()
    })
  }
}
```

### 事件节流

```typescript
// 节流事件处理
engine.on('scroll', throttle((event) => {
  updateScrollPosition(event)
}, 16)) // 60fps

// 防抖事件处理
engine.on('search', debounce((query) => {
  performSearch(query)
}, 300))
```

## 最佳实践

### 1. 插件设计原则

- **单一职责**：每个插件只负责一个特定功能
- **松耦合**：插件之间通过事件通信，避免直接依赖
- **可配置**：提供配置选项，增强灵活性
- **错误隔离**：插件错误不应影响其他插件

### 2. 事件命名规范

- 使用清晰的命名空间
- 动词使用现在时或过去时
- 避免使用缩写
- 保持一致性

### 3. 状态管理建议

- 保持状态结构扁平
- 使用不可变更新
- 避免在状态中存储函数
- 合理使用状态持久化

### 4. 性能考虑

- 避免在热路径上进行重型操作
- 使用事件节流和防抖
- 合理使用懒加载
- 监控内存使用情况

## 下一步

现在您已经了解了 @ldesign/engine 的核心概念，可以继续学习：

- [引擎实例](/guide/engine-instance) - 深入了解引擎的配置和使用
- [插件系统](/guide/plugin-system) - 学习如何开发和使用插件
- [事件系统](/guide/event-system) - 掌握事件的高级用法
- [中间件](/guide/middleware) - 了解中间件的强大功能
- [状态管理](/guide/state-management) - 深入学习状态管理
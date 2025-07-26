# 快速开始

欢迎使用 @ldesign/engine！这个指南将帮助您快速上手并创建您的第一个基于引擎的应用程序。

## 安装

首先，您需要安装 @ldesign/engine：

::: code-group

```bash [npm]
npm install @ldesign/engine
```

```bash [yarn]
yarn add @ldesign/engine
```

```bash [pnpm]
pnpm add @ldesign/engine
```

:::

## 创建您的第一个引擎实例

让我们从一个简单的示例开始：

```typescript
import { Engine } from '@ldesign/engine'

// 创建引擎实例
const engine = new Engine({
  name: 'my-first-app',
  version: '1.0.0',
  debug: true // 开启调试模式
})

// 监听引擎启动事件
engine.on('engine:start', () => {
  console.log('引擎已启动！')
})

// 启动引擎
engine.start()
```

## 注册您的第一个插件

插件是 @ldesign/engine 的核心概念。让我们创建一个简单的插件：

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 定义插件
const helloPlugin: Plugin = {
  name: 'hello-plugin',
  version: '1.0.0',
  install(engine) {
    // 插件安装时执行
    console.log('Hello Plugin 已安装')
    
    // 监听自定义事件
    engine.on('user:login', (user) => {
      console.log(`欢迎，${user.name}！`)
    })
    
    // 添加自定义方法
    engine.addMethod('sayHello', (name: string) => {
      return `Hello, ${name}!`
    })
  },
  uninstall(engine) {
    // 插件卸载时执行
    console.log('Hello Plugin 已卸载')
  }
}

// 创建引擎并注册插件
const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 注册插件
engine.use(helloPlugin)

// 启动引擎
engine.start()

// 使用插件提供的方法
const message = engine.sayHello('World')
console.log(message) // 输出: Hello, World!

// 触发事件
engine.emit('user:login', { name: 'Alice', id: 1 })
```

## 使用中间件

中间件允许您在特定的执行点插入自定义逻辑：

```typescript
import { Engine, Middleware } from '@ldesign/engine'

// 创建日志中间件
const loggerMiddleware: Middleware = {
  name: 'logger',
  async execute(context, next) {
    console.log(`[${new Date().toISOString()}] ${context.action} 开始`)
    
    const startTime = Date.now()
    
    try {
      // 执行下一个中间件或目标操作
      const result = await next()
      
      const duration = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] ${context.action} 完成 (${duration}ms)`)
      
      return result
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ${context.action} 失败:`, error)
      throw error
    }
  }
}

// 创建权限检查中间件
const authMiddleware: Middleware = {
  name: 'auth',
  async execute(context, next) {
    // 检查用户权限
    if (!context.user || !context.user.isAuthenticated) {
      throw new Error('用户未认证')
    }
    
    return next()
  }
}

const engine = new Engine({
  name: 'my-app',
  version: '1.0.0'
})

// 注册中间件
engine.use(loggerMiddleware)
engine.use(authMiddleware)

engine.start()
```

## 事件系统

@ldesign/engine 提供了强大的事件系统：

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'event-demo',
  version: '1.0.0'
})

// 监听事件
engine.on('data:received', (data) => {
  console.log('收到数据:', data)
})

// 监听一次性事件
engine.once('app:ready', () => {
  console.log('应用已准备就绪')
})

// 异步事件处理
engine.on('file:upload', async (file) => {
  console.log('开始上传文件:', file.name)
  
  // 模拟异步上传
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  console.log('文件上传完成:', file.name)
  
  // 触发上传完成事件
  engine.emit('file:uploaded', { file, timestamp: Date.now() })
})

// 事件拦截和修改
engine.intercept('message:send', (message) => {
  // 添加时间戳
  return {
    ...message,
    timestamp: Date.now(),
    processed: true
  }
})

engine.start()

// 触发事件
engine.emit('data:received', { id: 1, content: 'Hello World' })
engine.emit('app:ready')
engine.emit('file:upload', { name: 'document.pdf', size: 1024 })
```

## 状态管理

引擎内置了简单的状态管理功能：

```typescript
import { Engine } from '@ldesign/engine'

const engine = new Engine({
  name: 'state-demo',
  version: '1.0.0',
  initialState: {
    user: null,
    theme: 'light',
    notifications: []
  }
})

// 监听状态变化
engine.onStateChange('user', (newUser, oldUser) => {
  console.log('用户状态变化:', { newUser, oldUser })
})

// 更新状态
engine.setState('user', {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com'
})

// 获取状态
const currentUser = engine.getState('user')
console.log('当前用户:', currentUser)

// 批量更新状态
engine.updateState({
  theme: 'dark',
  notifications: [
    { id: 1, message: '欢迎使用应用', type: 'info' }
  ]
})

engine.start()
```

## 完整示例

让我们创建一个更完整的示例，展示如何组合使用这些功能：

```typescript
import { Engine, Plugin, Middleware } from '@ldesign/engine'

// 用户管理插件
const userPlugin: Plugin = {
  name: 'user-manager',
  version: '1.0.0',
  install(engine) {
    // 添加用户相关方法
    engine.addMethod('login', async (credentials) => {
      // 模拟登录
      const user = { id: 1, name: credentials.username }
      engine.setState('user', user)
      engine.emit('user:login', user)
      return user
    })
    
    engine.addMethod('logout', () => {
      const user = engine.getState('user')
      engine.setState('user', null)
      engine.emit('user:logout', user)
    })
  }
}

// 通知插件
const notificationPlugin: Plugin = {
  name: 'notification-manager',
  version: '1.0.0',
  install(engine) {
    engine.addMethod('notify', (message, type = 'info') => {
      const notification = {
        id: Date.now(),
        message,
        type,
        timestamp: new Date().toISOString()
      }
      
      const notifications = engine.getState('notifications') || []
      engine.setState('notifications', [...notifications, notification])
      engine.emit('notification:added', notification)
    })
    
    // 监听用户登录，显示欢迎通知
    engine.on('user:login', (user) => {
      engine.notify(`欢迎回来，${user.name}！`, 'success')
    })
  }
}

// 日志中间件
const loggerMiddleware: Middleware = {
  name: 'logger',
  async execute(context, next) {
    console.log(`[LOG] ${context.action} 开始执行`)
    const result = await next()
    console.log(`[LOG] ${context.action} 执行完成`)
    return result
  }
}

// 创建应用
const app = new Engine({
  name: 'my-complete-app',
  version: '1.0.0',
  debug: true,
  initialState: {
    user: null,
    notifications: [],
    theme: 'light'
  }
})

// 注册插件和中间件
app.use(loggerMiddleware)
app.use(userPlugin)
app.use(notificationPlugin)

// 监听应用事件
app.on('engine:start', () => {
  console.log('应用启动成功！')
})

app.on('notification:added', (notification) => {
  console.log('新通知:', notification.message)
})

// 启动应用
app.start()

// 模拟用户操作
setTimeout(async () => {
  await app.login({ username: 'alice', password: 'password' })
  
  setTimeout(() => {
    app.notify('这是一条测试消息', 'info')
  }, 1000)
}, 2000)
```

## 下一步

现在您已经了解了 @ldesign/engine 的基本用法，接下来可以：

- 📖 阅读 [基本概念](/guide/concepts) 了解更多核心概念
- 🔌 学习 [插件开发](/guide/plugin-development) 创建自定义插件
- ⚡ 探索 [事件系统](/guide/event-system) 的高级功能
- 🔧 了解 [中间件](/guide/middleware) 的强大能力
- 📚 查看 [API 文档](/api/) 获取完整的 API 参考
- 💡 浏览 [示例](/examples/) 获取更多实用示例

## 需要帮助？

如果您在使用过程中遇到问题：

- 查看 [FAQ](/faq) 寻找常见问题的解答
- 在 [GitHub Issues](https://github.com/ldesign/engine/issues) 报告 bug
- 在 [GitHub Discussions](https://github.com/ldesign/engine/discussions) 参与讨论
- 阅读 [故障排除指南](/guide/troubleshooting) 解决常见问题
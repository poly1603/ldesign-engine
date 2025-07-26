# 基本用法示例

本文档展示了 @ldesign/engine 的基本使用方法，包括引擎创建、插件注册、事件处理和状态管理等核心功能。

## 快速开始

### 创建引擎实例

```typescript
import { Engine } from '@ldesign/engine'

// 创建基础引擎实例
const engine = new Engine({
  name: 'MyApp',
  version: '1.0.0',
  debug: true
})

// 启动引擎
await engine.start()
console.log('引擎已启动')
```

### 事件系统基础用法

```typescript
// 注册事件监听器
engine.on('user:login', (user) => {
  console.log('用户登录:', user.name)
})

engine.on('user:logout', (user) => {
  console.log('用户登出:', user.name)
})

// 触发事件
engine.emit('user:login', {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
})

// 一次性事件监听
engine.once('app:ready', () => {
  console.log('应用已准备就绪')
})

engine.emit('app:ready')
```

### 状态管理基础用法

```typescript
// 设置状态
engine.setState('user', {
  id: 1,
  name: 'John Doe',
  isLoggedIn: true
})

engine.setState('settings', {
  theme: 'dark',
  language: 'zh-CN'
})

// 获取状态
const user = engine.getState('user')
const settings = engine.getState('settings')

console.log('当前用户:', user)
console.log('应用设置:', settings)

// 监听状态变化
engine.watchState('user', (newUser, oldUser) => {
  console.log('用户状态变化:', { newUser, oldUser })
})

// 更新状态
engine.setState('user', {
  ...user,
  lastLoginTime: new Date().toISOString()
})
```

## 完整示例：用户管理应用

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 创建引擎
const app = new Engine({
  name: 'UserManagementApp',
  version: '1.0.0',
  debug: true,
  initialState: {
    users: [],
    currentUser: null,
    settings: {
      theme: 'light',
      language: 'zh-CN'
    }
  }
})

// 用户管理插件
const userPlugin: Plugin = {
  name: 'UserPlugin',
  version: '1.0.0',
  
  install(engine) {
    // 注册用户相关事件处理
    engine.on('user:register', this.handleUserRegister.bind(this))
    engine.on('user:login', this.handleUserLogin.bind(this))
    engine.on('user:logout', this.handleUserLogout.bind(this))
    engine.on('user:update', this.handleUserUpdate.bind(this))
    
    console.log('用户插件已安装')
  },
  
  handleUserRegister(userData) {
    const users = app.getState('users') || []
    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
      isActive: true
    }
    
    users.push(newUser)
    app.setState('users', users)
    
    console.log('用户注册成功:', newUser)
    app.emit('user:registered', newUser)
  },
  
  handleUserLogin(credentials) {
    const users = app.getState('users') || []
    const user = users.find(u => 
      u.email === credentials.email && 
      u.password === credentials.password
    )
    
    if (user) {
      app.setState('currentUser', user)
      console.log('用户登录成功:', user.name)
      app.emit('user:loggedIn', user)
    } else {
      console.error('登录失败：用户名或密码错误')
      app.emit('user:loginFailed', credentials)
    }
  },
  
  handleUserLogout() {
    const currentUser = app.getState('currentUser')
    if (currentUser) {
      app.setState('currentUser', null)
      console.log('用户登出:', currentUser.name)
      app.emit('user:loggedOut', currentUser)
    }
  },
  
  handleUserUpdate(updateData) {
    const users = app.getState('users') || []
    const currentUser = app.getState('currentUser')
    
    if (currentUser) {
      const userIndex = users.findIndex(u => u.id === currentUser.id)
      if (userIndex !== -1) {
        const updatedUser = { ...users[userIndex], ...updateData }
        users[userIndex] = updatedUser
        
        app.setState('users', users)
        app.setState('currentUser', updatedUser)
        
        console.log('用户信息更新:', updatedUser)
        app.emit('user:updated', updatedUser)
      }
    }
  }
}

// 日志插件
const loggerPlugin: Plugin = {
  name: 'LoggerPlugin',
  version: '1.0.0',
  
  install(engine) {
    // 监听所有用户相关事件
    const userEvents = [
      'user:registered',
      'user:loggedIn',
      'user:loginFailed',
      'user:loggedOut',
      'user:updated'
    ]
    
    userEvents.forEach(event => {
      engine.on(event, (data) => {
        this.log(event, data)
      })
    })
    
    console.log('日志插件已安装')
  },
  
  log(event, data) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${event}:`, data)
    
    // 这里可以将日志发送到服务器或保存到本地
  }
}

// 通知插件
const notificationPlugin: Plugin = {
  name: 'NotificationPlugin',
  version: '1.0.0',
  
  install(engine) {
    engine.on('user:registered', this.showWelcomeNotification.bind(this))
    engine.on('user:loggedIn', this.showLoginNotification.bind(this))
    engine.on('user:loginFailed', this.showErrorNotification.bind(this))
    
    console.log('通知插件已安装')
  },
  
  showWelcomeNotification(user) {
    this.showNotification('success', `欢迎 ${user.name}！注册成功。`)
  },
  
  showLoginNotification(user) {
    this.showNotification('info', `欢迎回来，${user.name}！`)
  },
  
  showErrorNotification() {
    this.showNotification('error', '登录失败，请检查用户名和密码。')
  },
  
  showNotification(type, message) {
    console.log(`[${type.toUpperCase()}] ${message}`)
    // 在实际应用中，这里会显示 UI 通知
  }
}

// 注册插件
app.use(userPlugin)
app.use(loggerPlugin)
app.use(notificationPlugin)

// 启动应用
async function startApp() {
  try {
    await app.start()
    console.log('应用启动成功')
    
    // 模拟用户操作
    await simulateUserOperations()
  } catch (error) {
    console.error('应用启动失败:', error)
  }
}

// 模拟用户操作
async function simulateUserOperations() {
  console.log('\n=== 开始模拟用户操作 ===')
  
  // 1. 用户注册
  console.log('\n1. 用户注册')
  app.emit('user:register', {
    name: 'Alice Smith',
    email: 'alice@example.com',
    password: 'password123'
  })
  
  await delay(1000)
  
  // 2. 用户登录
  console.log('\n2. 用户登录')
  app.emit('user:login', {
    email: 'alice@example.com',
    password: 'password123'
  })
  
  await delay(1000)
  
  // 3. 更新用户信息
  console.log('\n3. 更新用户信息')
  app.emit('user:update', {
    name: 'Alice Johnson',
    phone: '+1234567890'
  })
  
  await delay(1000)
  
  // 4. 查看当前状态
  console.log('\n4. 当前应用状态')
  console.log('用户列表:', app.getState('users'))
  console.log('当前用户:', app.getState('currentUser'))
  
  await delay(1000)
  
  // 5. 用户登出
  console.log('\n5. 用户登出')
  app.emit('user:logout')
  
  await delay(1000)
  
  // 6. 尝试错误登录
  console.log('\n6. 尝试错误登录')
  app.emit('user:login', {
    email: 'alice@example.com',
    password: 'wrongpassword'
  })
  
  console.log('\n=== 用户操作模拟完成 ===')
}

// 工具函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 启动应用
startApp()
```

## 中间件使用示例

```typescript
import { Engine } from '@ldesign/engine'

const app = new Engine({
  name: 'MiddlewareExample',
  debug: true
})

// 日志中间件
app.middleware('logger', (context, next) => {
  const start = Date.now()
  console.log(`[${new Date().toISOString()}] 请求开始:`, context.request)
  
  next()
  
  const duration = Date.now() - start
  console.log(`[${new Date().toISOString()}] 请求完成，耗时: ${duration}ms`)
})

// 认证中间件
app.middleware('auth', (context, next) => {
  const { token } = context.request.headers || {}
  
  if (!token) {
    throw new Error('缺少认证令牌')
  }
  
  // 验证令牌（这里简化处理）
  if (token !== 'valid-token') {
    throw new Error('无效的认证令牌')
  }
  
  context.state.user = {
    id: 1,
    name: 'John Doe',
    role: 'user'
  }
  
  console.log('用户认证成功:', context.state.user.name)
  next()
})

// 权限检查中间件
app.middleware('permission', (context, next) => {
  const { user } = context.state
  const { action } = context.request
  
  // 简单的权限检查
  if (action === 'admin' && user.role !== 'admin') {
    throw new Error('权限不足')
  }
  
  console.log('权限检查通过')
  next()
})

// 业务逻辑中间件
app.middleware('business', (context, next) => {
  const { action, data } = context.request
  
  switch (action) {
    case 'getUserInfo':
      context.response = {
        success: true,
        data: context.state.user
      }
      break
      
    case 'updateProfile':
      // 模拟更新用户资料
      const updatedUser = { ...context.state.user, ...data }
      context.response = {
        success: true,
        data: updatedUser,
        message: '资料更新成功'
      }
      break
      
    default:
      context.response = {
        success: false,
        message: '未知操作'
      }
  }
  
  next()
})

// 处理请求的函数
async function processRequest(request: any) {
  try {
    const context = {
      request,
      state: {},
      response: null
    }
    
    await app.executeMiddleware(context)
    
    console.log('处理结果:', context.response)
    return context.response
  } catch (error) {
    console.error('请求处理失败:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// 测试中间件
async function testMiddleware() {
  console.log('=== 中间件测试 ===')
  
  // 1. 成功的请求
  console.log('\n1. 成功的请求')
  await processRequest({
    headers: { token: 'valid-token' },
    action: 'getUserInfo'
  })
  
  // 2. 缺少认证令牌
  console.log('\n2. 缺少认证令牌')
  await processRequest({
    action: 'getUserInfo'
  })
  
  // 3. 无效的认证令牌
  console.log('\n3. 无效的认证令牌')
  await processRequest({
    headers: { token: 'invalid-token' },
    action: 'getUserInfo'
  })
  
  // 4. 更新资料
  console.log('\n4. 更新资料')
  await processRequest({
    headers: { token: 'valid-token' },
    action: 'updateProfile',
    data: {
      name: 'John Smith',
      email: 'john.smith@example.com'
    }
  })
}

// 启动测试
app.start().then(() => {
  console.log('引擎启动成功')
  testMiddleware()
})
```

## 异步事件处理示例

```typescript
import { Engine } from '@ldesign/engine'

const app = new Engine({
  name: 'AsyncEventExample',
  debug: true
})

// 异步事件处理器
app.on('data:process', async (data) => {
  console.log('开始处理数据:', data.id)
  
  // 模拟异步数据处理
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  console.log('数据处理完成:', data.id)
  
  // 触发处理完成事件
  app.emit('data:processed', {
    ...data,
    processedAt: new Date().toISOString()
  })
})

app.on('data:processed', (data) => {
  console.log('数据已处理:', data)
})

// 批量数据处理
app.on('data:batch', async (items) => {
  console.log(`开始批量处理 ${items.length} 个项目`)
  
  // 并行处理
  const results = await Promise.all(
    items.map(async (item, index) => {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      return {
        ...item,
        processed: true,
        index
      }
    })
  )
  
  console.log('批量处理完成')
  app.emit('data:batchProcessed', results)
})

app.on('data:batchProcessed', (results) => {
  console.log('批量处理结果:', results.length, '个项目已处理')
})

// 错误处理
app.on('error', (error, context) => {
  console.error('发生错误:', error.message)
  console.error('错误上下文:', context)
})

// 测试异步事件
async function testAsyncEvents() {
  await app.start()
  
  console.log('=== 异步事件测试 ===')
  
  // 1. 单个数据处理
  console.log('\n1. 单个数据处理')
  app.emit('data:process', {
    id: 'item-1',
    content: 'Hello World'
  })
  
  await delay(2000)
  
  // 2. 批量数据处理
  console.log('\n2. 批量数据处理')
  const batchData = Array.from({ length: 5 }, (_, i) => ({
    id: `batch-item-${i + 1}`,
    content: `Content ${i + 1}`
  }))
  
  app.emit('data:batch', batchData)
  
  await delay(3000)
  
  console.log('\n=== 异步事件测试完成 ===')
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

testAsyncEvents()
```

## 状态监听示例

```typescript
import { Engine } from '@ldesign/engine'

const app = new Engine({
  name: 'StateWatchExample',
  initialState: {
    counter: 0,
    user: null,
    settings: {
      theme: 'light',
      notifications: true
    }
  }
})

// 监听计数器变化
app.watchState('counter', (newValue, oldValue) => {
  console.log(`计数器变化: ${oldValue} -> ${newValue}`)
  
  if (newValue > 0 && newValue % 5 === 0) {
    console.log('🎉 计数器达到5的倍数！')
    app.emit('counter:milestone', newValue)
  }
})

// 监听用户状态变化
app.watchState('user', (newUser, oldUser) => {
  if (!oldUser && newUser) {
    console.log('用户登录:', newUser.name)
    app.emit('user:loggedIn', newUser)
  } else if (oldUser && !newUser) {
    console.log('用户登出:', oldUser.name)
    app.emit('user:loggedOut', oldUser)
  } else if (oldUser && newUser) {
    console.log('用户信息更新:', newUser.name)
    app.emit('user:updated', newUser)
  }
})

// 监听设置变化
app.watchState('settings', (newSettings, oldSettings) => {
  console.log('设置已更新:', newSettings)
  
  // 检查主题变化
  if (oldSettings?.theme !== newSettings.theme) {
    console.log(`主题切换: ${oldSettings?.theme} -> ${newSettings.theme}`)
    app.emit('theme:changed', newSettings.theme)
  }
  
  // 检查通知设置变化
  if (oldSettings?.notifications !== newSettings.notifications) {
    console.log(`通知设置: ${newSettings.notifications ? '开启' : '关闭'}`)
    app.emit('notifications:toggled', newSettings.notifications)
  }
})

// 事件处理器
app.on('counter:milestone', (value) => {
  console.log(`🏆 里程碑达成！计数器值: ${value}`)
})

app.on('theme:changed', (theme) => {
  console.log(`🎨 应用主题已切换为: ${theme}`)
})

app.on('notifications:toggled', (enabled) => {
  console.log(`🔔 通知${enabled ? '已开启' : '已关闭'}`)
})

// 测试状态监听
async function testStateWatching() {
  await app.start()
  
  console.log('=== 状态监听测试 ===')
  
  // 1. 计数器操作
  console.log('\n1. 计数器操作')
  for (let i = 1; i <= 12; i++) {
    app.setState('counter', i)
    await delay(200)
  }
  
  await delay(1000)
  
  // 2. 用户操作
  console.log('\n2. 用户操作')
  app.setState('user', {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com'
  })
  
  await delay(500)
  
  app.setState('user', {
    id: 1,
    name: 'Alice Smith',
    email: 'alice.smith@example.com'
  })
  
  await delay(500)
  
  app.setState('user', null)
  
  await delay(1000)
  
  // 3. 设置操作
  console.log('\n3. 设置操作')
  app.setState('settings', {
    theme: 'dark',
    notifications: true
  })
  
  await delay(500)
  
  app.setState('settings', {
    theme: 'dark',
    notifications: false
  })
  
  await delay(500)
  
  app.setState('settings', {
    theme: 'light',
    notifications: false
  })
  
  console.log('\n=== 状态监听测试完成 ===')
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

testStateWatching()
```

## 总结

这些基本用法示例展示了 @ldesign/engine 的核心功能：

1. **引擎创建和配置** - 如何创建和配置引擎实例
2. **事件系统** - 事件的注册、触发和监听
3. **状态管理** - 状态的设置、获取和监听
4. **插件系统** - 插件的创建、注册和使用
5. **中间件** - 中间件的注册和执行
6. **异步处理** - 异步事件和操作的处理
7. **错误处理** - 错误的捕获和处理

通过这些示例，您可以快速上手 @ldesign/engine，并在此基础上构建更复杂的应用程序。
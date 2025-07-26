# 快速开始

欢迎使用 @ldesign/engine！本指南将帮助您在几分钟内开始使用这个强大的插件化引擎。

## 什么是 @ldesign/engine？

@ldesign/engine 是一个轻量级、高性能的插件化引擎，专为构建可扩展的现代应用程序而设计。它提供了：

- 🔌 **插件系统**：模块化架构，支持热插拔
- 🚀 **高性能**：优化的状态管理和事件系统
- 📦 **轻量级**：核心库小于 50KB
- 🔧 **TypeScript 优先**：完整的类型支持
- 🌐 **框架无关**：可与任何前端框架集成
- 🛠️ **开发友好**：简洁的 API 和丰富的调试工具

## 安装

使用您喜欢的包管理器安装 @ldesign/engine：

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

## 第一个应用

让我们创建一个简单的应用来了解 @ldesign/engine 的基本用法：

### 1. 创建引擎实例

```typescript
import { Engine } from '@ldesign/engine'

// 创建引擎实例
const engine = new Engine({
  name: 'my-first-app',
  version: '1.0.0'
})

console.log('引擎已创建:', engine.getInfo())
```

### 2. 创建第一个插件

```typescript
import { Plugin, Engine } from '@ldesign/engine'

// 定义一个简单的问候插件
class GreetingPlugin implements Plugin {
  name = 'greeting-plugin'
  version = '1.0.0'
  
  async install(engine: Engine): Promise<void> {
    console.log('问候插件正在安装...')
    
    // 添加问候方法
    engine.addMethod('greet', (name: string) => {
      return `你好，${name}！欢迎使用 @ldesign/engine！`
    })
    
    // 添加多语言问候方法
    engine.addMethod('greetInLanguage', (name: string, language: string) => {
      const greetings = {
        'zh': `你好，${name}！`,
        'en': `Hello, ${name}!`,
        'ja': `こんにちは、${name}！`,
        'ko': `안녕하세요, ${name}!`
      }
      
      return greetings[language] || greetings['en']
    })
    
    console.log('问候插件安装完成！')
  }
  
  async uninstall(engine: Engine): Promise<void> {
    console.log('问候插件正在卸载...')
    
    // 清理方法
    engine.removeMethod('greet')
    engine.removeMethod('greetInLanguage')
    
    console.log('问候插件卸载完成！')
  }
}
```

### 3. 安装和使用插件

```typescript
// 创建并安装插件
const greetingPlugin = new GreetingPlugin()

async function main() {
  try {
    // 安装插件
    await engine.use(greetingPlugin)
    
    // 使用插件提供的方法
    const message1 = engine.greet('张三')
    console.log(message1) // 输出: 你好，张三！欢迎使用 @ldesign/engine！
    
    const message2 = engine.greetInLanguage('John', 'en')
    console.log(message2) // 输出: Hello, John!
    
    const message3 = engine.greetInLanguage('田中', 'ja')
    console.log(message3) // 输出: こんにちは、田中！
    
  } catch (error) {
    console.error('发生错误:', error)
  }
}

main()
```

## 状态管理示例

@ldesign/engine 内置了强大的状态管理功能：

```typescript
// 创建用户管理插件
class UserPlugin implements Plugin {
  name = 'user-plugin'
  version = '1.0.0'
  
  async install(engine: Engine): Promise<void> {
    // 初始化用户状态
    engine.setState('user', {
      currentUser: null,
      isLoggedIn: false,
      preferences: {
        theme: 'light',
        language: 'zh-CN'
      }
    })
    
    // 添加登录方法
    engine.addMethod('login', async (username: string, password: string) => {
      // 模拟登录验证
      if (username && password) {
        const user = {
          id: Date.now(),
          username,
          email: `${username}@example.com`,
          loginTime: new Date().toISOString()
        }
        
        // 更新状态
        engine.setState('user.currentUser', user)
        engine.setState('user.isLoggedIn', true)
        
        // 触发登录事件
        engine.emit('user:login', user)
        
        return { success: true, user }
      } else {
        throw new Error('用户名和密码不能为空')
      }
    })
    
    // 添加登出方法
    engine.addMethod('logout', () => {
      const currentUser = engine.getState('user.currentUser')
      
      // 清除状态
      engine.setState('user.currentUser', null)
      engine.setState('user.isLoggedIn', false)
      
      // 触发登出事件
      engine.emit('user:logout', currentUser)
      
      return { success: true }
    })
    
    // 添加获取当前用户方法
    engine.addMethod('getCurrentUser', () => {
      return engine.getState('user.currentUser')
    })
    
    // 添加更新偏好设置方法
    engine.addMethod('updatePreferences', (preferences: any) => {
      engine.setState('user.preferences', {
        ...engine.getState('user.preferences'),
        ...preferences
      })
      
      engine.emit('user:preferences:updated', preferences)
    })
  }
}

// 使用用户插件
async function userExample() {
  const userPlugin = new UserPlugin()
  await engine.use(userPlugin)
  
  // 监听用户状态变化
  engine.subscribe('user.currentUser', (user) => {
    console.log('当前用户变化:', user)
  })
  
  // 监听登录事件
  engine.on('user:login', (user) => {
    console.log('用户已登录:', user.username)
  })
  
  // 监听登出事件
  engine.on('user:logout', (user) => {
    console.log('用户已登出:', user?.username)
  })
  
  try {
    // 执行登录
    const loginResult = await engine.login('张三', 'password123')
    console.log('登录结果:', loginResult)
    
    // 获取当前用户
    const currentUser = engine.getCurrentUser()
    console.log('当前用户:', currentUser)
    
    // 更新偏好设置
    engine.updatePreferences({ theme: 'dark', language: 'en-US' })
    
    // 查看完整状态
    console.log('完整用户状态:', engine.getState('user'))
    
    // 登出
    const logoutResult = engine.logout()
    console.log('登出结果:', logoutResult)
    
  } catch (error) {
    console.error('用户操作失败:', error)
  }
}

userExample()
```

## 事件系统示例

@ldesign/engine 提供了强大的事件系统用于组件间通信：

```typescript
// 创建通知插件
class NotificationPlugin implements Plugin {
  name = 'notification-plugin'
  version = '1.0.0'
  
  async install(engine: Engine): Promise<void> {
    // 初始化通知状态
    engine.setState('notifications', [])
    
    // 添加显示通知方法
    engine.addMethod('showNotification', (notification: {
      type: 'success' | 'error' | 'warning' | 'info'
      title: string
      message: string
      duration?: number
    }) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const fullNotification = {
        id,
        ...notification,
        timestamp: Date.now(),
        duration: notification.duration || 3000
      }
      
      // 添加到通知列表
      const notifications = engine.getState('notifications')
      engine.setState('notifications', [...notifications, fullNotification])
      
      // 触发通知事件
      engine.emit('notification:show', fullNotification)
      
      // 自动移除通知
      setTimeout(() => {
        engine.removeNotification(id)
      }, fullNotification.duration)
      
      return id
    })
    
    // 添加移除通知方法
    engine.addMethod('removeNotification', (id: string) => {
      const notifications = engine.getState('notifications')
      const updatedNotifications = notifications.filter(n => n.id !== id)
      engine.setState('notifications', updatedNotifications)
      
      engine.emit('notification:remove', id)
    })
    
    // 监听用户登录事件，显示欢迎通知
    engine.on('user:login', (user) => {
      engine.showNotification({
        type: 'success',
        title: '登录成功',
        message: `欢迎回来，${user.username}！`,
        duration: 5000
      })
    })
    
    // 监听用户登出事件，显示再见通知
    engine.on('user:logout', (user) => {
      if (user) {
        engine.showNotification({
          type: 'info',
          title: '已登出',
          message: `再见，${user.username}！`,
          duration: 3000
        })
      }
    })
  }
}

// 使用通知插件
async function notificationExample() {
  const notificationPlugin = new NotificationPlugin()
  await engine.use(notificationPlugin)
  
  // 监听通知事件
  engine.on('notification:show', (notification) => {
    console.log(`📢 [${notification.type.toUpperCase()}] ${notification.title}: ${notification.message}`)
  })
  
  engine.on('notification:remove', (id) => {
    console.log(`🗑️ 通知已移除: ${id}`)
  })
  
  // 显示各种类型的通知
  engine.showNotification({
    type: 'info',
    title: '信息',
    message: '这是一条信息通知'
  })
  
  engine.showNotification({
    type: 'success',
    title: '成功',
    message: '操作成功完成！'
  })
  
  engine.showNotification({
    type: 'warning',
    title: '警告',
    message: '请注意这个警告信息'
  })
  
  engine.showNotification({
    type: 'error',
    title: '错误',
    message: '发生了一个错误',
    duration: 10000 // 10秒后自动消失
  })
}

notificationExample()
```

## 完整示例

让我们把所有内容组合成一个完整的应用：

```typescript
import { Engine, Plugin } from '@ldesign/engine'

// 创建引擎
const app = new Engine({
  name: 'demo-app',
  version: '1.0.0',
  debug: true // 启用调试模式
})

// 应用主函数
async function createApp() {
  try {
    console.log('🚀 启动应用...')
    
    // 安装所有插件
    await app.use([
      new GreetingPlugin(),
      new UserPlugin(),
      new NotificationPlugin()
    ])
    
    console.log('✅ 所有插件安装完成')
    console.log('📦 已安装的插件:', app.getInstalledPlugins())
    console.log('🔧 可用的方法:', app.getAvailableMethods())
    
    // 设置全局错误处理
    app.on('error', (error) => {
      console.error('❌ 应用错误:', error)
      app.showNotification({
        type: 'error',
        title: '系统错误',
        message: error.message
      })
    })
    
    // 演示应用功能
    await demonstrateFeatures()
    
  } catch (error) {
    console.error('💥 应用启动失败:', error)
  }
}

// 演示功能
async function demonstrateFeatures() {
  console.log('\n🎯 开始功能演示...')
  
  // 1. 问候功能
  console.log('\n1️⃣ 问候功能:')
  console.log(app.greet('开发者'))
  console.log(app.greetInLanguage('Developer', 'en'))
  
  // 2. 用户管理
  console.log('\n2️⃣ 用户管理:')
  
  // 监听状态变化
  app.subscribe('user.isLoggedIn', (isLoggedIn) => {
    console.log(`👤 登录状态: ${isLoggedIn ? '已登录' : '未登录'}`)
  })
  
  // 执行登录
  await app.login('demo_user', 'password123')
  
  // 更新偏好设置
  app.updatePreferences({ theme: 'dark' })
  
  // 等待一段时间后登出
  setTimeout(() => {
    app.logout()
  }, 2000)
  
  // 3. 手动通知
  console.log('\n3️⃣ 通知系统:')
  setTimeout(() => {
    app.showNotification({
      type: 'info',
      title: '演示完成',
      message: '所有功能演示已完成！'
    })
  }, 3000)
}

// 启动应用
createApp()

// 在浏览器环境中，可以将引擎实例挂载到 window 对象上以便调试
if (typeof window !== 'undefined') {
  (window as any).__ENGINE__ = app
  console.log('🔍 引擎实例已挂载到 window.__ENGINE__，可在控制台中调试')
}
```

## 在不同框架中使用

### React 集成

```typescript
import React, { useEffect, useState } from 'react'
import { Engine } from '@ldesign/engine'

// 创建 React Hook
function useEngine() {
  const [engine] = useState(() => new Engine({
    name: 'react-app',
    version: '1.0.0'
  }))
  
  const [notifications, setNotifications] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  
  useEffect(() => {
    // 初始化插件
    const initializeEngine = async () => {
      await engine.use([
        new UserPlugin(),
        new NotificationPlugin()
      ])
    }
    
    initializeEngine()
    
    // 订阅状态变化
    const unsubscribeNotifications = engine.subscribe('notifications', setNotifications)
    const unsubscribeUser = engine.subscribe('user.currentUser', setCurrentUser)
    
    return () => {
      unsubscribeNotifications()
      unsubscribeUser()
    }
  }, [engine])
  
  return { engine, notifications, currentUser }
}

// React 组件
function App() {
  const { engine, notifications, currentUser } = useEngine()
  
  const handleLogin = async () => {
    try {
      await engine.login('user', 'password')
    } catch (error) {
      console.error('登录失败:', error)
    }
  }
  
  return (
    <div>
      <h1>@ldesign/engine + React</h1>
      
      {currentUser ? (
        <div>
          <p>欢迎，{currentUser.username}！</p>
          <button onClick={() => engine.logout()}>登出</button>
        </div>
      ) : (
        <button onClick={handleLogin}>登录</button>
      )}
      
      <div>
        {notifications.map(notification => (
          <div key={notification.id} className={`notification ${notification.type}`}>
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Vue 集成

```vue
<template>
  <div>
    <h1>@ldesign/engine + Vue</h1>
    
    <div v-if="currentUser">
      <p>欢迎，{{ currentUser.username }}！</p>
      <button @click="logout">登出</button>
    </div>
    <button v-else @click="login">登录</button>
    
    <div>
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        :class="`notification ${notification.type}`"
      >
        <strong>{{ notification.title }}</strong>
        <p>{{ notification.message }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Engine } from '@ldesign/engine'

const engine = new Engine({ name: 'vue-app', version: '1.0.0' })
const notifications = ref([])
const currentUser = ref(null)

let unsubscribers: Array<() => void> = []

onMounted(async () => {
  // 初始化插件
  await engine.use([
    new UserPlugin(),
    new NotificationPlugin()
  ])
  
  // 订阅状态变化
  unsubscribers.push(
    engine.subscribe('notifications', (value) => {
      notifications.value = value
    })
  )
  
  unsubscribers.push(
    engine.subscribe('user.currentUser', (value) => {
      currentUser.value = value
    })
  )
})

onUnmounted(() => {
  // 清理订阅
  unsubscribers.forEach(unsubscribe => unsubscribe())
})

const login = async () => {
  try {
    await engine.login('user', 'password')
  } catch (error) {
    console.error('登录失败:', error)
  }
}

const logout = () => {
  engine.logout()
}
</script>
```

## 下一步

恭喜！您已经学会了 @ldesign/engine 的基本用法。接下来您可以：

1. **深入学习**：查看 [配置选项](./configuration.md) 了解更多配置
2. **插件开发**：阅读 [插件开发指南](./plugin-development.md) 创建自定义插件
3. **最佳实践**：学习 [最佳实践](./best-practices.md) 构建高质量应用
4. **API 参考**：查看完整的 [API 文档](../api/index.md)
5. **示例代码**：浏览更多 [示例](../examples/index.md)

## 需要帮助？

如果您遇到问题，可以：

- 查看 [常见问题 (FAQ)](./faq.md)
- 阅读 [故障排除指南](./troubleshooting.md)
- 在 [GitHub](https://github.com/ldesign/engine) 上提交 Issue
- 参与社区讨论

祝您使用愉快！🎉
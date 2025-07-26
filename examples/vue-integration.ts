import { createApp, defineComponent, inject, onMounted, ref } from 'vue'
import { createEngine } from '../src/index'
import type { Engine, Plugin } from '../src/types'

// Vue 集成示例：展示如何在 Vue 应用中使用引擎

// 1. 创建一个主题插件
const themePlugin: Plugin = {
  name: 'theme',
  install(engine, options = {}) {
    const themes = {
      light: {
        primary: '#007bff',
        secondary: '#6c757d',
        background: '#ffffff',
        text: '#212529'
      },
      dark: {
        primary: '#0d6efd',
        secondary: '#6c757d',
        background: '#212529',
        text: '#ffffff'
      }
    }

    const currentTheme = ref(options.defaultTheme || 'light')

    const themeService = {
      themes,
      currentTheme,
      setTheme: (themeName: string) => {
        if (themes[themeName as keyof typeof themes]) {
          currentTheme.value = themeName
          engine.emit('theme:changed', { theme: themeName, colors: themes[themeName as keyof typeof themes] })
        }
      },
      getTheme: () => currentTheme.value,
      getColors: () => themes[currentTheme.value as keyof typeof themes]
    }

    engine.provide('theme', themeService)
    console.log('Theme plugin installed')
  }
}

// 2. 创建通知插件
const notificationPlugin: Plugin = {
  name: 'notification',
  install(engine) {
    const notifications = ref<Array<{ id: number; message: string; type: string; timestamp: number }>>([])
    let nextId = 1

    const notificationService = {
      notifications,
      show: (message: string, type = 'info', duration = 3000) => {
        const notification = {
          id: nextId++,
          message,
          type,
          timestamp: Date.now()
        }

        notifications.value.push(notification)
        engine.emit('notification:shown', notification)

        if (duration > 0) {
          setTimeout(() => {
            notificationService.remove(notification.id)
          }, duration)
        }

        return notification.id
      },
      remove: (id: number) => {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index > -1) {
          const removed = notifications.value.splice(index, 1)[0]
          engine.emit('notification:removed', removed)
        }
      },
      clear: () => {
        notifications.value.length = 0
        engine.emit('notification:cleared')
      }
    }

    engine.provide('notification', notificationService)
    console.log('Notification plugin installed')
  }
}

// 3. 创建 HTTP 客户端插件
const httpPlugin: Plugin = {
  name: 'http',
  install(engine, options = {}) {
    const baseURL = options.baseURL || ''
    const defaultHeaders = options.headers || {}

    const httpService = {
      async request(url: string, options: RequestInit = {}) {
        const fullUrl = baseURL + url
        const config = {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...defaultHeaders,
            ...options.headers
          }
        }

        engine.emit('http:request', { url: fullUrl, options: config })

        try {
          const response = await fetch(fullUrl, config)
          const data = await response.json()

          engine.emit('http:response', { url: fullUrl, response: data, status: response.status })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          return data
        } catch (error) {
          engine.emit('http:error', { url: fullUrl, error })
          throw error
        }
      },

      get: (url: string, options?: RequestInit) =>
        httpService.request(url, { ...options, method: 'GET' }),

      post: (url: string, data?: any, options?: RequestInit) =>
        httpService.request(url, {
          ...options,
          method: 'POST',
          body: data ? JSON.stringify(data) : undefined
        }),

      put: (url: string, data?: any, options?: RequestInit) =>
        httpService.request(url, {
          ...options,
          method: 'PUT',
          body: data ? JSON.stringify(data) : undefined
        }),

      delete: (url: string, options?: RequestInit) =>
        httpService.request(url, { ...options, method: 'DELETE' })
    }

    engine.provide('http', httpService)
    console.log('HTTP plugin installed')
  }
}

// 4. 创建 Vue 组件
const AppComponent = defineComponent({
  name: 'App',
  setup() {
    const engine = inject<Engine>('engine')
    const theme = inject('theme')
    const notification = inject('notification')
    const http = inject('http')

    const currentTheme = ref('light')
    const loading = ref(false)
    const users = ref<any[]>([])

    // 主题切换
    const toggleTheme = () => {
      const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
      currentTheme.value = newTheme
      theme?.setTheme(newTheme)
    }

    // 显示通知
    const showNotification = (type: string) => {
      const messages = {
        success: '操作成功！',
        error: '操作失败！',
        warning: '请注意！',
        info: '这是一条信息。'
      }
      notification?.show(messages[type as keyof typeof messages] || '未知消息', type)
    }

    // 加载用户数据
    const loadUsers = async () => {
      loading.value = true
      try {
        // 模拟 API 调用
        const mockUsers = [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
          { id: 3, name: 'Charlie', email: 'charlie@example.com' }
        ]

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000))

        users.value = mockUsers
        notification?.show('用户数据加载成功', 'success')
      } catch (error) {
        notification?.show('加载用户数据失败', 'error')
        console.error('Failed to load users:', error)
      } finally {
        loading.value = false
      }
    }

    // 组件挂载时的操作
    onMounted(() => {
      console.log('App component mounted')
      console.log('Engine state:', engine?.state)

      // 监听引擎事件
      engine?.on('theme:changed', ({ theme, colors }) => {
        console.log('Theme changed to:', theme, colors)
      })

      engine?.on('notification:shown', (notification) => {
        console.log('Notification shown:', notification)
      })
    })

    return {
      currentTheme,
      loading,
      users,
      notifications: notification?.notifications,
      toggleTheme,
      showNotification,
      loadUsers,
      removeNotification: notification?.remove,
      clearNotifications: notification?.clear
    }
  },

  template: `
    <div class="app" :class="\`theme-\${currentTheme}\`">
      <header class="header">
        <h1>Vue + Engine 集成示例</h1>
        <div class="controls">
          <button @click="toggleTheme" class="btn">
            切换到 {{ currentTheme === 'light' ? '深色' : '浅色' }} 主题
          </button>
        </div>
      </header>

      <main class="main">
        <section class="notifications-demo">
          <h2>通知系统</h2>
          <div class="btn-group">
            <button @click="showNotification('success')" class="btn btn-success">成功</button>
            <button @click="showNotification('error')" class="btn btn-error">错误</button>
            <button @click="showNotification('warning')" class="btn btn-warning">警告</button>
            <button @click="showNotification('info')" class="btn btn-info">信息</button>
            <button @click="clearNotifications" class="btn">清空通知</button>
          </div>
        </section>

        <section class="data-demo">
          <h2>数据加载</h2>
          <button @click="loadUsers" :disabled="loading" class="btn">
            {{ loading ? '加载中...' : '加载用户数据' }}
          </button>

          <div v-if="users.length > 0" class="users-list">
            <h3>用户列表</h3>
            <div v-for="user in users" :key="user.id" class="user-card">
              <strong>{{ user.name }}</strong>
              <span>{{ user.email }}</span>
            </div>
          </div>
        </section>
      </main>

      <!-- 通知容器 -->
      <div class="notifications-container">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="\`notification notification-\${notification.type}\`"
          @click="removeNotification(notification.id)"
        >
          {{ notification.message }}
          <span class="close">&times;</span>
        </div>
      </div>
    </div>
  `
})

// 5. 创建并配置应用
export async function createVueApp() {
  // 创建引擎
  const engine = createEngine({
    name: 'VueIntegrationDemo',
    version: '1.0.0',
    debug: true
  })

  // 安装插件
  await engine.use(themePlugin, { defaultTheme: 'light' })
  await engine.use(notificationPlugin)
  await engine.use(httpPlugin, {
    baseURL: 'https://jsonplaceholder.typicode.com',
    headers: {
      'X-App-Version': '1.0.0'
    }
  })

  // 创建 Vue 应用
  const app = createApp(AppComponent)

  // 将引擎和服务注入到 Vue 应用中
  app.provide('engine', engine)
  app.provide('theme', engine.inject('theme'))
  app.provide('notification', engine.inject('notification'))
  app.provide('http', engine.inject('http'))

  // 添加全局属性（可选）
  app.config.globalProperties.$engine = engine

  return { app, engine }
}

// 6. 样式（在实际项目中应该放在 CSS 文件中）
const styles = `
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  transition: all 0.3s ease;
}

.theme-light {
  background-color: #ffffff;
  color: #212529;
}

.theme-dark {
  background-color: #212529;
  color: #ffffff;
}

.header {
  padding: 1rem 2rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.theme-dark .header {
  border-bottom-color: #495057;
}

.main {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  background: #f8f9fa;
  color: #212529;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0.25rem;
}

.btn:hover {
  background: #e9ecef;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.theme-dark .btn {
  background: #495057;
  color: #ffffff;
  border-color: #6c757d;
}

.theme-dark .btn:hover {
  background: #5a6268;
}

.btn-success { background: #28a745; color: white; border-color: #28a745; }
.btn-error { background: #dc3545; color: white; border-color: #dc3545; }
.btn-warning { background: #ffc107; color: #212529; border-color: #ffc107; }
.btn-info { background: #17a2b8; color: white; border-color: #17a2b8; }

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.users-list {
  margin-top: 1rem;
}

.user-card {
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  margin: 0.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.theme-dark .user-card {
  border-color: #495057;
  background: #343a40;
}

.notifications-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  max-width: 300px;
}

.notification {
  padding: 1rem;
  margin: 0.5rem 0;
  border-radius: 0.25rem;
  cursor: pointer;
  position: relative;
  animation: slideIn 0.3s ease;
}

.notification-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.notification-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.notification-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
.notification-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }

.close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-weight: bold;
  opacity: 0.7;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

section {
  margin: 2rem 0;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
}

.theme-dark section {
  border-color: #495057;
  background: #343a40;
}
`

// 7. 启动函数
export async function startVueApp(selector = '#app') {
  // 注入样式
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)

  // 创建应用
  const { app, engine } = await createVueApp()

  // 挂载应用
  app.mount(selector)

  console.log('Vue app started successfully!')
  console.log('Engine state:', engine.state)
  console.log('Available services:', Object.keys(engine.getDebugInfo().services))

  return { app, engine }
}

// 如果直接运行此文件
if (typeof window !== 'undefined' && require.main === module) {
  // 创建一个简单的 HTML 容器
  document.body.innerHTML = '<div id="app"></div>'

  startVueApp('#app').catch(console.error)
}

export {
    AppComponent, httpPlugin, notificationPlugin, themePlugin
}
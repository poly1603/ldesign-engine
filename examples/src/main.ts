import { createApp } from 'vue'
import './style.css'
import { createEngine } from '@ldesign/engine'
import App from './App.vue'
import router from './router'

// 创建主题插件
const themePlugin = {
  name: 'theme',
  install: (engine: any) => {
    const themeService = {
      currentTheme: 'light',
      setTheme: (theme: string) => {
        themeService.currentTheme = theme
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)

        // 更新 CSS 变量
        const root = document.documentElement
        if (theme === 'dark') {
          root.style.setProperty('--bg-color', '#1a1a1a')
          root.style.setProperty('--text-color', '#ffffff')
          root.style.setProperty('--border-color', '#333333')
        }
 else {
          root.style.setProperty('--bg-color', '#ffffff')
          root.style.setProperty('--text-color', '#000000')
          root.style.setProperty('--border-color', '#e0e0e0')
        }

        engine.emit('theme:changed', { theme })
      },
      getTheme: () => themeService.currentTheme,
      toggleTheme: () => {
        const newTheme = themeService.currentTheme === 'light' ? 'dark' : 'light'
        themeService.setTheme(newTheme)
      },
    }

    // 从本地存储恢复主题
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      themeService.setTheme(savedTheme)
    }

    engine.provide('theme', themeService)
    return themeService
  },
}

// 创建通知插件
const notificationPlugin = {
  name: 'notification',
  install: (engine: any) => {
    const notificationService = {
      notifications: [],
      listeners: new Map(),
      show: (message: string, type: string = 'info', title?: string) => {
        const notification = {
          id: Date.now(),
          title: title || '通知',
          message,
          type,
          timestamp: new Date(),
        }
        notificationService.notifications.push(notification)

        // 触发通知事件
        notificationService.emit('notification', notification)
        engine.emit('notification:shown', notification)

        // 自动移除通知
        setTimeout(() => {
          notificationService.remove(notification.id)
        }, 5000)

        return notification
      },
      remove: (id: number) => {
        const index = notificationService.notifications.findIndex(n => n.id === id)
        if (index > -1) {
          const notification = notificationService.notifications.splice(index, 1)[0]
          engine.emit('notification:removed', notification)
        }
      },
      clear: () => {
        notificationService.notifications.length = 0
        engine.emit('notification:cleared')
      },
      // 简单的事件系统
      on: (event: string, callback: Function) => {
        if (!notificationService.listeners.has(event)) {
          notificationService.listeners.set(event, [])
        }
        notificationService.listeners.get(event).push(callback)
      },
      emit: (event: string, data: any) => {
        const listeners = notificationService.listeners.get(event)
        if (listeners) {
          listeners.forEach(callback => callback(data))
        }
      },
    }

    engine.provide('notification', notificationService)
    return notificationService
  },
}

// 启动应用
async function startApp() {
  try {
    // 创建引擎实例
    const engine = createEngine({
      name: 'ldesign-demo-app',
      version: '1.0.0',
      debug: true,
    })

    // 安装插件
    await engine.use(themePlugin)
    await engine.use(notificationPlugin)

    // 创建 Vue 应用
    const app = createApp(App)

    // 使用路由
    app.use(router)

    // 提供引擎实例和服务给组件
    app.provide('engine', engine)
    app.provide('theme', engine.inject('theme'))
    app.provide('notification', engine.inject('notification'))

    // 挂载应用
    app.mount('#app')

    // 显示启动成功通知
    const notificationService = engine.inject('notification')
    if (notificationService) {
      notificationService.show(
        '所有系统组件已成功初始化，演示应用已准备就绪！',
        'success',
        '应用启动成功',
      )
    }

    console.log('🚀 LDesign Engine 演示应用启动成功！')
    console.log('📊 引擎实例:', engine)
    console.log('🔌 引擎名称:', engine.name)
    console.log('🎯 引擎版本:', engine.version)
  }
 catch (error) {
    console.error('❌ 应用启动失败:', error)

    // 显示错误信息
    const errorDiv = document.createElement('div')
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fef2f2;
        border: 1px solid #dc2626;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        text-align: center;
        font-family: system-ui, sans-serif;
        color: #dc2626;
        z-index: 9999;
      ">
        <h2 style="margin: 0 0 16px 0; color: #dc2626;">应用启动失败</h2>
        <p style="margin: 0 0 16px 0; color: #7f1d1d;">${error.message}</p>
        <button onclick="location.reload()" style="
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">重新加载</button>
      </div>
    `
    document.body.appendChild(errorDiv)
  }
}

startApp()

/**
 * Vue 2 Engine 示例 - 入口文件
 */
import Vue from 'vue'
import { createEngineApp } from '@ldesign/engine-vue2'
import App from './App.vue'
import Home from './pages/Home.vue'
import About from './pages/About.vue'
import User from './pages/User.vue'
import './style.css'

// 定义示例插件
const loggerPlugin = {
  name: 'logger',
  version: '1.0.0',
  install(context: any) {
    console.log('📦 Logger 插件已安装')
    
    // 监听所有事件
    context.engine.events.on('*', (event: string, data: any) => {
      console.log(`📢 事件触发: ${event}`, data)
    })
  },
}

const themePlugin = {
  name: 'theme',
  version: '1.0.0',
  install(context: any) {
    console.log('🎨 Theme 插件已安装')
    
    // 设置默认主题
    context.engine.state.set('theme', 'light')
  },
}

// 定义示例中间件
const authMiddleware = {
  name: 'auth',
  priority: 100,
  async execute(context: any, next: () => Promise<void>) {
    console.log('🔐 Auth 中间件: 执行前')
    await next()
    console.log('🔐 Auth 中间件: 执行后')
  },
}

const loggingMiddleware = {
  name: 'logging',
  priority: 50,
  async execute(context: any, next: () => Promise<void>) {
    console.log('📝 Logging 中间件: 执行前', context.data)
    await next()
    console.log('📝 Logging 中间件: 执行后')
  },
}

// 创建引擎应用
createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'Vue 2 Engine Demo',
    debug: true,
  },
  router: {
    mode: 'hash',
    base: '/',
    routes: [
      { path: '/', component: Home },
      { path: '/about', component: About },
      { path: '/user/:id', component: User },
    ],
    preset: 'spa',
  },
  plugins: [loggerPlugin, themePlugin],
  middleware: [authMiddleware, loggingMiddleware],
  onReady: async (engine: any) => {
    console.log('✅ 引擎准备就绪!', engine)

    // 设置初始状态
    engine.state.set('count', 0)
    engine.state.set('user', { name: 'Vue 2 用户', role: 'admin' })

    // 触发欢迎事件
    engine.events.emit('app:welcome', { message: '欢迎使用 Vue 2 Engine!' })
  },
  onMounted: async (engine: any) => {
    console.log('✅ 应用已挂载!', engine)
  },
  onError: (error: Error, context: string) => {
    console.error('❌ 错误:', error, '上下文:', context)
  },
})


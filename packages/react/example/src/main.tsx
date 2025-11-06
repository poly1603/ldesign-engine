/**
 * React Engine 示例 - 入口文件（带路由）
 */
import { createEngineApp } from '@ldesign/engine-react'
import App from './App'
import Home from './pages/Home'
import About from './pages/About'
import User from './pages/User'
import './index.css'

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

// 创建引擎应用（带路由配置）
createEngineApp({
  rootComponent: App,
  mountElement: '#root',
  config: {
    name: 'React Engine Demo with Router',
    debug: true,
  },
  plugins: [loggerPlugin, themePlugin],
  middleware: [authMiddleware, loggingMiddleware],
  // 路由配置
  router: {
    mode: 'hash', // 使用 hash 模式以便在静态服务器上运行
    base: '/',
    preset: 'spa', // 使用 SPA 预设配置
    routes: [
      {
        path: '/',
        component: Home,
        meta: { title: '首页' },
      },
      {
        path: '/about',
        component: About,
        meta: { title: '关于' },
      },
      {
        path: '/user/:id',
        component: User,
        meta: { title: '用户详情' },
      },
    ],
  },
  onReady: async (engine) => {
    console.log('✅ 引擎准备就绪!', engine)

    // 设置初始状态
    engine.state.set('count', 0)
    engine.state.set('user', { name: 'React 用户', role: 'admin' })

    // 触发欢迎事件
    engine.events.emit('app:welcome', { message: '欢迎使用 React Engine with Router!' })

    // 如果路由器可用，记录路由信息
    if (engine.router) {
      console.log('🛣️ 路由器已就绪')
      // TODO: 添加 getCurrentRoute 方法
      // console.log('当前路由:', engine.router.getCurrentRoute())
    }
  },
  onMounted: async (engine) => {
    console.log('✅ 应用已挂载!', engine)
  },
  onError: (error, context) => {
    console.error('❌ 错误:', error, '上下文:', context)
  },
})


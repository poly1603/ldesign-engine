/**
 * Vue 3 Engine 示例 - 入口文件（带路由）
 */
import { createEngineApp } from '@ldesign/engine-vue3'
import App from './App.vue'
import Home from './pages/Home.vue'
import About from './pages/About.vue'
import User from './pages/User.vue'
import './style.css'

console.log('🚀 main.ts 开始执行 - 这是第一个日志，用于测试实时日志功能s')
console.log('⏰ 当前时间:', new Date().toISOString())

// 定义示例插件
const loggerPlugin = {
  name: 'logger',
  version: '1.0.0',
  install(context: any) {
    console.log('📦 Logger 插件已安装 - 这个日志应该显示在控制台')

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
    console.log('🎨 Theme 插件已安装 - 这个日志应该显示在控制台')

    // 设置默认主题
    context.engine.state.set('theme', 'light')
  },
}

// 定义示例中间件
const authMiddleware = {
  name: 'auth',
  priority: 100,
  async execute(context: any, next: () => Promise<void>) {
    console.log('🔐 Auth 中间件: 执行前 - 测试实时日志')
    await next()
    console.log('🔐 Auth 中间件: 执行后 - 测试实时日志')
  },
}

const loggingMiddleware = {
  name: 'logging',
  priority: 50,
  async execute(context: any, next: () => Promise<void>) {
    console.log('📝 Logging 中间件: 执行前', context.data)
    await next()
    console.log('📝 Logging 中间件: 执行后 - 测试实时日志输出')
  },
}

console.log('🔧 开始创建引擎应用...')

// 创建引擎应用（带路由配置）
createEngineApp({
  rootComponent: App,
  mountElement: '#app',
  config: {
    name: 'Vue 3 Engine Demo with Router',
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
    console.log('📦 引擎信息:', {
      name: engine.config.name,
      version: engine.config.version,
      debug: engine.config.debug,
    })

    // 设置初始状态
    engine.state.set('count', 0)
    engine.state.set('user', { name: 'Vue 3 用户', role: 'admin' })
    console.log('📊 初始状态已设置')

    // 触发欢迎事件
    engine.events.emit('app:welcome', { message: '欢迎使用 Vue 3 Engine with Router!' })
    console.log('📢 欢迎事件已触发')

    // 如果路由器可用，记录路由信息
    if (engine.router) {
      console.log('🛣️ 路由器已就绪')
      console.log('当前路由:', engine.router.getCurrentRoute())
    }
    
    // 定期输出日志测试实时日志功能
    setInterval(() => {
      console.log(`⏰ [main.ts] 定期日志输出 - ${new Date().toLocaleTimeString()} - 用于测试实时日志`)
    }, 8000) // 每8秒输出一次
  },
  onMounted: async (engine) => {
    console.log('✅ 应用已挂载!', engine)
    console.log('🎉 应用启动完成 - 所有日志都应该实时显示在控制台')
  },
  onError: (error, context) => {
    console.error('❌ 错误:', error, '上下文:', context)
  },
})

console.log('✅ main.ts 执行完成')


/**
 * Angular Engine 示例 - 入口文件（带路由）
 */
import '@angular/compiler'
import 'zone.js'
import { AppComponent } from './app/app.component'
import { HomeComponent } from './app/pages/home.component'
import { AboutComponent } from './app/pages/about.component'
import { UserComponent } from './app/pages/user.component'
import { createEngineApp } from '@ldesign/engine-angular'
import type { AngularEngineApp } from '@ldesign/engine-angular'

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
  rootComponent: AppComponent,
  config: {
    name: 'Angular Engine Demo with Router',
    debug: true,
  },
  // 路由配置
  router: {
    mode: 'hash', // 使用 hash 模式以便在静态服务器上运行
    base: '/',
    preset: 'spa', // 使用 SPA 预设配置
    routes: [
      {
        path: '/',
        component: HomeComponent,
        meta: { title: '首页' },
      },
      {
        path: '/about',
        component: AboutComponent,
        meta: { title: '关于' },
      },
      {
        path: '/user/:id',
        component: UserComponent,
        meta: { title: '用户详情' },
      },
    ],
  },
  plugins: [loggerPlugin, themePlugin],
  middleware: [authMiddleware, loggingMiddleware],
  onReady: async (engine: AngularEngineApp) => {
    console.log('✅ 引擎准备就绪!', engine)

    // 设置全局以便组件可获取
    ;(window as any).__ldesignEngine = engine
    ;(window as any).__ENGINE__ = engine
    window.dispatchEvent(new CustomEvent('ldesign:engine-ready'))

    // 设置初始状态
    engine.state.set('count', 0)
    engine.state.set('user', { name: 'Angular 用户', role: 'admin' })

    // 触发欢迎事件
    engine.events.emit('app:welcome', { message: '欢迎使用 Angular Engine with Router!' })

    // 如果路由器可用，记录路由信息
    if (engine.router) {
      console.log('🛣️ 路由器已就绪')
      console.log('当前路由:', engine.router.getCurrentRoute())
    }
  },
  onMounted: async (engine: AngularEngineApp) => {
    console.log('✅ 应用已挂载!', engine)
  },
  onError: (error: Error, context: string) => {
    console.error('❌ 错误:', error, '上下文:', context)
  },
})


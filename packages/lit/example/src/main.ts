/**
 * Lit Engine 示例 - 演示 createEngineApp 的使用
 */

import { createEngineApp } from '@ldesign/engine-lit'
import type { Plugin, Middleware } from '@ldesign/engine-core'
import './app-component'
import './style.css'

// 示例插件
const loggingPlugin: Plugin = {
  name: 'logging-plugin',
  version: '1.0.0',
  install(engine) {
    console.log('[Plugin] Logging plugin installed')
    
    // 监听状态变化
    engine.events.on('state:changed', (data) => {
      console.log('[Plugin] State changed:', data)
    })
  }
}

// 示例中间件
const authMiddleware: Middleware = {
  name: 'auth-middleware',
  async execute(context, next) {
    console.log('[Middleware] Auth middleware executing')
    await next()
    console.log('[Middleware] Auth middleware completed')
  }
}

// 创建引擎应用
async function bootstrap() {
  try {
    const engine = await createEngineApp({
      mountElement: '#app',
      config: {
        debug: true,
      },
      plugins: [loggingPlugin],
      middleware: [authMiddleware],
      onReady: async (engine) => {
        console.log('✅ Engine ready!')
        
        // 设置初始状态
        engine.state.set('appName', 'Lit Engine Example')
        engine.state.set('version', '0.2.0')
        
        // 注册自定义元素
        if ('registerElement' in engine) {
          console.log('Custom elements registered')
        }
      },
      onMounted: async (engine) => {
        console.log('✅ App mounted!')
        
        // 发送自定义事件
        engine.events.emit('app:mounted', { timestamp: Date.now() })
      },
      onError: (error, context) => {
        console.error(`❌ Error in ${context}:`, error)
      }
    })

    // 暴露到全局以便调试
    ;(window as any).__ENGINE__ = engine

    console.log('🚀 Lit Engine App started successfully!')
  } catch (error) {
    console.error('Failed to start app:', error)
  }
}

bootstrap()


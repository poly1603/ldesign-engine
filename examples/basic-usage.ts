import { createEngine } from '../src/index'
import type { Plugin } from '../src/types'

// 创建一个简单的插件
const loggerPlugin: Plugin = {
  name: 'logger',
  install(engine, options = {}) {
    const { prefix = '[Logger]' } = options
    
    // 提供日志服务
    engine.provide('logger', {
      log: (message: string) => console.log(`${prefix} ${message}`),
      error: (message: string) => console.error(`${prefix} ERROR: ${message}`),
      warn: (message: string) => console.warn(`${prefix} WARN: ${message}`)
    })
    
    // 监听引擎事件
    engine.on('engine:mounted', () => {
      console.log(`${prefix} Engine mounted successfully`)
    })
    
    engine.on('engine:error', (error) => {
      console.error(`${prefix} Engine error:`, error)
    })
  },
  
  uninstall(engine) {
    // 清理资源
    console.log('Logger plugin uninstalled')
  }
}

// 创建引擎实例
const engine = createEngine({
  name: 'MyApp',
  version: '1.0.0',
  debug: true,
  performance: {
    enabled: true,
    trackMemory: true,
    trackTiming: true
  },
  dev: {
    enabled: true,
    verbose: true
  }
})

// 安装插件
await engine.use(loggerPlugin, { prefix: '[MyApp]' })

// 添加中间件
engine.addMiddleware('beforeMount', async (context, next) => {
  console.log('Before mount middleware executed')
  await next()
})

engine.addMiddleware('mounted', async (context, next) => {
  console.log('Mounted middleware executed')
  await next()
})

// 配置管理
engine.setConfig('app.title', 'My Awesome App')
engine.setConfig('app.theme', 'dark')

// 监听配置变化
engine.watchConfig('app.theme', (newValue, oldValue) => {
  console.log(`Theme changed from ${oldValue} to ${newValue}`)
})

// 事件处理
engine.on('custom:event', (data) => {
  console.log('Custom event received:', data)
})

// 依赖注入
engine.provide('apiClient', {
  get: (url: string) => fetch(url).then(res => res.json()),
  post: (url: string, data: any) => fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json())
})

// 使用注入的服务
const logger = engine.inject('logger')
const apiClient = engine.inject('apiClient')

if (logger) {
  logger.log('Engine setup completed')
}

// 挂载引擎（在浏览器环境中）
if (typeof document !== 'undefined') {
  const app = document.createElement('div')
  app.id = 'app'
  document.body.appendChild(app)
  
  try {
    await engine.mount('#app')
    console.log('Engine mounted successfully')
    
    // 发射自定义事件
    engine.emit('custom:event', { message: 'Hello from mounted app!' })
    
    // 获取调试信息
    console.log('Debug info:', engine.getDebugInfo())
    
    // 健康检查
    const health = engine.healthCheck()
    console.log('Health check:', health)
    
  } catch (error) {
    console.error('Failed to mount engine:', error)
  }
}

export { engine }
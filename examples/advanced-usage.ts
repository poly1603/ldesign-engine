import { createEngine } from '../src/index'
import type { Plugin, MiddlewareFunction } from '../src/types'

// 高级示例：展示引擎的完整功能

// 1. 创建一个复杂的插件
const routerPlugin: Plugin = {
  name: 'router',
  priority: 100,
  dependencies: [],
  install(engine, options = {}) {
    const routes = new Map()
    const currentRoute = { value: '/' }
    
    // 提供路由服务
    engine.provide('router', {
      addRoute: (path: string, component: any) => {
        routes.set(path, component)
        engine.emit('route:added', { path, component })
      },
      navigate: (path: string) => {
        const oldRoute = currentRoute.value
        currentRoute.value = path
        engine.emit('route:changed', { from: oldRoute, to: path })
      },
      getCurrentRoute: () => currentRoute.value,
      getRoutes: () => Array.from(routes.entries())
    })
    
    console.log('Router plugin installed')
  },
  uninstall(engine) {
    console.log('Router plugin uninstalled')
  }
}

// 2. 创建状态管理插件
const storePlugin: Plugin = {
  name: 'store',
  priority: 90,
  install(engine, options = {}) {
    const state = new Proxy(options.initialState || {}, {
      set(target, key, value) {
        const oldValue = target[key as string]
        target[key as string] = value
        engine.emit('state:changed', { key, oldValue, newValue: value })
        return true
      }
    })
    
    engine.provide('store', {
      state,
      commit: (mutation: string, payload?: any) => {
        engine.emit('store:mutation', { mutation, payload })
      },
      dispatch: (action: string, payload?: any) => {
        engine.emit('store:action', { action, payload })
      }
    })
    
    console.log('Store plugin installed')
  }
}

// 3. 创建API客户端插件
const apiPlugin: Plugin = {
  name: 'api',
  priority: 80,
  install(engine, options = {}) {
    const baseURL = options.baseURL || '/api'
    
    const apiClient = {
      get: async (url: string) => {
        engine.emit('api:request', { method: 'GET', url })
        // 模拟API调用
        return new Promise(resolve => {
          setTimeout(() => {
            const response = { data: `Mock data for ${url}`, status: 200 }
            engine.emit('api:response', { url, response })
            resolve(response)
          }, 100)
        })
      },
      post: async (url: string, data: any) => {
        engine.emit('api:request', { method: 'POST', url, data })
        return new Promise(resolve => {
          setTimeout(() => {
            const response = { data: 'Created', status: 201 }
            engine.emit('api:response', { url, response })
            resolve(response)
          }, 100)
        })
      }
    }
    
    engine.provide('api', apiClient)
    console.log('API plugin installed')
  }
}

// 4. 创建性能监控中间件
const performanceMiddleware: MiddlewareFunction = async (context, next) => {
  const start = performance.now()
  console.log(`[Performance] ${context.hook} started`)
  
  await next()
  
  const end = performance.now()
  const duration = end - start
  console.log(`[Performance] ${context.hook} completed in ${duration.toFixed(2)}ms`)
  
  // 记录性能数据
  context.engine.emit('performance:metric', {
    hook: context.hook,
    duration,
    timestamp: Date.now()
  })
}

// 5. 创建日志中间件
const loggingMiddleware: MiddlewareFunction = async (context, next) => {
  console.log(`[Logger] Entering ${context.hook}`)
  
  try {
    await next()
    console.log(`[Logger] Exiting ${context.hook} successfully`)
  } catch (error) {
    console.error(`[Logger] Error in ${context.hook}:`, error)
    throw error
  }
}

// 6. 主应用逻辑
async function createAdvancedApp() {
  // 创建引擎实例
  const engine = createEngine({
    name: 'AdvancedApp',
    version: '2.0.0',
    debug: true,
    performance: {
      trackMemory: true,
      trackTiming: true
    }
  })
  
  // 添加中间件（按执行顺序）
  engine.addMiddleware('beforeMount', loggingMiddleware)
  engine.addMiddleware('beforeMount', performanceMiddleware)
  engine.addMiddleware('mounted', performanceMiddleware)
  engine.addMiddleware('beforeUnmount', performanceMiddleware)
  
  // 安装插件（按优先级顺序）
  await engine.use(routerPlugin)
  await engine.use(storePlugin, {
    initialState: {
      user: null,
      theme: 'light',
      loading: false
    }
  })
  await engine.use(apiPlugin, {
    baseURL: 'https://api.example.com'
  })
  
  // 设置事件监听器
  engine.on('route:changed', ({ from, to }) => {
    console.log(`Route changed from ${from} to ${to}`)
  })
  
  engine.on('state:changed', ({ key, oldValue, newValue }) => {
    console.log(`State changed: ${String(key)} = ${oldValue} -> ${newValue}`)
  })
  
  engine.on('api:request', ({ method, url }) => {
    console.log(`API Request: ${method} ${url}`)
  })
  
  engine.on('performance:metric', ({ hook, duration }) => {
    if (duration > 100) {
      console.warn(`Performance warning: ${hook} took ${duration.toFixed(2)}ms`)
    }
  })
  
  // 配置管理示例
  engine.setConfig('theme', 'dark')
  engine.setConfig('apiTimeout', 5000)
  
  // 监听配置变化
  engine.watchConfig('theme', (newTheme, oldTheme) => {
    console.log(`Theme changed from ${oldTheme} to ${newTheme}`)
    // 更新UI主题
  })
  
  // 使用依赖注入的服务
  const router = engine.inject('router')
  const store = engine.inject('store')
  const api = engine.inject('api')
  
  if (router && store && api) {
    // 设置路由
    router.addRoute('/', 'HomeComponent')
    router.addRoute('/about', 'AboutComponent')
    router.addRoute('/users', 'UsersComponent')
    
    // 模拟状态变化
    store.state.loading = true
    store.state.user = { id: 1, name: 'John Doe' }
    store.state.loading = false
    
    // 模拟API调用
    const userData = await api.get('/users/1')
    console.log('User data:', userData)
    
    // 导航到不同路由
    router.navigate('/about')
    router.navigate('/users')
  }
  
  // 获取调试信息
  const debugInfo = engine.getDebugInfo()
  console.log('Debug info:', debugInfo)
  
  // 健康检查
  const healthStatus = engine.healthCheck()
  console.log('Health status:', healthStatus)
  
  return engine
}

// 7. 错误处理示例
async function demonstrateErrorHandling() {
  const engine = createEngine({
    name: 'ErrorDemo',
    version: '1.0.0',
    errorHandler: (error, context) => {
      console.error('Global error handler:', error.message)
      console.error('Context:', context)
    }
  })
  
  // 创建一个会抛出错误的插件
  const faultyPlugin: Plugin = {
    name: 'faulty',
    install() {
      throw new Error('Plugin installation failed')
    }
  }
  
  try {
    await engine.use(faultyPlugin)
  } catch (error) {
    console.log('Caught plugin error:', error)
  }
  
  return engine
}

// 8. 插件依赖示例
async function demonstratePluginDependencies() {
  const engine = createEngine({
    name: 'DependencyDemo',
    version: '1.0.0'
  })
  
  const basePlugin: Plugin = {
    name: 'base',
    install(engine) {
      engine.provide('baseService', { version: '1.0.0' })
    }
  }
  
  const dependentPlugin: Plugin = {
    name: 'dependent',
    dependencies: ['base'],
    install(engine) {
      const baseService = engine.inject('baseService')
      console.log('Base service version:', baseService?.version)
      engine.provide('dependentService', { ready: true })
    }
  }
  
  // 安装插件（引擎会自动处理依赖顺序）
  await engine.use(dependentPlugin) // 这会先安装 base 插件
  await engine.use(basePlugin)
  
  return engine
}

// 导出示例函数
export {
  createAdvancedApp,
  demonstrateErrorHandling,
  demonstratePluginDependencies,
  routerPlugin,
  storePlugin,
  apiPlugin,
  performanceMiddleware,
  loggingMiddleware
}

// 如果直接运行此文件
if (require.main === module) {
  createAdvancedApp().then(engine => {
    console.log('Advanced app created successfully!')
    console.log('Engine state:', engine.state)
    console.log('Installed plugins:', Object.keys(engine.getDebugInfo().plugins))
  }).catch(console.error)
}
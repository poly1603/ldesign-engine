/**
 * Qwik 引擎应用
 */

import type {
  CoreEngineConfig,
  Plugin,
  Middleware,
  CoreEngine,
} from '@ldesign/engine-core'
import { createCoreEngine } from '@ldesign/engine-core'
import { createQwikAdapter } from '../adapters/qwik-adapter'

/**
 * 路由配置接口
 */
export interface RouterConfig {
  mode?: 'history' | 'hash' | 'memory'
  base?: string
  routes: RouteConfig[]
  preset?: 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'
  scrollBehavior?: (to: any, from: any, savedPosition: any) => any
  linkActiveClass?: string
  linkExactActiveClass?: string
  preload?: boolean | PreloadConfig
  cache?: boolean | CacheConfig
  animation?: boolean | AnimationConfig
  performance?: PerformanceConfig
  development?: DevelopmentConfig
  security?: SecurityConfig
}

export interface RouteConfig {
  path: string
  component?: any
  children?: RouteConfig[]
  meta?: Record<string, any>
  [key: string]: any
}

export interface PreloadConfig {
  enabled: boolean
  delay?: number
  [key: string]: any
}

export interface CacheConfig {
  enabled: boolean
  maxAge?: number
  [key: string]: any
}

export interface AnimationConfig {
  enabled: boolean
  duration?: number
  [key: string]: any
}

export interface PerformanceConfig {
  [key: string]: any
}

export interface DevelopmentConfig {
  [key: string]: any
}

export interface SecurityConfig {
  [key: string]: any
}

/**
 * Qwik 引擎应用类型
 */
export interface QwikEngineApp extends CoreEngine {
  app: any
  adapter: ReturnType<typeof createQwikAdapter>
}

/**
 * Qwik 引擎应用选项
 */
export interface QwikEngineAppOptions {
  /** 根组�?*/
  rootComponent: any
  /** 挂载元素 */
  mountElement?: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 路由配置 */
  router?: RouterConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列�?*/
  middleware?: Middleware[]
  /** 准备就绪回调 */
  onReady?: (engine: QwikEngineApp) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: QwikEngineApp) => void | Promise<void>
  /** 错误处理回调 */
  onError?: (error: Error, context: string) => void
}

/**
 * 创建 Qwik 引擎应用
 * 
 * @param options - 应用选项
 * @returns Qwik 引擎应用实例
 * 
 * @example
 * ```typescript
 * import { createEngineApp } from '@ldesign/engine-qwik'
 * import App from './App'
 * 
 * createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My App',
 *     debug: true,
 *   },
 *   plugins: [loggerPlugin, themePlugin],
 *   middleware: [authMiddleware],
 *   onReady: async (engine) => {
 *     console.log('Engine ready!')
 *   },
 * })
 * ```
 */
export async function createEngineApp(
  options: QwikEngineAppOptions
): Promise<QwikEngineApp> {
  const {
    rootComponent,
    mountElement = '#app',
    config = {},
    router: routerConfig,
    plugins = [],
    middleware = [],
    onReady,
    onMounted,
    onError,
  } = options

  try {
    // 创建适配�?   
    const adapter = createQwikAdapter()

    // 创建核心引擎
    const coreEngine = createCoreEngine({
      ...config,
      adapter,
    })

    // 如果配置了路由，动态加载路由插�?   
    if (routerConfig) {
      try {
        const { createRouterEnginePlugin } = await import('@ldesign/router-qwik')
        const routerPlugin = createRouterEnginePlugin({
          name: 'router',
          version: '1.0.0',
          ...routerConfig,
        })
        plugins.unshift(routerPlugin)

        if (config.debug) {
          console.log('[Engine] Router plugin created successfully')
        }
      } catch (error) {
        console.warn(
          'Failed to load @ldesign/router-qwik. Make sure it is installed if you want to use routing features.',
          error
        )
      }
    }

    // 注册中间�?   
    for (const mw of middleware) {
      coreEngine.middleware.use(mw)
    }

    // 注册插件
    for (const plugin of plugins) {
      await coreEngine.use(plugin)
    }

    // 初始化引�?   
    await coreEngine.init()

    // 创建 Qwik 应用（如果提供了 rootComponent�?   
    const app = rootComponent ? adapter.createApp(rootComponent) : null

    // 注册引擎�?Qwik（如果有 app�?   
    if (app) {
      adapter.registerEngine(app, coreEngine)
    }

    // 创建引擎应用对象
    const engineApp: QwikEngineApp = {
      ...coreEngine,
      app,
      adapter,
    }

    // 触发准备就绪回调
    if (onReady) {
      await onReady(engineApp)
    }

    // 触发生命周期事件
    await coreEngine.lifecycle.trigger('beforeMount')

    // 挂载应用（如果提供了 rootComponent）
    if (rootComponent) {
    await adapter.mount(app, mountElement)
    }

    // 触发生命周期事件
    await coreEngine.lifecycle.trigger('mounted')

    // 触发挂载完成回调
    if (onMounted) {
      await onMounted(engineApp)
    }

    return engineApp
  } catch (error) {
    if (onError) {
      onError(error as Error, 'createEngineApp')
    }
    console.error('Failed to create Qwik engine app:', error)
    throw error
  }
}

/**
 * 创建 Qwik 引擎应用（旧�?API，已废弃�? * @deprecated 使用 createEngineApp 代替
 */
export async function createQwikEngineApp(
  rootComponent: any,
  config: CoreEngineConfig = {},
  options: {
    mountElement?: string | Element
    middleware?: Middleware[]
    plugins?: Plugin[]
    onReady?: (app: QwikEngineApp) => void | Promise<void>
    onMounted?: (app: QwikEngineApp) => void | Promise<void>
  } = {},
): Promise<QwikEngineApp> {
  return createEngineApp({
    rootComponent,
    mountElement: options.mountElement,
    config,
    plugins: options.plugins,
    middleware: options.middleware,
    onReady: options.onReady,
    onMounted: options.onMounted,
  })
}

/**
 * 卸载 Qwik 引擎应用
 */
export async function unmountQwikEngineApp(
  engineApp: QwikEngineApp,
  mountElement?: string | Element,
): Promise<void> {
  try {
    const { adapter, lifecycle } = engineApp
    const element = mountElement || '#app'

    // 触发卸载前生命周�?   
    await lifecycle.trigger('beforeUnmount')

    // 卸载应用
    await adapter.unmount(engineApp.app, element)

    // 触发卸载后生命周�?   
    await lifecycle.trigger('unmounted')

    // 销毁引�?   
    await engineApp.destroy()
  } catch (error) {
    console.error('Failed to unmount Qwik engine app:', error)
    throw error
  }
}


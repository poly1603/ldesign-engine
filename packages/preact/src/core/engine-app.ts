/**
 * Preact 引擎应用
 */

import type {
  CoreEngineConfig,
  Plugin,
  Middleware,
  CoreEngine,
} from '@ldesign/engine-core'
import { createCoreEngine } from '@ldesign/engine-core'
import { createPreactAdapter } from '../adapters/preact-adapter'

/**
 * 路由配置接口
 */
export interface RouterConfig {
  /**
   * 路由模式
   * - history: HTML5 History 模式
   * - hash: Hash 模式
   * - memory: 内存模式（用�?SSR�?   */
  mode?: 'history' | 'hash' | 'memory'

  /**
   * 基础路径
   */
  base?: string

  /**
   * 路由配置列表
   */
  routes: RouteConfig[]

  /**
   * 预设配置
   * - spa: 单页应用优化
   * - mpa: 多页应用优化
   * - mobile: 移动端优�?   * - desktop: 桌面端优�?   * - admin: 后台管理系统优化
   * - blog: 博客系统优化
   */
  preset?: 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'

  /**
   * 滚动行为
   */
  scrollBehavior?: (to: any, from: any, savedPosition: any) => any

  /**
   * 激活链接的 class 名称
   */
  linkActiveClass?: string

  /**
   * 精确激活链接的 class 名称
   */
  linkExactActiveClass?: string

  /**
   * 预加载配�?   */
  preload?: boolean | PreloadConfig

  /**
   * 缓存配置
   */
  cache?: boolean | CacheConfig

  /**
   * 动画配置
   */
  animation?: boolean | AnimationConfig

  /**
   * 性能配置
   */
  performance?: PerformanceConfig

  /**
   * 开发配�?   */
  development?: DevelopmentConfig

  /**
   * 安全配置
   */
  security?: SecurityConfig
}

/**
 * 路由配置
 */
export interface RouteConfig {
  path: string
  component?: any
  children?: RouteConfig[]
  meta?: Record<string, any>
  [key: string]: any
}

/**
 * 预加载配�? */
export interface PreloadConfig {
  enabled: boolean
  delay?: number
  [key: string]: any
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  enabled: boolean
  maxAge?: number
  [key: string]: any
}

/**
 * 动画配置
 */
export interface AnimationConfig {
  enabled: boolean
  duration?: number
  [key: string]: any
}

/**
 * 性能配置
 */
export interface PerformanceConfig {
  [key: string]: any
}

/**
 * 开发配�? */
export interface DevelopmentConfig {
  [key: string]: any
}

/**
 * 安全配置
 */
export interface SecurityConfig {
  [key: string]: any
}

/**
 * Preact 引擎应用类型
 */
export interface PreactEngineApp extends CoreEngine {
  app: any
  adapter: ReturnType<typeof createPreactAdapter>
}

/**
 * Preact 引擎应用选项
 */
export interface PreactEngineAppOptions {
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
  onReady?: (engine: PreactEngineApp) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: PreactEngineApp) => void | Promise<void>
  /** 错误处理回调 */
  onError?: (error: Error, context: string) => void
}

/**
 * 创建 Preact 引擎应用
 * 
 * @param options - 应用选项
 * @returns Preact 引擎应用实例
 * 
 * @example
 * ```typescript
 * import { createEngineApp } from '@ldesign/engine-preact'
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
  options: PreactEngineAppOptions
): Promise<PreactEngineApp> {
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
    const adapter = createPreactAdapter()

    // 创建核心引擎
    const coreEngine = createCoreEngine({
      ...config,
      adapter,
    })

    // 如果配置了路由，动态加载路由插�?   
    if (routerConfig) {
      try {
        const { createRouterEnginePlugin } = await import('@ldesign/router-preact')
        const routerPlugin = createRouterEnginePlugin({
          name: 'router',
          version: '1.0.0',
          ...routerConfig,
        })

        // 将路由插件添加到插件列表的开头（优先安装）
        plugins.unshift(routerPlugin)
    if (config.debug) {
          console.log('[Engine] Router plugin created successfully')
        }
      } catch (error) {
        console.warn(
          'Failed to load @ldesign/router-preact. Make sure it is installed if you want to use routing features.',
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

    // 创建 Preact 应用
    const app = adapter.createApp(rootComponent)

    // 注册引擎�?Preact
    adapter.registerEngine(app, coreEngine)

    // 创建引擎应用对象
    const engineApp: PreactEngineApp = {
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

    // 挂载应用
    await adapter.mount(app, mountElement)

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
    console.error('Failed to create Preact engine app:', error)
    throw error
  }
}

/**
 * 创建 Preact 引擎应用（旧�?API，已废弃�? * @deprecated 使用 createEngineApp 代替
 */
export async function createPreactEngineApp(
  rootComponent: any,
  config: CoreEngineConfig = {},
  options: {
    mountElement?: string | Element
    middleware?: Middleware[]
    plugins?: Plugin[]
    onReady?: (app: PreactEngineApp) => void | Promise<void>
    onMounted?: (app: PreactEngineApp) => void | Promise<void>
  } = {},
): Promise<PreactEngineApp> {
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
 * 卸载 Preact 引擎应用
 */
export async function unmountPreactEngineApp(
  engineApp: PreactEngineApp,
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
    console.error('Failed to unmount Preact engine app:', error)
    throw error
  }
}


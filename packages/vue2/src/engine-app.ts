/**
 * Vue 2 引擎应用创建函数
 */

import Vue from 'vue'
import type {
  CoreEngine,
  CoreEngineConfig,
  Plugin,
  Middleware,
} from '@ldesign/engine-core'
import { createCoreEngine } from '@ldesign/engine-core'
import { createVue2Adapter } from './adapter'

// Vue 2 组件类型定义
// Vue 2 中组件可以是组件选项对象或构造函�?type Component = any

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
 * Vue 2 引擎应用选项
 */
export interface Vue2EngineAppOptions {
  /** 根组�?*/
  rootComponent: Component
  /** 挂载元素 */
  mountElement: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 路由配置 */
  router?: RouterConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列�?*/
  middleware?: Middleware[]
  /** 准备就绪回调 */
  onReady?: (engine: Vue2EngineApp) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: Vue2EngineApp) => void | Promise<void>
  /** 错误处理回调 */
  onError?: (error: Error, context: string) => void
}

/**
 * Vue 2 引擎应用
 */
export interface Vue2EngineApp extends CoreEngine {
  /** Vue 应用实例 */
  app: any
  /** 框架适配�?*/
  adapter: ReturnType<typeof createVue2Adapter>
}

/**
 * 创建 Vue 2 引擎应用
 * 
 * @param options - 应用选项
 * @returns Vue 2 引擎应用实例
 * 
 * @example
 * ```typescript
 * import { createEngineApp } from '@ldesign/engine-vue2'
 * import App from './App.vue'
 * 
 * const engine = await createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My App',
 *     debug: true,
 *   },
 *   plugins: [i18nPlugin, themePlugin],
 *   middleware: [authMiddleware],
 *   onReady: async (engine) => {
 *     console.log('Engine ready!')
 *   },
 *   onMounted: async (engine) => {
 *     console.log('App mounted!')
 *   },
 * })
 * ```
 */
export async function createEngineApp(
  options: Vue2EngineAppOptions
): Promise<Vue2EngineApp> {
  const {
    rootComponent,
    mountElement,
    config = {},
    router: routerConfig,
    plugins = [],
    middleware = [],
    onReady,
    onMounted,
    onError,
  } = options

  try {
    // 创建适配�?    const adapter = createVue2Adapter()

    // 创建核心引擎
    const coreEngine = createCoreEngine({
      ...config,
      adapter,
    })

    // 如果配置了路由，动态加载路由插�?    if (routerConfig) {
      try {
        const { createRouterEnginePlugin } = await import('@ldesign/router-vue2')
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
          'Failed to load @ldesign/router-vue2. Make sure it is installed if you want to use routing features.',
          error
        )
      }
    }

    // 初始化引�?    await coreEngine.init()

    // 注册中间�?    for (const mw of middleware) {
      coreEngine.middleware.use(mw)
    }

    // 注册插件
    for (const plugin of plugins) {
      await coreEngine.use(plugin)
    }

    // 创建 Vue 应用
    const app = adapter.createApp(rootComponent)

    // 注册引擎�?Vue
    adapter.registerEngine(app, coreEngine)

    // 创建引擎应用对象
    const engineApp: Vue2EngineApp = {
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
    throw error
  }
}


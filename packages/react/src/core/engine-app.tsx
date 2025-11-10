/**
 * React 引擎应用创建函数
 *
 * 提供统一�?API 来创建集成了核心引擎�?React 应用
 *
 * @module engine-app
 */

import type { ComponentType } from 'react'
import type { Root } from 'react-dom/client'
import type {
  CoreEngine,
  CoreEngineConfig,
  Plugin,
  Middleware,
} from '@ldesign/engine-core'
import { createCoreEngine } from '@ldesign/engine-core'
import { createReactAdapter } from '../adapters/react-adapter'

/**
 * 路由配置选项
 */
export interface RouterConfig {
  /** 路由模式 */
  mode?: 'history' | 'hash' | 'memory'
  /** 基础路径 */
  base?: string
  /** 路由配置数组 */
  routes: any[]
  /** 预设配置 */
  preset?: 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'
  /** 滚动行为 */
  scrollBehavior?: any
  /** 活跃链接类名 */
  linkActiveClass?: string
  /** 精确活跃链接类名 */
  linkExactActiveClass?: string
  /** 是否启用预加�?*/
  preload?: boolean | {
    strategy?: 'hover' | 'visible' | 'idle'
    delay?: number
    enabled?: boolean
  }
  /** 是否启用缓存 */
  cache?: boolean | {
    maxSize?: number
    strategy?: 'memory' | 'session' | 'local'
    enabled?: boolean
  }
  /** 动画配置 */
  animation?: boolean | {
    type?: 'fade' | 'slide' | 'scale' | 'flip'
    duration?: number
    enabled?: boolean
  }
  /** 性能配置 */
  performance?: {
    enableLazyLoading?: boolean
    enableCodeSplitting?: boolean
    enablePrefetch?: boolean
    cacheSize?: number
  }
  /** 开发配�?*/
  development?: {
    enableDevtools?: boolean
    enableHotReload?: boolean
    enableDebugMode?: boolean
  }
  /** 安全配置 */
  security?: {
    enableCSRFProtection?: boolean
    enableXSSProtection?: boolean
    trustedDomains?: string[]
  }
}

/**
 * React 引擎应用选项
 */
export interface ReactEngineAppOptions {
  /** 根组�?*/
  rootComponent: ComponentType
  /** 挂载元素选择器或 DOM 元素 */
  mountElement: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列�?*/
  middleware?: Middleware[]
  /** 路由配置 */
  router?: RouterConfig
  /** 根组件属�?*/
  rootProps?: Record<string, any>
  /** 准备就绪回调 */
  onReady?: (engine: ReactEngineApp) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: ReactEngineApp) => void | Promise<void>
  /** 错误处理回调 */
  onError?: (error: Error, context: string) => void
}

/**
 * React 引擎应用
 * 
 * 整合了核心引擎和 React Root 的应用实�? */
export interface ReactEngineApp extends CoreEngine {
  /** React Root 实例 */
  app: Root
  /** 框架适配�?*/
  adapter: ReturnType<typeof createReactAdapter>
}

/**
 * 创建 React 引擎应用
 * 
 * 这是创建集成了核心引擎的 React 应用的推荐方�? * 
 * 创建流程:
 * 1. 创建核心引擎
 * 2. 初始化引�? * 3. 注册中间�? * 4. 注册插件
 * 5. 创建 React 应用
 * 6. 注册引擎�?React
 * 7. 挂载应用
 * 
 * @param options - 应用选项
 * @returns React 引擎应用实例
 * 
 * @example
 * ```typescript
 * import { createEngineApp } from '@ldesign/engine-react'
 * import App from './App'
 * 
 * const engine = await createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My React App',
 *     debug: true,
 *   },
 *   plugins: [i18nPlugin, themePlugin],
 *   middleware: [authMiddleware],
 *   rootProps: {
 *     title: 'Welcome'
 *   },
 *   onReady: async (engine) => {
 *     console.log('Engine ready!')
 *   },
 *   onMounted: async (engine) => {
 *     console.log('App mounted!')
 *   },
 * })
 * 
 * // 使用引擎功能
 * engine.state.set('user', { name: 'Alice' })
 * engine.events.emit('app:ready')
 * ```
 */
export async function createEngineApp(
  options: ReactEngineAppOptions
): Promise<ReactEngineApp> {
  const {
    rootComponent,
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    router: routerConfig,
    rootProps = {},
    onReady,
    onMounted,
    onError,
  } = options

  try {
    // 1. 创建适配器
    const adapter = createReactAdapter()

    // 2. 创建核心引擎
    const coreEngine = createCoreEngine(config)

    // 3. 初始化引擎
    await coreEngine.init()

    // 4. 注册中间件
    for (const mw of middleware) {
      coreEngine.middleware.use(mw)
    }

    // 5. 如果提供了路由配置，创建路由插件
    if (routerConfig) {
      try {
        // 动态导入 React router 包以避免强制依赖
        const { createRouterEnginePlugin } = await import('@ldesign/router-react')

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
          'Failed to load @ldesign/router-react. Router functionality will not be available.',
          error
        )
      }
    }

    // 6. 注册插件
    for (const plugin of plugins) {
      await coreEngine.use(plugin)
    }

    // 7. 创建 React 应用
    const app = adapter.createApp(rootComponent, rootProps)

    // 8. 注册引擎到 React
    adapter.registerEngine(app, coreEngine)

    // 9. 创建引擎应用对象
    const engineApp: ReactEngineApp = {
      ...coreEngine,
      app,
      adapter,
    }

    // 10. 触发准备就绪回调
    if (onReady) {
      await onReady(engineApp)
    }

    // 11. 触发生命周期事件
    await coreEngine.lifecycle.trigger('beforeMount')

    // 12. 挂载应用
    await adapter.mount(app, mountElement)

    // 13. 触发生命周期事件
    await coreEngine.lifecycle.trigger('mounted')

    // 14. 触发挂载完成回调
    if (onMounted) {
      await onMounted(engineApp)
    }

    return engineApp
  } catch (error) {
    // 错误处理
    if (onError) {
      onError(error as Error, 'createEngineApp')
    }
    throw error
  }
}


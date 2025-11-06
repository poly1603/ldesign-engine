/**
 * Solid 引擎应用创建工具
 *
 * 提供统一的应用创建和配置接口
 */

import { createCoreEngine, type CoreEngine } from '@ldesign/engine-core'
import { createSolidAdapter } from './adapter'
import type { EngineConfig, Plugin, Middleware } from '@ldesign/engine-core'

/**
 * 路由配置接口
 */
export interface RouterConfig {
  /**
   * 路由模式
   * - history: HTML5 History API
   * - hash: Hash 模式
   * - memory: 内存模式（用于 SSR）
   */
  mode?: 'history' | 'hash' | 'memory'

  /**
   * 基础路径
   */
  base?: string

  /**
   * 路由配置列表
   */
  routes: any[]

  /**
   * 预设配置
   * - spa: 单页应用优化
   * - mpa: 多页应用优化
   * - mobile: 移动端优化
   * - desktop: 桌面端优化
   * - admin: 后台管理系统优化
   * - blog: 博客系统优化
   */
  preset?: 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'

  /**
   * 滚动行为
   */
  scrollBehavior?: any

  /**
   * 激活链接的 CSS 类名
   */
  linkActiveClass?: string

  /**
   * 精确激活链接的 CSS 类名
   */
  linkExactActiveClass?: string

  /**
   * 预加载配置
   */
  preload?: boolean | {
    strategy?: 'hover' | 'visible' | 'idle'
    delay?: number
    enabled?: boolean
  }

  /**
   * 缓存配置
   */
  cache?: boolean | {
    maxSize?: number
    strategy?: 'memory' | 'storage'
    enabled?: boolean
  }

  /**
   * 动画配置
   */
  animation?: boolean | {
    type?: 'fade' | 'slide' | 'zoom'
    duration?: number
    enabled?: boolean
  }

  /**
   * 性能配置
   */
  performance?: {
    lazyLoad?: boolean
    prefetch?: boolean
    prerender?: boolean
  }

  /**
   * 开发配置
   */
  development?: {
    strict?: boolean
    warnings?: boolean
  }

  /**
   * 安全配置
   */
  security?: {
    sanitize?: boolean
    validateRoutes?: boolean
  }
}

/**
 * Solid 引擎应用配置
 */
export interface SolidEngineAppConfig {
  /**
   * 根组件
   */
  rootComponent: any

  /**
   * 挂载元素选择器或 DOM 元素
   */
  mountElement: string | Element

  /**
   * 引擎配置
   */
  config?: Partial<EngineConfig>

  /**
   * 组件属性
   */
  props?: Record<string, any>

  /**
   * 插件列表
   */
  plugins?: Plugin[]

  /**
   * 中间件列表
   */
  middleware?: Middleware[]

  /**
   * 路由配置
   */
  router?: RouterConfig

  /**
   * 引擎准备就绪回调
   */
  onReady?: (engine: CoreEngine) => void | Promise<void>

  /**
   * 应用挂载完成回调
   */
  onMounted?: (engine: CoreEngine) => void | Promise<void>

  /**
   * 错误处理回调
   */
  onError?: (error: Error, context?: any) => void
}

/**
 * 创建 Solid 引擎应用
 * 
 * @param config - 应用配置
 * @returns 引擎实例
 * 
 * @example
 * ```typescript
 * import { createEngineApp } from '@ldesign/engine-solid'
 * import App from './App'
 * 
 * const engine = await createEngineApp({
 *   rootComponent: App,
 *   mountElement: '#app',
 *   config: {
 *     name: 'My Solid App',
 *     debug: true,
 *   },
 *   plugins: [myPlugin],
 *   middleware: [myMiddleware],
 * })
 * ```
 */
export async function createEngineApp(config: SolidEngineAppConfig): Promise<CoreEngine> {
  const {
    rootComponent,
    mountElement,
    config: engineConfig = {},
    props = {},
    plugins = [],
    middleware = [],
    router: routerConfig,
    onReady,
    onMounted,
    onError,
  } = config

  try {
    // 创建 Solid 适配器
    const adapter = createSolidAdapter()

    // 创建核心引擎
    const engine = createCoreEngine({
      name: engineConfig.name || 'Solid Engine App',
      version: engineConfig.version || '1.0.0',
      debug: engineConfig.debug ?? false,
      adapter,
    })

    // 如果提供了路由配置，创建路由插件
    if (routerConfig) {
      try {
        const { createRouterEnginePlugin } = await import('@ldesign/router-solid')
        const routerPlugin = createRouterEnginePlugin({
          name: 'router',
          version: '1.0.0',
          ...routerConfig,
        })
        // 将路由插件添加到插件列表开头
        plugins.unshift(routerPlugin)
        if (engine.logger) {
          engine.logger.info('Router plugin created successfully')
        }
      } catch (error) {
        console.warn(
          'Failed to load @ldesign/router-solid. Make sure it is installed if you want to use routing features.',
          error
        )
      }
    }

    // 注册插件
    for (const plugin of plugins) {
      await engine.use(plugin)
    }

    // 注册中间件
    for (const mw of middleware) {
      engine.middleware.use(mw)
    }

    // 初始化引擎
    await engine.init()

    // 触发准备就绪回调
    if (onReady) {
      await onReady(engine)
    }

    // 创建 Solid 应用
    const app = adapter.createApp(rootComponent, { props })

    // 注册引擎到应用
    adapter.registerEngine(app, engine)

    // 挂载应用
    await adapter.mount(app, mountElement)

    // 触发挂载完成回调
    if (onMounted) {
      await onMounted(engine)
    }

    // 触发 mounted 生命周期
    await engine.lifecycle.trigger('mounted')

    return engine
  } catch (error) {
    // 错误处理
    if (onError) {
      onError(error as Error, { config })
    } else {
      console.error('Failed to create Solid engine app:', error)
    }
    throw error
  }
}

/**
 * 创建 Solid 引擎应用(同步版本)
 * 
 * 注意:这个版本会立即返回引擎实例,但初始化是异步的
 * 
 * @param config - 应用配置
 * @returns 引擎实例
 */
export function createEngineAppSync(config: SolidEngineAppConfig): CoreEngine {
  const adapter = createSolidAdapter()
  const engine = createCoreEngine({
    name: config.config?.name || 'Solid Engine App',
    version: config.config?.version || '1.0.0',
    debug: config.config?.debug ?? false,
    adapter,
  })

  // 异步初始化
  ;(async () => {
    try {
      // 注册插件
      for (const plugin of config.plugins || []) {
        await engine.use(plugin)
      }

      // 注册中间件
      for (const mw of config.middleware || []) {
        engine.middleware.use(mw)
      }

      // 初始化引擎
      await engine.init()

      // 触发准备就绪回调
      if (config.onReady) {
        await config.onReady(engine)
      }

      // 创建 Solid 应用
      const app = adapter.createApp(config.rootComponent, { props: config.props })

      // 注册引擎到应用
      adapter.registerEngine(app, engine)

      // 挂载应用
      await adapter.mount(app, config.mountElement)

      // 触发挂载完成回调
      if (config.onMounted) {
        await config.onMounted(engine)
      }

      // 触发 mounted 生命周期
      await engine.lifecycle.trigger('mounted')
    } catch (error) {
      if (config.onError) {
        config.onError(error as Error, { config })
      } else {
        console.error('Failed to initialize Solid engine app:', error)
      }
    }
  })()

  return engine
}


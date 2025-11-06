/**
 * Vue 3 引擎应用创建函数
 */

import type { App, Component } from 'vue'
import type {
  CoreEngine,
  CoreEngineConfig,
  Plugin,
  Middleware,
} from '@ldesign/engine-core'
import { createCoreEngine } from '@ldesign/engine-core'
import { createVue3Adapter } from './adapter'

/**
 * 路由配置接口
 */
export interface RouterConfig {
  /** 路由模式 */
  mode?: 'history' | 'hash' | 'memory'
  /** 基础路径 */
  base?: string
  /** 路由列表 */
  routes: any[]
  /** 预设配置 */
  preset?: 'spa' | 'mpa' | 'mobile' | 'desktop' | 'admin' | 'blog'
  /** 滚动行为 */
  scrollBehavior?: any
  /** 活跃链接类名 */
  linkActiveClass?: string
  /** 精确活跃链接类名 */
  linkExactActiveClass?: string
  /** 预加载配置 */
  preload?: boolean | {
    /** 预加载策略 */
    strategy?: 'hover' | 'visible' | 'idle'
    /** 预加载延迟 */
    delay?: number
    /** 是否启用 */
    enabled?: boolean
  }
  /** 缓存配置 */
  cache?: boolean | {
    /** 最大缓存数量 */
    maxSize?: number
    /** 缓存策略 */
    strategy?: 'memory' | 'sessionStorage' | 'localStorage'
    /** 是否启用 */
    enabled?: boolean
  }
  /** 动画配置 */
  animation?: boolean | {
    /** 动画类型 */
    type?: 'fade' | 'slide' | 'zoom' | 'none'
    /** 动画持续时间 */
    duration?: number
    /** 是否启用 */
    enabled?: boolean
  }
  /** 性能配置 */
  performance?: {
    /** 是否启用懒加载 */
    lazyLoad?: boolean
    /** 是否启用代码分割 */
    codeSplitting?: boolean
  }
  /** 开发配置 */
  development?: {
    /** 是否启用调试 */
    debug?: boolean
    /** 是否显示路由信息 */
    showRouteInfo?: boolean
  }
  /** 安全配置 */
  security?: {
    /** 是否启用 CSRF 保护 */
    csrf?: boolean
    /** 是否启用 XSS 保护 */
    xss?: boolean
  }
}

/**
 * Vue 3 引擎应用选项
 */
export interface Vue3EngineAppOptions {
  /** 根组件 */
  rootComponent: Component
  /** 挂载元素 */
  mountElement: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列表 */
  middleware?: Middleware[]
  /** 路由配置 */
  router?: RouterConfig
  /** 准备就绪回调 */
  onReady?: (engine: Vue3EngineApp) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: Vue3EngineApp) => void | Promise<void>
  /** 错误处理回调 */
  onError?: (error: Error, context: string) => void
}

/**
 * Vue 3 引擎应用
 */
export interface Vue3EngineApp extends CoreEngine {
  /** Vue 应用实例 */
  app: App
  /** 框架适配器 */
  adapter: ReturnType<typeof createVue3Adapter>
}

/**
 * 创建 Vue 3 引擎应用
 * 
 * @param options - 应用选项
 * @returns Vue 3 引擎应用实例
 * 
 * @example
 * ```typescript
 * import { createEngineApp } from '@ldesign/engine-vue3'
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
  options: Vue3EngineAppOptions
): Promise<Vue3EngineApp> {
  const {
    rootComponent,
    mountElement,
    config = {},
    plugins = [],
    middleware = [],
    router: routerConfig,
    onReady,
    onMounted,
    onError,
  } = options

  try {
    // 创建适配器
    const adapter = createVue3Adapter()

    // 创建核心引擎
    const coreEngine = createCoreEngine(config)

    // 初始化引擎
    await coreEngine.init()

    // 注册中间件
    for (const mw of middleware) {
      coreEngine.middleware.use(mw)
    }

    // 如果提供了路由配置，创建路由插件
    if (routerConfig) {
      try {
        // 动态导入 Vue router 模块
        const { createRouterEnginePlugin } = await import('@ldesign/router-vue')

        // 创建路由插件
        const routerPlugin = createRouterEnginePlugin({
          name: 'router',
          version: '1.0.0',
          ...routerConfig,
        })

        // 将路由插件添加到插件列表开头（优先安装）
        plugins.unshift(routerPlugin)

        if (coreEngine.logger) {
          coreEngine.logger.info('Router plugin created successfully')
        }
      } catch (error) {
        console.warn(
          'Failed to load @ldesign/router-vue. Make sure it is installed if you want to use routing features.',
          error
        )
      }
    }

    // 注册插件
    for (const plugin of plugins) {
      await coreEngine.use(plugin)
    }

    // 创建 Vue 应用
    const app = adapter.createApp(rootComponent)

    // 注册引擎到 Vue
    adapter.registerEngine(app, coreEngine)

    // 创建引擎应用对象
    const engineApp: Vue3EngineApp = {
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


/**
 * Angular 引擎应用创建函数
 */

import { bootstrapApplication, type ApplicationRef } from '@angular/platform-browser'
import { provideZoneChangeDetection } from '@angular/core'
import type {
  CoreEngine,
  CoreEngineConfig,
  Plugin,
  Middleware,
} from '@ldesign/engine-core'
import { createCoreEngine } from '@ldesign/engine-core'
import { createAngularAdapter } from './adapter'
import { EngineService } from './services/engine.service'

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
 * Angular 引擎应用选项
 */
export interface AngularEngineAppOptions {
  /** 根组�?*/
  rootComponent: any
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 路由配置 */
  router?: RouterConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列�?*/
  middleware?: Middleware[]
  /** 准备就绪回调 */
  onReady?: (engine: AngularEngineApp) => void | Promise<void>
  /** 启动完成回调 */
  onMounted?: (engine: AngularEngineApp) => void | Promise<void>
  /** 错误处理回调 */
  onError?: (error: Error, context: string) => void
  /** 额外�?Angular providers */
  providers?: any[]
}

/**
 * Angular 引擎应用
 */
export interface AngularEngineApp extends CoreEngine {
  /** Angular 应用引用 */
  appRef: ApplicationRef
  /** 框架适配�?*/
  adapter: ReturnType<typeof createAngularAdapter>
  /** 引擎服务 */
  engineService: EngineService
}

/**
 * 创建 Angular 引擎应用
 * 
 * @param options - 应用选项
 * @returns Angular 引擎应用实例
 * 
 * @example
 * ```typescript
 * import { createEngineApp } from '@ldesign/engine-angular'
 * import { AppComponent } from './app/app.component'
 * 
 * createEngineApp({
 *   rootComponent: AppComponent,
 *   config: {
 *     name: 'My App',
 *     debug: true,
 *   },
 *   plugins: [loggerPlugin, themePlugin],
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
  options: AngularEngineAppOptions
): Promise<AngularEngineApp> {
  const {
    rootComponent,
    config = {},
    router: routerConfig,
    plugins = [],
    middleware = [],
    onReady,
    onMounted,
    onError,
    providers = [],
  } = options

  try {
    // 创建适配器
    const adapter = createAngularAdapter()

    // 创建核心引擎
    const coreEngine = createCoreEngine({
      ...config,
      adapter,
    })

    // 如果配置了路由，动态加载路由插件
    if (routerConfig) {
      try {
        const { createRouterEnginePlugin } = await import('@ldesign/router-angular')
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
          'Failed to load @ldesign/router-angular. Make sure it is installed if you want to use routing features.',
          error
        )
      }
    }

    // 注册中间件
    for (const mw of middleware) {
      coreEngine.middleware.use(mw)
    }

    // 注册插件
    for (const plugin of plugins) {
      await coreEngine.use(plugin)
    }

    // 初始化引擎
    await coreEngine.init()

    // 创建引擎服务
    const engineService = new EngineService()
    engineService.setEngine(coreEngine)

    // 创建引擎应用对象
    const engineApp: AngularEngineApp = {
      ...coreEngine,
      appRef: null as any,
      adapter,
      engineService,
    }

    // 触发准备就绪回调
    if (onReady) {
      await onReady(engineApp)
    }

    // 触发生命周期事件
    await coreEngine.lifecycle.trigger('beforeMount')

    // 启动 Angular 应用
    const appRef = await bootstrapApplication(rootComponent, {
      providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        {
          provide: EngineService,
          useValue: engineService,
        },
        ...providers,
      ],
    }).catch((err) => {
      if (onError) {
        onError(err as Error, 'bootstrapApplication')
      }
      throw err
    })

    // 设置应用引用
    engineApp.appRef = appRef

    // 触发生命周期事件
    await coreEngine.lifecycle.trigger('mounted')

    // 触发启动完成回调
    if (onMounted) {
      await onMounted(engineApp)
    }

    console.log('�?Angular 应用已启�?')

    return engineApp
  } catch (error) {
    if (onError) {
      onError(error as Error, 'createEngineApp')
    }
    throw error
  }
}


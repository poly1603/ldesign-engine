/**
 * 增强的路由引擎插件
 * 
 * 充分利用引擎功能，提供更强大的路由集成
 * 
 * @module plugins/router-plugin
 */

import type { App } from 'vue'
import type {
  Plugin,
  PluginContext,
  Middleware,
  ServiceContainer,
  ConfigManager,
  StateManager,
  EventManager,
  LifecycleManager
} from '@ldesign/engine-core'
import type { VueEngine, VueEnginePlugin } from '../engine/vue-engine'

/**
 * 路由插件配置
 */
export interface RouterPluginConfig {
  /** 路由模式 */
  mode?: 'history' | 'hash' | 'memory'
  /** 基础路径 */
  base?: string
  /** 路由配置 */
  routes?: any[]
  /** 是否启用严格模式 */
  strict?: boolean
  /** 是否启用预加载 */
  preload?: boolean | {
    strategy?: 'hover' | 'visible' | 'idle'
    delay?: number
  }
  /** 是否启用缓存 */
  cache?: boolean | {
    max?: number
    ttl?: number
    exclude?: string[]
  }
  /** 路由守卫 */
  guards?: {
    beforeEach?: (to: any, from: any, next: any) => void
    afterEach?: (to: any, from: any) => void
    beforeResolve?: (to: any, from: any, next: any) => void
  }
  /** 滚动行为 */
  scrollBehavior?: (to: any, from: any, savedPosition: any) => any
  /** 过渡动画 */
  transition?: {
    name?: string
    mode?: 'in-out' | 'out-in'
    duration?: number
  }
  /** 面包屑配置 */
  breadcrumb?: {
    enabled?: boolean
    homeRoute?: string
    separator?: string
  }
  /** 标签页配置 */
  tabs?: {
    enabled?: boolean
    max?: number
    persistent?: boolean
    contextMenu?: boolean
  }
}

/**
 * 路由服务
 * 
 * 提供路由相关的服务方法
 */
export interface RouterService {
  /** 路由实例 */
  router: any
  /** 导航到指定路由 */
  push(to: any): Promise<void>
  /** 替换当前路由 */
  replace(to: any): Promise<void>
  /** 后退 */
  back(): void
  /** 前进 */
  forward(): void
  /** 跳转到指定历史记录 */
  go(n: number): void
  /** 添加路由 */
  addRoute(route: any): void
  /** 删除路由 */
  removeRoute(name: string): void
  /** 获取所有路由 */
  getRoutes(): any[]
  /** 检查路由是否存在 */
  hasRoute(name: string): boolean
  /** 获取当前路由 */
  getCurrentRoute(): any
  /** 生成路由链接 */
  createHref(to: any): string
  /** 解析路由 */
  resolve(to: any): any
  /** 路由匹配 */
  match(to: any): any
}

/**
 * 路由中间件
 * 
 * 在路由导航时执行
 */
export interface RouterMiddleware extends Middleware {
  /** 路由匹配规则 */
  match?: string | RegExp | ((route: any) => boolean)
}

/**
 * 创建路由引擎插件
 * 
 * @param config - 路由配置
 * @returns 路由引擎插件
 * 
 * @example
 * ```typescript
 * const routerPlugin = createRouterPlugin({
 *   mode: 'history',
 *   routes: [
 *     { path: '/', component: Home },
 *     { path: '/about', component: About }
 *   ],
 *   guards: {
 *     beforeEach: (to, from, next) => {
 *       // 路由守卫逻辑
 *       next()
 *     }
 *   }
 * })
 * 
 * engine.use(routerPlugin)
 * ```
 */
export function createRouterPlugin(config: RouterPluginConfig = {}): VueEnginePlugin {
  return {
    name: 'router',
    version: '2.0.0',
    dependencies: [],

    async install(ctx: PluginContext, options?: any) {
      const engine = ctx.engine as VueEngine
      const container = engine.container
      const configManager = engine.configManager
      const stateManager = engine.state
      const eventManager = engine.events
      const lifecycleManager = engine.lifecycle

      // 合并配置
      const finalConfig = {
        mode: 'history' as const,
        base: '/',
        routes: [],
        strict: false,
        preload: false,
        cache: false,
        ...config,
        ...options,
      }

      // 保存配置到配置管理器
      configManager.set('router', finalConfig)

      // 动态导入路由包（包括 history 创建函数）
      const {
        createRouter: createVueRouter,
        createWebHistory,
        createWebHashHistory,
        RouterView,
        RouterLink,
        RouterTabs,
        RouterBreadcrumb
      } = await import('@ldesign/router-vue')

      // 根据模式创建 history 对象
      let history
      switch (finalConfig.mode) {
        case 'hash':
          history = createWebHashHistory(finalConfig.base)
          break
        case 'history':
        default:
          history = createWebHistory(finalConfig.base)
          break
      }

      // 创建路由实例
      const router = createVueRouter({
        history,
        routes: finalConfig.routes || [],
      })

      // 创建路由服务
      const routerService: RouterService = {
        router,

        async push(to: any) {
          await router.push(to)
        },

        async replace(to: any) {
          await router.replace(to)
        },

        back() {
          router.back()
        },

        forward() {
          router.forward()
        },

        go(n: number) {
          router.go(n)
        },

        addRoute(route: any) {
          router.addRoute(route)
        },

        removeRoute(name: string) {
          router.removeRoute(name)
        },

        getRoutes() {
          return router.getRoutes()
        },

        hasRoute(name: string) {
          return router.hasRoute(name)
        },

        getCurrentRoute() {
          return router.currentRoute.value
        },

        createHref(to: any) {
          return router.createHref(to)
        },

        resolve(to: any) {
          return router.resolve(to)
        },

        match(to: any) {
          return router.match(to)
        },
      }

      // 注册路由服务到容器
      container.singleton('router', routerService)

      // 保存路由状态
      stateManager.set('router:current', router.currentRoute.value)
      stateManager.set('router:history', [])
      stateManager.set('router:tabs', [])

      // 设置路由守卫
      if (finalConfig.guards?.beforeEach) {
        router.beforeEach(finalConfig.guards.beforeEach)
      }

      if (finalConfig.guards?.afterEach) {
        router.afterEach(finalConfig.guards.afterEach)
      }

      if (finalConfig.guards?.beforeResolve) {
        router.beforeResolve(finalConfig.guards.beforeResolve)
      }

      // 监听路由变化
      router.afterEach((to: any, from: any) => {
        // 更新状态
        stateManager.set('router:current', to)

        // 更新历史记录
        const history = stateManager.get('router:history') || []
        history.push({
          path: to.path,
          name: to.name,
          params: to.params,
          query: to.query,
          meta: to.meta,
          timestamp: Date.now(),
        })
        stateManager.set('router:history', history)

        // 触发事件
        eventManager.emit('router:navigated', { to, from })

        // 执行中间件
        engine.middleware.execute({
          type: 'route',
          data: { to, from },
          cancelled: false,
        })
      })

      // 注册路由中间件
      engine.middleware.use({
        name: 'router-logger',
        priority: 100,
        async execute(ctx, next) {
          if (ctx.type === 'route') {
            const { to, from } = ctx.data
            console.log(`[Router] Navigating from ${from.path} to ${to.path}`)
          }
          await next()
        },
      })

      // 如果启用了认证检查
      if (configManager.get('router.requiresAuth')) {
        engine.middleware.use({
          name: 'router-auth',
          priority: 90,
          async execute(ctx, next) {
            if (ctx.type === 'route') {
              const { to } = ctx.data
              if (to.meta?.requiresAuth) {
                const auth = container.resolve('auth')
                if (!auth?.isAuthenticated()) {
                  ctx.cancelled = true
                  router.push('/login')
                  return
                }
              }
            }
            await next()
          },
        })
      }

      // 如果启用了面包屑
      if (finalConfig.breadcrumb?.enabled) {
        stateManager.set('router:breadcrumb', [])

        router.afterEach((to: any) => {
          const breadcrumb = generateBreadcrumb(to, finalConfig.breadcrumb)
          stateManager.set('router:breadcrumb', breadcrumb)
        })
      }

      // 如果启用了标签页
      if (finalConfig.tabs?.enabled) {
        const maxTabs = finalConfig.tabs.max || 10

        router.afterEach((to: any) => {
          const tabs = stateManager.get('router:tabs') || []

          // 检查标签是否已存在
          const existingIndex = tabs.findIndex((t: any) => t.path === to.path)

          if (existingIndex === -1) {
            // 添加新标签
            tabs.push({
              path: to.path,
              name: to.name,
              title: to.meta?.title || to.name,
              params: to.params,
              query: to.query,
              closable: to.meta?.closable !== false,
            })

            // 限制标签数量
            if (tabs.length > maxTabs) {
              tabs.shift()
            }
          } else {
            // 更新现有标签
            tabs[existingIndex] = {
              ...tabs[existingIndex],
              params: to.params,
              query: to.query,
            }
          }

          stateManager.set('router:tabs', tabs)
          stateManager.set('router:activeTab', to.path)
        })
      }

      // 添加路由生命周期钩子
      lifecycleManager.on('beforeMount', async () => {
        console.log('[Router] Preparing router for mount...')
      })

      lifecycleManager.on('mounted', async () => {
        console.log('[Router] Router mounted successfully')

        // 初始化路由
        if (router.currentRoute.value.path === '/') {
          const initialRoute = configManager.get('router.initialRoute', '/')
          await router.push(initialRoute)
        }
      })

      console.log('[RouterPlugin] Router plugin installed successfully')
    },

    // Vue 应用安装
    async installVue(app: App, options?: any) {
      const router = app.config.globalProperties.$engine?.container?.resolve('router')?.router

      if (router) {
        // 使用 Vue Router（会自动注册 RouterView 和 RouterLink 组件）
        app.use(router)

        // 如果需要额外的组件（如 RouterTabs、RouterBreadcrumb），动态导入并注册
        if (options?.tabs?.enabled || options?.breadcrumb?.enabled) {
          const routerVue = await import('@ldesign/router-vue')

          if (options?.tabs?.enabled) {
            app.component('RouterTabs', routerVue.RouterTabs)
          }

          if (options?.breadcrumb?.enabled) {
            app.component('RouterBreadcrumb', routerVue.RouterBreadcrumb)
          }
        }
      }
    },
  }
}

/**
 * 生成面包屑
 * 
 * @private
 */
function generateBreadcrumb(route: any, config: any): any[] {
  const breadcrumb = []

  // 添加首页
  if (config.homeRoute) {
    breadcrumb.push({
      path: '/',
      title: 'Home',
      icon: 'home',
    })
  }

  // 根据路由 meta 生成面包屑
  if (route.matched) {
    route.matched.forEach((r: any) => {
      if (r.meta?.breadcrumb !== false) {
        breadcrumb.push({
          path: r.path,
          title: r.meta?.title || r.name,
          icon: r.meta?.icon,
        })
      }
    })
  }

  return breadcrumb
}

/**
 * 创建路由权限中间件
 * 
 * @param authService - 认证服务名称
 * @returns 路由中间件
 */
export function createRouterAuthMiddleware(authService = 'auth'): RouterMiddleware {
  return {
    name: 'router-auth',
    priority: 90,
    async execute(ctx, next) {
      if (ctx.type === 'route') {
        const { to } = ctx.data
        const engine = ctx.engine as VueEngine

        if (to.meta?.requiresAuth) {
          const auth = engine.container.resolve(authService)

          if (!auth?.isAuthenticated()) {
            ctx.cancelled = true

            // 保存目标路由
            engine.state.set('auth:redirectTo', to.fullPath)

            // 跳转到登录页
            const router = engine.container.resolve('router')
            await router.push('/login')

            return
          }
        }
      }

      await next()
    },
  }
}

/**
 * 创建路由日志中间件
 * 
 * @param logger - 日志服务名称
 * @returns 路由中间件
 */
export function createRouterLoggerMiddleware(logger = 'logger'): RouterMiddleware {
  return {
    name: 'router-logger',
    priority: 100,
    async execute(ctx, next) {
      if (ctx.type === 'route') {
        const engine = ctx.engine as VueEngine
        const log = engine.container.resolve(logger)
        const { to, from } = ctx.data

        const startTime = Date.now()

        log?.info?.(`[Router] Navigating: ${from.path} -> ${to.path}`, {
          from: {
            path: from.path,
            name: from.name,
            params: from.params,
            query: from.query,
          },
          to: {
            path: to.path,
            name: to.name,
            params: to.params,
            query: to.query,
          },
        })

        await next()

        const duration = Date.now() - startTime
        log?.info?.(`[Router] Navigation completed in ${duration}ms`)
      } else {
        await next()
      }
    },
  }
}

/**
 * 创建路由分析中间件
 * 
 * @returns 路由中间件
 */
export function createRouterAnalyticsMiddleware(): RouterMiddleware {
  return {
    name: 'router-analytics',
    priority: 80,
    async execute(ctx, next) {
      if (ctx.type === 'route') {
        const engine = ctx.engine as VueEngine
        const { to, from } = ctx.data

        // 记录页面访问
        engine.events.emit('analytics:pageview', {
          path: to.path,
          title: to.meta?.title || to.name,
          referrer: from.path,
          timestamp: Date.now(),
        })

        // 更新访问统计
        const stats = engine.state.get('router:stats') || {}
        stats[to.path] = (stats[to.path] || 0) + 1
        engine.state.set('router:stats', stats)
      }

      await next()
    },
  }
}
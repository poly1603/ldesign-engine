/**
 * Router 集成插件
 * 
 * 在 engine-vue3 中集成 @ldesign/router-vue 的简化版本
 * 核心逻辑委托给 router-vue 的 engine-plugin
 * 
 * @module plugins/router-plugin
 */

import type { App } from 'vue'
import type { PluginContext } from '@ldesign/engine-core'
import type { VueEngine, VueEnginePlugin } from '../engine/vue-engine'

/**
 * 路由插件配置(简化版)
 */
export interface RouterPluginConfig {
  /** 路由模式 */
  mode?: 'history' | 'hash' | 'memory'
  /** 基础路径 */
  base?: string
  /** 路由配置 */
  routes?: any[]
  /** 路由守卫 */
  guards?: {
    beforeEach?: (to: any, from: any, next: any) => void
    afterEach?: (to: any, from: any) => void
    beforeResolve?: (to: any, from: any, next: any) => void
  }
  /** 滚动行为 */
  scrollBehavior?: (to: any, from: any, savedPosition: any) => any
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
  /** 其他选项 */
  [key: string]: any
}

/**
 * 创建路由引擎插件
 * 
 * 这是一个轻量级的集成层,主要功能:
 * 1. 检查 router-vue 是否可用
 * 2. 委托给 router-vue 的 engine-plugin
 * 3. 提供统一的配置接口
 * 
 * @param config - 路由配置
 * @returns 路由引擎插件
 */
export function createRouterPlugin(config: RouterPluginConfig = {}): VueEnginePlugin {
  return {
    name: 'router',
    version: '2.0.0',
    dependencies: [],

    async install(ctx: PluginContext, options?: any) {
      const engine = ctx.engine as VueEngine

      try {
        // 动态导入 router-vue 的 engine-plugin
        const { createRouterEnginePlugin } = await import('@ldesign/router-vue/plugins')

        // 合并配置
        const finalConfig = {
          ...config,
          ...options,
        }

        // 创建 router-vue 的引擎插件
        const routerEnginePlugin = createRouterEnginePlugin(finalConfig)

        // 委托安装
        await routerEnginePlugin.install(ctx, finalConfig)

        if (engine.config.debug) {
          console.log('[RouterPlugin] Router plugin installed via @ldesign/router-vue')
        }
      }
      catch (error) {
        // router-vue 不可用,静默失败或警告
        if (engine.config.debug) {
          console.warn('[RouterPlugin] @ldesign/router-vue not available:', error)
          console.log('[RouterPlugin] Router functionality will not be available')
        }
      }
    },

    // Vue 应用安装
    async installVue(app: App, options?: any) {
      try {
        const engine = app.config.globalProperties.$engine as VueEngine
        const router = engine?.container?.resolve('router')?.router

        if (router) {
          // 使用 Vue Router
          app.use(router)

          // 注册额外组件
          if (options?.tabs?.enabled || options?.breadcrumb?.enabled) {
            const routerVue = await import('@ldesign/router-vue')

            if (options?.tabs?.enabled && routerVue.RouterTabs) {
              app.component('RouterTabs', routerVue.RouterTabs)
            }

            if (options?.breadcrumb?.enabled && routerVue.RouterBreadcrumb) {
              app.component('RouterBreadcrumb', routerVue.RouterBreadcrumb)
            }
          }
        }
      }
      catch (error) {
        console.warn('[RouterPlugin] Failed to install router to Vue app:', error)
      }
    },
  }
}
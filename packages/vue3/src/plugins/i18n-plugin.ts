/**
 * I18n 引擎插件
 * 集成 @ldesign/i18n-vue 到 LDesign Engine
 * @module plugins/i18n-plugin
 */

import type { PluginContext } from '@ldesign/engine-core'
import type { VueEngine, VueEnginePlugin } from '../engine/vue-engine'

/**
 * I18n 插件配置
 */
export interface I18nPluginConfig {
  locale?: string
  fallbackLocale?: string | string[]
  messages?: Record<string, any>
  debug?: boolean
  cache?: boolean
  cacheSize?: number
  performance?: boolean
  preloadLocales?: string[]
  persistence?: {
    enabled?: boolean
    key?: string
    storage?: 'localStorage' | 'sessionStorage'
  }
  globalProperties?: boolean
  directives?: boolean
  components?: boolean
  [key: string]: any
}

/**
 * 创建 I18n 引擎插件
 * @param config - I18n 配置
 * @returns I18n 引擎插件
 */
export function createI18nPlugin(config: I18nPluginConfig = {}): VueEnginePlugin {
  return {
    name: 'i18n',
    version: '1.0.0',
    dependencies: [],

    async install(ctx: PluginContext) {
      const engine = ctx.engine as VueEngine

      const finalConfig = {
        locale: 'zh-CN',
        fallbackLocale: 'en-US',
        messages: {},
        debug: false,
        cache: true,
        cacheSize: 100,
        performance: true,
        preloadLocales: [],
        persistence: { enabled: true, key: 'ldesign-locale', storage: 'localStorage' as const },
        globalProperties: true,
        directives: true,
        components: true,
        ...config,
      }

      const { OptimizedI18n } = await import('@ldesign/i18n-core')
      const { createI18nPlugin: createVueI18nPlugin } = await import('@ldesign/i18n-vue')

      const i18n = new (OptimizedI18n as any)({
        locale: finalConfig.locale,
        fallbackLocale: Array.isArray(finalConfig.fallbackLocale)
          ? finalConfig.fallbackLocale[0]
          : finalConfig.fallbackLocale,
        messages: finalConfig.messages,
        // 将缓存配置映射到 core（支持 maxSize）
        cache: finalConfig.cache === false
          ? false
          : (typeof finalConfig.cache === 'object'
            ? finalConfig.cache
            : { maxSize: finalConfig.cacheSize ?? 1000 }),
        // 透传性能与持久化配置到 core
        performance: finalConfig.performance,
        persistence: finalConfig.persistence,
        debug: finalConfig.debug,
      })

      await i18n.init()

      // 保存 i18n 实例到 engine
      const engineAny = engine as any
      engineAny.i18n = i18n

      // 立即将 i18n 注册到服务容器，避免页面早期通过 container.resolve('i18n') 报错
      try {
        engine.registerService('i18n', i18n)
        // 兼容：也使用 Symbol.for('i18n') 注册一次，避免不同包的 Symbol 不一致
        engine.registerService(Symbol.for('i18n'), i18n)
        console.log('[I18nPlugin] I18n registered to container as service')
      }
      catch (e) {
        console.warn('[I18nPlugin] Failed to register i18n service to container:', e)
      }

      const installToVue = () => {
        const app = engine.getApp()
        console.log('[I18nPlugin] installToVue called, app exists:', !!app)
        if (app) {
          console.log('[I18nPlugin] Installing i18n to Vue app')
          console.log('[I18nPlugin] i18n instance:', i18n)
          console.log('[I18nPlugin] i18n.locale:', i18n.locale)

          const vuePlugin = createVueI18nPlugin(i18n, {
            globalProperties: finalConfig.globalProperties,
            directives: finalConfig.directives,
            components: finalConfig.components,
          })

          console.log('[I18nPlugin] Vue plugin created:', vuePlugin)
          console.log('[I18nPlugin] Vue plugin type:', typeof vuePlugin)
          console.log('[I18nPlugin] Vue plugin has install?', 'install' in vuePlugin)
          console.log('[I18nPlugin] Vue plugin install type:', typeof vuePlugin.install)

          console.log('[I18nPlugin] Calling app.use()')
          app.use(vuePlugin)
          console.log('[I18nPlugin] app.use() completed')

          // 额外的回退 provide：字符串 key，避免跨包重复实例导致的 Symbol 注入失败
          try {
            // 使用字符串键进行一次额外提供，供潜在的降级路径使用
            app.provide('i18n' as any, i18n as any)
            console.log('[I18nPlugin] Fallback app.provide("i18n", i18n) completed')
          }
          catch (e) {
            console.warn('[I18nPlugin] Fallback provide failed:', e)
          }

          // 注意：createI18nPlugin 内部已经调用了 app.provide(I18N_SYMBOL, i18n)
          // 所以这里不需要再次 provide Symbol
          console.log('[I18nPlugin] I18n installed successfully')
        }
        else {
          console.error('[I18nPlugin] App not available in installToVue!')
        }
      }

      const currentApp = engine.getApp()
      console.log('[I18nPlugin] Checking if app exists:', !!currentApp)

      if (currentApp) {
        console.log('[I18nPlugin] App already exists, installing immediately')
        installToVue()
      }
      else {
        console.log('[I18nPlugin] App not ready, waiting for app:created event')
        engine.events.once('app:created', () => {
          console.log('[I18nPlugin] app:created event received')
          installToVue()
        })
      }
    },

    async uninstall() {
      // 清理逻辑
    },
  }
}

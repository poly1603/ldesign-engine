/**
 * 插件 API 组合式 API
 *
 * 提供在组件中使用插件 API 注册表的能力
 *
 * @module composables/use-plugin-api
 */

import { ref, onUnmounted, type Ref } from 'vue'
import type { PluginAPI } from '@ldesign/engine-core'
import { useEngine } from './use-engine'

/**
 * 使用插件 API
 *
 * 获取引擎中的插件 API 注册表，访问其他插件暴露的 API
 *
 * @returns 插件 API 操作方法
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePluginAPI } from '@ldesign/engine-vue3'
 *
 * const { get, has, getAllNames } = usePluginAPI()
 *
 * // 获取 i18n 插件的 API
 * const i18nAPI = get('i18n')
 * if (i18nAPI) {
 *   const locale = i18nAPI.getLocale()
 * }
 *
 * // 列出所有已注册的 API
 * console.log(getAllNames())
 * </script>
 * ```
 */
export function usePluginAPI() {
  const engine = useEngine()

  return {
    /**
     * 获取插件 API
     * @param name - 插件名称
     */
    get: <T extends PluginAPI = PluginAPI>(name: string): T | undefined => {
      return engine.api.get(name as any) as T | undefined
    },

    /**
     * 检查插件 API 是否已注册
     * @param name - 插件名称
     */
    has: (name: string): boolean => {
      return engine.api.has(name)
    },

    /**
     * 获取所有已注册的 API 名称
     */
    getAllNames: (): string[] => {
      return engine.api.getAllNames()
    },

    /**
     * 获取所有已注册的 API
     */
    getAll: (): PluginAPI[] => {
      return engine.api.getAll()
    },

    /**
     * 获取注册表大小
     */
    size: (): number => {
      return engine.api.size()
    },
  }
}

/**
 * 使用插件 API 注册
 *
 * 注册插件 API 并在组件卸载时自动注销
 *
 * @param api - 要注册的插件 API
 *
 * @example
 * ```vue
 * <script setup>
 * import { usePluginAPIRegister } from '@ldesign/engine-vue3'
 *
 * // 注册 API（组件卸载时自动注销）
 * usePluginAPIRegister({
 *   name: 'my-widget',
 *   version: '1.0.0',
 *   getData: () => ({ ... }),
 *   setData: (data) => { ... },
 * })
 * </script>
 * ```
 */
export function usePluginAPIRegister(api: PluginAPI): void {
  const engine = useEngine()

  engine.api.register(api)

  onUnmounted(() => {
    engine.api.unregister(api.name)
  })
}

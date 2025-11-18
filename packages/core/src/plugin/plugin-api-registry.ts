/**
 * 插件 API 注册表
 *
 * 提供插件 API 的注册、查询和调用功能，实现类型安全的插件间通信
 *
 * @module plugin/plugin-api-registry
 */

import type { PluginAPI, PluginAPIMap, PluginAPIName, GetPluginAPI } from '../types/plugin-api'

/**
 * 插件 API 注册表接口
 */
export interface PluginAPIRegistry {
  /**
   * 注册插件 API
   * @param api - 插件 API 实例
   */
  register<T extends PluginAPI>(api: T): void

  /**
   * 注销插件 API
   * @param name - 插件名称
   */
  unregister(name: string): boolean

  /**
   * 获取插件 API
   * @param name - 插件名称
   */
  get<T extends PluginAPIName>(name: T): GetPluginAPI<T> | undefined

  /**
   * 检查插件 API 是否已注册
   * @param name - 插件名称
   */
  has(name: string): boolean

  /**
   * 获取所有已注册的插件 API 名称
   */
  getAllNames(): string[]

  /**
   * 获取所有已注册的插件 API
   */
  getAll(): PluginAPI[]

  /**
   * 清空所有插件 API
   */
  clear(): void

  /**
   * 获取注册表大小
   */
  size(): number
}

/**
 * 核心插件 API 注册表实现
 */
export class CorePluginAPIRegistry implements PluginAPIRegistry {
  /** API 存储 */
  private apis = new Map<string, PluginAPI>()

  /** 调试模式 */
  private debug: boolean

  /**
   * 构造函数
   * @param options - 配置选项
   */
  constructor(options: { debug?: boolean } = {}) {
    this.debug = options.debug || false
  }

  /**
   * 注册插件 API
   */
  register<T extends PluginAPI>(api: T): void {
    if (!api || !api.name) {
      throw new Error('Invalid plugin API: name is required')
    }

    if (this.apis.has(api.name)) {
      if (this.debug) {
        console.warn(`[PluginAPIRegistry] API "${api.name}" is already registered, overwriting...`)
      }
    }

    this.apis.set(api.name, api)

    if (this.debug) {
      console.log(`[PluginAPIRegistry] API "${api.name}" v${api.version} registered`)
    }
  }

  /**
   * 注销插件 API
   */
  unregister(name: string): boolean {
    const result = this.apis.delete(name)

    if (this.debug && result) {
      console.log(`[PluginAPIRegistry] API "${name}" unregistered`)
    }

    return result
  }

  /**
   * 获取插件 API
   */
  get<T extends PluginAPIName>(name: T): GetPluginAPI<T> | undefined {
    return this.apis.get(name) as GetPluginAPI<T> | undefined
  }

  /**
   * 检查插件 API 是否已注册
   */
  has(name: string): boolean {
    return this.apis.has(name)
  }

  /**
   * 获取所有已注册的插件 API 名称
   */
  getAllNames(): string[] {
    return Array.from(this.apis.keys())
  }

  /**
   * 获取所有已注册的插件 API
   */
  getAll(): PluginAPI[] {
    return Array.from(this.apis.values())
  }

  /**
   * 清空所有插件 API
   */
  clear(): void {
    this.apis.clear()

    if (this.debug) {
      console.log('[PluginAPIRegistry] All APIs cleared')
    }
  }

  /**
   * 获取注册表大小
   */
  size(): number {
    return this.apis.size
  }
}

/**
 * 创建插件 API 注册表实例
 *
 * @param options - 配置选项
 * @returns 插件 API 注册表实例
 *
 * @example
 * ```typescript
 * import { createPluginAPIRegistry } from '@ldesign/engine-core'
 *
 * const apiRegistry = createPluginAPIRegistry({ debug: true })
 *
 * // 注册 API
 * apiRegistry.register({
 *   name: 'i18n',
 *   version: '1.0.0',
 *   getLocale() { return 'zh-CN' },
 *   setLocale(locale) { return Promise.resolve() },
 *   t(key, params) { return key },
 *   // ...其他方法
 * })
 *
 * // 获取 API（带类型提示）
 * const i18nAPI = apiRegistry.get('i18n')
 * if (i18nAPI) {
 *   const locale = i18nAPI.getLocale() // 完整的类型提示
 * }
 * ```
 */
export function createPluginAPIRegistry(options?: { debug?: boolean }): PluginAPIRegistry {
  return new CorePluginAPIRegistry(options)
}

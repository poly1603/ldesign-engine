/**
 * 插件系统类型定义
 */

import type { CoreEngine } from './engine'

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 引擎实例 */
  engine: CoreEngine
  /** 插件配置 */
  config?: Record<string, any>
}

/**
 * 插件接口
 */
export interface Plugin<Options = any> {
  /** 插件名称 */
  readonly name: string
  /** 插件版本 */
  readonly version?: string
  /** 插件依赖 */
  readonly dependencies?: string[]
  /** 安装函数 */
  install: (context: PluginContext, options?: Options) => void | Promise<void>
  /** 卸载函数 */
  uninstall?: (context: PluginContext) => void | Promise<void>
}

/**
 * 插件管理器接口
 */
export interface PluginManager {
  /** 注册插件 */
  use: <T = any>(plugin: Plugin<T>, options?: T) => Promise<void>
  /** 卸载插件 */
  uninstall: (name: string) => Promise<boolean>
  /** 获取插件 */
  get: (name: string) => Plugin | undefined
  /** 获取所有插件 */
  getAll: () => Plugin[]
  /** 检查插件是否已安装 */
  has: (name: string) => boolean
  /** 清空所有插件 */
  clear: () => void
}


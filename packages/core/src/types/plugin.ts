/**
 * 插件系统类型定义
 */

import type { CoreEngine } from './engine'

/**
 * 框架信息
 */
export interface FrameworkInfo {
  /** 框架名称 */
  name: 'vue' | 'react' | 'lit' | 'unknown'
  /** 框架版本 */
  version?: string
  /** 框架应用实例 */
  app?: any
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 引擎实例 */
  engine: CoreEngine
  /** 插件配置 */
  config?: Record<string, any>
  /** 框架信息（可选，框架特定引擎会提供） */
  framework?: FrameworkInfo
  /** 服务容器（可选，支持依赖注入的引擎会提供） */
  container?: {
    singleton: (identifier: string | symbol, implementation: any) => void
    resolve: <T = any>(identifier: string | symbol) => T
    has: (identifier: string | symbol) => boolean
  }
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
  use: <T = any>(plugin: Plugin<T>, options?: T, customContext?: Partial<PluginContext>) => Promise<void>
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
  /** 获取插件数量 */
  size: () => number
}


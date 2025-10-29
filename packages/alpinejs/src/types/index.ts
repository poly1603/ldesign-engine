/**
 * AlpineJS 特定类型
 */

import type { CoreEngine, CoreEngineConfig, Plugin, Middleware } from '@ldesign/engine-core'

export type { AlpineJSAdapterConfig } from '../adapter/alpinejs-adapter'

/**
 * AlpineJS 引擎接口
 */
export interface AlpineJSEngine extends CoreEngine {
  /** 挂载应用 */
  mount(mountElement?: string | Element): Promise<void>
  /** 卸载应用 */
  unmount(): Promise<void>
  /** 获取 Alpine 实例 */
  getAlpineInstance(): any
}

/**
 * AlpineJS 引擎应用配置
 */
export interface AlpineJSEngineAppOptions {
  /** 挂载元素 (可选，AlpineJS 通常使用声明式挂载) */
  mountElement?: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列表 */
  middleware?: Middleware[]
  /** 功能开关 */
  features?: {
    enableDevTools?: boolean
    autoInit?: boolean
  }
  /** 初始化完成回调 */
  onReady?: (engine: AlpineJSEngine) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: AlpineJSEngine) => void | Promise<void>
  /** 错误处理 */
  onError?: (error: Error, context: string) => void
}


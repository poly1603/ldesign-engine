/**
 * Preact 特定类型
 */

import type { CoreEngine, CoreEngineConfig, Plugin, Middleware } from '@ldesign/engine-core'
import type { ComponentType } from 'preact'

export type { PreactAdapterConfig } from '../adapter/preact-adapter'

/**
 * Preact 引擎接口
 */
export interface PreactEngine extends CoreEngine {
  /** 根组件 */
  readonly rootComponent?: ComponentType
  /** 挂载应用 */
  mount(mountElement: string | Element): Promise<void>
  /** 卸载应用 */
  unmount(): Promise<void>
}

/**
 * Preact 引擎应用配置
 */
export interface PreactEngineAppOptions {
  /** 根组件 */
  rootComponent: ComponentType
  /** 挂载元素 */
  mountElement?: string | Element
  /** 引擎配置 */
  config?: CoreEngineConfig
  /** 插件列表 */
  plugins?: Plugin[]
  /** 中间件列表 */
  middleware?: Middleware[]
  /** 功能开关 */
  features?: {
    enableHotReload?: boolean
    enableDevTools?: boolean
    enableSignals?: boolean
  }
  /** 初始化完成回调 */
  onReady?: (engine: PreactEngine) => void | Promise<void>
  /** 挂载完成回调 */
  onMounted?: (engine: PreactEngine) => void | Promise<void>
  /** 错误处理 */
  onError?: (error: Error, context: string) => void
}

